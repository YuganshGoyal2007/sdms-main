import { Op } from 'sequelize';
import asyncHandler from '../lib/asyncHandler.js';
import logger from '../lib/logger.js';
import { FeeRecord, Student, ChangeLog } from '../models/index.js';

/**
 * GET /fees/my
 * Get logged-in student's fees, ledger, and payment summary.
 */
export const getMyFees = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  let student = null;
  if (req.user.role === 'student') {
    student = await Student.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id },
          ...(req.user.username ? [{ rollNo: req.user.username }, { enrollmentNo: req.user.username }] : []),
          ...(req.user.email ? [{ email: req.user.email }] : []),
        ],
      },
      attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'school', 'department', 'program', 'batch', 'specialization'],
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found for this user.' });
    }
  } else {
    return res.status(403).json({ success: false, message: 'Only students can access this endpoint directly.' });
  }

  let feeRecords = await FeeRecord.findAll({
    where: {
      [Op.or]: [{ studentId: student.id }, { rollNo: student.rollNo }],
    },
    order: [['semester', 'DESC'], ['id', 'ASC']],
  });

  // If new student has no fee records yet, auto-generate standard default semester fee ledger
  if (feeRecords.length === 0) {
    const defaultFees = [
      {
        studentId: student.id,
        rollNo: student.rollNo,
        academicYear: '2025-2026',
        semester: 5,
        feeType: 'Tuition Fee',
        amount: 60000.0,
        paidAmount: 60000.0,
        dueAmount: 0.0,
        status: 'paid',
        dueDate: '2025-08-15',
        paidDate: '2025-08-10',
        transactionRef: `TXN-${student.rollNo}-01`,
        remarks: 'Paid online via NetBanking',
      },
      {
        studentId: student.id,
        rollNo: student.rollNo,
        academicYear: '2025-2026',
        semester: 5,
        feeType: 'Hostel & Mess Fee',
        amount: 35000.0,
        paidAmount: 35000.0,
        dueAmount: 0.0,
        status: 'paid',
        dueDate: '2025-08-15',
        paidDate: '2025-08-12',
        transactionRef: `TXN-${student.rollNo}-02`,
        remarks: 'Paid online via UPI',
      },
      {
        studentId: student.id,
        rollNo: student.rollNo,
        academicYear: '2025-2026',
        semester: 5,
        feeType: 'Examination Fee',
        amount: 2500.0,
        paidAmount: 2500.0,
        dueAmount: 0.0,
        status: 'paid',
        dueDate: '2025-11-01',
        paidDate: '2025-10-28',
        transactionRef: `TXN-${student.rollNo}-03`,
        remarks: 'Cleared',
      },
      {
        studentId: student.id,
        rollNo: student.rollNo,
        academicYear: '2025-2026',
        semester: 5,
        feeType: 'Library & Security Deposit',
        amount: 1000.0,
        paidAmount: 1000.0,
        dueAmount: 0.0,
        status: 'paid',
        dueDate: '2025-09-01',
        paidDate: '2025-08-20',
        transactionRef: `TXN-${student.rollNo}-04`,
        remarks: 'No library book overdue',
      },
    ];

    await FeeRecord.bulkCreate(defaultFees);
    feeRecords = await FeeRecord.findAll({
      where: {
        [Op.or]: [{ studentId: student.id }, { rollNo: student.rollNo }],
      },
      order: [['semester', 'DESC'], ['id', 'ASC']],
    });
  }

  let totalAmount = 0;
  let totalPaid = 0;
  let totalDue = 0;

  for (const r of feeRecords) {
    totalAmount += Number(r.amount || 0);
    totalPaid += Number(r.paidAmount || 0);
    totalDue += Number(r.dueAmount || 0);
  }

  return res.json({
    success: true,
    student,
    summary: {
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
      status: totalDue <= 0 ? 'cleared' : 'dues_pending',
      count: feeRecords.length,
    },
    feeRecords,
  });
});

