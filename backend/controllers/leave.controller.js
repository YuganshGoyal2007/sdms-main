import { Op } from 'sequelize';
import asyncHandler from '../lib/asyncHandler.js';
import logger from '../lib/logger.js';
import {
  LeaveType,
  LeaveApplication,
  User,
  ChangeLog,
  Faculty,
  Coordinator,
  Chairperson,
  ChairpersonClass,
  Notification,
  FacultyAssignment,
  Subject,
} from '../models/index.js';
import Timetable from '../models/timetable.model.js';
import TimetableSection from '../models/timetableSection.model.js';
import { findSectionForClass } from '../services/timetable.service.js';

/**
 * GET /leaves/types
 * List all active leave types.
 */
export const getLeaveTypes = asyncHandler(async (req, res) => {
  const leaveTypes = await LeaveType.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']],
  });
  return res.json({ success: true, count: leaveTypes.length, leaveTypes });
});

/**
 * POST /leaves/types
 * Admin adds new leave type.
 */
export const createLeaveType = asyncHandler(async (req, res) => {
  const { name, code, description, maxDays, requiresAttachment } = req.body;
  if (!name || !code || !maxDays) {
    return res.status(400).json({ success: false, message: 'Name, code, and maxDays are required.' });
  }

  const existing = await LeaveType.findOne({
    where: { [Op.or]: [{ name }, { code }] },
  });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Leave type or code already exists.' });
  }

  const lt = await LeaveType.create({
    name,
    code: code.toUpperCase().trim(),
    description: description || null,
    maxDays: Number(maxDays),
    requiresAttachment: Boolean(requiresAttachment),
    isActive: true,
  });

  return res.status(201).json({ success: true, message: 'Leave type created.', leaveType: lt });
});

/**
 * PUT /leaves/types/:id
 * Admin updates a leave type.
 */
export const updateLeaveType = asyncHandler(async (req, res) => {
  const lt = await LeaveType.findByPk(req.params.id);
  if (!lt) return res.status(404).json({ success: false, message: 'Leave type not found.' });

  const { name, description, maxDays, requiresAttachment, isActive } = req.body;
  await lt.update({
    name: name || lt.name,
    description: description !== undefined ? description : lt.description,
    maxDays: maxDays ? Number(maxDays) : lt.maxDays,
    requiresAttachment: requiresAttachment !== undefined ? Boolean(requiresAttachment) : lt.requiresAttachment,
    isActive: isActive !== undefined ? Boolean(isActive) : lt.isActive,
  });

  return res.json({ success: true, message: 'Leave type updated.', leaveType: lt });
});

/**
 * DELETE /leaves/types/:id
 * Admin soft-deletes / deactivates a leave type.
 */
export const deleteLeaveType = asyncHandler(async (req, res) => {
  const lt = await LeaveType.findByPk(req.params.id);
  if (!lt) return res.status(404).json({ success: false, message: 'Leave type not found.' });

  await lt.update({ isActive: false });
  return res.json({ success: true, message: 'Leave type deactivated.' });
});

/**
 * GET /leaves/my
 * View my leave application history.
 */
export const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await LeaveApplication.findAll({
    where: { userId: req.user.id },
    include: [{ model: LeaveType, as: 'leaveType' }],
    order: [['createdAt', 'DESC']],
  });

  return res.json({ success: true, count: leaves.length, leaves });
});

/**
 * GET /leaves/my/balance
 * Returns remaining days per leave type for logged in user.
 */
export const getMyLeaveBalances = asyncHandler(async (req, res) => {
  const types = await LeaveType.findAll({ where: { isActive: true } });
  const myLeaves = await LeaveApplication.findAll({
    where: {
      userId: req.user.id,
      status: { [Op.in]: ['approved', 'pending'] }, // count both consumed and active
    },
  });

  const balances = types.map((t) => {
    const usedDays = myLeaves
      .filter((l) => l.leaveTypeId === t.id)
      .reduce((acc, curr) => acc + Number(curr.totalDays || 0), 0);
    const remainingDays = Math.max(0, t.maxDays - usedDays);
    return {
      id: t.id,
      name: t.name,
      code: t.code,
      description: t.description,
      maxDays: t.maxDays,
      usedDays,
      remainingDays,
      requiresAttachment: t.requiresAttachment,
    };
  });

  return res.json({ success: true, balances });
});

