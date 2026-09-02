import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';
import { addChairperson, getChairpersonClasses, getChairpersonLogs, getChairpersons, getMessages, sendMessage, deleteChairperson } from '../controllers/chairperson.controller.js';

const router = express.Router();
router.post('/', isAuthenticated, allowRoles('admin'), addChairperson);
router.get('/', isAuthenticated, allowRoles('admin'), getChairpersons);
router.delete('/:id', isAuthenticated, allowRoles('admin'), deleteChairperson);
router.get('/classes', isAuthenticated, allowRoles('chairperson', 'admin'), getChairpersonClasses);
router.get('/logs', isAuthenticated, allowRoles('chairperson'), getChairpersonLogs);
router.get('/messages', isAuthenticated, allowRoles('chairperson', 'coordinator'), getMessages);
router.post('/messages', isAuthenticated, allowRoles('chairperson', 'coordinator'), sendMessage);
export default router;