/**
 * GET /fees/student/:rollNo
 * Admin or Staff inspects any student's fees.
 */
export const getStudentFees = asyncHandler(async (req, res) => {
  const { rollNo } = req.params;
  const student = await Student.findOne({
    where: {
      [Op.or]: [{ rollNo }, { enrollmentNo: rollNo }],
    },
    attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'school', 'department', 'program', 'batch', 'specialization'],
  });

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found.' });
  }

  const feeRecords = await FeeRecord.findAll({
    where: {
      [Op.or]: [{ studentId: student.id }, { rollNo: student.rollNo }],
    },
    order: [['semester', 'DESC'], ['id', 'ASC']],
  });

  let totalAmount = 0;
  let totalPaid = 0;
  let totalDue = 0;

  for (const r of feeRecords) {
    totalAmount += Number(r.amount || 0);
    totalPaid += Number(r.paidAmount || 0);
    totalDue += Number(r.dueAmount || 0);
  }

  return res.json({
    success: true,
    student,
    summary: {
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
      status: totalDue <= 0 ? 'cleared' : 'dues_pending',
      count: feeRecords.length,
    },
    feeRecords,
  });
});

/**
 * POST /fees/pay
 * Simulates online fee payment or registers an official payment transaction.
 */
export const payFeeRecord = asyncHandler(async (req, res) => {
  const { recordId, amount, paymentMethod } = req.body;

  if (!recordId) {
    return res.status(400).json({ success: false, message: 'Fee record ID is required.' });
  }

  const fee = await FeeRecord.findByPk(recordId);
  if (!fee) {
    return res.status(404).json({ success: false, message: 'Fee record not found.' });
  }

  const payAmount = Number(amount || fee.dueAmount);
  if (payAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0.' });
  }

  const newPaid = Number(fee.paidAmount || 0) + payAmount;
  const newDue = Math.max(0, Number(fee.amount || 0) - newPaid);
  const newStatus = newDue <= 0 ? 'paid' : 'partial';
  const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  await fee.update({
    paidAmount: newPaid,
    dueAmount: newDue,
    status: newStatus,
    paidDate: new Date(),
    transactionRef: txnId,
    remarks: `Paid via ${paymentMethod || 'Online Gateway'} (${txnId})`,
  });

  try {
    await ChangeLog.create({
      userId: req.user.id,
      action: 'fee_payment',
      entity: 'fee_record',
      entityId: String(fee.id),
      details: { rollNo: fee.rollNo, paid: payAmount, remainingDue: newDue, txnId },
    });
  } catch (e) {
    logger.warn({ err: e }, 'Failed to record fee payment changelog');
  }

  return res.json({
    success: true,
    message: 'Payment processed successfully.',
    receipt: {
      transactionRef: txnId,
      feeType: fee.feeType,
      paidAmount: payAmount,
      remainingDue: newDue,
      paidDate: fee.paidDate,
      status: newStatus,
    },
    fee,
  });
});

/**
 * GET /fees/admin/all
 * Paginated, searchable, filterable fee records across all students.
 */
export const getAllFeesAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const { query, status, semester, feeType } = req.query;

  const where = {};
  if (status && status !== 'all') {
    where.status = status;
  }
  if (semester && semester !== 'all') {
    where.semester = parseInt(semester, 10);
  }
  if (feeType && feeType !== 'all') {
    where.feeType = feeType;
  }

  const studentInclude = {
    model: Student,
    attributes: ['id', 'rollNo', 'enrollmentNo', 'fullName', 'school', 'department', 'program', 'batch'],
    required: false,
  };

  if (query && query.trim()) {
    const q = `%${query.trim()}%`;
    where[Op.or] = [
      { rollNo: { [Op.like]: q } },
      { transactionRef: { [Op.like]: q } },
      { '$Student.fullName$': { [Op.like]: q } },
      { '$Student.enrollmentNo$': { [Op.like]: q } },
    ];
  }

  const { count, rows } = await FeeRecord.findAndCountAll({
    where,
    include: [studentInclude],
    order: [['id', 'DESC']],
    limit,
    offset,
  });

  // Global aggregates across all students
  const totalAssessed = (await FeeRecord.sum('amount')) || 0;
  const totalCollected = (await FeeRecord.sum('paidAmount')) || 0;
  const totalOutstanding = (await FeeRecord.sum('dueAmount')) || 0;
  const studentsWithDues = await FeeRecord.count({
    distinct: true,
    col: 'rollNo',
    where: { dueAmount: { [Op.gt]: 0 } },
  });

  return res.json({
    success: true,
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
    metrics: {
      totalAssessed: Math.round(totalAssessed * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      totalStudentsWithDues: studentsWithDues,
    },
  });
});

