<<<<<<< HEAD
import asyncHandler from '../lib/asyncHandler.js';
import { Op } from 'sequelize';
import { AttendanceSession, AttendanceRecord, Student, Subject, Coordinator, Chairperson, ChairpersonClass, FacultyAssignment } from '../models/index.js';

// A student may only ever read their OWN attendance: identity is derived from
// the authenticated user, never from the rollNo in the URL. Admins see any
// student; coordinator/chairperson only students inside their scoped classes.
export const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  const { rollNo } = req.params;

  let student;
  if (req.user.role === 'student') {
    // Identity is ALWAYS derived from auth; the rollNo URL param is ignored
    // for students, so probing another roll number returns their own data or
    // nothing — never another student's.
    student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'No student profile is linked to this account' });
    }
  } else {
    student = await Student.findOne({ where: { rollNo } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    if (req.user.role !== 'admin') {
      const allowed = await getScopedClassKeys(req.user);
      const studentKey = classKeyOf(student);
      if (!allowed.has(studentKey)) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this student\'s attendance' });
      }
    }
  }

  const records = await AttendanceRecord.findAll({ where: { studentId: student.id } });
  if (records.length === 0) {
    return res.json({
      success: true,
      student: { rollNo: student.rollNo, fullName: student.fullName },
      overall: { total: 0, present: 0, absent: 0, excused: 0, percentage: null },
      subjects: [],
      recent: [],
    });
  }

  const sessions = await AttendanceSession.findAll({
    where: { id: records.map((r) => r.sessionId) },
    include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }],
  });
  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  // subjectId -> { subject, present, absent, excused, total }
  const perSubject = new Map();
  const recent = [];
  let present = 0, absent = 0, excused = 0;

  for (const r of records) {
    const session = sessionById.get(r.sessionId);
    if (!session) continue;
    if (r.status === 'present') present++;
    else if (r.status === 'absent') absent++;
    else excused++;

    const sid = session.subjectId;
    if (!perSubject.has(sid)) {
      perSubject.set(sid, {
        subjectId: sid,
        subjectName: session.subject?.name ?? null,
        subjectCode: session.subject?.code ?? null,
        present: 0, absent: 0, excused: 0, total: 0,
      });
    }
    const agg = perSubject.get(sid);
    agg[r.status]++;
    agg.total++;

    recent.push({
      sessionId: session.id,
      date: session.date,
      sessionType: session.sessionType,
      topic: session.topic,
      subjectId: sid,
      subjectName: session.subject?.name ?? null,
      subjectCode: session.subject?.code ?? null,
      status: r.status,
    });
  }

  const total = present + absent + excused;
  const subjects = [...perSubject.values()].map((s) => ({
    ...s,
    percentage: s.total > 0 ? Math.round(((s.present + s.excused) / s.total) * 1000) / 10 : null,
  }));
  recent.sort((a, b) => (a.date < b.date ? 1 : -1));

  res.json({
    success: true,
    student: { rollNo: student.rollNo, fullName: student.fullName },
    overall: {
      total, present, absent, excused,
      percentage: Math.round(((present + excused) / total) * 1000) / 10,
    },
    subjects,
    recent: recent.slice(0, 20),
  });
});

// GET /attendance/student/:rollNo/subject/:subjectId — session-by-session drilldown
export const getStudentSubjectAttendance = asyncHandler(async (req, res) => {
  const { rollNo, subjectId } = req.params;

  let student;
  if (req.user.role === 'student') {
    student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'No student profile is linked to this account' });
    }
  } else {
    student = await Student.findOne({ where: { rollNo } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (req.user.role !== 'admin') {
      const allowed = await getScopedClassKeys(req.user);
      if (!allowed.has(classKeyOf(student))) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this student\'s attendance' });
      }
    }
  }

  const subject = await Subject.findByPk(Number(subjectId));
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

  // Only sessions held for the student's own class count.
  const sessions = await AttendanceSession.findAll({
    where: { subjectId: Number(subjectId), classKey: classKeyOf(student) },
    include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }],
    order: [['date', 'DESC']],
  });

  const records = await AttendanceRecord.findAll({
    where: { studentId: student.id, sessionId: sessions.map((s) => s.id) },
  });
  const recordBySession = new Map(records.map((r) => [r.sessionId, r]));

  const history = sessions.map((s) => {
    const r = recordBySession.get(s.id);
    return {
      sessionId: s.id,
      date: s.date,
      sessionType: s.sessionType,
      topic: s.topic,
      status: r?.status ?? null, // null = unmarked/absent from records
    };
  });

  const marked = history.filter((h) => h.status);
  const present = marked.filter((h) => h.status === 'present').length;
  const absent = marked.filter((h) => h.status === 'absent').length;
  const excused = marked.filter((h) => h.status === 'excused').length;
  const total = present + absent + excused;

  res.json({
    success: true,
    subject: { id: subject.id, name: subject.name, code: subject.code },
    summary: { totalSessions: history.length, marked, present, absent, excused, percentage: total > 0 ? Math.round(((present + excused) / total) * 1000) / 10 : null },
    history,
  });
});

