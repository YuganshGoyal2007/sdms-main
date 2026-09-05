import { Op } from 'sequelize';
import sequelize from '../lib/db.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import logger from '../lib/logger.js';
import Subject from '../models/subject.model.js';
import FacultyAssignment from '../models/facultyAssignment.model.js';
import AttendanceSession from '../models/attendanceSession.model.js';
import AttendanceRecord from '../models/attendanceRecord.model.js';
import Student from '../models/student.model.js';
import User from '../models/user.model.js';
import ChangeLog from '../models/changeLog.model.js';

const TEACHING_ROLES = ['faculty', 'coordinator', 'chairperson'];

const todayDateOnly = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isTeachingUser = (user) => Boolean(user) && TEACHING_ROLES.includes(user.role);

const findOwnedAssignment = async (user, { subjectId, school, department, program, batch, specialization, semester }) => {
  if (!isTeachingUser(user)) return null;
  const where = {
    facultyId: user.id,
    subjectId,
    isActive: true,
    [Op.and]: [
      sequelize.where(sequelize.fn('LOWER', sequelize.col('school')), String(school || '').trim().toLowerCase()),
      sequelize.where(sequelize.fn('LOWER', sequelize.col('department')), String(department || '').trim().toLowerCase()),
      sequelize.where(sequelize.fn('LOWER', sequelize.col('program')), String(program || '').trim().toLowerCase()),
      sequelize.where(sequelize.fn('LOWER', sequelize.col('batch')), String(batch || '').trim().toLowerCase()),
      sequelize.where(sequelize.fn('LOWER', sequelize.col('specialization')), String(specialization || '').trim().toLowerCase()),
    ],
  };
  if (semester !== undefined && semester !== null) {
    where.semester = semester;
  }
  const assignment = await FacultyAssignment.findOne({ where });
  return assignment;
};

const enrichAssignmentWithSubject = async (row) => {
  if (!row) return null;
  const data = typeof row.toJSON === 'function' ? row.toJSON() : row;
  const subject = await Subject.findByPk(data.subjectId, {
    attributes: ['id', 'name', 'code', 'credits', 'type', 'semester'],
  });
  return {
    assignmentId: data.id,
    facultyId: data.facultyId,
    teacherRole: data.teacherRole,
    subjectId: data.subjectId,
    subjectName: subject?.name || null,
    subjectCode: subject?.code || null,
    subjectType: subject?.type || null,
    subjectCredits: subject?.credits ?? null,
    semester: data.semester,
    academicYear: data.academicYear,
    school: data.school,
    department: data.department,
    program: data.program,
    batch: data.batch,
    specialization: data.specialization,
    isActive: data.isActive,
  };
};

/**
 * GET /teaching/my-classes
 * Returns active faculty_assignments for the logged-in teaching user
 * plus today's session status (if any) for each class.
 */
