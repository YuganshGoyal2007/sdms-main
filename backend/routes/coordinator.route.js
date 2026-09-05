import express from 'express';
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { addCoordinator, deleteCoordinator, getAdminDetails, getAdmins, getChangeLogs, getCoordinatorClasses, getNotifications } from '../controllers/coordinator.controller.js';

const router = express.Router();

router.get('/get-admin-details', isAuthenticated, allowRoles('coordinator', 'admin'), getAdminDetails);
router.get('/get-admins', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), getAdmins);
router.get('/classes', isAuthenticated, allowRoles('coordinator'), getCoordinatorClasses);
router.get('/changes', isAuthenticated, allowRoles('coordinator', 'admin', 'chairperson'), getChangeLogs);
router.get('/notifications', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), getNotifications);
router.post('/add-coordinator', isAuthenticated, allowRoles('admin'), addCoordinator);
router.delete('/delete-coordinator/:id', isAuthenticated, allowRoles('admin'), deleteCoordinator);

router.get("/me", isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'faculty', 'student'), getAdminDetails);

export default router;
