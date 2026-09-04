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