export const getMyClasses = asyncHandler(async (req, res) => {
  if (!req.user || !isTeachingUser(req.user)) {
    return res.status(403).json({ success: false, message: 'Only teaching users can view their classes.' });
  }

  const assignments = await FacultyAssignment.findAll({
    where: { facultyId: req.user.id, isActive: true },
    order: [
      ['school', 'ASC'],
      ['department', 'ASC'],
      ['program', 'ASC'],
      ['batch', 'ASC'],
      ['specialization', 'ASC'],
      ['semester', 'ASC'],
    ],
  });

  if (!assignments.length) {
    return res.json({
      success: true,
      count: 0,
      classes: [],
      date: todayDateOnly(),
    });
  }

  const today = todayDateOnly();
  const subjectIds = Array.from(new Set(assignments.map((a) => a.subjectId).filter(Boolean)));

  // Fast Batch Query 1: Fetch all subjects in 1 SQL query
  const subjects = await Subject.findAll({
    where: { id: { [Op.in]: subjectIds } },
    attributes: ['id', 'name', 'code', 'credits', 'type', 'semester'],
  });
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Fast Batch Query 2: Fetch today's sessions in 1 SQL query
  const sessions = await AttendanceSession.findAll({
    where: {
      subjectId: { [Op.in]: subjectIds },
      facultyId: req.user.id,
      date: today,
    },
    attributes: ['id', 'status', 'sessionType', 'topic', 'subjectId', 'school', 'department', 'program', 'batch', 'specialization'],
    order: [['createdAt', 'DESC']],
  });
  const sessionMap = new Map();
  for (const s of sessions) {
    const classKey = `${s.school}|${s.department}|${s.program}|${s.batch}|${s.specialization}|${s.subjectId}`.toLowerCase();
    if (!sessionMap.has(classKey)) {
      sessionMap.set(classKey, s);
    }
    if (!sessionMap.has(String(s.subjectId))) {
      sessionMap.set(String(s.subjectId), s);
    }
  }

  const classes = assignments.map((row) => {
    const data = typeof row.toJSON === 'function' ? row.toJSON() : row;
    const subj = subjectMap.get(data.subjectId);
    const classKey = `${data.school}|${data.department}|${data.program}|${data.batch}|${data.specialization}|${data.subjectId}`.toLowerCase();
    const sess = sessionMap.get(classKey) || sessionMap.get(String(data.subjectId));

    return {
      assignmentId: data.id,
      facultyId: data.facultyId,
      teacherRole: data.teacherRole,
      subjectId: data.subjectId,
      subjectName: subj?.name || null,
      subjectCode: subj?.code || null,
      subjectType: subj?.type || null,
      subjectCredits: subj?.credits ?? null,
      semester: data.semester,
      academicYear: data.academicYear,
      school: data.school,
      department: data.department,
      program: data.program,
      batch: data.batch,
      specialization: data.specialization,
      isActive: data.isActive,
      todaySession: sess
        ? {
            sessionId: sess.id,
            status: sess.status,
            sessionType: sess.sessionType,
            topic: sess.topic,
          }
        : null,
    };
  });

  return res.json({
    success: true,
    count: classes.length,
    classes,
    date: today,
  });
});

/**
 * GET /teaching/my-classes/:classKey/:subjectId/today
 * Returns today's session (with all attendance records) for the given class/subject.
 * The :classKey is the URL-encoded 5-tuple "school|department|program|batch|specialization"
 *   e.g. "SCT|CS|BTech|2023|AI"
 */
export const getTodaySession = asyncHandler(async (req, res) => {
  if (!req.user || !isTeachingUser(req.user)) {
    return res.status(403).json({ success: false, message: 'Only teaching users can view sessions.' });
  }
  const { classKey, subjectId } = req.params;
  const rawKey = String(classKey || '');
  const delimiter = rawKey.includes('%7C') ? '%7C' : rawKey.includes('~') ? '~' : '|';
  const parts = rawKey.split(delimiter).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  if (parts.length !== 5) {
    return res.status(400).json({ success: false, message: 'classKey must encode school|department|program|batch|specialization' });
  }
  const [school, department, program, batch, specialization] = parts;
  const subjId = Number(subjectId);
  if (!Number.isInteger(subjId) || subjId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid subjectId.' });
  }

  const assignment = await findOwnedAssignment(req.user, {
    subjectId: subjId,
    school, department, program, batch, specialization,
  });
  if (!assignment) {
    return res.status(403).json({ success: false, message: 'You are not assigned to this class/subject.' });
  }

  const subject = await Subject.findByPk(subjId, { attributes: ['id', 'name', 'code', 'semester', 'credits', 'type'] });
  const today = todayDateOnly();
  const session = await AttendanceSession.findOne({
    where: { subjectId: subjId, facultyId: req.user.id, date: today },
    order: [['createdAt', 'DESC']],
  });

  return res.json({
    success: true,
    date: today,
    subject,
    class: { school, department, program, batch, specialization },
    session: session ? (typeof session.toJSON === 'function' ? session.toJSON() : session) : null,
  });
});

