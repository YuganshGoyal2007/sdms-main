import { Op } from 'sequelize';
import asyncHandler from '../lib/asyncHandler.js';
import { FacultyAssignment, AttendanceSession, AttendanceRecord, Student, Subject, User, ChangeLog } from '../models/index.js';

// Canonical class identity, same format as chairperson.controller.js
export const buildClassKey = (school, department, program, batch, specialization) =>
  [school, department, program, batch, specialization]
    .map((v) => String(v ?? '').trim().toLowerCase())
    .join('::');

const parseClassKey = (classKey) => {
  const parts = String(classKey ?? '').split('::');
  if (parts.length !== 5) {
    const err = new Error('Invalid class key');
    err.status = 422;
    throw err;
  }
  return { school: parts[0], department: parts[1], program: parts[2], batch: parts[3], specialization: parts[4] };
};

const todayStr = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? ''));

// Throws 403 unless the authenticated user has an active assignment for
// classKey + subjectId. Authorization is ALWAYS derived from the DB, never
// from anything the frontend sends.
export async function requireAssignment(user, classKey, subjectId) {
  const assignment = await FacultyAssignment.findOne({
    where: { facultyId: user.id, subjectId, classKey, isActive: true },
  });
  if (!assignment) {
    const err = new Error('You are not assigned to this class/subject');
    err.status = 403;
    throw err;
  }
  return assignment;
}

export async function requireSessionAccess(user, sessionId) {
  const session = await AttendanceSession.findByPk(sessionId);
  if (!session) {
    const err = new Error('Attendance session not found');
    err.status = 404;
    throw err;
  }
  if (user.role === 'admin') return { session, isOwner: false, isAdmin: true };
  const isOwner = session.facultyId === user.id;
  if (!isOwner) {
    // Also verify an active assignment exists (assignment may have been
    // transferred; the original creator still keeps read access only via
    // ownership below, so this branch is just a safety net).
    const err = new Error('You are not authorized to access this attendance session');
    err.status = 403;
    throw err;
  }
  return { session, isOwner: true, isAdmin: false };
}

// GET /teaching/my-classes
export const getMyClasses = asyncHandler(async (req, res) => {
  const assignments = await FacultyAssignment.findAll({
    where: { facultyId: req.user.id, isActive: true },
    include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'type'] }],
    order: [['createdAt', 'ASC']],
  });

  const date = todayStr();
  const classes = await Promise.all(
    assignments.map(async (a) => {
      const classFields = {
        school: a.school,
        department: a.department,
        program: a.program,
        batch: a.batch,
        specialization: a.specialization,
      };
      const studentWhere = { ...classFields, status: 'active' };
      const [totalStudents, todaySessions] = await Promise.all([
        Student.count({ where: studentWhere }),
        AttendanceSession.findAll({
          where: { subjectId: a.subjectId, classKey: a.classKey, date },
          attributes: ['id', 'status', 'sessionType'],
        }),
      ]);
      return {
        id: a.id,
        subjectId: a.subjectId,
        subjectName: a.subject?.name ?? null,
        subjectCode: a.subject?.code ?? null,
        subjectType: a.subject?.type ?? null,
        teacherRole: a.teacherRole,
        semester: a.semester,
        academicYear: a.academicYear,
        classKey: a.classKey,
        ...classFields,
        totalStudents,
        todaySessions,
      };
    })
  );

  res.json({ success: true, date, classes });
});

// GET /teaching/classes/:classKey/students — roster for a class the user teaches
export const getClassRoster = asyncHandler(async (req, res) => {
  const { classKey } = req.params;
  const classFields = parseClassKey(classKey);

  // Must teach at least one subject in this class.
  const anyAssignment = await FacultyAssignment.findOne({
    where: { facultyId: req.user.id, classKey, isActive: true },
  });
  if (!anyAssignment) {
    return res.status(403).json({ success: false, message: 'You are not assigned to this class' });
  }

  const students = await Student.findAll({
    where: { ...classFields, status: 'active' },
    attributes: ['id', 'rollNo', 'fullName', 'photo', 'school', 'department', 'program', 'batch', 'specialization'],
    order: [['rollNo', 'ASC']],
  });

  res.json({ success: true, classKey, students });
});

// GET /teaching/my-classes/:classKey/:subjectId/today?date=YYYY-MM-DD
export const getTodaySession = asyncHandler(async (req, res) => {
  const { classKey, subjectId } = req.params;
  await requireAssignment(req.user, classKey, Number(subjectId));

  const date = isValidDate(req.query.date) ? req.query.date : todayStr();
  const sessions = await AttendanceSession.findAll({
    where: { subjectId: Number(subjectId), classKey, date },
    order: [['createdAt', 'ASC']],
  });

  res.json({ success: true, date, sessions });
});

