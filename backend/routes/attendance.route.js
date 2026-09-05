import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import {
  getMyClasses,
  getTodaySession,
  createSession,
  updateSession,
  submitSession,
  getSessionRecords,
  getClassRoster,
  upsertAttendanceRecords,
} from '../controllers/teaching.controller.js';
import {
  unlockSession,
  createFacultyAssignment,
  listFacultyAssignments,
  deleteFacultyAssignment,
  getEligibleTeachers,
  listSessions,
  getStudentAttendanceSummary,
} from '../controllers/attendance.controller.js';

const router = express.Router();

// ----- Teaching (faculty / coordinator / chairperson) -----
router.get(['/teaching/my-classes', '/faculty/my-classes'], isAuthenticated, allowRoles('faculty', 'coordinator', 'chairperson'), getMyClasses);
router.get(
  ['/teaching/my-classes/:classKey/:subjectId/today', '/faculty/my-classes/:classKey/:subjectId/today'],
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson'),
  getTodaySession
);
router.get(
  '/teaching/roster',
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson'),
  getClassRoster
);
router.post('/teaching/sessions', isAuthenticated, allowRoles('faculty', 'coordinator', 'chairperson'), createSession);
router.patch('/teaching/sessions/:id', isAuthenticated, allowRoles('faculty', 'coordinator', 'chairperson'), updateSession);
router.post(
  '/teaching/sessions/:id/submit',
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson'),
  submitSession
);
router.get(
  '/teaching/sessions/:id/records',
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson', 'admin'),
  getSessionRecords
);
router.put(
  '/teaching/sessions/:id/records',
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson', 'admin'),
  upsertAttendanceRecords
);

// ----- Admin -----
router.post(
  '/admin/attendance/sessions/:id/unlock',
  isAuthenticated,
  allowRoles('admin'),
  unlockSession
);
router.get('/admin/attendance/sessions', isAuthenticated, allowRoles('admin', 'chairperson'), listSessions);

router.post('/admin/faculty-assignments', isAuthenticated, allowRoles('admin'), createFacultyAssignment);
router.get('/admin/faculty-assignments', isAuthenticated, allowRoles('admin'), listFacultyAssignments);
router.delete('/admin/faculty-assignments/:id', isAuthenticated, allowRoles('admin'), deleteFacultyAssignment);
router.get('/admin/eligible-teachers', isAuthenticated, allowRoles('admin'), getEligibleTeachers);

// ----- Student summary (self, or staff with scope) -----
router.get('/attendance/student/:rollNo/summary', isAuthenticated, allowRoles('student', 'faculty', 'coordinator', 'chairperson', 'admin'), getStudentAttendanceSummary);

export default router;
