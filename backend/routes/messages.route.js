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
router.post('/', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty'), sendMessage);
router.get('/inbox', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty'), getInbox);
router.delete('/inbox', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty'), clearInbox);
router.get('/sent', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty'), getSent);
router.delete('/sent', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty'), clearSent);
router.get('/unread-count', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty'), unreadCount);
router.get('/recipients', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty'), getRecipients);
router.patch('/mark-all-read', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty'), markAllRead);
router.patch('/:id/read', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty'), markRead);
router.delete('/:id', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student', 'faculty'), deleteMessage);

export default router;