// POST /teaching/sessions
export const createSession = asyncHandler(async (req, res) => {
  const { classKey, subjectId, date, sessionType, topic, startTime, endTime } = req.body ?? {};
  if (!classKey || !subjectId || !isValidDate(date)) {
    return res.status(422).json({ success: false, message: 'classKey, subjectId and a valid date (YYYY-MM-DD) are required' });
  }
  if (!['lecture', 'lab', 'tutorial'].includes(sessionType)) {
    return res.status(422).json({ success: false, message: 'sessionType must be lecture, lab or tutorial' });
  }

  const assignment = await requireAssignment(req.user, classKey, Number(subjectId));

  const existing = await AttendanceSession.findOne({
    where: { subjectId: Number(subjectId), classKey, date, sessionType },
  });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An attendance session already exists for this subject, class, date and session type', sessionId: existing.id });
  }

  if (date > todayStr()) {
    return res.status(422).json({ success: false, message: 'Attendance cannot be marked for a future date' });
  }

  const session = await AttendanceSession.create({
    school: assignment.school,
    department: assignment.department,
    program: assignment.program,
    batch: assignment.batch,
    specialization: assignment.specialization,
    classKey,
    semester: assignment.semester,
    academicYear: assignment.academicYear,
    subjectId: Number(subjectId),
    facultyId: req.user.id,
    date,
    sessionType,
    topic: topic ?? null,
    startTime: startTime ?? null,
    endTime: endTime ?? null,
    status: 'draft',
    createdBy: req.user.id,
  });

  res.status(201).json({ success: true, session });
});

// PATCH /teaching/sessions/:id — owner edits draft metadata only
export const updateSession = asyncHandler(async (req, res) => {
  const { session, isOwner } = await requireSessionAccess(req.user, Number(req.params.id));
  if (!isOwner) {
    return res.status(403).json({ success: false, message: 'Only the session owner can edit session metadata' });
  }
  if (session.status !== 'draft') {
    return res.status(409).json({ success: false, message: 'This session is submitted/locked and can no longer be edited by teaching staff' });
  }

  const { topic, startTime, endTime, sessionType, date } = req.body ?? {};
  if (sessionType !== undefined && !['lecture', 'lab', 'tutorial'].includes(sessionType)) {
    return res.status(422).json({ success: false, message: 'sessionType must be lecture, lab or tutorial' });
  }
  if (date !== undefined && !isValidDate(date)) {
    return res.status(422).json({ success: false, message: 'Invalid date' });
  }
  if (date !== undefined && date > todayStr()) {
    return res.status(422).json({ success: false, message: 'Attendance cannot be marked for a future date' });
  }

  const nextType = sessionType ?? session.sessionType;
  const nextDate = date ?? session.date;
  if (nextType !== session.sessionType || nextDate !== session.date) {
    const clash = await AttendanceSession.findOne({
      where: {
        id: { [Op.ne]: session.id },
        subjectId: session.subjectId,
        classKey: session.classKey,
        date: nextDate,
        sessionType: nextType,
      },
    });
    if (clash) {
      return res.status(409).json({ success: false, message: 'Another session already exists for this subject, class, date and session type' });
    }
  }

  await session.update({
    topic: topic ?? session.topic,
    startTime: startTime ?? session.startTime,
    endTime: endTime ?? session.endTime,
    sessionType: nextType,
    date: nextDate,
  });

  res.json({ success: true, session });
});

// POST /teaching/sessions/:id/submit — owner locks the session
export const submitSession = asyncHandler(async (req, res) => {
  const { session, isOwner } = await requireSessionAccess(req.user, Number(req.params.id));
  if (!isOwner) {
    return res.status(403).json({ success: false, message: 'Only the session owner can submit this session' });
  }
  if (session.status !== 'draft') {
    return res.status(409).json({ success: false, message: 'This session has already been submitted' });
  }

  const marked = await AttendanceRecord.count({ where: { sessionId: session.id } });
  if (marked === 0) {
    return res.status(422).json({ success: false, message: 'Cannot submit an empty attendance sheet' });
  }

  await session.update({
    status: 'locked',
    submittedAt: new Date(),
    lockedAt: new Date(),
    lockedBy: req.user.id,
  });

  res.json({ success: true, session });
});

