import { Op } from 'sequelize';
import XLSX from 'xlsx';

import { reformatExcel } from '../services/excelReformat.service.js';
import { uploadStudentPhotos } from '../services/photoUpload.service.js';
import Student from '../models/student.model.js';
import Coordinator from '../models/coordinator.model.js';
import { removeSpaces } from '../services/whitespace.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import logger from '../lib/logger.js';
import { getChairpersonAssignments } from './chairperson.controller.js';
import {
  getCoordinatorAssignedClasses,
  buildCoordinatorWhereClause,
  isClassAssignedToCoordinator,
} from './student.controller.js';

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

const classFields = [
  'school',
  'department',
  'program',
  'batch',
  'specialization'
];

const normalizeClass = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const exactClassMatch = (student, assignment) =>
  classFields.every(
    (field) =>
      normalizeClass(student[field]) ===
      normalizeClass(assignment[field])
  );

const buildExportRow = (student) => {
  const raw = student.toJSON();

  const row = {
    'Roll No': raw.rollNo,
    'Enrollment No': raw.enrollmentNo,
    'Full Name': raw.fullName,
    'School': raw.school,
    'Department': raw.department,
    'Program': raw.program,
    'Batch': raw.batch,
    'Specialization': raw.specialization,
    "Father's Name": raw.fatherName,
    "Mother's Name": raw.motherName,
    'Gender': raw.gender,
    'Date of Birth': raw.dob ? new Date(raw.dob).toISOString().slice(0, 10) : '',
    'Category': raw.category,
    'Aadhaar / National ID': raw.nationalId,
    'Mobile': raw.mobile,
    'Email': raw.email,
    'Address': raw.address,
    'Hosteller': raw.hosteller,
    'Enrollment Status': raw.enrollmentStatus,
    'Admission Type': raw.admissionType,
    'Admission Year': raw.admissionYear,
    '12th Compartment': raw.twelfthCompartment,
    'Internship Status': raw.internshipStatus,
    'Placement Status': raw.placementStatus,
    'Status': raw.status,
    'Created At': raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
    'Updated At': raw.updatedAt ? new Date(raw.updatedAt).toISOString() : '',
    'Photo Available': raw.photo ? 'Yes' : 'No'
  };

  const semesters = Array.isArray(raw.semesters) ? raw.semesters : [];
  semesters.forEach((semester, index) => {
    const number = semester?.semester || index + 1;
    row[`Semester ${number} Registration`] = semester?.registered ?? '';
    row[`Semester ${number} SGPA`] = semester?.sgpa ?? '';
  });

  const yearCGPA = Array.isArray(raw.yearCGPA) ? raw.yearCGPA : [];
  yearCGPA.forEach((year, index) => {
    const number = year?.year || index + 1;
    const suffix = number === 1 ? 'st' : number === 2 ? 'nd' : number === 3 ? 'rd' : 'th';
    row[`${number}${suffix} Year CGPA`] = year?.cgpa ?? '';
  });

  return row;
};

const sendWorkbook = (res, students, filename, metadata = {}) => {
  const rows = students.map(buildExportRow);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.min(Math.max(key.length + 2, 12), 32)
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Records');

  const summary = XLSX.utils.json_to_sheet([
    { Field: 'Exported At', Value: new Date().toISOString() },
    { Field: 'Records', Value: students.length },
    ...(metadata.school ? [{ Field: 'School', Value: metadata.school }] : []),
    ...(metadata.department ? [{ Field: 'Department', Value: metadata.department }] : []),
    ...(metadata.program ? [{ Field: 'Program', Value: metadata.program }] : []),
    ...(metadata.batch ? [{ Field: 'Batch', Value: metadata.batch }] : []),
    ...(metadata.specialization ? [{ Field: 'Specialization', Value: metadata.specialization }] : [])
  ]);

  XLSX.utils.book_append_sheet(workbook, summary, 'Export Info');

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  return res.send(buffer);
};

export const exportStudentsToExcel = asyncHandler(async (req, res) => {
  const { school, department, program, batch, specialization } = req.query;

  const hasClassFilter = classFields.some((field) => req.query[field]);

  let where;
  let metadata = { school, department, program, batch, specialization };

  logger.info(
    {
      userId: req.user?.id,
      role: req.user?.role,
      filters: { school, department, program, batch, specialization },
    },
    'Export students to Excel'
  );

  if (req.user.role === 'admin') {
    where = {};
    classFields.forEach((field) => {
      if (req.query[field]) where[field] = req.query[field];
    });
  } else if (req.user.role === 'coordinator') {
    const assignments = await getCoordinatorAssignedClasses(req.user);
    if (!assignments.length) {
      return res.status(403).json({
        success: false,
        message: 'No classes are assigned to this coordinator.'
      });
    }

    if (hasClassFilter) {
      const target = { school, department, program, batch, specialization };
      if (!isClassAssignedToCoordinator(assignments, target)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: this class is not assigned to you.'
        });
      }
      where = Object.fromEntries(
        classFields
          .filter((field) => req.query[field])
          .map((field) => [field, req.query[field]])
      );
    } else {
      where = buildCoordinatorWhereClause(assignments);
      metadata = {};
    }
  } else if (req.user.role === 'chairperson') {
    const { assignments } = await getChairpersonAssignments(req.user);
    if (!assignments.length) {
      return res.status(403).json({
        success: false,
        message: 'No classes are assigned to this chairperson.'
      });
    }

    if (hasClassFilter) {
      const target = { school, department, program, batch, specialization };
      if (!isClassAssignedToCoordinator(assignments, target)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: this class is not assigned to you.'
        });
      }
      where = Object.fromEntries(
        classFields
          .filter((field) => req.query[field])
          .map((field) => [field, req.query[field]])
      );
    } else {
      where = {
        [Op.or]: assignments.map((assignment) =>
          Object.fromEntries(
            classFields.map((field) => [field, assignment[field]])
          )
        )
      };
      metadata = {};
    }
  } else {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to export student records.'
    });
  }

  const students = await Student.findAll({
    where,
    order: [
      ['school', 'ASC'],
      ['department', 'ASC'],
      ['program', 'ASC'],
      ['batch', 'ASC'],
      ['specialization', 'ASC'],
      ['rollNo', 'ASC']
    ]
  });

  const prefix = req.user.role === 'admin'
    ? 'all-student-records'
    : req.user.role === 'chairperson'
      ? 'chairperson-assigned-records'
      : 'coordinator-assigned-records';

  const suffix = hasClassFilter ? '-class' : '';
  const filename = `${prefix}${suffix}.xlsx`;

  logger.info(
    { recordCount: students.length, filename, role: req.user.role, userId: req.user.id },
    'Export students complete'
  );

  return sendWorkbook(res, students, filename, metadata);
});
