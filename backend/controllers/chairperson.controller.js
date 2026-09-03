import { Op } from 'sequelize';
import sequelize from '../lib/db.js';
import Chairperson from '../models/chairperson.model.js';
import ChairpersonClass from '../models/chairpersonClass.model.js';
import Coordinator from '../models/coordinator.model.js';
import ChangeLog from '../models/changeLog.model.js';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import logger from '../lib/logger.js';

const classFields = ['school', 'department', 'program', 'batch', 'specialization'];

const classMatches = (assignment, target) => classFields.every((field) =>
  !assignment[field] || !target?.[field] || String(assignment[field]).trim().toLowerCase() === String(target[field]).trim().toLowerCase()
);

const validClass = (item) => classFields.every((field) => item?.[field]?.trim());

const normalize = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const classKey = (item) =>
  [item.school, item.department, item.program, item.batch, item.specialization]
    .map(normalize)
    .join('::');

/**
 * Rich chairperson assignments resolver (port from main).
 * Tries userId, then email, then username. Returns deduped, sorted classes.
 * Falls back to direct class fields on the chairperson record if no ChairpersonClass rows.
 */
export const getChairpersonAssignments = async (user) => {
  if (!user || user.role !== 'chairperson') {
    return { chairperson: null, assignments: [] };
  }

  const conditions = [];
  if (user.id !== undefined && user.id !== null) {
    conditions.push({ userId: user.id });
  }
  if (user.username) {
    conditions.push({ email: user.username });
  }
  if (user.email) {
    conditions.push({ email: user.email });
  }

  if (conditions.length === 0) {
    return { chairperson: null, assignments: [] };
  }

  const chairpersonRecord = await Chairperson.findOne({
    where: { [Op.or]: conditions },
    order: [['createdAt', 'DESC']],
  });

  if (!chairpersonRecord) {
    return { chairperson: null, assignments: [] };
  }

  let classRows = [];
  if (chairpersonRecord.id) {
    classRows = await ChairpersonClass.findAll({
      where: { chairpersonId: chairpersonRecord.id },
      order: [
        ['school', 'ASC'],
        ['department', 'ASC'],
        ['program', 'ASC'],
        ['batch', 'ASC'],
        ['specialization', 'ASC'],
      ],
    });
  }

  const classAssignments = classRows.length
    ? classRows.map((record) => {
        const item = typeof record.toJSON === 'function' ? record.toJSON() : record;
        return {
          id: item.id,
          school: item.school,
          department: item.department,
          program: item.program,
          batch: item.batch,
          specialization: item.specialization,
          userId: chairpersonRecord.userId,
          chairpersonId: item.chairpersonId,
          name: chairpersonRecord.name,
          email: chairpersonRecord.email,
          phone: chairpersonRecord.phone,
        };
      })
    : [];

  if (classAssignments.length) {
    const unique = new Map();
    classAssignments.forEach((item) => {
      const key = classKey(item);
      if (!unique.has(key)) unique.set(key, item);
    });
    return { chairperson: chairpersonRecord, assignments: [...unique.values()] };
  }

  const item = typeof chairpersonRecord.toJSON === 'function' ? chairpersonRecord.toJSON() : chairpersonRecord;
  const directClass = {
    id: item.id,
    school: item.school,
    department: item.department,
    program: item.program,
    batch: item.batch,
    specialization: item.specialization,
    userId: item.userId,
    chairpersonId: item.chairpersonId,
    name: item.name,
    email: item.email,
    phone: item.phone,
  };
  const directAssignment = classKey(directClass) ? [directClass] : [];

  return {
    chairperson: chairpersonRecord,
    assignments: directAssignment.filter((item) => item.school || item.department || item.program || item.batch || item.specialization),
  };
};

