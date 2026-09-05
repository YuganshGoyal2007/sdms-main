import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';
import {
  getMyFees,
  getStudentFees,
  payFeeRecord,
  getAllFeesAdmin,
  assessStudentFee,
  updateFeeRecord,
  exportFeesCsv,
} from '../controllers/fees.controller.js';

const router = express.Router();

// Student routes
router.get('/fees/my', isAuthenticated, allowRoles('student'), getMyFees);
router.post('/fees/pay', isAuthenticated, allowRoles('student', 'admin'), payFeeRecord);

// Admin & Staff routes
router.get('/fees/admin/all', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), getAllFeesAdmin);
router.post('/fees/admin/record', isAuthenticated, allowRoles('admin', 'coordinator'), assessStudentFee);
router.put('/fees/admin/record/:id', isAuthenticated, allowRoles('admin', 'coordinator'), updateFeeRecord);
router.get('/fees/admin/export', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), exportFeesCsv);

router.get(
  '/fees/student/:rollNo',
  isAuthenticated,
  allowRoles('admin', 'coordinator', 'chairperson', 'faculty'),
  getStudentFees
);

export default router;