function classKeyOf(student) {
  return [student.school, student.department, student.program, student.batch, student.specialization]
    .map((v) => String(v ?? '').trim().toLowerCase())
    .join('::');
}

// Union of classes a coordinator/chairperson (or teaching user) is scoped to,
// following the same resolution pattern as chairperson.controller.js.
async function getScopedClassKeys(user) {
  const keys = new Set();
  const toKey = (x) =>
    [x.school, x.department, x.program, x.batch, x.specialization]
      .map((v) => String(v ?? '').trim().toLowerCase())
      .join('::');

  const [assignments, coordinators, chairpersons] = await Promise.all([
    FacultyAssignment.findAll({ where: { facultyId: user.id, isActive: true } }),
    Coordinator.findAll({ where: ownerWhere(user) }).catch(() => []),
    Chairperson.findAll({ where: ownerWhere(user) }).catch(() => []),
  ]);
  assignments.forEach((a) => keys.add(a.classKey));
  coordinators.forEach((c) => keys.add(toKey(c)));

  for (const cp of chairpersons) {
    const classes = await ChairpersonClass.findAll({ where: { chairpersonId: cp.id } });
    classes.forEach((c) => keys.add(toKey(c)));
  }
  return keys;
}

function ownerWhere(user) {
  return {
    [Op.or]: [{ userId: user.id }, { email: user.username }, { email: user.email }],
  };
}
=======
import { Op, fn, col, literal } from 'sequelize';
import { asyncHandler } from '../lib/asyncHandler.js';
import logger from '../lib/logger.js';
import Subject from '../models/subject.model.js';
import FacultyAssignment from '../models/facultyAssignment.model.js';
import AttendanceSession from '../models/attendanceSession.model.js';
import AttendanceRecord from '../models/attendanceRecord.model.js';
import Student from '../models/student.model.js';
import User from '../models/user.model.js';
import ChangeLog from '../models/changeLog.model.js';
import { getChairpersonAssignments } from './chairperson.controller.js';

/**
 * POST /admin/attendance/sessions/:id/unlock
 * Body: { reason: string }
 * Side-effects: writes ChangeLog entry.
 */
export const unlockSession = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can unlock sessions.' });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid session id.' });
  const reason = (req.body.reason || '').trim();
  if (!reason || reason.length < 3) {
    return res.status(422).json({ success: false, message: 'A reason of at least 3 characters is required.' });
  }
  if (reason.length > 500) {
    return res.status(422).json({ success: false, message: 'Reason must be 500 characters or fewer.' });
  }

  const session = await AttendanceSession.findByPk(id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
  if (session.status !== 'locked') {
    return res.status(409).json({ success: false, message: 'Only locked sessions can be unlocked.' });
  }

  const oldValue = { status: session.status, lockedBy: session.lockedBy, lockedAt: session.lockedAt };
  await session.update({
    status: 'draft',
    unlockedBy: req.user.id,
    unlockedAt: new Date(),
    unlockReason: reason,
    // Keep lockedBy/lockedAt as a record of prior lock; do not null them.
  });
  const newValue = { status: 'draft', unlockedBy: req.user.id, unlockedAt: new Date(), unlockReason: reason };

  await ChangeLog.create({
    userId: req.user.id,
    action: 'attendance.session.unlock',
    entity: 'AttendanceSession',
    entityId: String(id),
    details: { oldValue, newValue, reason },
  }).catch((e) => logger.warn({ err: e.message }, 'ChangeLog write failed (non-fatal)'));

  return res.json({ success: true, session });
});

