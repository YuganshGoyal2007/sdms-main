import { Op } from 'sequelize';
import asyncHandler from '../lib/asyncHandler.js';
import logger from '../lib/logger.js';
import { LeaveType, LeaveApplication, User, ChangeLog } from '../models/index.js';

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
 * Apply for leave with quota deduction and day calculation.
 */
export const applyLeave = asyncHandler(async (req, res) => {
  const { leaveTypeId, fromDate, toDate, reason, attachmentUrl, department, school } = req.body;

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

  const app = await LeaveApplication.create({
    userId: req.user.id,
    applicantName: req.user.name || req.user.username,
    applicantRole: req.user.role,
    department: department || req.user.department || null,
    school: school || req.user.school || null,
    leaveTypeId,
    fromDate,
    toDate,
    totalDays,
    reason,
    attachmentUrl: attachmentUrl || null,
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
      details: { leaveType: lt.name, totalDays, fromDate, toDate },
    });
  } catch (e) {
    logger.warn({ err: e }, 'Failed to record leave application changelog');
  }

  const populated = await LeaveApplication.findByPk(app.id, {
    include: [{ model: LeaveType, as: 'leaveType' }],
  });

  return res.status(201).json({
    success: true,
    message: 'Leave application submitted successfully for HOD review.',
    leave: populated,
  });
});

/**
 * GET /leaves/pending
 * Approver review queue for HOD and Dean.
 */
export const getPendingLeaves = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  let whereClause = {};

  if (userRole === 'chairperson' || userRole === 'coordinator') {
    // HOD review tier
    whereClause.hodStatus = 'pending';
    whereClause.status = 'pending';
    if (req.user.department) {
      whereClause.department = req.user.department;
    }
  } else if (userRole === 'admin') {
    // Admin / Dean review tier (can review HOD-approved or all pending)
    whereClause.status = 'pending';
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized to view approval queue.' });
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
 * Two-tier approval handler (HOD -> Dean).
 */
export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;
  const userRole = req.user.role;

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

  if (userRole === 'chairperson' || userRole === 'coordinator') {
    // HOD ACTION
    if (leave.hodStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Already reviewed by HOD.' });
    }

    leave.hodStatus = status;
    leave.hodApprovedBy = req.user.id;
    leave.hodApprovedAt = new Date();
    leave.hodComments = comments || null;

    if (status === 'rejected') {
      leave.status = 'rejected';
    } else {
      leave.deanStatus = 'pending';
    }
  } else if (userRole === 'admin') {
    // DEAN / ADMIN ACTION
    leave.deanStatus = status;
    leave.deanApprovedBy = req.user.id;
    leave.deanApprovedAt = new Date();
    leave.deanComments = comments || null;

    leave.status = status;
    if (!leave.hodApprovedBy) {
      leave.hodStatus = status;
      leave.hodApprovedBy = req.user.id;
      leave.hodApprovedAt = new Date();
    }
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized to approve/reject leaves.' });
  }

  await leave.save();

  try {
    await ChangeLog.create({
      userId: req.user.id,
      action: `leave_${status}`,
      entity: 'leave_application',
      entityId: String(leave.id),
      details: { status, reviewerRole: userRole, comments },
    });
  } catch (e) {
    logger.warn({ err: e }, 'Failed to record leave review changelog');
  }

  return res.json({
    success: true,
    message: `Leave request ${status} by ${userRole}.`,
    leave,
  });
});
