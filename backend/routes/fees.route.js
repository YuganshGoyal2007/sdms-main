import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';
import { getMyFees, getStudentFees, payFeeRecord } from '../controllers/fees.controller.js';

const router = express.Router();

// Student routes
router.get('/fees/my', isAuthenticated, allowRoles('student'), getMyFees);
router.post('/fees/pay', isAuthenticated, allowRoles('student', 'admin'), payFeeRecord);

// Admin / Staff routes
router.get(
  '/fees/student/:rollNo',
  isAuthenticated,
  allowRoles('admin', 'coordinator', 'chairperson', 'faculty'),
  getStudentFees
);

export default router;
