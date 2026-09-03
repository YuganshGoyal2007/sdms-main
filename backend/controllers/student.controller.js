import Student from "../models/student.model.js";
import User from "../models/user.model.js";
import Coordinator from "../models/coordinator.model.js";
import ChangeLog from "../models/changeLog.model.js";
import Notification from "../models/notification.model.js";
import { removeSpaces } from "../services/whitespace.service.js";
import XLSX from 'xlsx';
import { buildSemesters, buildYearCGPA, COLUMN_ORDER, PROGRAM_CONFIG } from "../services/upload.service.js";
import { parseExcelDate } from "../services/parsing.service.js";
import { reformatExcel } from "../services/excelReformat.service.js";
import { Op, fn, col, where as seqWhere } from 'sequelize';
import { getChairpersonAssignments } from './chairperson.controller.js';
import { asyncHandler } from "../lib/asyncHandler.js";
import logger from "../lib/logger.js";

export const getCoordinatorAssignedClasses = async (user) => {
  if (!user || user.role !== 'coordinator') return [];
  const userIdentifierConditions = [{ userId: user.id }];
  if (user.username) {
    userIdentifierConditions.push({ email: user.username });
  }
  const coordRecords = await Coordinator.findAll({
    where: {
      [Op.or]: userIdentifierConditions
    }
  });
  return coordRecords.map(c => ({
    school: c.school,
    department: c.department,
    program: c.program,
    batch: c.batch,
    specialization: c.specialization
  }));
};

export const isClassAssignedToCoordinator = (assignedClasses, target) => {
  if (!assignedClasses || assignedClasses.length === 0) return false;
  return assignedClasses.some(c => {
    const matchSchool = !c.school || !target.school || c.school.toLowerCase().trim() === target.school.toLowerCase().trim();
    const matchDept = !c.department || !target.department || c.department.toLowerCase().trim() === target.department.toLowerCase().trim();
    const matchProg = !c.program || !target.program || c.program.toLowerCase().trim() === target.program.toLowerCase().trim();
    const matchBatch = !c.batch || !target.batch || c.batch.toLowerCase().trim() === target.batch.toLowerCase().trim();
    const matchSpec = !c.specialization || !target.specialization || c.specialization.toLowerCase().trim() === target.specialization.toLowerCase().trim();
    return matchSchool && matchDept && matchProg && matchBatch && matchSpec;
  });
};

export const buildCoordinatorWhereClause = (assignedClasses) => {
  if (!assignedClasses || assignedClasses.length === 0) return { id: -1 };
  const conditions = assignedClasses.map(c => {
    const cond = {};
    if (c.school) cond.school = c.school;
    if (c.department) cond.department = c.department;
    if (c.program) cond.program = c.program;
    if (c.batch) cond.batch = c.batch;
    if (c.specialization) cond.specialization = c.specialization;
    return cond;
  });
  return { [Op.or]: conditions };
};

export const getProgramRule = (program, batch) => {
  const programRules = {
    'B.Tech': { semesters: 8, years: 4 },
    'M.Tech': { semesters: 4, years: 2 },
    'B.Tech + M.Tech': { semesters: 10, years: 5 }
  };
  if (programRules[program]) return programRules[program];

  if (batch && batch.includes('-')) {
    const parts = batch.split('-');
    const start = parseInt(parts[0]);
    let end = parseInt(parts[1]);
    if (!isNaN(start) && !isNaN(end)) {
      if (end < 100) {
        end = Math.floor(start / 100) * 100 + end;
      }
      const duration = end - start;
      if (duration > 0 && duration <= 10) {
        return { semesters: duration * 2, years: duration };
      }
    }
  }
  return { semesters: 8, years: 4 };
};