/**
 * POST /fees/admin/record
 * Admin assesses fee or fine for a student.
 */
export const assessStudentFee = asyncHandler(async (req, res) => {
  const { rollNo, feeType, amount, semester, academicYear, dueDate, remarks } = req.body;

  if (!rollNo || !feeType || !amount) {
    return res.status(400).json({ success: false, message: 'Roll No, Fee Type, and Amount are required.' });
  }

  const student = await Student.findOne({
    where: {
      [Op.or]: [{ rollNo }, { enrollmentNo: rollNo }],
    },
  });

  const parsedAmount = Number(amount);
  if (parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
  }

  const newFee = await FeeRecord.create({
    studentId: student ? student.id : null,
    rollNo: student ? student.rollNo : rollNo,
    academicYear: academicYear || '2025-2026',
    semester: parseInt(semester, 10) || 5,
    feeType,
    amount: parsedAmount,
    paidAmount: 0.0,
    dueAmount: parsedAmount,
    status: 'pending',
    dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    remarks: remarks || `Assessed by Admin (${req.user.username || req.user.email})`,
  });

  return res.status(201).json({
    success: true,
    message: 'Fee assessed successfully.',
    fee: newFee,
  });
});

/**
 * PUT /fees/admin/record/:id
 * Admin updates or waives a fee record.
 */
export const updateFeeRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paidAmount, dueAmount, status, remarks, transactionRef } = req.body;

  const fee = await FeeRecord.findByPk(id);
  if (!fee) {
    return res.status(404).json({ success: false, message: 'Fee record not found.' });
  }

  const updates = {};
  if (paidAmount !== undefined) updates.paidAmount = Number(paidAmount);
  if (dueAmount !== undefined) updates.dueAmount = Number(dueAmount);
  if (status) updates.status = status;
  if (remarks) updates.remarks = remarks;
  if (transactionRef) updates.transactionRef = transactionRef;
  if (updates.status === 'paid' && !fee.paidDate) {
    updates.paidDate = new Date();
  }

  await fee.update(updates);

  return res.json({
    success: true,
    message: 'Fee record updated successfully.',
    fee,
  });
});

/**
 * GET /fees/admin/export
 * Download CSV of all fee records.
 */
export const exportFeesCsv = asyncHandler(async (req, res) => {
  const records = await FeeRecord.findAll({
    include: [{ model: Student, attributes: ['fullName', 'program', 'school'] }],
    order: [['rollNo', 'ASC'], ['semester', 'DESC']],
    limit: 5000,
  });

  let csv = 'Roll No,Student Name,Program,School,Semester,Fee Type,Assessed (INR),Paid (INR),Due (INR),Status,Transaction Ref,Due Date\n';

  for (const r of records) {
    const name = (r.Student?.fullName || '').replace(/,/g, ' ');
    const prog = (r.Student?.program || '').replace(/,/g, ' ');
    const sch = (r.Student?.school || '').replace(/,/g, ' ');
    csv += `${r.rollNo},"${name}","${prog}","${sch}",Sem ${r.semester},"${r.feeType}",${r.amount},${r.paidAmount},${r.dueAmount},${r.status},${r.transactionRef || 'N/A'},${r.dueDate || 'N/A'}\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="SDMS_All_Student_Fees.csv"');
  return res.send(csv);
});