const validateSessionPayload = (body) => {
  const errors = [];
  if (!body.subjectId || !Number.isInteger(Number(body.subjectId))) errors.push('subjectId is required');
  if (!body.school?.trim()) errors.push('school is required');
  if (!body.department?.trim()) errors.push('department is required');
  if (!body.program?.trim()) errors.push('program is required');
  if (!body.batch?.trim()) errors.push('batch is required');
  if (!body.specialization?.trim()) errors.push('specialization is required');
  if (body.semester == null || !Number.isInteger(Number(body.semester))) errors.push('semester is required');
  if (!body.date) errors.push('date is required');
  if (body.date && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) errors.push('date must be YYYY-MM-DD');
  if (body.sessionType && !['lecture', 'lab', 'tutorial'].includes(body.sessionType)) errors.push('sessionType must be lecture|lab|tutorial');
  return errors;
};

/**
 * POST /teaching/sessions
 * Create a new session. If one already exists for (subjectId, date, sessionType),
 * returns 409.
 */
export const createSession = asyncHandler(async (req, res) => {
  if (!req.user || !isTeachingUser(req.user)) {
    return res.status(403).json({ success: false, message: 'Only teaching users can create sessions.' });
  }
  const errors = validateSessionPayload(req.body);
  if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });

  const assignment = await findOwnedAssignment(req.user, {
    subjectId: Number(req.body.subjectId),
    school: req.body.school,
    department: req.body.department,
    program: req.body.program,
    batch: req.body.batch,
    specialization: req.body.specialization,
  });
  if (!assignment) {
    return res.status(403).json({ success: false, message: 'You are not assigned to this class/subject.' });
  }

  const sessionType = req.body.sessionType || 'lecture';
  const existing = await AttendanceSession.findOne({
    where: {
      subjectId: Number(req.body.subjectId),
      date: req.body.date,
      sessionType,
    },
  });
  if (existing) {
    return res.status(409).json({ success: false, message: 'A session already exists for this subject, date, and type.' });
  }

  const session = await AttendanceSession.create({
    school: req.body.school,
    department: req.body.department,
    program: req.body.program,
    batch: req.body.batch,
    specialization: req.body.specialization,
    subjectId: Number(req.body.subjectId),
    facultyId: req.user.id,
    date: req.body.date,
    startTime: req.body.startTime || null,
    endTime: req.body.endTime || null,
    sessionType,
    topic: req.body.topic || null,
    status: 'draft',
    createdBy: req.user.id,
  });

  await ChangeLog.create({
    userId: req.user.id,
    action: 'attendance.session.create',
    entity: 'AttendanceSession',
    entityId: String(session.id),
    details: { subjectId: session.subjectId, date: session.date, sessionType: session.sessionType },
  }).catch((e) => logger.warn({ err: e.message }, 'ChangeLog write failed (non-fatal)'));

  return res.status(201).json({ success: true, session });
});

/**
 * PATCH /teaching/sessions/:id
 * Update metadata. Allowed only for owner and only if status='draft'.
 */
