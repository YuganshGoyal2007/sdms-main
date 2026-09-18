import { Op } from 'sequelize';
import XLSX from 'xlsx';
import sequelize from '../lib/db.js';

import { reformatExcel } from '../services/excelReformat.service.js';
import { uploadStudentPhotos } from '../services/photoUpload.service.js';
import Student from '../models/student.model.js';
import Coordinator from '../models/coordinator.model.js';
import { removeSpaces, normalizeIdentifier, formatCanonicalRollNo, detectAndCorrectSwappedIdentifiers, toTitleCase } from '../services/whitespace.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import sharp from 'sharp';
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

  let reformattedBuffer;
  try {
    reformattedBuffer = reformatExcel(req.file.buffer);
  } catch (err) {
    logger.warn({ err: { name: err.name, message: err.message } }, 'Excel reformatting failed');
    return res.status(400).json({ success: false, message: err.message || 'Unable to reformat Excel file' });
  }

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
    const normalizedRollNo = normalizeIdentifier(result.rollNo);
    if (!normalizedRollNo) {
      errors.push({ rollNo: result.rollNo || 'Unknown', error: 'Invalid or missing roll number' });
      continue;
    }

    let photoData = result.photoData;
    if (!photoData) {
      errors.push({ rollNo: result.rollNo, error: 'No photo data extracted for this student' });
      continue;
    }

    let convertedPhoto = photoData;
    try {
      const base64Data = photoData.split(',')[1] || photoData;
      const imgBuffer = Buffer.from(base64Data, 'base64');
      const compressedBuffer = await sharp(imgBuffer)
        .resize({ width: 400, height: 500, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
      convertedPhoto = 'data:image/jpeg;base64,' + compressedBuffer.toString('base64');
    } catch (err) {
      logger.warn({ rollNo: result.rollNo, err: err.message }, 'Failed to compress photo with sharp, using original');
    }

    try {
      const [updated] = await Student.update(
        { photo: convertedPhoto },
        { 
          where: { 
            [Op.or]: [
              { rollNo: normalizedRollNo },
              { enrollmentNo: normalizedRollNo }
            ]
          } 
        }
      );
      if (updated > 0) {
        updatedCount += 1;
      } else {
        errors.push({ rollNo: result.rollNo, error: 'Student not found for this roll/enrollment number' });
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

const buildExportRow = (student, withPhoto = false) => {
  const raw = typeof student.toJSON === 'function' ? student.toJSON() : student;

  // Auto-detect and swap if rollNo and enrollmentNo were swapped in database
  const { rollNo: cleanRoll, enrollmentNo: cleanEnroll } = detectAndCorrectSwappedIdentifiers(raw.rollNo, raw.enrollmentNo);

  const row = {
    'Roll No': cleanRoll || '',
    'Enrollment No': cleanEnroll || '',
    'Full Name': toTitleCase(raw.fullName),
    'School': (raw.school || '').toUpperCase(),
    'Department': (raw.department || '').toUpperCase(),
    'Program': raw.program || '',
    'Batch': raw.batch || '',
    'Specialization': raw.specialization || '',
    "Father's Name": toTitleCase(raw.fatherName),
    "Mother's Name": toTitleCase(raw.motherName),
    'Gender': raw.gender || '',
    'Date of Birth': raw.dob ? new Date(raw.dob).toISOString().slice(0, 10) : '',
    'Category': raw.category || '',
    'Aadhaar / National ID': raw.nationalId || '',
    'Mobile': raw.mobile || '',
    'Email': (raw.email || '').toLowerCase(),
    'Address': raw.address || '',
    'Hosteller': raw.hosteller || 'No',
    'Enrollment Status': raw.enrollmentStatus || 'Enrolled',
    'Admission Type': raw.admissionType || 'Regular',
    'Admission Year': raw.admissionYear || '',
    '12th Compartment': raw.twelfthCompartment || 'No',
    'Internship Status': raw.internshipStatus || 'Inactive',
    'Placement Status': raw.placementStatus || 'Not Placed',
    'Status': raw.status || 'Active',
    'Created At': raw.createdAt ? new Date(raw.createdAt).toISOString().slice(0, 19).replace('T', ' ') : '',
    'Updated At': raw.updatedAt ? new Date(raw.updatedAt).toISOString().slice(0, 19).replace('T', ' ') : '',
    'Photo Available': raw.hasPhoto ? 'Yes' : (raw.photo ? 'Yes' : 'No')
  };

  if (withPhoto) {
    row['Photo'] = raw.photo || '';
  }

  let semesters = raw.semesters;
  if (typeof semesters === 'string') {
    try { semesters = JSON.parse(semesters); } catch { semesters = []; }
  }
  semesters = Array.isArray(semesters) ? semesters : [];
  semesters.forEach((semester, index) => {
    const number = semester?.semester || index + 1;
    row[`Semester ${number} Registration`] = semester?.registered ?? '';
    row[`Semester ${number} SGPA`] = semester?.sgpa ?? '';
  });

  let yearCGPA = raw.yearCGPA;
  if (typeof yearCGPA === 'string') {
    try { yearCGPA = JSON.parse(yearCGPA); } catch { yearCGPA = []; }
  }
  yearCGPA = Array.isArray(yearCGPA) ? yearCGPA : [];
  yearCGPA.forEach((year, index) => {
    const number = year?.year || index + 1;
    const suffix = number === 1 ? 'st' : number === 2 ? 'nd' : number === 3 ? 'rd' : 'th';
    row[`${number}${suffix} Year CGPA`] = year?.cgpa ?? '';
  });

  return row;
};

const normVal = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v).trim().toLowerCase();
  return (s === 'none' || s === 'n/a' || s === 'null') ? '' : s;
};

const sendWorkbook = (res, students, filename, metadata = {}, withPhoto = false) => {
  const rows = students.map(s => buildExportRow(s, withPhoto));
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);

  worksheet['!cols'] = Object.keys(rows[0] || {}).map((key) => {
    let maxLen = key.length;
    for (let r = 0; r < Math.min(rows.length, 500); r++) {
      const val = String(rows[r][key] ?? '');
      if (val.length > maxLen) maxLen = val.length;
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });

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
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

  return res.send(buffer);
};

export const exportStudentsToExcel = asyncHandler(async (req, res) => {
  const { school, department, program, batch, specialization, withPhotos } = req.query;

  const querySchool = school ? String(school).trim() : null;
  const queryDept = department ? String(department).trim() : null;
  const queryProg = program ? String(program).trim() : null;
  const queryBatch = batch ? String(batch).trim() : null;
  const querySpec = specialization ? String(specialization).trim() : null;
  const includePhotos = withPhotos === 'true';

  const hasFilter = Boolean(querySchool || queryDept || queryProg || queryBatch || querySpec);

  let where = {};
  let metadata = {
    school: querySchool || undefined,
    department: queryDept || undefined,
    program: queryProg || undefined,
    batch: queryBatch || undefined,
    specialization: querySpec || undefined,
  };

  logger.info(
    {
      userId: req.user?.id,
      role: req.user?.role,
      filters: metadata,
    },
    'Export students to Excel'
  );

  // Build base filter conditions supporting multi-tier hierarchy (dept, program, batch, class)
  const baseFilter = {};
  if (querySchool) {
    baseFilter.school = { [Op.or]: [querySchool, querySchool.toLowerCase(), querySchool.toUpperCase()] };
  }
  if (queryDept) {
    baseFilter.department = { [Op.or]: [queryDept, queryDept.toLowerCase(), queryDept.toUpperCase()] };
  }
  if (queryProg) {
    baseFilter.program = queryProg;
  }
  if (queryBatch) {
    baseFilter.batch = queryBatch;
  }
  if (querySpec) {
    baseFilter.specialization = querySpec;
  }

  if (req.user.role === 'admin') {
    where = baseFilter;
  } else if (req.user.role === 'chairperson') {
    const { assignments } = await getChairpersonAssignments(req.user);
    if (!assignments || !assignments.length) {
      return res.status(403).json({
        success: false,
        message: 'No classes or departments are assigned to this chairperson.'
      });
    }

    const assignedDepts = [...new Set(assignments.map((a) => normVal(a.department)).filter(Boolean))];

    // If department filter specified, verify it falls under chairperson purview
    if (queryDept) {
      const targetDeptNorm = normVal(queryDept);
      const isDeptAllowed = assignedDepts.some((d) => d === targetDeptNorm) ||
        assignments.some((a) => normVal(a.department) === targetDeptNorm);

      if (!isDeptAllowed) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Department ${queryDept} is not under your purview.`
        });
      }
    } else if (assignedDepts.length > 0) {
      baseFilter.department = { [Op.in]: assignedDepts };
    }

    // If specific class filter requested, verify class compatibility
    if (querySpec) {
      const match = assignments.some((a) =>
        (!queryDept || normVal(a.department) === normVal(queryDept)) &&
        (!queryBatch || normVal(a.batch) === normVal(queryBatch)) &&
        normVal(a.specialization) === normVal(querySpec)
      );
      if (!match) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: this class is not assigned to you.'
        });
      }
    }

    where = baseFilter;
  } else if (req.user.role === 'coordinator') {
    const assignments = await getCoordinatorAssignedClasses(req.user);
    if (!assignments || !assignments.length) {
      return res.status(403).json({
        success: false,
        message: 'No classes are assigned to this coordinator.'
      });
    }

    const coordWhere = buildCoordinatorWhereClause(assignments);
    if (hasFilter) {
      where = { [Op.and]: [coordWhere, baseFilter] };
    } else {
      where = coordWhere;
    }
  } else {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to export student records.'
    });
  }

  const attributes = {
    exclude: includePhotos ? [] : ['photo'],
    include: [
      [
        sequelize.literal("CASE WHEN photo IS NOT NULL AND photo != '' THEN 1 ELSE 0 END"),
        'hasPhoto'
      ]
    ]
  };

  const students = await Student.findAll({
    where,
    attributes,
    raw: true,
    order: [
      ['school', 'ASC'],
      ['department', 'ASC'],
      ['program', 'ASC'],
      ['batch', 'ASC'],
      ['specialization', 'ASC'],
      ['rollNo', 'ASC']
    ]
  });

  // Natural sequential sorting by canonical roll number within class
  students.sort((a, b) => {
    const schoolComp = (a.school || '').localeCompare(b.school || '');
    if (schoolComp !== 0) return schoolComp;
    const deptComp = (a.department || '').localeCompare(b.department || '');
    if (deptComp !== 0) return deptComp;
    const progComp = (a.program || '').localeCompare(b.program || '');
    if (progComp !== 0) return progComp;
    const batchComp = (a.batch || '').localeCompare(b.batch || '');
    if (batchComp !== 0) return batchComp;
    const specComp = (a.specialization || '').localeCompare(b.specialization || '');
    if (specComp !== 0) return specComp;

    // Secondary sort: canonical roll number using natural numeric collation
    const rollA = detectAndCorrectSwappedIdentifiers(a.rollNo, a.enrollmentNo).rollNo || '';
    const rollB = detectAndCorrectSwappedIdentifiers(b.rollNo, b.enrollmentNo).rollNo || '';
    return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Descriptive, clean filename reflecting the exact export tier
  const parts = [];
  if (querySchool) parts.push(querySchool.toUpperCase());
  if (queryDept) parts.push(queryDept.toUpperCase());
  if (queryProg) parts.push(queryProg.replace(/\s+/g, '_'));
  if (queryBatch) parts.push(`Batch_${queryBatch}`);
  if (querySpec) parts.push(querySpec.replace(/\s+/g, '_'));

  let fileBase = parts.join('_');
  if (!fileBase) {
    fileBase = req.user.role === 'admin'
      ? 'All_Students'
      : req.user.role === 'chairperson'
        ? 'Chairperson_Assigned_Students'
        : 'Coordinator_Assigned_Students';
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${fileBase}_${dateStr}.xlsx`;

  logger.info(
    { recordCount: students.length, filename, role: req.user.role, userId: req.user.id },
    'Export students complete'
  );

  return sendWorkbook(res, students, filename, metadata, includePhotos);
});