/**
 * POST /admin/faculty-assignments
 * Admin assigns a user (any role) to a subject + class + academic year.
 * Body: { facultyId, teacherRole, subjectId, school, department, program, batch, specialization, semester, academicYear, isActive? }
 */
export const createFacultyAssignment = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can create faculty assignments.' });
  }
  const errors = [];
  const b = req.body || {};
  const facultyIdNum = Number(b.facultyId ?? b.userId);
  let subjectIdNum = Number(b.subjectId);
  const teacherRole = String(b.teacherRole || '').trim().toLowerCase();

  if (!Number.isInteger(facultyIdNum) || facultyIdNum <= 0) errors.push('facultyId (or userId) required');
  if (!['faculty', 'coordinator', 'chairperson'].includes(teacherRole)) errors.push('teacherRole must be faculty|coordinator|chairperson');
  if (!b.school?.trim()) errors.push('school required');
  if (!b.department?.trim()) errors.push('department required');
  if (!b.program?.trim()) errors.push('program required');
  if (!b.batch?.trim()) errors.push('batch required');
  if (!b.specialization?.trim()) errors.push('specialization required');
  if (b.semester == null || !Number.isInteger(Number(b.semester))) errors.push('semester required');
  if (!b.academicYear?.trim()) errors.push('academicYear required');

  if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });

  const user = await User.findByPk(facultyIdNum, { attributes: ['id', 'role', 'name', 'username'] });
  if (!user) return res.status(404).json({ success: false, message: `Teacher user with ID ${facultyIdNum} not found.` });

  // Resolve subject by ID or by Code/Name if provided
  let subject = null;
  if (Number.isInteger(subjectIdNum) && subjectIdNum > 0) {
    subject = await Subject.findByPk(subjectIdNum, { attributes: ['id', 'name', 'code'] });
  } else if (b.subjectCode?.trim()) {
    subject = await Subject.findOne({
      where: {
        code: b.subjectCode.trim(),
        school: b.school.trim(),
        department: b.department.trim(),
        program: b.program.trim(),
      },
    });
  }

  // If subject not found by ID or code, but name & code provided, auto-create subject
  if (!subject && b.subjectName?.trim() && b.subjectCode?.trim()) {
    subject = await Subject.create({
      school: b.school.trim(),
      department: b.department.trim(),
      program: b.program.trim(),
      batch: b.batch.trim(),
      specialization: b.specialization.trim(),
      name: b.subjectName.trim(),
      code: b.subjectCode.trim().toUpperCase(),
      semester: Number(b.semester),
      credits: Number(b.credits) || 4,
      type: b.subjectType === 'lab' ? 'lab' : 'theory',
    });
  }

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found. Please provide a valid subjectId or both subjectName and subjectCode.',
    });
  }

  try {
    const assignment = await FacultyAssignment.create({
      facultyId: facultyIdNum,
      teacherRole,
      subjectId: subject.id,
      school: b.school.trim(),
      department: b.department.trim(),
      program: b.program.trim(),
      batch: b.batch.trim(),
      specialization: b.specialization.trim(),
      semester: Number(b.semester),
      academicYear: b.academicYear.trim(),
      isActive: b.isActive === false ? false : true,
      createdBy: req.user.id,
    });

    await ChangeLog.create({
      userId: req.user.id,
      action: 'faculty.assignment.create',
      entity: 'FacultyAssignment',
      entityId: String(assignment.id),
      details: { facultyId: assignment.facultyId, subjectId: assignment.subjectId, teacherRole: assignment.teacherRole },
    }).catch((e) => logger.warn({ err: e.message }, 'ChangeLog write failed (non-fatal)'));

    return res.status(201).json({ success: true, assignment });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'An active assignment already exists for this user/subject/class/year/role.' });
    }
    throw err;
  }
});

/**
 * GET /admin/faculty-assignments
 * Optional filters: facultyId, subjectId, isActive.
 */