export const addStudent = asyncHandler(async (req, res) => {
  const { status = 'active', rollNo, enrollmentNo, fullName, school, department, program, batch, specialization, fatherName, motherName, gender, dob, category, nationalId, mobile, email, address, hosteller, enrollmentStatus, admissionType, twelfthCompartment, admissionYear, semesters = [], yearCGPA = [], internshipStatus, placementStatus, photo } = req.body;
    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      const targetClass = { school, department, program, batch, specialization };
      if (!isClassAssignedToCoordinator(assignedClasses, targetClass)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to add students to this class.'
        });
      }
    }

    const targetStatus = status || 'active';

    if (targetStatus === 'active') {
      const existingRoll = await Student.findOne({ where: { rollNo: removeSpaces(rollNo.toLowerCase()), status: 'active' } });
      if (existingRoll) {
        return res.status(409).json({ success: false, message: 'Active student with this Roll number already exists' });
      }

      const existingEnroll = await Student.findOne({ where: { enrollmentNo: removeSpaces(enrollmentNo.toLowerCase()), status: 'active' } });
      if (existingEnroll) {
        return res.status(409).json({ success: false, message: 'Active student with this Enrollment number already exists' });
      }

      const existingMobile = await Student.findOne({ where: { mobile: mobile, status: 'active' } });
      if (existingMobile) {
        return res.status(409).json({ success: false, message: 'Active student with this Phone number already exists' });
      }

      const existingEmail = await Student.findOne({ where: { email: removeSpaces(email.toLowerCase()), status: 'active' } });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Active student with this Email already exists' });
      }
    }

    const rule = getProgramRule(program, batch);

    if (semesters.length !== rule.semesters) {
      return res.status(400).json({
        success: false,
        message: `${program} must have ${rule.semesters} semesters`
      });
    }

    if (yearCGPA.length !== rule.years) {
      return res.status(400).json({
        success: false,
        message: `${program} must have ${rule.years} years CGPA`
      });
    }

    const student = await Student.create({
      rollNo: rollNo.toLowerCase(),
      enrollmentNo: enrollmentNo.toLowerCase(),
      fullName,
      school,
      department,
      program,
      batch,
      specialization,
      fatherName,
      motherName,
      gender,
      dob,
      category,
      nationalId,
      mobile: mobile.replace(/\s/g, ''),
      email: email.toLowerCase(),
      address,
      hosteller,
      admissionType,
      twelfthCompartment,
      enrollmentStatus,
      admissionYear,
      semesters,
      yearCGPA,
      internshipStatus,
      placementStatus,
      photo,
      status: targetStatus,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    // Log change and notify admins if created by coordinator
    try {
      await ChangeLog.create({
        userId: req.user.id,
        action: 'create',
        entity: 'student',
        entityId: student.rollNo,
        details: student.toJSON(),
      });

      if (req.user.role === 'coordinator') {
        await Notification.create({
          toRole: 'admin',
          message: `Coordinator ${req.user.name || req.user.email} created student ${student.rollNo}`,
          data: { student: student.toJSON(), by: req.user.id }
        });
      }
    } catch (e) {
      logger.warn({ entityId: student.rollNo, err: { name: e.name, message: e.message } }, 'Failed to create changelog/notification');
    }
    return res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: student
    });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rollNo, enrollmentNo, fullName, school, department, program, batch, specialization, fatherName, motherName, gender, dob, category, nationalId, mobile, email, address, hosteller, enrollmentStatus, admissionType, twelfthCompartment, admissionYear, semesters, yearCGPA, internshipStatus, placementStatus, photo } = req.body;
    const student = await Student.findOne({ where: { rollNo: id } });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      if (!isClassAssignedToCoordinator(assignedClasses, student)) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Student is not in your assigned class."
        });
      }
      const targetClass = {
        school: school || student.school,
        department: department || student.department,
        program: program || student.program,
        batch: batch || student.batch,
        specialization: specialization || student.specialization
      };
      if (!isClassAssignedToCoordinator(assignedClasses, targetClass)) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You cannot move a student to an unassigned class."
        });
      }
    }

    const cleanedRoll = rollNo ? removeSpaces(rollNo.toLowerCase()) : undefined;
    const cleanedEnroll = enrollmentNo ? removeSpaces(enrollmentNo.toLowerCase()) : undefined;
    const cleanedEmail = email ? removeSpaces(email.toLowerCase()) : undefined;
    const cleanedMobile = mobile ? mobile.replace(/\s/g, "") : undefined;

    const targetStatus = status || student.status;

    if (targetStatus === 'active') {
      const targetRoll = cleanedRoll || student.rollNo;
      if (targetRoll) {
        const dupRoll = await Student.findOne({
          where: {
            rollNo: targetRoll,
            status: 'active',
            id: { [Op.ne]: student.id }
          }
        });
        if (dupRoll) return res.status(409).json({ success: false, message: 'Active student with this Roll number already exists' });
      }

      const targetEnroll = cleanedEnroll || student.enrollmentNo;
      if (targetEnroll) {
        const dupEnroll = await Student.findOne({
          where: {
            enrollmentNo: targetEnroll,
            status: 'active',
            id: { [Op.ne]: student.id }
          }
        });
        if (dupEnroll) return res.status(409).json({ success: false, message: 'Active student with this Enrollment number already exists' });
      }

      const targetMobile = cleanedMobile || student.mobile;
      if (targetMobile) {
        const dupMobile = await Student.findOne({
          where: {
            mobile: targetMobile,
            status: 'active',
            id: { [Op.ne]: student.id }
          }
        });
        if (dupMobile) return res.status(409).json({ success: false, message: 'Active student with this Phone number already exists' });
      }

      const targetEmail = cleanedEmail || student.email;
      if (targetEmail) {
        const dupEmail = await Student.findOne({
          where: {
            email: targetEmail,
            status: 'active',
            id: { [Op.ne]: student.id }
          }
        });
        if (dupEmail) return res.status(409).json({ success: false, message: 'Active student with this Email already exists' });
      }
    }

    const selectedProgram = program || student.program;
    const selectedBatch = batch || student.batch;
    const rule = getProgramRule(selectedProgram, selectedBatch);

    if (semesters && semesters.length !== rule.semesters) {
      return res.status(400).json({
        success: false,
        message: `${selectedProgram} must have ${rule.semesters} semesters`
      });
    }

    if (yearCGPA && yearCGPA.length !== rule.years) {
      return res.status(400).json({
        success: false,
        message: `${selectedProgram} must have ${rule.years} years CGPA`
      });
    }

    const updateData = {
      ...(status && { status }),
      ...(rollNo && { rollNo: cleanedRoll }),
      ...(cleanedEnroll && { enrollmentNo: cleanedEnroll }),
      ...(cleanedEmail && { email: cleanedEmail }),
      ...(cleanedMobile && { mobile: cleanedMobile }),
      ...(fullName && { fullName }),
      ...(school && { school }),
      ...(department && { department }),
      ...(program && { program }),
      ...(batch && { batch }),
      ...(specialization && { specialization }),
      ...(fatherName && { fatherName }),
      ...(motherName && { motherName }),
      ...(gender && { gender }),
      ...(dob && { dob }),
      ...(category && { category }),
      ...(nationalId && { nationalId }),
      ...(address && { address }),
      ...(hosteller !== undefined && { hosteller }),
      ...(enrollmentStatus && { enrollmentStatus }),
      ...(admissionType && { admissionType }),
      ...(twelfthCompartment !== undefined && { twelfthCompartment }),
      ...(admissionYear && { admissionYear }),
      ...(semesters && { semesters }),
      ...(yearCGPA && { yearCGPA }),
      ...(internshipStatus && { internshipStatus }),
      ...(placementStatus && { placementStatus }),
      ...(photo && { photo }),
      updatedBy: req.user.id
    };

    const before = student.toJSON();
    await student.update(updateData);
    const after = student.toJSON();

    // Log change and notify admin if coordinator
    try {
      await ChangeLog.create({
        userId: req.user.id,
        action: 'update',
        entity: 'student',
        entityId: student.rollNo,
        details: { before, after }
      });

      if (req.user.role === 'coordinator') {
        await Notification.create({
          toRole: 'admin',
          message: `Coordinator ${req.user.name || req.user.email} updated student ${student.rollNo}`,
          data: { before, after, by: req.user.id }
        });
      }
    } catch (e) {
      logger.warn({ entityId: student.rollNo, err: { name: e.name, message: e.message } }, 'Failed to create changelog/notification');
    }

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student
    });
});