/**
 * POST /leaves/apply
 * Apply for leave with quota deduction, day calculation, and optional remarks.
 */
export const applyLeave = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Leave management is restricted to faculty and academic staff.',
    });
  }

  const { leaveTypeId, fromDate, toDate, reason, remarks, attachmentUrl, department, school } = req.body;

  if (!leaveTypeId || !fromDate || !toDate || !reason) {
    return res.status(400).json({ success: false, message: 'Leave type, dates, and reason are required.' });
  }

  const lt = await LeaveType.findByPk(leaveTypeId);
  if (!lt || !lt.isActive) {
    return res.status(404).json({ success: false, message: 'Invalid or inactive leave type.' });
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid date format.' });
  }
  if (to < from) {
    return res.status(400).json({ success: false, message: 'To date cannot be earlier than from date.' });
  }

  const totalDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate current usage
  const existingLeaves = await LeaveApplication.findAll({
    where: {
      userId: req.user.id,
      leaveTypeId,
      status: { [Op.in]: ['approved', 'pending'] },
    },
  });
  const usedDays = existingLeaves.reduce((acc, curr) => acc + Number(curr.totalDays || 0), 0);
  const remainingDays = Math.max(0, lt.maxDays - usedDays);

  if (totalDays > remainingDays) {
    return res.status(400).json({
      success: false,
      message: `Requested ${totalDays} day(s), but only ${remainingDays} day(s) remain for ${lt.name}.`,
    });
  }

  // Auto-resolve applicant profile info if not supplied
  let resolvedName = req.user.name || req.user.username;
  let resolvedDept = department || req.user.department || null;
  let resolvedSchool = school || req.user.school || null;

  try {
    if (req.user.role === 'faculty') {
      const fac = await Faculty.findOne({ where: { userId: req.user.id } });
      if (fac) {
        if (fac.name) resolvedName = fac.name;
        if (!resolvedDept && fac.department) resolvedDept = fac.department;
      }
    } else if (req.user.role === 'chairperson') {
      const chair = await Chairperson.findOne({ where: { userId: req.user.id } });
      if (chair) {
        if (chair.name) resolvedName = chair.name;
        const chairClass = await ChairpersonClass.findOne({ where: { chairpersonId: chair.id } });
        if (chairClass) {
          if (!resolvedDept && chairClass.department) resolvedDept = chairClass.department;
          if (!resolvedSchool && chairClass.school) resolvedSchool = chairClass.school;
        }
      }
    } else if (req.user.role === 'coordinator') {
      const coord = await Coordinator.findOne({ where: { userId: req.user.id } });
      if (coord) {
        if (coord.name) resolvedName = coord.name;
        if (!resolvedDept && coord.department) resolvedDept = coord.department;
        if (!resolvedSchool && coord.school) resolvedSchool = coord.school;
      }
    }
    // officer (e.g. Dean) — use user record name directly; department/school from req.user
  } catch (e) {
    logger.warn({ err: e }, 'Could not auto-resolve profile for leave application');
  }

  const app = await LeaveApplication.create({
    userId: req.user.id,
    applicantName: resolvedName,
    applicantRole: req.user.role,
    department: resolvedDept,
    school: resolvedSchool,
    leaveTypeId,
    fromDate,
    toDate,
    totalDays,
    reason: reason.trim(),
    remarks: remarks ? remarks.trim() : null,
    attachmentUrl: attachmentUrl ? attachmentUrl.trim() : null,
    status: 'pending',
    hodStatus: 'pending',
    deanStatus: 'pending',
  });

  try {
    await ChangeLog.create({
      userId: req.user.id,
      action: 'apply_leave',
      entity: 'leave_application',
      entityId: String(app.id),
      details: { leaveType: lt.name, totalDays, fromDate, toDate, remarks },
    });
  } catch (e) {
    logger.warn({ err: e }, 'Failed to record leave application changelog');
  }

  // Notify admins/coordinators of new leave application
  try {
    await Notification.create({
      toRole: 'admin',
      message: `New leave request submitted by ${resolvedName} (${req.user.role}, ${resolvedDept || 'All Depts'}): ${totalDays} day(s) for ${lt.name}.`,
      data: {
        leaveId: app.id,
        applicantId: req.user.id,
        applicantName: resolvedName,
        applicantRole: req.user.role,
        leaveType: lt.name,
        totalDays,
      },
      scope: 'broadcast',
    });
  } catch (e) {
    logger.warn({ err: e }, 'Failed to dispatch notification for leave application');
  }

  const populated = await LeaveApplication.findByPk(app.id, {
    include: [{ model: LeaveType, as: 'leaveType' }],
  });

  return res.status(201).json({
    success: true,
    message: 'Leave application submitted successfully for review.',
    leave: populated,
  });
});