// GET /teaching/sessions/:id/records — owner or admin
export const getSessionRecords = asyncHandler(async (req, res) => {
  const { session } = await requireSessionAccess(req.user, Number(req.params.id));

  const [records, students] = await Promise.all([
    AttendanceRecord.findAll({ where: { sessionId: session.id } }),
    Student.findAll({
      where: {
        school: session.school,
        department: session.department,
        program: session.program,
        batch: session.batch,
        specialization: session.specialization,
        status: 'active',
      },
      attributes: ['id', 'rollNo', 'fullName', 'photo'],
      order: [['rollNo', 'ASC']],
    }),
  ]);

  res.json({
    success: true,
    session,
    roster: students,
    records: records.map((r) => ({
      studentId: r.studentId,
      rollNo: r.rollNo,
      status: r.status,
      remarks: r.remarks,
      markedAt: r.markedAt,
    })),
  });
});

// PUT /teaching/sessions/:id/records — owner (draft) or admin override (locked, audited)
export const upsertAttendanceRecords = asyncHandler(async (req, res) => {
  const { session, isOwner, isAdmin } = await requireSessionAccess(req.user, Number(req.params.id));
  const { records } = req.body ?? {};
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(422).json({ success: false, message: 'records array is required' });
  }

  if (isOwner && !isAdmin && session.status !== 'draft') {
    return res.status(409).json({ success: false, message: 'This session is locked. Ask an admin to unlock it before making changes.' });
  }
  if (isAdmin && !isOwner && session.status === 'draft') {
    return res.status(403).json({ success: false, message: 'Admins may only override locked sessions' });
  }

  // Validate every student actually belongs to this session's class and that
  // statuses are legal. Never trust studentId from the frontend blindly.
  const students = await Student.findAll({
    where: {
      school: session.school,
      department: session.department,
      program: session.program,
      batch: session.batch,
      specialization: session.specialization,
      status: 'active',
    },
    attributes: ['id', 'rollNo'],
  });
  const byId = new Map(students.map((s) => [s.id, s]));

  const validStatuses = ['present', 'absent', 'excused'];
  const prepared = [];
  for (const r of records) {
    const student = byId.get(Number(r.studentId));
    if (!student) {
      return res.status(422).json({ success: false, message: `Student ${r.studentId} does not belong to this class` });
    }
    if (!validStatuses.includes(r.status)) {
      return res.status(422).json({ success: false, message: `Invalid status "${r.status}" — must be present, absent or excused` });
    }
    prepared.push({
      sessionId: session.id,
      studentId: student.id,
      rollNo: student.rollNo,
      status: r.status,
      remarks: r.remarks ?? null,
      markedAt: new Date(),
    });
  }

  // Batch upsert, one at a time on the unique (sessionId, studentId) pair.
  for (const row of prepared) {
    await AttendanceRecord.upsert(row);
  }

  if (isAdmin && !isOwner) {
    await ChangeLog.create({
      userId: req.user.id,
      action: 'admin_override_records',
      entity: 'attendance_session',
      entityId: String(session.id),
      details: {
        reason: req.body?.reason ?? null,
        oldStatus: session.status,
        changed: prepared.map((p) => ({ studentId: p.studentId, rollNo: p.rollNo, status: p.status })),
      },
    });
  }

  const saved = await AttendanceRecord.findAll({ where: { sessionId: session.id } });
  res.json({ success: true, records: saved });
});

// Admin: list sessions (read-only view)
// GET /admin/attendance/sessions?classKey=&subjectId=&date=
export const adminListSessions = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.classKey) where.classKey = String(req.query.classKey);
  if (req.query.subjectId) where.subjectId = Number(req.query.subjectId);
  if (req.query.date && isValidDate(req.query.date)) where.date = req.query.date;
  if (req.query.status && ['draft', 'submitted', 'locked'].includes(req.query.status)) where.status = req.query.status;

  const sessions = await AttendanceSession.findAll({ where, order: [['date', 'DESC'], ['createdAt', 'DESC']], limit: 200 });
  res.json({ success: true, sessions });
});