const normalizePhotoValue = (photo) => {
  if (!photo) return null;
  const trimmed = String(photo).trim();
  if (trimmed.startsWith('data:image/')) return trimmed;
  return `data:image/jpeg;base64,${trimmed.replace(/\s+/g, '')}`;
};

export const updateStudentPhoto = asyncHandler(async (req, res) => {
    const { rollNo } = req.params;
    const { photo } = req.body;

    if (!photo) {
      return res.status(400).json({ success: false, message: 'Photo data is required' });
    }

    const normalizedPhoto = normalizePhotoValue(photo);
    if (!normalizedPhoto) {
      return res.status(400).json({ success: false, message: 'Invalid photo data' });
    }

    const newRollNo = removeSpaces(String(rollNo).toLowerCase());
    const student = await Student.findOne({ where: { rollNo: newRollNo } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      if (!isClassAssignedToCoordinator(assignedClasses, student)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Student is not in your assigned class.'
        });
      }
    }

    await student.update({ photo: normalizedPhoto });

    try {
      await ChangeLog.create({
        userId: req.user.id,
        action: 'update_photo',
        entity: 'student',
        entityId: student.rollNo,
        details: { rollNo: student.rollNo }
      });
    } catch (e) {
      logger.warn({ entityId: student.rollNo, err: { name: e.name, message: e.message } }, 'Failed to create changelog');
    }

    return res.status(200).json({ success: true, message: 'Photo updated successfully' });
});

export const getStudentCount = asyncHandler(async (req, res) => {
    let count;
    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      const coordWhere = buildCoordinatorWhereClause(assignedClasses);
      count = await Student.count({ where: coordWhere });
    } else if (req.user && req.user.role === 'chairperson') {
      const { assignments } = await getChairpersonAssignments(req.user);
      const chairWhere = buildCoordinatorWhereClause(assignments);
      count = await Student.count({ where: chairWhere });
    } else {
      count = await Student.count();
    }
    return res.status(200).json({ count });
});

export const getStudentProfile = asyncHandler(async (req, res) => {
    const { rollNo } = req.params;

    const newRollNo = removeSpaces(rollNo.toLowerCase());

    const student = await Student.findOne({
      where: { rollNo: newRollNo },
      include: [
        { model: User, as: 'user' },
        { model: User, as: 'creator' },
        { model: User, as: 'updater' }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found in db",
      });
    }

    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      if (!isClassAssignedToCoordinator(assignedClasses, student)) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Student is not in your assigned class."
        });
      }
    }

    res.status(200).json({
      success: true,
      student,
    });
});

export const searchStudents = asyncHandler(async (req, res) => {
    const q = req.query.q || req.query.qs || req.query.query || req.query.roll || '';
    if (!q || String(q).trim() === '') {
      return res.status(400).json({ success: false, message: 'Query parameter `q` is required' });
    }

    const cleaned = removeSpaces(String(q).toLowerCase());

    let baseWhere = {
      [Op.or]: [
        { rollNo: cleaned },
        { rollNo: { [Op.like]: `%${q}%` } },
        { enrollmentNo: cleaned },
        { enrollmentNo: { [Op.like]: `%${q}%` } },
        seqWhere(fn('LOWER', col('fullName')), { [Op.like]: `%${q.toLowerCase()}%` }),
      ]
    };

    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      const coordWhere = buildCoordinatorWhereClause(assignedClasses);
      baseWhere = {
        [Op.and]: [baseWhere, coordWhere]
      };
    }

    const students = await Student.findAll({
      where: baseWhere,
      limit: 50,
      order: [['rollNo', 'ASC']],
    });

    return res.status(200).json({ success: true, count: students.length, students });
});

export const getStudentDetails = asyncHandler(async (req, res) => {
    const student = await Student.findOne({
      where: { userId: req.user.id },
      include: [
        { model: User, as: 'user' },
        { model: User, as: 'creator' },
        { model: User, as: 'updater' }
      ]
    });
    if (student) {
      return res.status(200).json({
        success: true,
        message: 'Student details found successfully',
        student
      });
    }
    return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
});

