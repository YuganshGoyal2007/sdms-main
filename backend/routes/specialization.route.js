import express  from 'express';
import { addSpecialization, countSpecializations, deleteSpecialization, searchBatches, searchSpecialization, viewSpecializations } from '../controllers/specialization.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { allowRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

router.post('/add-specialization', isAuthenticated, allowRoles('admin'), addSpecialization);
router.get('/count-specialization', isAuthenticated, allowRoles('admin', 'coordinator'), countSpecializations);
router.get('/view-specializations', isAuthenticated, allowRoles('admin', 'coordinator'), viewSpecializations);
router.delete('/delete-specialization', isAuthenticated, allowRoles('admin'), deleteSpecialization);
router.get('/search-batches', isAuthenticated, allowRoles('admin', 'coordinator'), searchBatches);
router.get('/search-specialization-names', isAuthenticated, allowRoles('admin', 'coordinator'), searchSpecialization);

export default router;