/**
 * GET /leaves/pending
 * Approver review queue for HOD, Coordinators, and Dean / Admin.
 * Supports optional ?filter=all|pending|history and ?role=all|faculty|coordinator|chairperson|student query parameters.
 */
export const getPendingLeaves = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const isDeanOrOfficer = userRole === 'officer' && (req.user.officeCode === 'DEAN' || req.user.officeCode === 'dean');
  const isHodOrDept = userRole === 'chairperson' || userRole === 'coordinator';
  const isAdmin = userRole === 'admin';

  const { filter, role: filterRole } = req.query;
  let whereClause = {};

  if (isHodOrDept) {
    // HOD review tier
    if (filter === 'history') {
      whereClause.hodStatus = { [Op.in]: ['approved', 'rejected'] };
    } else if (filter === 'all') {
      // no status constraint
    } else {
      whereClause.hodStatus = 'pending';
      whereClause.status = 'pending';
    }

    // If user has a department, optionally filter by department, but allow seeing all if none set
    let dept = req.user.department;
    if (!dept) {
      try {
        if (userRole === 'chairperson') {
          const chair = await Chairperson.findOne({ where: { userId: req.user.id } });
          if (chair) {
            const chairClass = await ChairpersonClass.findOne({ where: { chairpersonId: chair.id } });
            if (chairClass?.department) dept = chairClass.department;
          }
        } else {
          const coord = await Coordinator.findOne({ where: { userId: req.user.id } });
          if (coord?.department) dept = coord.department;
        }
      } catch (e) {}
    }
    if (dept) {
      whereClause.department = dept;
    }
  } else if (isAdmin || isDeanOrOfficer) {
    // Admin / Dean review tier
    if (filter === 'history') {
      whereClause.status = { [Op.in]: ['approved', 'rejected'] };
    } else if (filter === 'all') {
      // no status constraint
    } else {
      // Pending review queue:
      // Show applications pending Dean action (or all pending applications)
      whereClause.status = 'pending';
    }
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized to view approval queue.' });
  }

  if (filterRole && filterRole !== 'all') {
    whereClause.applicantRole = filterRole;
  }

  const leaves = await LeaveApplication.findAll({
    where: whereClause,
    include: [
      { model: LeaveType, as: 'leaveType' },
      { model: User, as: 'applicant', attributes: ['id', 'username', 'role'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  return res.json({ success: true, count: leaves.length, leaves });
});

/**
 * PUT /leaves/:id/status
 * Dual approval handler:
 * For teaching roles (faculty, coordinator, chairperson):
 * - BOTH HOD and Dean must approve for overall status to become 'approved'.
 * - If EITHER rejects, overall status immediately becomes 'rejected'.
 * For students:
 * - HOD or Dean review can finalize.
 */
export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;
  const userRole = req.user.role;
  const isDean = (userRole === 'officer' && (req.user.officeCode === 'DEAN' || req.user.officeCode === 'dean')) || (userRole === 'admin' && req.body.asRole === 'dean');
  const isHOD = userRole === 'chairperson' || userRole === 'coordinator' || (userRole === 'admin' && req.body.asRole !== 'dean');

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'." });
  }

  const leave = await LeaveApplication.findByPk(req.params.id, {
    include: [{ model: LeaveType, as: 'leaveType' }],
  });

  if (!leave) return res.status(404).json({ success: false, message: 'Leave application not found.' });

  if (leave.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Leave application has already been finalized.' });
  }

  const isTeacherApplicant = ['faculty', 'coordinator', 'chairperson'].includes(leave.applicantRole);

  // Determine reviewer tier
  let reviewerTier = '';
  if (userRole === 'officer' && (req.user.officeCode === 'DEAN' || req.user.officeCode === 'dean')) {
    reviewerTier = 'dean';
  } else if (userRole === 'chairperson' || userRole === 'coordinator') {
    reviewerTier = 'hod';
  } else if (userRole === 'admin') {
    // Admin can act as HOD or Dean (defaults to Dean if hodStatus already approved, or explicit asRole)
    if (req.body.asRole === 'dean' || leave.hodStatus === 'approved') {
      reviewerTier = 'dean';
    } else {
      reviewerTier = 'hod';
    }
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized to approve/reject leaves.' });
  }

  if (reviewerTier === 'hod') {
    if (leave.hodStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Already reviewed by HOD.' });
    }

    leave.hodStatus = status;
    leave.hodApprovedBy = req.user.id;
    leave.hodApprovedAt = new Date();
    leave.hodComments = comments ? comments.trim() : null;

    if (status === 'rejected') {
      // Immediate rejection
      leave.status = 'rejected';
    } else {
      // HOD approved
      if (isTeacherApplicant) {
        // Teacher leave requires BOTH HOD and Dean approval
        if (leave.deanStatus === 'approved') {
          leave.status = 'approved';
        } else {
          leave.status = 'pending';
        }
      } else {
        // For students, HOD approval suffices or advances
        leave.status = 'approved';
      }
    }
  } else if (reviewerTier === 'dean') {
    if (leave.deanStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Already reviewed by Dean.' });
    }

    leave.deanStatus = status;
    leave.deanApprovedBy = req.user.id;
    leave.deanApprovedAt = new Date();
    leave.deanComments = comments ? comments.trim() : null;

    if (status === 'rejected') {
      // Immediate rejection
      leave.status = 'rejected';
    } else {
      // Dean approved
      if (isTeacherApplicant) {
        // Teacher leave requires BOTH HOD and Dean approval
        if (leave.hodStatus === 'approved') {
          leave.status = 'approved';
        } else {
          leave.status = 'pending';
        }
      } else {
        leave.status = 'approved';
        if (!leave.hodApprovedBy) {
          leave.hodStatus = 'approved';
          leave.hodApprovedBy = req.user.id;
          leave.hodApprovedAt = new Date();
        }
      }
    }
  }

  await leave.save();

  try {
    await ChangeLog.create({
      userId: req.user.id,
      action: `leave_${status}`,
      entity: 'leave_application',
      entityId: String(leave.id),
      details: { status, reviewerTier, reviewerRole: userRole, comments },
    });
  } catch (e) {
    logger.warn({ err: e }, 'Failed to record leave review changelog');
  }

  // Notify applicant of review outcome
  try {
    const actionLabel = status === 'approved' ? 'approved' : 'rejected';
    await Notification.create({
      toUserId: leave.userId,
      toRole: leave.applicantRole,
      message: `Your leave application #${leave.id} (${leave.leaveType?.name || 'Leave'}) has been ${actionLabel} by ${reviewerTier.toUpperCase()} (${userRole.toUpperCase()}).${comments ? ` Remarks: ${comments}` : ''}`,
      data: {
        leaveId: leave.id,
        status: leave.status,
        reviewerTier,
        reviewerRole: userRole,
        comments,
      },
      scope: 'direct',
    });
  } catch (e) {
    logger.warn({ err: e }, 'Failed to dispatch notification to leave applicant');
  }

  return res.json({
    success: true,
    message: `Leave request marked as ${status} by ${reviewerTier.toUpperCase()}. Overall status: ${leave.status}.`,
    leave,
  });
});

