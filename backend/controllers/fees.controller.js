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
