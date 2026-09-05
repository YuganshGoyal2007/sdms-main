import { Op } from 'sequelize';
<<<<<<< HEAD
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
=======
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
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
    status: 'draft',
    createdBy: req.user.id,
  });

<<<<<<< HEAD
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
=======
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
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
  }

  await session.update({
    status: 'locked',
    submittedAt: new Date(),
<<<<<<< HEAD
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
=======
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
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
    Student.findAll({
      where: {
        school: session.school,
        department: session.department,
        program: session.program,
        batch: session.batch,
        specialization: session.specialization,
<<<<<<< HEAD
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
=======
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
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
      school: session.school,
      department: session.department,
      program: session.program,
      batch: session.batch,
      specialization: session.specialization,
<<<<<<< HEAD
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
=======
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
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
});
