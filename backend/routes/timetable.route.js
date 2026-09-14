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
    getScrapeStatusController,
    syncFacultyController,
    getFacultyAuditLogController,
    previewSectionController,
    captureTimetableSnapshot,
    getTimetableSnapshots,
    getSnapshotDetails,
} from '../controllers/timetable.controller.js';

const router = express.Router();

// Dry Run / Section Preview (Admin / Coordinator / Chairperson) - Pure read-only, no DB writes
router.post('/preview-section', isAuthenticated, allowRoles('admin', 'chairperson', 'coordinator'), previewSectionController);

// Timetable Snapshot Engine (Admin / Chairperson)
router.post('/snapshots/capture', isAuthenticated, allowRoles('admin', 'chairperson'), captureTimetableSnapshot);
router.get('/snapshots', isAuthenticated, allowRoles('admin', 'chairperson', 'coordinator', 'faculty'), getTimetableSnapshots);
router.get('/snapshots/:id', isAuthenticated, allowRoles('admin', 'chairperson', 'coordinator', 'faculty'), getSnapshotDetails);

// Live Scraping & Faculty Reassignment Engine (Admin / Coordinator)
router.get('/scrape-live-status', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), getScrapeStatusController);
router.post('/sync-faculty', isAuthenticated, allowRoles('admin'), syncFacultyController);
router.get('/faculty-audit-log', isAuthenticated, allowRoles('admin'), getFacultyAuditLogController);

// Student endpoints
router.get('/me', isAuthenticated, allowRoles('student'), getMyTimetable);
router.post('/refresh', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), refreshMyTimetable);
router.get('/changes-since', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'student'), hasChangesSince);

// Class-level read (admin / coordinator / chairperson / faculty / student)
router.get('/section/:school/:department/:program/:batch/:specialization', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson', 'faculty', 'student'), getTimetableForClass);

// Admin & Chairperson: section mappings and refresh
router.get('/sections', isAuthenticated, allowRoles('admin', 'chairperson'), listSections);
router.post('/sections', isAuthenticated, allowRoles('admin'), createSection);
router.post('/sections/bulk', isAuthenticated, allowRoles('admin'), bulkCreateSections);
router.get('/discover', isAuthenticated, allowRoles('admin', 'chairperson'), discoverMissing);
router.delete('/sections/:id', isAuthenticated, allowRoles('admin'), deleteSection);
router.post('/refresh-all', isAuthenticated, allowRoles('admin', 'chairperson'), refreshAll);

export default router;
