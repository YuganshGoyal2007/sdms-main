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
  getAllOfficesOverview,
  getOfficePortalData,
  actionOfficeClearance,
  bulkApproveOfficeClearance,
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

// Departmental Portals (Library, Hostel, Sports, Dean, ICT Office)
router.get(
  '/no-dues/portals/overview',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator', 'faculty', 'officer'),
  getAllOfficesOverview
);
router.get(
  '/no-dues/portal/:officeCode',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator', 'faculty', 'officer'),
  getOfficePortalData
);
router.post(
  '/no-dues/portal/:officeCode/action/:stageId',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator', 'faculty', 'officer'),
  actionOfficeClearance
);
router.post(
  '/no-dues/portal/:officeCode/bulk-approve',
  isAuthenticated,
  allowRoles('admin', 'chairperson', 'coordinator', 'faculty', 'officer'),
  bulkApproveOfficeClearance
);

export default router;