export const listFacultyAssignments = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admins only.' });
  }
  const where = {};
  if (req.query.facultyId) where.facultyId = Number(req.query.facultyId);
  if (req.query.subjectId) where.subjectId = Number(req.query.subjectId);
  if (req.query.isActive != null) where.isActive = req.query.isActive !== 'false';

  const rows = await FacultyAssignment.findAll({
    where,
    order: [['facultyId', 'ASC'], ['createdAt', 'DESC']],
  });

  if (!rows.length) {
    return res.json({ success: true, count: 0, assignments: [] });
  }

  const facultyIds = [...new Set(rows.map((r) => r.facultyId).filter(Boolean))];
  const subjectIds = [...new Set(rows.map((r) => r.subjectId).filter(Boolean))];

  const [users, subjects] = await Promise.all([
    facultyIds.length
      ? User.findAll({ where: { id: { [Op.in]: facultyIds } }, attributes: ['id', 'name', 'username', 'role'] })
      : Promise.resolve([]),
    subjectIds.length
      ? Subject.findAll({ where: { id: { [Op.in]: subjectIds } }, attributes: ['id', 'name', 'code', 'credits', 'type', 'semester'] })
      : Promise.resolve([]),
  ]);

  const userMap = new Map(users.map((u) => [u.id, typeof u.toJSON === 'function' ? u.toJSON() : u]));
  const subjectMap = new Map(subjects.map((s) => [s.id, typeof s.toJSON === 'function' ? s.toJSON() : s]));

  const enriched = rows.map((row) => {
    const item = typeof row.toJSON === 'function' ? row.toJSON() : row;
    const u = userMap.get(item.facultyId);
    const s = subjectMap.get(item.subjectId);
    return {
      ...item,
      facultyName: u?.name || u?.username || `User #${item.facultyId}`,
      facultyEmail: u?.username || null,
      userRole: u?.role || item.teacherRole,
      subjectName: s?.name || null,
      subjectCode: s?.code || null,
      subjectType: s?.type || null,
    };
  });

  return res.json({ success: true, count: enriched.length, assignments: enriched });
});

export const deleteFacultyAssignment = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admins only.' });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid assignment ID.' });
  }
  const assignment = await FacultyAssignment.findByPk(id);
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found.' });
  }
  await assignment.destroy();
  await ChangeLog.create({
    userId: req.user.id,
    action: 'faculty.assignment.delete',
    entity: 'FacultyAssignment',
    entityId: String(id),
    details: { facultyId: assignment.facultyId, subjectId: assignment.subjectId },
  }).catch((e) => logger.warn({ err: e.message }, 'ChangeLog write failed (non-fatal)'));

  return res.json({ success: true, message: 'Faculty assignment deleted successfully.' });
});

/**
 * GET /admin/eligible-teachers
 * Return list of users eligible to be assigned subjects (faculty, coordinator, chairperson)
 */
export const getEligibleTeachers = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admins only.' });
  }

  const users = await User.findAll({
    where: {
      role: { [Op.in]: ['faculty', 'coordinator', 'chairperson'] }
    },
    attributes: ['id', 'name', 'username', 'role'],
    order: [['role', 'ASC'], ['name', 'ASC']]
  });

  return res.json({
    success: true,
    count: users.length,
    teachers: users.map(u => ({
      id: u.id,
      name: u.name || u.username,
      username: u.username,
      email: u.username,
      role: u.role
    }))
  });
});

/**
 * GET /admin/attendance/sessions
 * List attendance sessions. Admins see all; chairpersons see their assigned classes.
 * Optional filters: status, subjectId, date, facultyId.
 */