export const getFilteredStudents = asyncHandler(async (req, res) => {
    const { school, department, program, batch, specialization } = req.body;
    const hasParams = Boolean(school || department || program || batch || specialization);

    if (req.user && req.user.role === 'chairperson') {
      const { assignments } = await getChairpersonAssignments(req.user);
      if (hasParams) {
        const targetClass = { school, department, program, batch, specialization };
        if (!isClassAssignedToCoordinator(assignments, targetClass)) {
          return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to view this class.' });
        }
      }
      const chairWhere = hasParams ? {} : buildCoordinatorWhereClause(assignments);
      if (hasParams) {
        if (school) chairWhere.school = school;
        if (department) chairWhere.department = department;
        if (program) chairWhere.program = program;
        if (batch) chairWhere.batch = batch;
        if (specialization) chairWhere.specialization = specialization;
      }
      const students = await Student.findAll({ where: chairWhere, order: [['rollNo', 'ASC']] });
      return res.status(200).json({ success: true, count: students.length, students });
    }

    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      if (hasParams) {
        const targetClass = { school, department, program, batch, specialization };
        if (!isClassAssignedToCoordinator(assignedClasses, targetClass)) {
          return res.status(403).json({
            success: false,
            message: "Access denied: You are not assigned to manage this class."
          });
        }
        const where = {};
        if (school) where.school = school;
        if (department) where.department = department;
        if (program) where.program = program;
        if (batch) where.batch = batch;
        if (specialization) where.specialization = specialization;
        const students = await Student.findAll({ where, order: [['rollNo', 'ASC']] });
        return res.status(200).json({ success: true, count: students.length, students });
      } else {
        const coordWhere = buildCoordinatorWhereClause(assignedClasses);
        const students = await Student.findAll({ where: coordWhere, order: [['rollNo', 'ASC']] });
        return res.status(200).json({ success: true, count: students.length, students });
      }
    } else {
      const where = {};
      if (school) where.school = school;
      if (department) where.department = department;
      if (program) where.program = program;
      if (batch) where.batch = batch;
      if (specialization) where.specialization = specialization;

      const students = await Student.findAll({
        where,
        order: [['rollNo', 'ASC']],
      });

      return res.status(200).json({
        success: true,
        count: students.length,
        students,
      });
    }
});

export const deleteStudent = asyncHandler(async (req, res) => {
    const { rollNo } = req.params;

    const student = await Student.findOne({ where: { rollNo: rollNo } });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      if (!isClassAssignedToCoordinator(assignedClasses, student)) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Student is not in your assigned class."
        });
      }
    }

    const snapshot = student.toJSON();
    await Student.destroy({ where: { enrollmentNo: student.enrollmentNo } });
    await User.destroy({ where: { username: student.enrollmentNo } });

    try {
      await ChangeLog.create({
        userId: req.user.id,
        action: 'delete',
        entity: 'student',
        entityId: snapshot.rollNo,
        details: snapshot
      });

      if (req.user.role === 'coordinator') {
        await Notification.create({
          toRole: 'admin',
          message: `Coordinator ${req.user.name || req.user.email} deleted student ${snapshot.rollNo}`,
          data: { student: snapshot, by: req.user.id }
        });
      }
    } catch (e) {
      logger.warn({ entityId: student.rollNo, err: { name: e.name, message: e.message } }, 'Failed to create changelog/notification');
    }

    res.status(200).json({
      message: 'Student deleted successfully'
    });
});

export const deleteSpecializationStudents = asyncHandler(async (req, res) => {
    const { school, department, program, batch, specialization } = req.body;
    if (!school || !department || !program || !batch || !specialization) {
      return res.status(400).json({
        message:
          "school, department, program, batch, specialization are required",
      });
    }

    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      const targetClass = { school, department, program, batch, specialization };
      if (!isClassAssignedToCoordinator(assignedClasses, targetClass)) {
        return res.status(403).json({
          message: "Access denied: You are not authorized to delete this class."
        });
      }
    }

    const where = {
      school,
      department,
      program,
      batch,
      specialization,
    };

    const students = await Student.findAll({
      where,
      attributes: ['userId']
    });

    if (!students.length) {
      return res.status(200).json({
        message: "No students found for given criteria",
      });
    }

    const userIds = students
      .map((s) => s.userId)
      .filter(Boolean);

    const deletedUsers = await User.destroy({
      where: {
        id: userIds,
        role: "student",
      }
    });

    const deletedStudents = await Student.destroy({ where });

    try {
      await ChangeLog.create({
        userId: req.user.id,
        action: 'delete_specialization_students',
        entity: 'specialization',
        entityId: `${program} ${batch} (${specialization})`,
        details: { school, department, program, batch, specialization, deletedStudents, deletedUsers }
      });
    } catch (e) {
      logger.warn({ entityId: student.rollNo, err: { name: e.name, message: e.message } }, 'Failed to create changelog');
    }

    return res.status(200).json({
      message: "Students and corresponding users deleted successfully",
      deletedStudents,
      deletedUsers,
    });

});