/**
 * GET /leaves/:id/teacher-timetable
 * Returns scheduled classes and timetable entries for the teacher associated with this leave application.
 * Accessible to HOD, Dean, and Admin approvers to inspect lecture clashes during the requested leave.
 */
export const getTeacherTimetableForLeave = asyncHandler(async (req, res) => {
  const leaveId = req.params.id;
  const leave = await LeaveApplication.findByPk(leaveId);

  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave application not found.' });
  }

  const teacherUserId = leave.userId;

  // 1. Fetch faculty record to get facultyId / short code if any
  const facultyRecord = await Faculty.findOne({ where: { userId: teacherUserId } });
  const teacherUser = await User.findByPk(teacherUserId, { attributes: ['id', 'name', 'username', 'role'] });

  // 2. Fetch assigned classes from FacultyAssignment
  const assignments = await FacultyAssignment.findAll({
    where: { facultyId: teacherUserId, isActive: true },
  });

  const subjectIds = Array.from(new Set(assignments.map((a) => a.subjectId).filter(Boolean)));
  const subjects = await Subject.findAll({
    where: { id: { [Op.in]: subjectIds } },
    attributes: ['id', 'name', 'code', 'credits', 'type', 'semester'],
  });
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // 3. For each assigned class, lookup its timetable
  const classTimetables = [];
  for (const asgn of assignments) {
    const subj = subjectMap.get(asgn.subjectId);
    let tt = await Timetable.findOne({
      where: {
        school: asgn.school,
        department: asgn.department,
        program: asgn.program,
        batch: asgn.batch,
        specialization: asgn.specialization,
      },
    });

    if (!tt) {
      // Fallback section lookup
      const section = await findSectionForClass(asgn.school, asgn.department, asgn.program, asgn.batch, asgn.specialization);
      if (section) {
        tt = await Timetable.findOne({
          where: {
            school: section.school,
            department: section.department,
            program: section.program,
            batch: section.batch,
            specialization: section.specialization,
          },
        });
      }
    }

    classTimetables.push({
      assignmentId: asgn.id,
      school: asgn.school,
      department: asgn.department,
      program: asgn.program,
      batch: asgn.batch,
      specialization: asgn.specialization,
      semester: asgn.semester,
      academicYear: asgn.academicYear,
      subject: subj ? { id: subj.id, name: subj.name, code: subj.code, type: subj.type } : null,
      entries: tt ? tt.entries : {},
    });
  }

  // 4. Also search for any timetable slot mentioning teacher's faculty code or name
  let candidateCodes = [];
  if (facultyRecord?.facultyId) candidateCodes.push(facultyRecord.facultyId.toUpperCase());
  if (teacherUser?.name) {
    // Generate acronym/initials, e.g., 'Arun Solanki' -> 'AS', 'Dr. Test Faculty' -> 'TF'
    const cleanName = teacherUser.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '').trim();
    const initials = cleanName.split(/\s+/).map((w) => w[0]).join('').toUpperCase();
    if (initials) candidateCodes.push(initials);
  }

  return res.json({
    success: true,
    teacher: {
      id: teacherUserId,
      name: leave.applicantName,
      role: leave.applicantRole,
      department: leave.department,
      school: leave.school,
      facultyId: facultyRecord?.facultyId || null,
      email: teacherUser?.username || null,
    },
    leave: {
      id: leave.id,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      totalDays: leave.totalDays,
      reason: leave.reason,
      remarks: leave.remarks,
    },
    assignedClasses: classTimetables,
    candidateCodes,
  });
});

