import { Op } from 'sequelize';
import asyncHandler from '../lib/asyncHandler.js';
import logger from '../lib/logger.js';
import {
  NoDuesApplication,
  NoDuesStage,
  Student,
  FeeRecord,
  User,
  ChangeLog,
} from '../models/index.js';

// Helper: Generate displayId
function generateDisplayId(rollNo) {
  const clean = String(rollNo || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 2; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ND${clean}${suffix}`;
}

/**
 * Waterfall Status Updater (DAG level advancement and completion)
 * Automatically advances application.currentStageOrder across sequential levels (1 -> 2 -> 3),
 * unlocks parallel level 4 departments, and upon full auxiliary clearance unlocks level 5 (Accounts),
 * finally issuing the verified certificate upon terminal sign-off.
 */
async function advanceApplicationWorkflow(application) {
  if (!application) return null;
  if (application.isCompleted || application.status === 'completed') {
    return application;
  }

  const allStages = await NoDuesStage.findAll({
    where: { applicationId: application.id },
    order: [['sequenceOrder', 'ASC'], ['id', 'ASC']],
  });

  if (allStages.length === 0) return application;

  // 1. Check if any stage is explicitly rejected
  const anyRejected = allStages.find((s) => s.status === 'rejected');
  if (anyRejected) {
    application.status = 'rejected';
    application.remarks = `Rejected at [${anyRejected.stageName}]: ${anyRejected.comments || 'Outstanding dues / document required'}`;
    await application.save();
    return application;
  }

  // 2. Identify distinct sequence levels
  const distinctLevels = [...new Set(allStages.map((s) => s.sequenceOrder))].sort((a, b) => a - b);

  let activeLevel = distinctLevels[0] || 1;
  let allCleared = true;

  for (const level of distinctLevels) {
    const stagesAtLevel = allStages.filter((s) => s.sequenceOrder === level);
    const hasPending = stagesAtLevel.some((s) => s.status !== 'approved');

    if (hasPending) {
      activeLevel = level;
      allCleared = false;
      break;
    }
  }

  if (allCleared) {
    application.currentStageOrder = 999;
    application.status = 'completed';
    application.isCompleted = true;
    if (!application.certificateNumber) {
      application.certificateNumber = `GBU-ND-${application.displayId}-${Date.now().toString().slice(-6)}`;
      application.certificateIssuedAt = new Date();
    }
  } else {
    application.currentStageOrder = activeLevel;
    application.status = 'in_progress';
  }

  await application.save();
  return application;
}

/**
 * GET /no-dues/my
 * Current student's No-Dues application, stage progress, and certificate if cleared.
 */
export const getMyNoDues = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied: Students only.' });
  }

  const student = await Student.findOne({
    where: {
      [Op.or]: [
        { userId: req.user.id },
        ...(req.user.username ? [{ rollNo: req.user.username }, { enrollmentNo: req.user.username }] : []),
        ...(req.user.email ? [{ email: req.user.email }] : []),
      ],
    },
    attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'school', 'department', 'program', 'batch', 'specialization', 'hosteller'],
  });

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found.' });
  }

  let application = await NoDuesApplication.findOne({
    where: { studentId: student.id },
    order: [['createdAt', 'DESC']],
    include: [{ model: NoDuesStage, as: 'stages' }],
  });

  // Check outstanding fee records
  const feeDueCount = await FeeRecord.count({
    where: {
      [Op.or]: [{ studentId: student.id }, { rollNo: student.rollNo }],
      dueAmount: { [Op.gt]: 0 },
    },
  });

  if (!application) {
    return res.json({
      success: true,
      hasApplication: false,
      student,
      hasOutstandingFees: feeDueCount > 0,
      application: null,
      stages: [],
      workflow: { top: [], parallel: [], bottom: [] },
      progressPercentage: 0,
      stats: { total: 0, approved: 0, pending: 0, locked: 0, rejected: 0 },
    });
  }

  // Waterfall progression update
  application = await advanceApplicationWorkflow(application);

  const rawStages = await NoDuesStage.findAll({
    where: { applicationId: application.id },
    order: [['sequenceOrder', 'ASC'], ['id', 'ASC']],
  });

  const currentLevel = application.isCompleted ? 999 : (application.currentStageOrder || 1);

  const stages = rawStages.map((s) => {
    const isLocked = !application.isCompleted && s.sequenceOrder > currentLevel;
    let computedStatus = s.status;
    if (s.status === 'pending' && isLocked) {
      computedStatus = 'locked';
    }
    return {
      ...s.toJSON(),
      isLocked,
      computedStatus,
    };
  });

  const totalStages = stages.length;
  const approvedStages = stages.filter((s) => s.status === 'approved').length;
  const progressPercentage = application.isCompleted
    ? 100
    : totalStages > 0
    ? Math.round((approvedStages / totalStages) * 100)
    : 0;

  const top = stages.filter((s) => s.sequenceOrder < 4);
  const parallel = stages.filter((s) => s.sequenceOrder === 4);
  const bottom = stages.filter((s) => s.sequenceOrder > 4);

  return res.json({
    success: true,
    hasApplication: true,
    student,
    hasOutstandingFees: feeDueCount > 0,
    application,
    stages,
    workflow: { top, parallel, bottom },
    progressPercentage,
    stats: {
      total: totalStages,
      approved: approvedStages,
      pending: stages.filter((s) => s.computedStatus === 'pending').length,
      locked: stages.filter((s) => s.computedStatus === 'locked').length,
      rejected: stages.filter((s) => s.computedStatus === 'rejected').length,
    },
    canResubmit: application.status === 'rejected',
  });
});

/**
 * POST /no-dues/apply
 * Create and initialize a 5-stage clearance pipeline.
 */
export const applyNoDues = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can apply for No Dues.' });
  }

  const student = await Student.findOne({
    where: {
      [Op.or]: [
        { userId: req.user.id },
        ...(req.user.username ? [{ rollNo: req.user.username }, { enrollmentNo: req.user.username }] : []),
        ...(req.user.email ? [{ email: req.user.email }] : []),
      ],
    },
  });

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student record not found.' });
  }

  // Check if active application already exists
  const existing = await NoDuesApplication.findOne({
    where: {
      studentId: student.id,
      status: { [Op.in]: ['pending', 'in_progress'] },
    },
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'You already have an active No-Dues application in progress.',
      displayId: existing.displayId,
    });
  }

  const { reason, studentRemarks, proofDocumentUrl, isHosteller } = req.body;
  const displayId = generateDisplayId(student.rollNo);
  const hostellerStatus = isHosteller !== undefined ? Boolean(isHosteller) : Boolean(student.hosteller);

  const application = await NoDuesApplication.create({
    displayId,
    studentId: student.id,
    rollNo: student.rollNo,
    school: student.school,
    department: student.department,
    program: student.program,
    batch: student.batch,
    status: 'in_progress',
    currentStageOrder: 1,
    isCompleted: false,
    remarks: reason || null,
    studentRemarks: studentRemarks || null,
    proofDocumentUrl: proofDocumentUrl || null,
  });

  // Create Standard 5-Gate Clearance Stages
  const stagesToCreate = [
    {
      applicationId: application.id,
      stageCode: 'SCHOOL_OFFICE',
      stageName: 'School Administrative Office',
      verifierRole: 'coordinator',
      status: 'pending',
      duesAmount: 0.0,
      sequenceOrder: 1,
    },
    {
      applicationId: application.id,
      stageCode: 'HOD',
      stageName: `Head of Department (${student.department})`,
      verifierRole: 'chairperson',
      status: 'pending',
      duesAmount: 0.0,
      sequenceOrder: 2,
    },
    {
      applicationId: application.id,
      stageCode: 'DEAN',
      stageName: `Dean, ${student.school}`,
      verifierRole: 'admin',
      status: 'pending',
      duesAmount: 0.0,
      sequenceOrder: 3,
    },
    {
      applicationId: application.id,
      stageCode: 'LIB',
      stageName: 'Central Bodhisattva Library',
      verifierRole: 'staff',
      status: 'pending',
      duesAmount: 0.0,
      sequenceOrder: 4,
    },
    {
      applicationId: application.id,
      stageCode: 'LAB',
      stageName: 'Department Laboratories & Instrumentation',
      verifierRole: 'staff',
      status: 'pending',
      duesAmount: 0.0,
      sequenceOrder: 4,
    },
    {
      applicationId: application.id,
      stageCode: 'SPT',
      stageName: 'University Sports Council',
      verifierRole: 'staff',
      status: 'pending',
      duesAmount: 0.0,
      sequenceOrder: 4,
    },
    {
      applicationId: application.id,
      stageCode: 'CRC',
      stageName: 'Corporate Relations & Training Cell (CRC)',
      verifierRole: 'staff',
      status: 'pending',
      duesAmount: 0.0,
      sequenceOrder: 4,
    },
  ];

  if (hostellerStatus) {
    stagesToCreate.push({
      applicationId: application.id,
      stageCode: 'HST',
      stageName: 'Hostel Administration & Mess Office',
      verifierRole: 'staff',
      status: 'pending',
      duesAmount: 0.0,
      sequenceOrder: 4,
    });
  }

  // Final Stage: Accounts
  stagesToCreate.push({
    applicationId: application.id,
    stageCode: 'ACC',
    stageName: 'Finance & Accounts Branch',
    verifierRole: 'admin',
    status: 'pending',
    duesAmount: 0.0,
    sequenceOrder: 5,
  });

  await NoDuesStage.bulkCreate(stagesToCreate);

  try {
    await ChangeLog.create({
      userId: req.user.id,
      action: 'apply_no_dues',
      entity: 'no_dues_application',
      entityId: String(application.id),
      details: { rollNo: student.rollNo, displayId, stagesCount: stagesToCreate.length },
    });
  } catch (e) {
    logger.warn({ err: e }, 'Failed to record no-dues changelog');
  }

  const createdStages = await NoDuesStage.findAll({
    where: { applicationId: application.id },
    order: [['sequenceOrder', 'ASC']],
  });

  return res.status(201).json({
    success: true,
    message: 'No-Dues application submitted successfully. Verification pipeline initialized.',
    application,
    stages: createdStages,
  });
});

/**
 * POST /no-dues/resubmit
 * Resubmit application after addressing dues / rejection remarks.
 */
export const resubmitNoDues = asyncHandler(async (req, res) => {
  const { studentRemarks, proofDocumentUrl } = req.body;

  const student = await Student.findOne({
    where: {
      [Op.or]: [
        { userId: req.user.id },
        ...(req.user.username ? [{ rollNo: req.user.username }, { enrollmentNo: req.user.username }] : []),
      ],
    },
  });

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found.' });
  }

  const application = await NoDuesApplication.findOne({
    where: { studentId: student.id },
    order: [['createdAt', 'DESC']],
    include: [{ model: NoDuesStage, as: 'stages' }],
  });

  if (!application) {
    return res.status(404).json({ success: false, message: 'No application found to resubmit.' });
  }

  if (application.status !== 'rejected') {
    return res.status(400).json({ success: false, message: 'Only rejected applications can be resubmitted.' });
  }

  // Reset rejected stages to pending
  await NoDuesStage.update(
    { status: 'pending', comments: null, duesAmount: 0.0, verifiedAt: null, verifiedBy: null },
    { where: { applicationId: application.id, status: 'rejected' } }
  );

  await application.update({
    status: 'in_progress',
    studentRemarks: studentRemarks || application.studentRemarks,
    proofDocumentUrl: proofDocumentUrl || application.proofDocumentUrl,
    remarks: null,
  });

  const updatedStages = await NoDuesStage.findAll({
    where: { applicationId: application.id },
    order: [['sequenceOrder', 'ASC']],
  });

  return res.json({
    success: true,
    message: 'Application resubmitted successfully. Clearance pipeline resumed.',
    application,
    stages: updatedStages,
  });
});

/**
 * GET /no-dues/pending
 * Clearance authority queue: Fetch pending applications awaiting review.
 */
export const getPendingClearances = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Auth required.' });

  let stageFilter = { status: 'pending' };

  if (user.role === 'admin') {
    // Admins see all pending stages (or filter by query)
  } else if (user.role === 'chairperson') {
    // Chairperson acts as HOD
    stageFilter.stageCode = 'HOD';
  } else if (user.role === 'coordinator') {
    stageFilter.stageCode = 'SCHOOL_OFFICE';
  }

  const pendingStages = await NoDuesStage.findAll({
    where: stageFilter,
    include: [
      {
        model: NoDuesApplication,
        as: 'application',
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'school', 'department', 'program', 'batch', 'specialization', 'photo'],
          },
        ],
      },
    ],
    order: [['sequenceOrder', 'ASC'], ['createdAt', 'ASC']],
  });

  // Only return stages that are ready for active review (sequenceOrder <= application.currentStageOrder)
  const readyStages = pendingStages.filter((st) => {
    const app = st.application;
    if (!app || app.status === 'rejected' || app.isCompleted) return false;
    const currentLvl = app.currentStageOrder || 1;
    return st.sequenceOrder <= currentLvl;
  });

  return res.json({
    success: true,
    count: readyStages.length,
    pendingClearances: readyStages,
  });
});

/**
 * POST /no-dues/stages/:id/action
 * Approve or reject a clearance stage.
 */
export const actionClearanceStage = asyncHandler(async (req, res) => {
  const stageId = Number(req.params.id);
  const { action, comments, duesAmount } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'." });
  }

  const stage = await NoDuesStage.findByPk(stageId, {
    include: [{ model: NoDuesApplication, as: 'application' }],
  });

  if (!stage) {
    return res.status(404).json({ success: false, message: 'Clearance stage not found.' });
  }

  let application = stage.application;
  if (!application) {
    return res.status(404).json({ success: false, message: 'Parent application not found.' });
  }

  // Enforce workflow level locking
  const currentLvl = application.isCompleted ? 999 : (application.currentStageOrder || 1);
  if (action === 'approve' && stage.sequenceOrder > currentLvl) {
    return res.status(400).json({
      success: false,
      message: `Stage [${stage.stageName}] is locked. Level ${currentLvl} clearance must be completed first.`,
    });
  }

  const due = action === 'reject' ? Number(duesAmount || 0) : 0.0;
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  await stage.update({
    status: newStatus,
    duesAmount: due,
    comments: comments || (action === 'approve' ? 'Dues cleared: verified zero liability.' : 'Dues outstanding.'),
    verifiedBy: req.user.id,
    verifiedByName: req.user.name || req.user.username,
    verifiedAt: new Date(),
  });

  // Advance application waterfall
  application = await advanceApplicationWorkflow(application);

  try {
    await ChangeLog.create({
      userId: req.user.id,
      action: `no_dues_${action}`,
      entity: 'no_dues_stage',
      entityId: String(stage.id),
      details: {
        applicationDisplayId: application.displayId,
        stage: stage.stageCode,
        action,
        duesAmount: due,
        reviewer: req.user.username,
      },
    });
  } catch (e) {
    logger.warn({ err: e }, 'Failed to record clearance action changelog');
  }

  const refreshedApp = await NoDuesApplication.findByPk(application.id, {
    include: [{ model: NoDuesStage, as: 'stages' }],
  });

  return res.json({
    success: true,
    message: `Stage [${stage.stageName}] successfully ${newStatus}.`,
    stage,
    application: refreshedApp,
  });
});

/**
 * GET /no-dues/certificate/:applicationId
 * Returns complete printable certificate metadata for a completed clearance.
 */
export const getClearanceCertificate = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const application = await NoDuesApplication.findByPk(applicationId, {
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'school', 'department', 'program', 'batch', 'specialization', 'fatherName'],
      },
      {
        model: NoDuesStage,
        as: 'stages',
      },
    ],
  });

  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found.' });
  }

  if (!application.isCompleted && application.status !== 'completed') {
    return res.status(400).json({ success: false, message: 'Clearance certificate is only available after 100% stage completion.' });
  }

  return res.json({
    success: true,
    certificate: {
      certificateNumber: application.certificateNumber,
      issuedDate: application.certificateIssuedAt,
      studentName: application.student?.fullName,
      rollNo: application.student?.rollNo,
      enrollmentNo: application.student?.enrollmentNo,
      program: application.student?.program,
      batch: application.student?.batch,
      department: application.student?.department,
      school: application.student?.school,
      fatherName: application.student?.fatherName,
      status: 'VERIFIED & CLEARED',
      verificationUrl: `https://gbu.ac.in/verify/no-dues/${application.displayId}`,
      stages: application.stages,
    },
  });
});