const createHeaderMatchers = () => {
  const normalizeHeader = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const headerAliases = {
      rollNo: ["rollno", "rollnumber", "roll", "rollnum", "rollnumber", "rn", "registrationnumber", "registrationno", "regno", "regnumber", "rollid", "rollidnumber", "srno", "srnumber", "sno"],
      enrollmentNo: ["enrollmentno", "enrollmentnumber", "enroll", "enrollment", "enrollno", "enrollnumber", "registrationnumber", "registrationno", "regno", "regnumber", "admissionnumber", "admissionno", "studentid", "studentidnumber", "studentidno", "id", "idnumber", "idno", "admissionid", "studentregistration", "studentregistrationnumber", "registrationid"],
      fullName: ["fullname", "name", "studentname", "nameofstudent", "candidate", "fullnamet", "student", "studentfullname", "nameofthestudent", "stdname", "nameofthestudent"],
      fatherName: ["fathername", "father", "father'sname", "fathersname"],
      motherName: ["mothername", "mother", "mother'sname", "mothersname"],
    dob: ["dob", "dateofbirth", "birthdate", "birthday"],
    category: ["category", "caste"],
    nationalId: ["nationalid", "aadhar", "aadharnumber", "aadhaar", "idnumber", "idno"],
    mobile: ["mobile", "phone", "phoneno", "mobilephone", "contactnumber", "contactno", "contact"],
    email: ["email", "emailaddress", "emailid", "mail", "e-mail"],
    address: ["address", "residence", "permanentaddress"],
    hosteller: ["hosteller", "hostel", "hostelstatus", "hosteltype"],
    admissionType: ["admissiontype", "admission", "admissioncategory", "admissionstatus"],
    admissionYear: ["admissionyear", "yearofadmission", "admissionyr"],
    enrollmentStatus: ["enrollmentstatus", "status", "studentstatus"],
    twelfthCompartment: ["twelfthcompartment", "twelvethcompartment", "12thcompartment", "compartment"],
    internshipStatus: ["internshipstatus", "internship"],
    placementStatus: ["placementstatus", "placement"],
  };

  const matchHeaderField = (normalizedHeader) => {
    if (!normalizedHeader) return null;

    for (const key of COLUMN_ORDER) {
      const normalizedField = normalizeHeader(key);
      const aliases = headerAliases[key] || [];

      if (normalizedHeader === normalizedField || aliases.includes(normalizedHeader)) {
        return key;
      }
    }

    if (normalizedHeader.includes("father")) return "fatherName";
    if (normalizedHeader.includes("mother")) return "motherName";

    if (normalizedHeader.includes("roll") && (normalizedHeader.includes("no") || normalizedHeader.includes("num") || normalizedHeader.includes("number") || normalizedHeader.includes("rn") || normalizedHeader.includes("id"))) {
      if (normalizedHeader.includes("enroll")) return null;
      return "rollNo";
    }

    if (
      normalizedHeader.includes("enrol") ||
      normalizedHeader.includes("enroll") ||
      normalizedHeader === "registrationno" ||
      normalizedHeader === "registrationnumber" ||
      normalizedHeader === "registrationid" ||
      normalizedHeader === "admissionno" ||
      normalizedHeader === "admissionnumber" ||
      normalizedHeader === "studentid" ||
      normalizedHeader === "studentidnumber" ||
      (normalizedHeader.includes("id") && normalizedHeader.includes("student")) ||
      (normalizedHeader.includes("id") && (normalizedHeader.includes("no") || normalizedHeader.includes("num") || normalizedHeader.includes("number")))
    ) {
      if (normalizedHeader.includes("status") || normalizedHeader.includes("type") || normalizedHeader.includes("year")) {
        // Skip
      } else {
        return "enrollmentNo";
      }
    }

    if (
      normalizedHeader === "id" ||
      normalizedHeader === "studentid" ||
      (normalizedHeader.includes("student") && normalizedHeader.includes("id"))
    ) {
      return "enrollmentNo";
    }
    if (normalizedHeader.includes("name") && !normalizedHeader.includes("father") && !normalizedHeader.includes("mother")) {
      return "fullName";
    }
    if (normalizedHeader.includes("phone") || normalizedHeader.includes("contact") || normalizedHeader.includes("mobile")) return "mobile";
    if (normalizedHeader.includes("mail")) return "email";
    if (normalizedHeader.includes("dob") || normalizedHeader.includes("birth")) return "dob";
    if (normalizedHeader.includes("hostel")) return "hosteller";
    if (normalizedHeader.includes("aadhar") || normalizedHeader.includes("aadhaar") || normalizedHeader.includes("national")) return "nationalId";
    
    if (normalizedHeader.includes("admission") && normalizedHeader.includes("type")) return "admissionType";
    if (normalizedHeader.includes("admission") && normalizedHeader.includes("year")) return "admissionYear";

    // Dynamic Regex for Semester Registration (e.g. "1 Sem Registration" -> "1semregistration")
    const semRegMatch = normalizedHeader.match(/^(\d+|i|ii|iii|iv|v|vi|vii|viii)(st|nd|rd|th)?sem(?:ester)?reg(?:istration)?/);
    if (semRegMatch) {
      let num = parseInt(semRegMatch[1]);
      if (isNaN(num)) {
        const romanMap = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ist: 1, iind: 2, iiird: 3, ivth: 4 };
        num = romanMap[semRegMatch[1].replace(/(st|nd|rd|th)$/, "")] || romanMap[semRegMatch[1]];
      }
      return `semRegistration_${num}`;
    }

    // Dynamic Regex for Year CGPA (e.g. "1st Year CGPA" -> "1styearcgpa", "Ist Year CGPA" -> "istyearcgpa")
    const yearCGPAMatch = normalizedHeader.match(/^(\d+|ist|iind|iiird|ivth|i|ii|iii|iv|v)(st|nd|rd|th)?yearcgpa/);
    if (yearCGPAMatch) {
      let num = parseInt(yearCGPAMatch[1]);
      if (isNaN(num)) {
        const romanMap = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, ist: 1, iind: 2, iiird: 3, ivth: 4 };
        num = romanMap[yearCGPAMatch[1]];
      }
      return `yearCGPA_${num}`;
    }
    
    // Dynamic Regex for Semester SGPA/CGPA (e.g. "1 Sem SGPA" -> "1semsgpa")
    const semSGPAMatch = normalizedHeader.match(/^(\d+|i|ii|iii|iv|v|vi|vii|viii)(st|nd|rd|th)?sem(?:ester)?s?gpa/);
    if (semSGPAMatch) {
      let num = parseInt(semSGPAMatch[1]);
      if (isNaN(num)) {
        const romanMap = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ist: 1, iind: 2, iiird: 3, ivth: 4 };
        num = romanMap[semSGPAMatch[1].replace(/(st|nd|rd|th)$/, "")] || romanMap[semSGPAMatch[1]];
      }
      return `semSGPA_${num}`;
    }

    return null;
  };

  return { normalizeHeader, matchHeaderField };
};