export const addChairperson = asyncHandler(async (req, res) => {
  const { chairpersonId, name, email, phone, classes } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  if (!chairpersonId?.trim() || !name?.trim() || !normalizedEmail || !phone?.trim() || !Array.isArray(classes) || !classes.length || !classes.every(validClass)) {
    return res.status(400).json({ success: false, message: 'Chairperson details and at least one complete class assignment are required.' });
  }

  const transaction = await sequelize.transaction();
  try {
    const exists = await Chairperson.findOne({
      where: { [Op.or]: [{ chairpersonId: chairpersonId.trim() }, { email: normalizedEmail }] },
      transaction,
    });
    if (exists) {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: 'Chairperson ID or email already exists.' });
    }

    const chairperson = await Chairperson.create({
      chairpersonId: chairpersonId.trim(),
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      createdBy: req.user.id,
    }, { transaction });

    const uniqueClasses = new Map();
    classes.forEach((item) => {
      const key = [item.school, item.department, item.program, item.batch, item.specialization]
        .map((v) => String(v ?? '').trim().toLowerCase())
        .join('::');
      if (key && !uniqueClasses.has(key)) {
        uniqueClasses.set(key, {
          school: item.school.trim(),
          department: item.department.trim(),
          program: item.program.trim(),
          batch: item.batch.trim(),
          specialization: item.specialization.trim(),
        });
      }
    });

    await ChairpersonClass.bulkCreate([...uniqueClasses.values()].map((item) => ({
      chairpersonId: chairperson.id,
      ...item,
    })), { transaction });

    await transaction.commit();
    logger.info({ chairpersonId: chairperson.id, classesCount: classes.length, createdBy: req.user.id }, 'Chairperson added');
    return res.status(201).json({ success: true, message: 'Chairperson added successfully.', chairperson });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const getChairpersons = asyncHandler(async (_req, res) => {
  const chairpersons = await Chairperson.findAll({ order: [['name', 'ASC']] });
  const ids = chairpersons.map((item) => item.id);
  const assignments = ids.length ? await ChairpersonClass.findAll({ where: { chairpersonId: ids } }) : [];
  return res.json({ success: true, chairpersons: chairpersons.map((item) => ({ ...item.toJSON(), classes: assignments.filter((row) => row.chairpersonId === item.id) })) });
});

export const getChairpersonClasses = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.role !== 'chairperson') {
    return res.status(403).json({ success: false, message: 'Only chairpersons can access assigned classes.' });
  }
  const { assignments } = await getChairpersonAssignments(req.user);
  if (!assignments.length) {
    return res.status(200).json({ success: true, count: 0, classes: [], message: 'No classes are assigned to this chairperson.' });
  }
  return res.status(200).json({
    success: true,
    count: assignments.length,
    classes: assignments.map((item) => ({
      id: item.id,
      school: item.school,
      department: item.department,
      program: item.program,
      batch: item.batch,
      specialization: item.specialization,
    })),
  });
});

export const getChairpersonLogs = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const logs = await ChangeLog.findAll({
    where: { userId: req.user.id },
    attributes: ['id', 'userId', 'action', 'entity', 'entityId', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 200,
  });
  return res.status(200).json({ success: true, logs });
});

export const getMessages = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const messages = await Notification.findAll({
    where: {
      [Op.or]: [
        { toRole: req.user.role },
        { toRole: 'admin' },
      ],
    },
    attributes: ['id', 'toRole', 'message', 'read', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 50,
    raw: true,
  });
  return res.status(200).json({ success: true, messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const receiverRole = req.body.receiverRole || 'admin';
  if (!content?.trim()) {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }
  const notification = await Notification.create({
    toRole: receiverRole,
    message: content.trim(),
    data: {
      fromUserId: req.user.id,
      fromRole: req.user.role,
      fromName: req.user.name || req.user.username,
    },
  });
  return res.status(201).json({ success: true, message: 'Message sent successfully.', notification });
});

export const deleteChairperson = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();
  try {
    const chairperson = await Chairperson.findByPk(id, { transaction });
    if (!chairperson) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Chairperson not found.' });
    }

    await ChairpersonClass.destroy({ where: { chairpersonId: chairperson.id }, transaction });

    if (chairperson.userId) {
      await User.destroy({ where: { id: chairperson.userId }, transaction });
    }

    await chairperson.destroy({ transaction });
    await transaction.commit();

    logger.info({ chairpersonId: id, deletedBy: req.user.id }, 'Chairperson deleted');
    return res.json({ success: true, message: 'Chairperson deleted successfully.' });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const getAdminDetails = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role === 'chairperson') {
    const { chairperson, assignments } = await getChairpersonAssignments(req.user);

    if (!chairperson) {
      return res.status(404).json({
        success: false,
        message: 'Chairperson not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Chairperson details found successfully.',
      user: chairperson,
      assignments,
    });
  }

  return res.status(403).json({
    success: false,
    message: 'This endpoint is only available for chairperson details.',
  });
});
