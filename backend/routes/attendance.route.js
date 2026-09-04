import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';
import {
  getMyClasses, getClassRoster, getTodaySession, createSession, updateSession,
  submitSession, getSessionRecords, upsertAttendanceRecords,
  adminListSessions, unlockSession, createFacultyAssignment, listFacultyAssignments,
  listSubjects, createSubject,
} from '../controllers/teaching.controller.js';
import {
  getStudentAttendanceSummary, getStudentSubjectAttendance,
} from '../controllers/attendance.controller.js';

const router = express.Router();

const TEACHING_ROLES = ['faculty', 'coordinator', 'chairperson'];

// ---- Teaching (faculty / coordinator / chairperson) ----
router.get('/teaching/my-classes', isAuthenticated, allowRoles(...TEACHING_ROLES), getMyClasses);
router.get('/teaching/my-classes/:classKey/:subjectId/today', isAuthenticated, allowRoles(...TEACHING_ROLES), getTodaySession);
router.get('/teaching/classes/:classKey/students', isAuthenticated, allowRoles(...TEACHING_ROLES), getClassRoster);
router.post('/teaching/sessions', isAuthenticated, allowRoles(...TEACHING_ROLES), createSession);
router.patch('/teaching/sessions/:id', isAuthenticated, allowRoles(...TEACHING_ROLES), updateSession);
router.post('/teaching/sessions/:id/submit', isAuthenticated, allowRoles(...TEACHING_ROLES), submitSession);
// Admin gets read access + locked-override; ownership/lock rules are enforced in the controller.
router.get('/teaching/sessions/:id/records', isAuthenticated, allowRoles(...TEACHING_ROLES, 'admin'), getSessionRecords);
router.put('/teaching/sessions/:id/records', isAuthenticated, allowRoles(...TEACHING_ROLES, 'admin'), upsertAttendanceRecords);

// ---- Admin: assignments, subjects, unlock ----
router.post('/admin/faculty-assignments', isAuthenticated, allowRoles('admin'), createFacultyAssignment);
router.get('/admin/faculty-assignments', isAuthenticated, allowRoles('admin'), listFacultyAssignments);
router.get('/admin/subjects', isAuthenticated, allowRoles('admin'), listSubjects);
router.post('/admin/subjects', isAuthenticated, allowRoles('admin'), createSubject);
router.get('/admin/attendance/sessions', isAuthenticated, allowRoles('admin'), adminListSessions);
router.post('/admin/attendance/sessions/:id/unlock', isAuthenticated, allowRoles('admin'), unlockSession);

// ---- Student attendance (student = own only; others scoped in controller) ----
router.get('/attendance/student/:rollNo/summary', isAuthenticated, allowRoles('student', 'faculty', 'coordinator', 'chairperson', 'admin'), getStudentAttendanceSummary);
router.get('/attendance/student/:rollNo/subject/:subjectId', isAuthenticated, allowRoles('student', 'faculty', 'coordinator', 'chairperson', 'admin'), getStudentSubjectAttendance);

export default router;
