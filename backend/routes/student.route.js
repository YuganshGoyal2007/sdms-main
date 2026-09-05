import express from 'express';
import { addStudent, deleteSpecializationStudents, deleteStudent, getFilteredStudents, getStudentCount, getStudentDetails, getStudentProfile, updateStudent, updateStudentPhoto, uploadStudents, uploadStudentsWithReformat, searchStudents, bulkUpdateStudents } from '../controllers/student.controller.js';
import { reformatExcelFile, uploadStudentPhotosController, exportStudentsToExcel } from '../controllers/excel.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import multer from 'multer';
import { allowRoles } from '../middlewares/role.middleware.js';
import logger from '../lib/logger.js';

const router = express.Router();

const ALLOWED_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

const excelFileFilter = (req, file, cb) => {
  const lowerName = (file.originalname || '').toLowerCase();
  const extOk = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');
  const mimeOk = ALLOWED_MIMES.has(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);

  logger.warn(
    { originalname: file.originalname, mimetype: file.mimetype, size: file.size, userId: req.user?.id },
    'Rejected upload: not an allowed Excel file'
  );
  const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
  err.message = 'Only .xlsx or .xls files are accepted';
  cb(err);
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: excelFileFilter,
});

const uploadLarge = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024, files: 1 },
    fileFilter: excelFileFilter,
});


router.post('/add-student', isAuthenticated, allowRoles('admin', 'coordinator'), addStudent);
router.put("/update-student/:id", isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), updateStudent);
router.post('/bulk-update-students', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), bulkUpdateStudents);
router.post('/upload-students', isAuthenticated, allowRoles('admin', 'coordinator'), upload.single("file"), uploadStudents);
router.post('/upload-students-with-reformat', isAuthenticated, allowRoles('admin', 'coordinator'), upload.single("file"), uploadStudentsWithReformat);
router.post('/reformat-excel', isAuthenticated, allowRoles('admin', 'coordinator'), upload.single("file"), reformatExcelFile);
router.post('/upload-photos', isAuthenticated, allowRoles('admin', 'coordinator'), uploadLarge.single("file"), uploadStudentPhotosController);
router.get('/export-students', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), exportStudentsToExcel);
router.put('/update-student-photo/:rollNo', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), updateStudentPhoto);
router.get('/count-students', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), getStudentCount);
router.get('/search-students', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), searchStudents);
router.get('/get-student-profile/:rollNo', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), getStudentProfile);
router.get('/get-student-details', isAuthenticated, allowRoles('student'), getStudentDetails);
router.post('/filter-students', isAuthenticated, allowRoles('admin', 'coordinator', 'chairperson'), getFilteredStudents);
router.delete('/delete-student/:rollNo', isAuthenticated, allowRoles('admin', 'coordinator'), deleteStudent);
router.delete('/delete-specialization-students', isAuthenticated, allowRoles('admin', 'coordinator'), deleteSpecializationStudents);

export default router;