const sanitizeEmail = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/\s+/g, '').toLowerCase();
  if (!cleaned) return null;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
  return isValidEmail ? cleaned : cleaned; // Even if invalid, save what they typed instead of generating a fake email
};

const sanitizeNumericString = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    // Convert e.g., 6.29554123456e11 to "629554123456"
    return value.toLocaleString('fullwide', {useGrouping:false});
  }
  let str = String(value).trim();
  // If it's stored as scientific notation string like "6.29554E+11"
  if (str.match(/^[0-9.]+E\+\d+$/i)) {
    return Number(str).toLocaleString('fullwide', {useGrouping:false});
  }
  return str;
};

const createStudentDocument = (doc, school, department, program, batch, specialization, years, semesters, userId) => {
  const semestersArray = buildSemesters(semesters);
  for (let i = 0; i < semesters; i++) {
    const semNum = i + 1;
    if (doc[`semRegistration_${semNum}`] !== undefined) {
      semestersArray[i].registered = String(doc[`semRegistration_${semNum}`]).trim() || "Pending";
    }
    if (doc[`semSGPA_${semNum}`] !== undefined) {
      semestersArray[i].sgpa = doc[`semSGPA_${semNum}`] || null;
    }
  }

  const cgpaArray = buildYearCGPA(years);
  for (let i = 0; i < years; i++) {
    const yearNum = i + 1;
    if (doc[`yearCGPA_${yearNum}`] !== undefined) {
      cgpaArray[i].cgpa = doc[`yearCGPA_${yearNum}`] || null;
    }
  }

  return {
    userId: null,
    rollNo: doc.rollNo ? removeSpaces(String(doc.rollNo).toLowerCase()) : null,
    enrollmentNo: doc.enrollmentNo ? removeSpaces(String(doc.enrollmentNo).toLowerCase()) : null,
    fullName: doc.fullName ? String(doc.fullName).trim() : null,
    fatherName: doc.fatherName ? String(doc.fatherName).trim() : "",
    motherName: doc.motherName ? String(doc.motherName).trim() : "",
    gender: doc.gender ? String(doc.gender).trim() : "Not Specified",
    dob: parseExcelDate(doc.dob),
    category: doc.category ? String(doc.category).trim() : "General",
    nationalId: sanitizeNumericString(doc.nationalId),
    mobile: sanitizeNumericString(doc.mobile) ? sanitizeNumericString(doc.mobile).replace(/\s/g, "") : "",
    email: sanitizeEmail(doc.email),
    address: doc.address ? String(doc.address).trim() : null,
    hosteller: doc.hosteller ? String(doc.hosteller).trim() : "No",
    enrollmentStatus: doc.enrollmentStatus || "Enrolled",
    admissionType: doc.admissionType || "Regular",
    admissionYear: doc.admissionYear ? String(doc.admissionYear).trim() : null,
    twelfthCompartment: doc.twelfthCompartment || "No",
    internshipStatus: doc.internshipStatus || "Inactive",
    placementStatus: doc.placementStatus || "Not Placed",
    photo: doc.photo || null,
    school,
    department,
    program,
    batch,
    specialization,
    semesters: semestersArray,
    yearCGPA: cgpaArray,
    createdBy: userId,
  };
};

const isRowEmpty = (row) => {
  if (Array.isArray(row)) {
    return row.every((value) => value === null || value === undefined || value === "");
  }
  if (row && typeof row === "object") {
    return Object.values(row).every((value) => value === null || value === undefined || value === "");
  }
  return true;
};