export const listSessions = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Auth required.' });
  const isAdmin = req.user.role === 'admin';
  const isChair = req.user.role === 'chairperson';

  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.subjectId) where.subjectId = Number(req.query.subjectId);
  if (req.query.date) where.date = req.query.date;
  if (req.query.facultyId) where.facultyId = Number(req.query.facultyId);

  if (isChair) {
    const { assignments } = await getChairpersonAssignments(req.user);
    if (!assignments.length) {
      return res.json({ success: true, count: 0, sessions: [] });
    }
    where[Op.or] = assignments.map((a) => ({
      school: a.school,
      department: a.department,
      program: a.program,
      batch: a.batch,
      specialization: a.specialization,
    }));
  } else if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Admins or chairpersons only.' });
  }

  const sessions = await AttendanceSession.findAll({
    where,
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
    limit: 200,
  });

  const subjectIds = [...new Set(sessions.map((s) => s.subjectId).filter(Boolean))];
  const facultyIds = [...new Set(sessions.map((s) => s.facultyId).filter(Boolean))];
  const sessionIds = sessions.map((s) => s.id);

  const [subjects, faculties, recordCounts] = await Promise.all([
    Subject.findAll({ where: { id: { [Op.in]: subjectIds } }, attributes: ['id', 'name', 'code', 'semester'] }),
    User.findAll({ where: { id: { [Op.in]: facultyIds } }, attributes: ['id', 'name', 'username'] }),
    AttendanceRecord.findAll({
      where: { sessionId: { [Op.in]: sessionIds } },
      attributes: ['sessionId', [fn('COUNT', col('id')), 'count']],
      group: ['sessionId'],
      raw: true,
    }),
  ]);

  const subjMap = new Map(subjects.map((s) => [s.id, s]));
  const facMap = new Map(faculties.map((f) => [f.id, f]));
  const countMap = new Map(recordCounts.map((r) => [r.sessionId, Number(r.count)]));

  const enrichedSessions = sessions.map((s) => {
    const raw = typeof s.toJSON === 'function' ? s.toJSON() : s;
    const subj = subjMap.get(raw.subjectId);
    const fac = facMap.get(raw.facultyId);
    return {
      ...raw,
      subjectName: subj?.name || null,
      subjectCode: subj?.code || null,
      subjectSemester: subj?.semester ?? null,
      facultyName: fac?.name || fac?.username || `User #${raw.facultyId}`,
      facultyEmail: fac?.username || null,
      recordCount: countMap.get(raw.id) || 0,
    };
  });

  return res.json({ success: true, count: enrichedSessions.length, sessions: enrichedSessions });
});

/**
 * GET /attendance/student/:rollNo/summary
 * Returns overall + per-subject attendance summary.
 * - Student: MUST be querying their own rollNo (rollNo derived from auth).
 * - Coordinator/Chairperson: see students in their assigned classes.
 * - Admin: see any student.
 */
