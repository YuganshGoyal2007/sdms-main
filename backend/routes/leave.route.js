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
} from '../controllers/leave.controller.js';

const router = express.Router();

// Public / Authenticated Leave Types
router.get('/leaves/types', isAuthenticated, getLeaveTypes);
router.post('/leaves/types', isAuthenticated, allowRoles('admin'), createLeaveType);
router.put('/leaves/types/:id', isAuthenticated, allowRoles('admin'), updateLeaveType);
router.delete('/leaves/types/:id', isAuthenticated, allowRoles('admin'), deleteLeaveType);

// Faculty / Staff Leave Operations
router.get(
  '/leaves/my',
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson', 'admin'),
  getMyLeaves
);
router.get(
  '/leaves/my/balance',
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson', 'admin'),
  getMyLeaveBalances
);
router.post(
  '/leaves/apply',
  isAuthenticated,
  allowRoles('faculty', 'coordinator', 'chairperson', 'admin'),
  applyLeave
);

// Approval Operations (HOD & Dean)
router.get(
  '/leaves/pending',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator'),
  getPendingLeaves
);
router.put(
  '/leaves/:id/status',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator'),
  updateLeaveStatus
);

export default router;
