import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';
import {
    sendMessage,
    getInbox,
    getSent,
    markRead,
    markAllRead,
    unreadCount,
    deleteMessage,
    clearInbox,
    clearSent,
    getRecipients,
} from '../controllers/messages.controller.js';

const router = express.Router();

/**
 * All authenticated users can hit these endpoints.
 * Per-role authorization happens inside each handler.
 */
router.post('/', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty', 'officer'), sendMessage);
router.get('/inbox', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty', 'officer'), getInbox);
router.delete('/inbox', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty', 'officer'), clearInbox);
router.get('/sent', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty', 'officer'), getSent);
router.delete('/sent', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty', 'officer'), clearSent);
router.get('/unread-count', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty', 'officer'), unreadCount);
router.get('/recipients', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty', 'officer'), getRecipients);
router.patch('/mark-all-read', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty', 'officer'), markAllRead);
router.patch('/:id/read', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty', 'officer'), markRead);
router.delete('/:id', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty', 'officer'), deleteMessage);

export default router;
