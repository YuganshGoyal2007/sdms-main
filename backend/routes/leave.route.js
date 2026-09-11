import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';
import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getMyLeaves,
  getMyLeaveBalances,
  applyLeave,
  getPendingLeaves,
  updateLeaveStatus,
  getTeacherTimetableForLeave,
} from '../controllers/leave.controller.js';

const router = express.Router();

// Public / Authenticated Leave Types
router.get('/leaves/types', isAuthenticated, getLeaveTypes);
router.post('/leaves/types', isAuthenticated, allowRoles('admin'), createLeaveType);
router.put('/leaves/types/:id', isAuthenticated, allowRoles('admin'), updateLeaveType);
router.delete('/leaves/types/:id', isAuthenticated, allowRoles('admin'), deleteLeaveType);

// Leave Operations (Faculty, Staff, Coordinators, Chairpersons, Admin, Officers — restricted from students)
router.get(
  '/leaves/my',
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson', 'admin', 'officer'),
  getMyLeaves
);
router.get(
  '/leaves/my/balance',
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson', 'admin', 'officer'),
  getMyLeaveBalances
);
router.post(
  '/leaves/apply',
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson', 'admin', 'officer'),
  applyLeave
);

// Approval Operations (HOD & Dean)
router.get(
  '/leaves/pending',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator', 'officer'),
  getPendingLeaves
);
router.put(
  '/leaves/:id/status',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator', 'officer'),
  updateLeaveStatus
);

// Teacher timetable review for approvers
router.get(
  '/leaves/:id/teacher-timetable',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator', 'officer'),
  getTeacherTimetableForLeave
);

export default router;