export const updateSession = asyncHandler(async (req, res) => {
  if (!req.user || !isTeachingUser(req.user)) {
    return res.status(403).json({ success: false, message: 'Only teaching users can update sessions.' });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid session id.' });

  const session = await AttendanceSession.findByPk(id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
  if (session.facultyId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only edit your own sessions.' });
  }
  if (session.status !== 'draft') {
    return res.status(409).json({ success: false, message: 'Locked/submitted sessions cannot be edited by teaching users.' });
  }

  const updates = {};
  if (req.body.topic != null) updates.topic = req.body.topic;
  if (req.body.startTime !== undefined) updates.startTime = req.body.startTime || null;
  if (req.body.endTime !== undefined) updates.endTime = req.body.endTime || null;
  if (req.body.sessionType && ['lecture', 'lab', 'tutorial'].includes(req.body.sessionType)) {
    updates.sessionType = req.body.sessionType;
  }

  await session.update(updates);
  return res.json({ success: true, session });
});

/**
 * POST /teaching/sessions/:id/submit
 * Lock the session. Owner only.
 */
export const submitSession = asyncHandler(async (req, res) => {
  if (!req.user || !isTeachingUser(req.user)) {
    return res.status(403).json({ success: false, message: 'Only teaching users can submit sessions.' });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid session id.' });

  const session = await AttendanceSession.findByPk(id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
  if (session.facultyId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only submit your own sessions.' });
  }
  if (session.status === 'locked') {
    return res.status(409).json({ success: false, message: 'Session is already locked.' });
  }

  // Validate: at least one record must exist
  const recordCount = await AttendanceRecord.count({ where: { sessionId: id } });
  if (recordCount === 0) {
    return res.status(422).json({ success: false, message: 'Cannot submit a session with no attendance records.' });
  }

  await session.update({
    status: 'locked',
    submittedAt: new Date(),
    lockedBy: req.user.id,
    lockedAt: new Date(),
  });

  await ChangeLog.create({
    userId: req.user.id,
    action: 'attendance.session.submit',
    entity: 'AttendanceSession',
    entityId: String(id),
    details: { recordCount },
  }).catch((e) => logger.warn({ err: e.message }, 'ChangeLog write failed (non-fatal)'));

  return res.json({ success: true, session });
});

/**
 * GET /teaching/sessions/:id/records
 * Fetch all attendance records for a session, plus the roster (students in this class).
 * Owner OR admin.
 */
export const getSessionRecords = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Auth required.' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid session id.' });

  const session = await AttendanceSession.findByPk(id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

  const isOwner = session.facultyId === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'You are not authorized to view these records.' });
  }

  const [records, students, subject] = await Promise.all([
    AttendanceRecord.findAll({
      where: { sessionId: id },
      attributes: ['id', 'sessionId', 'studentId', 'rollNo', 'status', 'markedAt', 'remarks'],
      raw: true,
    }),
    Student.findAll({
      where: {
        school: session.school,
        department: session.department,
        program: session.program,
        batch: session.batch,
        specialization: session.specialization,
      },
      attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'email', 'photo', 'status'],
      order: [['rollNo', 'ASC']],
    }),
    Subject.findByPk(session.subjectId, { attributes: ['id', 'name', 'code', 'semester', 'credits', 'type'] }),
  ]);

  const recordMap = new Map(records.map((r) => [r.studentId, r]));
  const roster = students.map((s) => {
    const raw = typeof s.toJSON === 'function' ? s.toJSON() : s;
    const rec = recordMap.get(raw.id);
    return {
      studentId: raw.id,
      rollNo: raw.rollNo,
      enrollmentNo: raw.enrollmentNo,
      fullName: raw.fullName,
      email: raw.email,
      photo: raw.photo || null,
      studentStatus: raw.status,
      attendance: rec
        ? {
            recordId: rec.id,
            status: rec.status,
            markedAt: rec.markedAt,
            remarks: rec.remarks,
          }
        : null,
    };
  });

  return res.json({
    success: true,
    session: typeof session.toJSON === 'function' ? session.toJSON() : session,
    subject,
    roster,
  });
});

/**
 * GET /teaching/roster
 * Returns the student roster for a class + subject.
 * Used to pre-populate Mark Attendance before a session is created.
 * Query: subjectId, school, department, program, batch, specialization, semester
 */