// Admin: unlock a locked session — reason REQUIRED, audited
// POST /admin/attendance/sessions/:id/unlock
export const unlockSession = asyncHandler(async (req, res) => {
  const session = await AttendanceSession.findByPk(Number(req.params.id));
  if (!session) {
    return res.status(404).json({ success: false, message: 'Attendance session not found' });
  }
  const reason = String(req.body?.reason ?? '').trim();
  if (!reason) {
    return res.status(422).json({ success: false, message: 'A reason is required to unlock an attendance session' });
  }
  if (session.status !== 'locked') {
    return res.status(409).json({ success: false, message: 'Only locked sessions can be unlocked' });
  }

  const oldStatus = session.status;
  await session.update({
    status: 'draft',
    unlockedBy: req.user.id,
    unlockedAt: new Date(),
    unlockReason: reason,
  });

  await ChangeLog.create({
    userId: req.user.id,
    action: 'admin_unlock_session',
    entity: 'attendance_session',
    entityId: String(session.id),
    details: { reason, oldStatus, newStatus: 'draft', facultyId: session.facultyId, subjectId: session.subjectId, date: session.date },
  });

  res.json({ success: true, session });
});

// Admin: assign a user to teach a subject in a class
// POST /admin/faculty-assignments
export const createFacultyAssignment = asyncHandler(async (req, res) => {
  const { userId, teacherRole, subjectId, school, department, program, batch, specialization, semester, academicYear } = req.body ?? {};

  if (!userId || !Number(subjectId) || !teacherRole || !school || !department || !program || !batch || !specialization || !semester || !academicYear) {
    return res.status(422).json({ success: false, message: 'userId, teacherRole, subjectId, school, department, program, batch, specialization, semester and academicYear are required' });
  }
  if (!['faculty', 'coordinator', 'chairperson'].includes(teacherRole)) {
    return res.status(422).json({ success: false, message: 'teacherRole must be faculty, coordinator or chairperson' });
  }

  const user = await User.findByPk(Number(userId));
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (!['faculty', 'coordinator', 'chairperson'].includes(user.role)) {
    return res.status(422).json({ success: false, message: `User role is "${user.role}" — only faculty, coordinator or chairperson users can be assigned to teach` });
  }

  const subject = await Subject.findByPk(Number(subjectId));
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

  const classKey = buildClassKey(school, department, program, batch, specialization);
  const duplicate = await FacultyAssignment.findOne({
    where: { facultyId: Number(userId), subjectId: Number(subjectId), classKey, semester, academicYear, isActive: true },
  });
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'This user already has an active assignment for this subject and class' });
  }

  const assignment = await FacultyAssignment.create({
    facultyId: Number(userId),
    teacherRole,
    subjectId: Number(subjectId),
    school,
    department,
    program,
    batch,
    specialization,
    classKey,
    semester,
    academicYear,
    isActive: true,
  });

  await ChangeLog.create({
    userId: req.user.id,
    action: 'create',
    entity: 'faculty_assignment',
    entityId: String(assignment.id),
    details: { assignment: assignment.toJSON() },
  });

  res.status(201).json({ success: true, assignment });
});

// Admin: list assignments
// GET /admin/faculty-assignments
export const listFacultyAssignments = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.classKey) where.classKey = String(req.query.classKey);
  if (req.query.userId) where.facultyId = Number(req.query.userId);
  const assignments = await FacultyAssignment.findAll({
    where,
    include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, assignments });
});

// Admin: subject CRUD (minimal — list/create)
// GET /admin/subjects
export const listSubjects = asyncHandler(async (req, res) => {
  const where = {};
  for (const f of ['school', 'department', 'program', 'batch', 'specialization', 'semester']) {
    if (req.query[f]) where[f] = String(req.query[f]);
  }
  const subjects = await Subject.findAll({ where, order: [['name', 'ASC']] });
  res.json({ success: true, subjects });
});

// POST /admin/subjects
export const createSubject = asyncHandler(async (req, res) => {
  const { school, department, program, batch, specialization, name, code, semester, credits, type } = req.body ?? {};
  if (!school || !department || !program || !batch || !specialization || !name || !code || !semester) {
    return res.status(422).json({ success: false, message: 'school, department, program, batch, specialization, name, code and semester are required' });
  }
  if (type !== undefined && !['theory', 'lab'].includes(type)) {
    return res.status(422).json({ success: false, message: 'type must be theory or lab' });
  }
  const duplicate = await Subject.findOne({
    where: { school, department, program, batch, specialization, code, semester },
  });
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'This subject already exists for this class and semester' });
  }
  const subject = await Subject.create({ school, department, program, batch, specialization, name, code, semester, credits: credits ?? null, type: type ?? 'theory' });

  await ChangeLog.create({
    userId: req.user.id,
    action: 'create',
    entity: 'subject',
    entityId: String(subject.id),
    details: { subject: subject.toJSON() },
  });

  res.status(201).json({ success: true, subject });
});
