import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';
import {
    getMyTimetable,
    getTimetableForClass,
    refreshMyTimetable,
    refreshAll,
    listSections,
    createSection,
    bulkCreateSections,
    discoverMissing,
    deleteSection,
    hasChangesSince,
} from '../controllers/timetable.controller.js';

const router = express.Router();

// Student endpoints
router.get('/me', isAuthenticated, allowRoles('student'), getMyTimetable);
router.post('/refresh', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), refreshMyTimetable);
router.get('/changes-since', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), hasChangesSince);

// Class-level read (admin / coordinator / chairperson / faculty / student)
router.get('/section/:school/:department/:program/:batch/:specialization', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'faculty', 'student'), getTimetableForClass);

// Admin: section mappings
router.get('/sections', isAuthenticated, allowRoles('admin'), listSections);
router.post('/sections', isAuthenticated, allowRoles('admin'), createSection);
router.post('/sections/bulk', isAuthenticated, allowRoles('admin'), bulkCreateSections);
router.get('/discover', isAuthenticated, allowRoles('admin'), discoverMissing);
router.delete('/sections/:id', isAuthenticated, allowRoles('admin'), deleteSection);
router.post('/refresh-all', isAuthenticated, allowRoles('admin'), refreshAll);

export default router;
