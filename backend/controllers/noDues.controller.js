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
    include: [{ model: NoDuesStage, as: 'stages', separate: true, order: [['sequenceOrder', 'ASC'], ['id', 'ASC']] }],
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
    {
      applicationId: application.id,
      stageCode: 'ICT',
      stageName: 'Information & Communication Technology (ICT) Office',
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

// ==========================================
// DEDICATED DEPARTMENTAL NO-DUES PORTALS
// Library, Hostel, Sports, Dean, ICT Office
// ==========================================

export const OFFICE_DEFINITIONS = {
  library: {
    code: 'LIB',
    slug: 'library',
    name: 'Central Bodhisattva Library',
    category: 'Auxiliary Resource Center',
    icon: 'BookOpen',
    description: 'Book return verification, catalogue accession clearance, overdue fine settlements, and digital journal account closure.',
    checklists: [
      'Verify physical return of all circulation books and journals',
      'Check overdue fines or lost book assessment ledger',
      'Revoke remote e-library and research database credentials',
      'Collect and void physical student library card'
    ],
    quickRemarks: [
      'All books returned in good condition. Zero outstanding dues.',
      'Overdue fine cleared. Library account marked clear.',
      'Books unreturned or overdue. Dues penalty recorded.',
      'Library card surrendered and catalog verified.'
    ]
  },
  hostel: {
    code: 'HST',
    slug: 'hostel',
    name: 'Hostel Administration & Mess Office',
    category: 'Residential Services',
    icon: 'Home',
    description: 'Hostel room inventory inspection, furniture verification, mess rebate & dues settlement, and key handover.',
    checklists: [
      'Conduct room inspection for fixture or furniture damages',
      'Review monthly mess billing ledger and rebate calculations',
      'Collect physical room, almirah, and main door keys',
      'Authorize hostel caution money refund clearance'
    ],
    quickRemarks: [
      'Room vacated in proper condition. Mess dues settled.',
      'Room and almirah keys received. Zero hostel liability.',
      'Room damage assessment fee levied.',
      'Mess dues pending. Liability amount recorded.'
    ]
  },
  sports: {
    code: 'SPT',
    slug: 'sports',
    name: 'University Sports Council',
    category: 'Athletics & Recreation',
    icon: 'Trophy',
    description: 'Sports kits and equipment returns, gymnasium pass deactivation, tournament inventory audit, and facility clearance.',
    checklists: [
      'Verify return of all university athletic equipment and kits',
      'Deactivate gymnasium access pass and locker allocation',
      'Confirm zero damage to university sports complex property',
      'Review university tournament participation record'
    ],
    quickRemarks: [
      'All sports equipment returned in excellent order.',
      'Gym pass and locker vacated. Zero liabilities.',
      'Equipment damaged or unreturned. Dues recorded.',
      'No equipment issued. Automatic clearance granted.'
    ]
  },
  dean: {
    code: 'DEAN',
    slug: 'dean',
    name: 'School Dean Clearance Desk',
    category: 'Academic Executive',
    icon: 'GraduationCap',
    description: 'School-level academic standing evaluation, department council review, disciplinary clearance, and graduation endorsement.',
    checklists: [
      'Confirm department HOD and coordinator clearances completed',
      'Verify core academic credits and curriculum requirements fulfilled',
      'Confirm no active proctorial or disciplinary sanctions',
      'Endorse final graduation and degree award clearance'
    ],
    quickRemarks: [
      'Academic credits fulfilled. Disciplinary record clean. Cleared.',
      'School Dean endorsement approved for degree clearance.',
      'Academic criteria not satisfied. Re-verification required.',
      'Disciplinary hold in effect. Contact Dean office.'
    ]
  },
  ict: {
    code: 'ICT',
    slug: 'ict',
    name: 'Information & Communication Technology (ICT) Office',
    category: 'Digital Infrastructure',
    icon: 'Laptop',
    description: 'University email deactivation, campus Wi-Fi MAC de-registration, lab domain credential removal, and hardware return.',
    checklists: [
      'Schedule deactivation of official university email (@gbu.ac.in)',
      'Revoke campus-wide Wi-Fi credentials and registered MAC addresses',
      'Clear high-performance server / cloud laboratory access',
      'Verify return of any issued tokens, lab dongles, or hardware'
    ],
    quickRemarks: [
      'University email deactivated. Wi-Fi credentials revoked.',
      'All IT resources and domain logins successfully cleared.',
      'Unreturned lab hardware or network token. Dues levied.',
      'Zero IT liabilities found. Clearance approved.'
    ]
  }
};

export function resolveOffice(slugOrCode) {
  const norm = String(slugOrCode || '').toLowerCase().trim();
  if (OFFICE_DEFINITIONS[norm]) return OFFICE_DEFINITIONS[norm];
  if (norm === 'lib') return OFFICE_DEFINITIONS.library;
  if (norm === 'hst') return OFFICE_DEFINITIONS.hostel;
  if (norm === 'spt') return OFFICE_DEFINITIONS.sports;
  if (norm === 'it' || norm === 'ict-office') return OFFICE_DEFINITIONS.ict;
  const match = Object.values(OFFICE_DEFINITIONS).find(
    (o) => o.code.toLowerCase() === norm || o.slug.toLowerCase() === norm
  );
  return match || null;
}

/**
 * Validates whether the authenticated user has clearance authority for the specified desk.
 * Strict Departmental RBAC:
 * - Departmental officers (role: 'officer') are strictly authorized ONLY for their matching officeCode.
 * - Central HOD / Administrator (role: 'admin') is strictly restricted from auxiliary department desks
 *   (Central Library, Hostel Administration, Sports Council, School Dean, ICT Office).
 */
export function validateDeskAccess(user, office) {
  if (!user) {
    return {
      allowed: false,
      status: 401,
      error: 'UNAUTHENTICATED',
      message: 'Authentication required to access departmental clearance desk.',
      authorizedOfficeCode: null,
    };
  }

  const userOffice = String(user.officeCode || '').toUpperCase().trim();

  // 1. Departmental Officer check
  if (user.role === 'officer') {
    if (userOffice !== office.code.toUpperCase()) {
      return {
        allowed: false,
        status: 403,
        error: 'FORBIDDEN_DESK',
        message: `Access Denied: You are authenticated as ${userOffice || 'another'} Officer. You do not have authorization to access the ${office.name} desk.`,
        authorizedOfficeCode: userOffice,
      };
    }
    return { allowed: true };
  }

  // 2. Central HOD / Admin check: strictly restricted from auxiliary desks
  if (user.role === 'admin') {
    if (userOffice !== office.code.toUpperCase()) {
      return {
        allowed: false,
        status: 403,
        error: 'FORBIDDEN_DESK',
        message: `Access Denied: You are authenticated as Central HOD / Academic Administrator. Access to the ${office.name} (${office.code}) clearance desk is restricted exclusively to authorized departmental officers.`,
        authorizedOfficeCode: userOffice || 'HOD',
      };
    }
    return { allowed: true };
  }

  // 3. All other roles
  return {
    allowed: false,
    status: 403,
    error: 'FORBIDDEN_DESK',
    message: `Access Denied: Role "${user.role}" does not have clearance officer authorization for ${office.name}.`,
    authorizedOfficeCode: null,
  };
}

/**
 * GET /no-dues/portals/overview
 * Overview of all 5 departmental clearance desks with live counts.
 */
export const getAllOfficesOverview = asyncHandler(async (req, res) => {
  const offices = Object.values(OFFICE_DEFINITIONS);
  const results = [];

  for (const office of offices) {
    const stages = await NoDuesStage.findAll({
      where: { stageCode: office.code },
      include: [
        {
          model: NoDuesApplication,
          as: 'application',
          attributes: ['id', 'status', 'currentStageOrder'],
        },
      ],
    });

    let pending = 0;
    let ready = 0;
    let approved = 0;
    let rejected = 0;
    let totalDues = 0;

    for (const s of stages) {
      if (s.status === 'approved') approved++;
      else if (s.status === 'rejected') rejected++;
      else {
        pending++;
        const app = s.application;
        if (app && app.status !== 'rejected' && s.sequenceOrder <= (app.currentStageOrder || 1)) {
          ready++;
        }
      }
      totalDues += Number(s.duesAmount || 0);
    }

    const access = validateDeskAccess(req.user, office);

    results.push({
      ...office,
      isAuthorized: access.allowed,
      lockReason: access.allowed ? null : access.message,
      stats: {
        total: stages.length,
        pending,
        ready,
        approved,
        rejected,
        totalDues,
      },
    });
  }

  return res.json({
    success: true,
    offices: results,
  });
});

/**
 * GET /no-dues/portal/:officeCode
 * Data for a specific department desk: details, stats, queue, and audit history.
 */
export const getOfficePortalData = asyncHandler(async (req, res) => {
  const { officeCode } = req.params;
  const office = resolveOffice(officeCode);

  if (!office) {
    return res.status(404).json({
      success: false,
      message: `Unknown office portal code: "${officeCode}". Available: library, hostel, sports, dean, ict.`,
    });
  }

  // Strict Departmental Access Check
  const access = validateDeskAccess(req.user, office);
  if (!access.allowed) {
    return res.status(access.status || 403).json({
      success: false,
      error: access.error || 'FORBIDDEN_DESK',
      message: access.message,
      authorizedOfficeCode: access.authorizedOfficeCode,
    });
  }

  const allStages = await NoDuesStage.findAll({
    where: { stageCode: office.code },
    include: [
      {
        model: NoDuesApplication,
        as: 'application',
        include: [
          {
            model: Student,
            as: 'student',
            attributes: [
              'id',
              'rollNo',
              'enrollmentNo',
              'fullName',
              'school',
              'department',
              'program',
              'batch',
              'specialization',
              'mobile',
              'email',
              'hosteller',
              'photo',
            ],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  let approved = 0;
  let rejected = 0;
  let pending = 0;
  let ready = 0;
  let totalDues = 0;

  const queue = [];
  const history = [];

  for (const st of allStages) {
    const app = st.application;
    const isAppRejected = app?.status === 'rejected';
    const isStageApproved = st.status === 'approved';
    const isStageRejected = st.status === 'rejected';
    const isReady =
      !isAppRejected &&
      st.status === 'pending' &&
      st.sequenceOrder <= (app?.currentStageOrder || 1);

    if (isStageApproved) approved++;
    else if (isStageRejected) rejected++;
    else {
      pending++;
      if (isReady) ready++;
    }

    totalDues += Number(st.duesAmount || 0);

    const item = {
      id: st.id,
      applicationId: st.applicationId,
      stageCode: st.stageCode,
      stageName: st.stageName,
      status: st.status,
      duesAmount: Number(st.duesAmount || 0),
      comments: st.comments,
      sequenceOrder: st.sequenceOrder,
      verifiedBy: st.verifiedBy,
      verifiedByName: st.verifiedByName,
      verifiedAt: st.verifiedAt,
      createdAt: st.createdAt,
      isReady,
      isLocked: !isReady && st.status === 'pending',
      application: app
        ? {
            id: app.id,
            displayId: app.displayId,
            rollNo: app.rollNo,
            status: app.status,
            currentStageOrder: app.currentStageOrder,
            isCompleted: app.isCompleted,
            studentRemarks: app.studentRemarks,
            remarks: app.remarks,
            proofDocumentUrl: app.proofDocumentUrl,
            student: app.student,
          }
        : null,
    };

    queue.push(item);
    if (isStageApproved || isStageRejected) {
      history.push(item);
    }
  }

  return res.json({
    success: true,
    office,
    stats: {
      total: allStages.length,
      pending,
      ready,
      approved,
      rejected,
      totalDues,
    },
    queue,
    history: history.slice(0, 50),
  });
});

/**
 * POST /no-dues/portal/:officeCode/action/:stageId
 * Approve or reject a clearance stage from a dedicated department desk.
 */
export const actionOfficeClearance = asyncHandler(async (req, res) => {
  const { officeCode, stageId } = req.params;
  const office = resolveOffice(officeCode);

  if (!office) {
    return res.status(404).json({ success: false, message: 'Invalid office portal code.' });
  }

  // Strict Departmental Access Check
  const access = validateDeskAccess(req.user, office);
  if (!access.allowed) {
    return res.status(access.status || 403).json({
      success: false,
      error: access.error || 'FORBIDDEN_DESK',
      message: access.message,
      authorizedOfficeCode: access.authorizedOfficeCode,
    });
  }

  const { action, comments, duesAmount } = req.body;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'." });
  }

  const stage = await NoDuesStage.findByPk(stageId, {
    include: [{ model: NoDuesApplication, as: 'application' }],
  });

  if (!stage) {
    return res.status(404).json({ success: false, message: 'Stage record not found.' });
  }

  if (stage.stageCode !== office.code) {
    return res.status(400).json({
      success: false,
      message: `Stage [${stage.stageCode}] does not belong to desk [${office.name}].`,
    });
  }

  let application = stage.application;
  if (!application) {
    return res.status(404).json({ success: false, message: 'Parent application not found.' });
  }

  // Check sequence locking
  const currentLvl = application.isCompleted ? 999 : (application.currentStageOrder || 1);
  if (action === 'approve' && stage.sequenceOrder > currentLvl) {
    return res.status(400).json({
      success: false,
      message: `Stage is locked. Level ${currentLvl} clearance must be completed before ${office.name} can sign off.`,
    });
  }

  const due = action === 'reject' ? Number(duesAmount || 0) : 0.0;
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  await stage.update({
    status: newStatus,
    duesAmount: due,
    comments:
      comments ||
      (action === 'approve'
        ? `${office.name}: Verified zero liability. Clearance granted.`
        : `${office.name}: Dues or unreturned assets recorded.`),
    verifiedBy: req.user?.id || null,
    verifiedByName: req.user?.name || req.user?.username || `${office.name} Desk Officer`,
    verifiedAt: new Date(),
  });

  // Advance application waterfall
  application = await advanceApplicationWorkflow(application);

  try {
    await ChangeLog.create({
      userId: req.user?.id || 1,
      action: `no_dues_${office.slug}_${action}`,
      entity: 'no_dues_stage',
      entityId: String(stage.id),
      details: {
        office: office.slug,
        applicationDisplayId: application.displayId,
        stage: stage.stageCode,
        action,
        duesAmount: due,
        reviewer: req.user?.username || 'officer',
      },
    });
  } catch (e) {
    logger.warn({ err: e }, 'Failed to record desk changelog');
  }

  const refreshedApp = await NoDuesApplication.findByPk(application.id, {
    include: [{ model: NoDuesStage, as: 'stages' }],
  });

  return res.json({
    success: true,
    message: `[${office.name}] successfully ${newStatus} clearance for ${application.rollNo}.`,
    stage,
    application: refreshedApp,
  });
});

/**
 * POST /no-dues/portal/:officeCode/bulk-approve
 * Batch approve multiple students with zero dues.
 */
export const bulkApproveOfficeClearance = asyncHandler(async (req, res) => {
  const { officeCode } = req.params;
  const office = resolveOffice(officeCode);

  if (!office) {
    return res.status(404).json({ success: false, message: 'Invalid office portal code.' });
  }

  // Strict Departmental Access Check
  const access = validateDeskAccess(req.user, office);
  if (!access.allowed) {
    return res.status(access.status || 403).json({
      success: false,
      error: access.error || 'FORBIDDEN_DESK',
      message: access.message,
      authorizedOfficeCode: access.authorizedOfficeCode,
    });
  }

  const { stageIds } = req.body;
  if (!Array.isArray(stageIds) || stageIds.length === 0) {
    return res.status(400).json({ success: false, message: 'stageIds must be a non-empty array.' });
  }

  const stages = await NoDuesStage.findAll({
    where: {
      id: { [Op.in]: stageIds },
      stageCode: office.code,
      status: 'pending',
    },
    include: [{ model: NoDuesApplication, as: 'application' }],
  });

  let approvedCount = 0;
  const affectedApplications = new Set();

  for (const st of stages) {
    const app = st.application;
    const currentLvl = app?.currentStageOrder || 1;
    if (st.sequenceOrder <= currentLvl && app?.status !== 'rejected') {
      await st.update({
        status: 'approved',
        duesAmount: 0.0,
        comments: `${office.name}: Batch verified zero liability. Clearance granted.`,
        verifiedBy: req.user?.id || null,
        verifiedByName: req.user?.name || req.user?.username || `${office.name} Desk Officer`,
        verifiedAt: new Date(),
      });
      approvedCount++;
      if (app) affectedApplications.add(app);
    }
  }

  for (const app of affectedApplications) {
    await advanceApplicationWorkflow(app);
  }

  return res.json({
    success: true,
    message: `Batch clearance complete: ${approvedCount} student(s) approved by ${office.name}.`,
    approvedCount,
  });
});
