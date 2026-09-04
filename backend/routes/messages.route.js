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
router.post('/', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), sendMessage);
router.get('/inbox', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), getInbox);
router.delete('/inbox', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), clearInbox);
router.get('/sent', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), getSent);
router.delete('/sent', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), clearSent);
router.get('/unread-count', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), unreadCount);
router.get('/recipients', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), getRecipients);
router.patch('/mark-all-read', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), markAllRead);
router.patch('/:id/read', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), markRead);
router.delete('/:id', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), deleteMessage);

export default router;
