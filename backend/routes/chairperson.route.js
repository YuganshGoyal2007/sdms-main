import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';
import { addChairperson, getAdminDetails, getChairpersonClasses, getChairpersonLogs, getChairpersons, getMessages, sendMessage, deleteChairperson } from '../controllers/chairperson.controller.js';

const router = express.Router();

router.post('/', isAuthenticated, allowRoles('admin'), addChairperson);
router.get('/', isAuthenticated, allowRoles('admin'), getChairpersons);
router.delete('/:id', isAuthenticated, allowRoles('admin'), deleteChairperson);
router.get('/get-admin-details', isAuthenticated, allowRoles('chairperson'), getAdminDetails);
router.get('/classes', isAuthenticated, allowRoles('chairperson', 'admin'), getChairpersonClasses);
router.get('/logs', isAuthenticated, allowRoles('chairperson'), getChairpersonLogs);
router.get('/messages', isAuthenticated, allowRoles('chairperson', 'coordinator'), getMessages);
router.post('/messages', isAuthenticated, allowRoles('chairperson', 'coordinator'), sendMessage);

router.get('/me', isAuthenticated, allowRoles('chairperson'), (req, res) => {
  return res.json({
    success: true,
    id: req.user.id,
    role: req.user.role,
    username: req.user.username,
    email: req.user.email,
  });
});

export default router;