export const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Auth required.' });
  const requestedRollNo = String(req.params.rollNo || '').trim();

  // Find the student record
  let student = null;
  if (req.user.role === 'student') {
    student = await Student.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id },
          ...(req.user.username ? [{ rollNo: req.user.username }, { enrollmentNo: req.user.username }] : []),
          ...(req.user.email ? [{ email: req.user.email }] : []),
        ],
      },
      attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'email', 'school', 'department', 'program', 'batch', 'specialization', 'photo'],
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    // Prevent IDOR: ensure requested identifier matches student's own rollNo or enrollmentNo
    if (requestedRollNo && requestedRollNo.toLowerCase() !== 'me') {
      const matchRoll = student.rollNo && student.rollNo.toLowerCase() === requestedRollNo.toLowerCase();
      const matchEnroll = student.enrollmentNo && student.enrollmentNo.toLowerCase() === requestedRollNo.toLowerCase();
      if (!matchRoll && !matchEnroll) {
        return res.status(403).json({ success: false, message: 'Access denied: You are only authorized to view your own attendance.' });
      }
    }
  } else {
    // Staff / admin lookup by rollNo or enrollmentNo
    student = await Student.findOne({
      where: {
        [Op.or]: [
          { rollNo: requestedRollNo },
          { enrollmentNo: requestedRollNo },
        ],
      },
      attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'email', 'school', 'department', 'program', 'batch', 'specialization', 'photo'],
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });
  }

  // Authorization: staff with scope sees their students; admin sees all.
  if (req.user.role === 'student') {
    // Already validated above
  } else if (req.user.role === 'coordinator') {
    const { getCoordinatorAssignedClasses } = await import('./student.controller.js');
    const assigned = await getCoordinatorAssignedClasses(req.user);
    const matches = assigned.some((c) =>
      c.school === student.school && c.department === student.department &&
      c.program === student.program && c.batch === student.batch &&
      c.specialization === student.specialization
    );
    if (!matches) return res.status(403).json({ success: false, message: 'You are not assigned to this student\'s class.' });
  } else if (req.user.role === 'chairperson') {
    const { assignments } = await getChairpersonAssignments(req.user);
    const matches = assignments.some((c) =>
      c.school === student.school && c.department === student.department &&
      c.program === student.program && c.batch === student.batch &&
      c.specialization === student.specialization
    );
    if (!matches) return res.status(403).json({ success: false, message: 'You are not assigned to this student\'s class.' });
  } else if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  // Aggregate per subject
  const records = await AttendanceRecord.findAll({
    where: { studentId: student.id },
    attributes: ['id', 'sessionId', 'status'],
    raw: true,
  });

  const sessionIds = [...new Set(records.map((r) => r.sessionId))];
  const sessions = sessionIds.length > 0 ? await AttendanceSession.findAll({
    where: { id: { [Op.in]: sessionIds } },
    attributes: ['id', 'subjectId', 'date', 'sessionType', 'topic', 'status'],
    order: [['date', 'DESC']],
    raw: true,
  }) : [];

  const recordedSubjectIds = [...new Set(sessions.map((s) => s.subjectId))];

  // Fetch all curriculum subjects for this student's class + recorded subjects
  const classSubjects = await Subject.findAll({
    where: {
      [Op.or]: [
        ...(recordedSubjectIds.length > 0 ? [{ id: { [Op.in]: recordedSubjectIds } }] : []),
        {
          school: student.school,
          department: student.department,
          program: student.program,
        },
      ],
    },
    attributes: ['id', 'name', 'code', 'semester', 'type'],
    raw: true,
  });

  const subjectMap = new Map(classSubjects.map((s) => [s.id, s]));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  // Pre-populate with all class subjects
  const perSubject = new Map();
  for (const cs of classSubjects) {
    perSubject.set(cs.id, {
      subjectId: cs.id,
      subjectName: cs.name || `Subject #${cs.id}`,
      subjectCode: cs.code || null,
      semester: cs.semester ?? null,
      type: cs.type || null,
      total: 0,
      present: 0,
      absent: 0,
      excused: 0,
    });
  }

  let total = 0, present = 0, absent = 0, excused = 0;
  for (const r of records) {
    const s = sessionMap.get(r.sessionId);
    if (!s) continue;
    const subj = subjectMap.get(s.subjectId);
    const key = s.subjectId;
    if (!perSubject.has(key)) {
      perSubject.set(key, {
        subjectId: s.subjectId,
        subjectName: subj?.name || `Subject #${s.subjectId}`,
        subjectCode: subj?.code || null,
        semester: subj?.semester ?? null,
        type: subj?.type || null,
        total: 0,
        present: 0,
        absent: 0,
        excused: 0,
      });
    }
    const agg = perSubject.get(key);
    agg.total += 1;
    if (r.status === 'present') agg.present += 1;
    if (r.status === 'absent') agg.absent += 1;
    if (r.status === 'excused') agg.excused += 1;
    total += 1;
    if (r.status === 'present') present += 1;
    if (r.status === 'absent') absent += 1;
    if (r.status === 'excused') excused += 1;
  }

  const subjectsArr = [...perSubject.values()].map((s) => ({
    ...s,
    percentage: s.total ? Math.round((s.present / s.total) * 1000) / 10 : 0,
  })).sort((a, b) => (b.total - a.total) || a.subjectName.localeCompare(b.subjectName));

  const recent = sessions.slice(0, 30).map((s) => {
    const rec = records.find((r) => r.sessionId === s.id);
    const subj = subjectMap.get(s.subjectId);
    return {
      sessionId: s.id,
      subjectId: s.subjectId,
      date: s.date,
      sessionType: s.sessionType,
      topic: s.topic,
      subjectName: subj?.name || null,
      subjectCode: subj?.code || null,
      status: rec?.status || 'unmarked',
    };
  });

  return res.json({
    success: true,
    student: typeof student.toJSON === 'function' ? student.toJSON() : student,
    overall: {
      total,
      present,
      absent,
      excused,
      percentage: total ? Math.round((present / total) * 1000) / 10 : 0,
    },
    subjects: subjectsArr,
    recentSessions: recent,
  });
});
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
