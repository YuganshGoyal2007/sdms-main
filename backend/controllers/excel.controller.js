import { reformatExcel } from '../services/excelReformat.service.js';
import { uploadStudentPhotos } from '../services/photoUpload.service.js';
import Student from '../models/student.model.js';
import { removeSpaces } from '../services/whitespace.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import logger from '../lib/logger.js';

export const reformatExcelFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Excel file is required' });
  }

  logger.info(
    {
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      userId: req.user?.id,
    },
    'Reformatting Excel file'
  );

  const reformattedBuffer = reformatExcel(req.file.buffer);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="reformatted.xlsx"');

  res.send(reformattedBuffer);
});

export const uploadStudentPhotosController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Excel file is required' });
  }

  logger.info(
    {
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      userId: req.user?.id,
    },
    'Uploading student photos from Excel'
  );

  const { results, errors } = await uploadStudentPhotos(req.file.buffer);

  let updatedCount = 0;
  for (const result of results) {
    const normalizedRollNo = removeSpaces(String(result.rollNo).toLowerCase());
    try {
      const [updated] = await Student.update(
        { photo: result.photoData },
        { where: { rollNo: normalizedRollNo } }
      );
      if (updated > 0) {
        updatedCount += 1;
      } else {
        errors.push({ rollNo: result.rollNo, error: 'Student not found for this roll number' });
      }
    } catch (err) {
      logger.warn({ rollNo: result.rollNo, err: { name: err.name, message: err.message } }, 'Photo update failed for student');
      errors.push({ rollNo: result.rollNo, error: err.message || 'Failed to update student photo' });
    }
  }

  logger.info(
    { total: results.length, updated: updatedCount, failed: errors.length, userId: req.user?.id },
    'Student photo upload completed'
  );

  res.status(200).json({
    success: true,
    message: 'Photo upload completed',
    updated: updatedCount,
    failed: errors.length,
    errors
  });
});
