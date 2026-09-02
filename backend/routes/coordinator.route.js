import express from 'express';
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { addCoordinator, deleteCoordinator, getAdminDetails, getAdmins, getChangeLogs, getNotifications } from '../controllers/coordinator.controller.js';

const router = express.Router();

router.get('/get-admin-details',isAuthenticated, getAdminDetails);
router.get('/get-admins', isAuthenticated, allowRoles('admin', 'coordinator'), getAdmins);
router.get('/changes', isAuthenticated, allowRoles('coordinator', 'admin', 'chairperson'), getChangeLogs);
router.get('/notifications', isAuthenticated, allowRoles('admin'), getNotifications);
router.post('/add-coordinator', isAuthenticated, allowRoles('admin'), addCoordinator);
router.delete('/delete-coordinator/:id', isAuthenticated, allowRoles('admin'), deleteCoordinator);

router.get("/me", isAuthenticated, (req, res) => {
  res.json({
    id: req.user.id,
    role: req.user.role,
  })
})

export default router;