const processStudentRows = async (rows, school, department, program, batch, specialization, years, semesters, userId) => {
  const { normalizeHeader, matchHeaderField } = createHeaderMatchers();
  const requiredFields = ["rollNo", "enrollmentNo", "fullName"];

  const findHeaderRow = () => {
    let bestCandidate = null;
    let bestScore = -1;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!Array.isArray(row)) continue;

      const mapping = {};
      let recognizedCount = 0;
      let requiredMatchCount = 0;

      row.forEach((cell, index) => {
        const normalizedHeader = normalizeHeader(cell);
        const field = matchHeaderField(normalizedHeader);
        if (!field) return;

        mapping[index] = field;
        recognizedCount += 1;
        if (requiredFields.includes(field)) {
          requiredMatchCount += 1;
        }
      });

      if (requiredMatchCount === requiredFields.length && recognizedCount >= 3) {
        return { rowIndex, mapping };
      }

      const score = requiredMatchCount * 10 + recognizedCount;
      if (recognizedCount >= 3 && requiredMatchCount >= 2 && score > bestScore) {
        bestScore = score;
        bestCandidate = { rowIndex, mapping };
      }
    }

    return bestCandidate;
  };

  const headerInfo = findHeaderRow();
  if (!headerInfo) {
    const headerRow = rows.find(row => Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined));
    const normalizedHeaderRow = headerRow ? headerRow.map(value => normalizeHeader(value)) : [];
    return {
      error: true,
      message: "Could not detect header row. Please use the sample sheet format or place the column names in the first non-empty row.",
      headerRow: headerRow ? headerRow.map(value => String(value || "").trim()) : [],
      normalizedHeaderRow,
    };
  }

  const { rowIndex: headerRowIndex, mapping: headerMapping } = headerInfo;
  const dataRows = rows.slice(headerRowIndex + 1).filter(row => !isRowEmpty(row));

  if (dataRows.length === 0) {
    return { error: true, message: "No student data rows found in the Excel file." };
  }

  const foundHeaders = Object.values(headerMapping);
  if (!requiredFields.every((field) => foundHeaders.includes(field))) {
    const headerRowValues = rows[headerRowIndex] || [];
    return {
      error: true,
      message: "Excel headers do not contain the required fields. Please include Roll No, Enrollment No and Full Name.",
      foundHeaders,
      headerRow: headerRowValues.map((value) => String(value || "").trim()),
    };
  }

  let inserted = 0;
  const errors = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const doc = {};

    COLUMN_ORDER.forEach((field) => {
      doc[field] = null;
    });

    Object.entries(headerMapping).forEach(([index, field]) => {
      const columnIndex = Number(index);
      doc[field] = row[columnIndex] ?? null;
    });

    const rawEmail = doc.email ? String(doc.email).trim() : null;
    const studentDoc = createStudentDocument(doc, school, department, program, batch, specialization, years, semesters, userId);

    if (!studentDoc.rollNo || !studentDoc.enrollmentNo || !studentDoc.fullName) {
      errors.push({
        row: headerRowIndex + i + 2,
        error: 'Missing required student fields in the excel row',
        parsed: {
          rollNo: studentDoc.rollNo,
          enrollmentNo: studentDoc.enrollmentNo,
          fullName: studentDoc.fullName,
        },
        rawEmail,
        parsedEmail: studentDoc.email,
      });
      continue;
    }

    try {
      const existing = await Student.findOne({ where: { rollNo: studentDoc.rollNo } });
      if (existing) {
        await existing.update(studentDoc);
      } else {
        await Student.create(studentDoc);
      }
      inserted++;
    } catch (err) {
      errors.push({
        row: headerRowIndex + i + 2,
        error: err.errors ? err.errors.map(e => e.message).join(', ') : err.message,
        rawEmail,
        parsedEmail: studentDoc.email,
      });
    }
  }

  return {
    message: "Upload completed",
    inserted,
    failed: errors.length,
    errors,
  };
};

const processStudentObjects = async (rows, school, department, program, batch, specialization, years, semesters, userId) => {
  let inserted = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (isRowEmpty(row)) continue;

    const doc = {};
    Object.keys(row).forEach((key) => {
      doc[key] = row[key] ?? row[key.charAt(0).toUpperCase() + key.slice(1)] ?? null;
    });

    const rawEmail = doc.email ? String(doc.email).trim() : null;
    const studentDoc = createStudentDocument(doc, school, department, program, batch, specialization, years, semesters, userId);

    if (!studentDoc.rollNo || !studentDoc.enrollmentNo || !studentDoc.fullName) {
      errors.push({
        row: i + 2,
        error: 'Missing required student fields in the excel row',
        parsed: {
          rollNo: studentDoc.rollNo,
          enrollmentNo: studentDoc.enrollmentNo,
          fullName: studentDoc.fullName,
        },
        rawEmail,
        parsedEmail: studentDoc.email,
        rawRow: row,
      });
      continue;
    }

    try {
      const existing = await Student.findOne({ where: { rollNo: studentDoc.rollNo } });
      if (existing) {
        await existing.update(studentDoc);
      } else {
        await Student.create(studentDoc);
      }
      inserted++;
    } catch (err) {
      errors.push({
        row: i + 2,
        error: err.errors ? err.errors.map(e => e.message).join(', ') : err.message,
        rawEmail,
        parsedEmail: studentDoc.email,
        rawRow: row,
      });
    }
  }

  return {
    message: "Upload completed",
    inserted,
    failed: errors.length,
    errors,
  };
};