export const getClassRoster = asyncHandler(async (req, res) => {
  if (!req.user || !isTeachingUser(req.user)) {
    return res.status(403).json({ success: false, message: 'Only teaching users can view rosters.' });
  }
  const subjectId = Number(req.query.subjectId);
  const { school, department, program, batch, specialization, semester } = req.query;
  if (!Number.isInteger(subjectId) || subjectId <= 0) {
    return res.status(400).json({ success: false, message: 'subjectId is required.' });
  }
  if (!school || !department || !program || !batch || !specialization) {
    return res.status(400).json({ success: false, message: 'Full class identity required.' });
  }
  const assignment = await findOwnedAssignment(req.user, {
    subjectId,
    school: String(school),
    department: String(department),
    program: String(program),
    batch: String(batch),
    specialization: String(specialization),
    semester: semester ? Number(semester) : 0,
  });
  if (!assignment) {
    return res.status(403).json({ success: false, message: 'You are not assigned to this class/subject.' });
  }
  const students = await Student.findAll({
    where: {
      school: String(school),
      department: String(department),
      program: String(program),
      batch: String(batch),
      specialization: String(specialization),
    },
    attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'email', 'photo', 'status'],
    order: [['rollNo', 'ASC']],
  });
  const subject = await Subject.findByPk(subjectId, { attributes: ['id', 'name', 'code', 'semester', 'credits', 'type'] });
  return res.json({
    success: true,
    subject,
    class: { school, department, program, batch, specialization },
    roster: students.map((s) => {
      const raw = typeof s.toJSON === 'function' ? s.toJSON() : s;
      return {
        studentId: raw.id,
        rollNo: raw.rollNo,
        enrollmentNo: raw.enrollmentNo,
        fullName: raw.fullName,
        email: raw.email,
        photo: raw.photo || null,
        studentStatus: raw.status,
        attendance: null,
      };
    }),
  });
});

/**
 * PUT /teaching/sessions/:id/records
 * Upsert attendance records. Owner OR admin (admin can edit locked via unlock).
 * Body: { records: [{ studentId, rollNo, status, remarks? }] }
 */
export const upsertAttendanceRecords = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Auth required.' });
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid session id.' });

  const session = await AttendanceSession.findByPk(id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

  const isOwner = session.facultyId === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'You are not authorized to modify these records.' });
  }

  if (!isAdmin && session.status === 'locked') {
    return res.status(409).json({ success: false, message: 'Session is locked. Ask an admin to unlock it.' });
  }

  const records = Array.isArray(req.body.records) ? req.body.records : null;
  if (!records) return res.status(422).json({ success: false, message: 'records array is required.' });

  const validStatuses = new Set(['present', 'absent', 'excused']);
  for (const r of records) {
    if (!Number.isInteger(Number(r.studentId))) {
      return res.status(422).json({ success: false, message: 'Each record must have a numeric studentId.' });
    }
    if (!validStatuses.has(r.status)) {
      return res.status(422).json({ success: false, message: `Invalid status '${r.status}'. Use present|absent|excused.` });
    }
  }

  const validStudents = await Student.findAll({
    where: {
      id: { [Op.in]: records.map((r) => Number(r.studentId)) },
      school: session.school,
      department: session.department,
      program: session.program,
      batch: session.batch,
      specialization: session.specialization,
    },
    attributes: ['id', 'rollNo'],
  });
  const studentMap = new Map(validStudents.map((s) => [s.id, s.rollNo]));

  const transaction = await sequelize.transaction();
  try {
    const now = new Date();
    for (const r of records) {
      const studentId = Number(r.studentId);
      const rollNo = studentMap.get(studentId);
      if (!rollNo) continue; // skip students not in this class
      const [rec, created] = await AttendanceRecord.findOrCreate({
        where: { sessionId: id, studentId },
        defaults: {
          sessionId: id,
          studentId,
          rollNo,
          status: r.status,
          markedAt: now,
          remarks: r.remarks || null,
        },
        transaction,
      });
      if (!created) {
        await rec.update(
          { status: r.status, markedAt: now, remarks: r.remarks || null },
          { transaction }
        );
      }
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  await ChangeLog.create({
    userId: req.user.id,
    action: 'attendance.records.upsert',
    entity: 'AttendanceRecord',
    entityId: String(id),
    details: { count: records.length, sessionId: id },
  }).catch((e) => logger.warn({ err: e.message }, 'ChangeLog write failed (non-fatal)'));

  return res.json({ success: true, count: records.length });
});
