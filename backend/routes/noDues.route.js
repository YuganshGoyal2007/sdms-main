import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';
import {
  getMyNoDues,
  applyNoDues,
  resubmitNoDues,
  getPendingClearances,
  actionClearanceStage,
  getClearanceCertificate,
} from '../controllers/noDues.controller.js';

const router = express.Router();

// Student endpoints
router.get('/no-dues/my', isAuthenticated, allowRoles('student'), getMyNoDues);
router.post('/no-dues/apply', isAuthenticated, allowRoles('student'), applyNoDues);
router.post('/no-dues/resubmit', isAuthenticated, allowRoles('student'), resubmitNoDues);
router.get('/no-dues/certificate/:applicationId', isAuthenticated, getClearanceCertificate);

// Approver / Staff / Admin endpoints
router.get(
  '/no-dues/pending',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator', 'faculty'),
  getPendingClearances
);
router.post(
  '/no-dues/stages/:id/action',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator', 'faculty'),
  actionClearanceStage
);

export default router;