export const uploadStudents = asyncHandler(async (req, res) => {
    const { school, department, program, batch, specialization } = req.body;

    logger.info(
      {
        userId: req.user?.id,
        userRole: req.user?.role,
        fileSize: req.file?.size,
        mimetype: req.file?.mimetype,
        class: { school, department, program, batch, specialization },
      },
      'Bulk upload: students (raw)'
    );

    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      const targetClass = { school, department, program, batch, specialization };
      if (!isClassAssignedToCoordinator(assignedClasses, targetClass)) {
        return res.status(403).json({ message: "Access denied: Upload target class is not assigned to you." });
      }
    }

    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    if (!PROGRAM_CONFIG[program]) {
      return res.status(400).json({ message: "Invalid program" });
    }

    const { years, semesters } = PROGRAM_CONFIG[program];
    
    let workbookBuffer = req.file.buffer;
    try {
      workbookBuffer = reformatExcel(req.file.buffer);
    } catch (formatErr) {
      // Fallback to raw data if reformat fails due to missing headers in a secondary sheet.
      workbookBuffer = req.file.buffer;
    }

    const workbook = XLSX.read(workbookBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const objectRows = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: true,
    });

    const { normalizeHeader } = createHeaderMatchers();
    const normalizedHeaders = objectRows.length > 0 && typeof objectRows[0] === "object" && !Array.isArray(objectRows[0])
      ? Object.keys(objectRows[0]).map((key) => normalizeHeader(key))
      : [];
    const hasStandardHeaders = COLUMN_ORDER.some((field) => normalizedHeaders.includes(normalizeHeader(field)));

    let result;
    if (objectRows.length > 0 && typeof objectRows[0] === "object" && !Array.isArray(objectRows[0]) && hasStandardHeaders) {
      result = await processStudentObjects(objectRows, school, department, program, batch, specialization, years, semesters, req.user.id);
    } else {
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        raw: true,
      });

      if (!rows || rows.length === 0) {
        return res.status(400).json({ message: "Excel file is empty or invalid." });
      }

      result = await processStudentRows(rows, school, department, program, batch, specialization, years, semesters, req.user.id);
    }

    if (result.error) {
      return res.status(400).json(result);
    }

    try {
      await ChangeLog.create({
        userId: req.user.id,
        action: 'upload_students',
        entity: 'bulk_students',
        entityId: `${program} ${batch} (${specialization})`,
        details: { school, department, program, batch, specialization, inserted: result.inserted, failed: result.failed }
      });
    } catch (e) {
      logger.warn({ entityId: `${program} ${batch} (${specialization})`, err: { name: e.name, message: e.message } }, 'Failed to create changelog for bulk upload');
    }

    return res.status(201).json(result);
});

export const uploadStudentsWithReformat = asyncHandler(async (req, res) => {
    const { school, department, program, batch, specialization } = req.body;

    logger.info(
      {
        userId: req.user?.id,
        userRole: req.user?.role,
        fileSize: req.file?.size,
        mimetype: req.file?.mimetype,
        class: { school, department, program, batch, specialization },
      },
      'Bulk upload: students (reformat)'
    );

    if (req.user && req.user.role === 'coordinator') {
      const assignedClasses = await getCoordinatorAssignedClasses(req.user);
      const targetClass = { school, department, program, batch, specialization };
      if (!isClassAssignedToCoordinator(assignedClasses, targetClass)) {
        return res.status(403).json({ message: "Access denied: Upload target class is not assigned to you." });
      }
    }

    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    if (!PROGRAM_CONFIG[program]) {
      return res.status(400).json({ message: "Invalid program" });
    }

    const { years, semesters } = PROGRAM_CONFIG[program];

    let workbookBuffer = req.file.buffer;
    try {
      workbookBuffer = reformatExcel(req.file.buffer);
    } catch (formatErr) {
      logger.warn({ err: { name: formatErr.name, message: formatErr.message } }, 'Reformat failed, falling back to raw sheet parsing');
      workbookBuffer = req.file.buffer;
    }

    const workbook = XLSX.read(workbookBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const objectRows = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: false,
    });

    const { normalizeHeader } = createHeaderMatchers();
    const normalizedHeaders = objectRows.length > 0 && typeof objectRows[0] === "object" && !Array.isArray(objectRows[0])
      ? Object.keys(objectRows[0]).map((key) => normalizeHeader(key))
      : [];
    const hasStandardHeaders = COLUMN_ORDER.some((field) => normalizedHeaders.includes(normalizeHeader(field)));

    let result;
    if (objectRows.length > 0 && typeof objectRows[0] === "object" && !Array.isArray(objectRows[0]) && hasStandardHeaders) {
      result = await processStudentObjects(objectRows, school, department, program, batch, specialization, years, semesters, req.user.id);
    } else {
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
      });

      if (!rows || rows.length === 0) {
        return res.status(400).json({ message: "Reformatted Excel file is empty or invalid." });
      }

      result = await processStudentRows(rows, school, department, program, batch, specialization, years, semesters, req.user.id);
    }

    if (result.error) {
      return res.status(400).json(result);
    }

    try {
      await ChangeLog.create({
        userId: req.user.id,
        action: 'upload_students',
        entity: 'bulk_students',
        entityId: `${program} ${batch} (${specialization})`,
        details: { school, department, program, batch, specialization, inserted: result.inserted, failed: result.failed }
      });
    } catch (e) {
      logger.warn({ entityId: `${program} ${batch} (${specialization})`, err: { name: e.name, message: e.message } }, 'Failed to create changelog for bulk upload');
    }

    return res.status(201).json(result);
});
