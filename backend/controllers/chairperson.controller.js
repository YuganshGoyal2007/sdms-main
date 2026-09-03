import { Op } from 'sequelize';
import sequelize from '../lib/db.js';
import Chairperson from '../models/chairperson.model.js';
import ChairpersonClass from '../models/chairpersonClass.model.js';
import Coordinator from '../models/coordinator.model.js';
import ChangeLog from '../models/changeLog.model.js';
import Notification from '../models/notification.model.js';
import Message from '../models/message.model.js';
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

const coordinatorUsersForAssignments = async (assignments) => {
  if (!assignments.length) return [];
  const coordinators = await Coordinator.findAll({ where: { role: 'coordinator' } });
  return coordinators.filter((coordinator) => assignments.some((assignment) => classMatches(assignment, coordinator)));
};

export const addChairperson = asyncHandler(async (req, res) => {
  const { chairpersonId, name, email, phone, classes } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  if (!chairpersonId?.trim() || !name?.trim() || !normalizedEmail || !phone?.trim() || !Array.isArray(classes) || !classes.length || !classes.every(validClass)) {
    return res.status(400).json({ success: false, message: 'Chairperson details and at least one complete class assignment are required.' });
  }
  const exists = await Chairperson.findOne({ where: { [Op.or]: [{ chairpersonId: chairpersonId.trim() }, { email: normalizedEmail }] } });
  if (exists) return res.status(409).json({ success: false, message: 'Chairperson ID or email already exists.' });

  const chairperson = await Chairperson.create({ chairpersonId: chairpersonId.trim(), name: name.trim(), email: normalizedEmail, phone: phone.trim(), createdBy: req.user.id });
  await ChairpersonClass.bulkCreate(classes.map((item) => ({
    chairpersonId: chairperson.id,
    school: item.school.trim(), department: item.department.trim(), program: item.program.trim(), batch: item.batch.trim(), specialization: item.specialization.trim(),
  })));
  logger.info({ chairpersonId: chairperson.id, classesCount: classes.length, createdBy: req.user.id }, 'Chairperson added');
  return res.status(201).json({ success: true, message: 'Chairperson added successfully.', chairperson });
});

export const getChairpersons = asyncHandler(async (_req, res) => {
  const chairpersons = await Chairperson.findAll({ order: [['name', 'ASC']] });
  const ids = chairpersons.map((item) => item.id);
  const assignments = ids.length ? await ChairpersonClass.findAll({ where: { chairpersonId: ids } }) : [];
  return res.json({ success: true, chairpersons: chairpersons.map((item) => ({ ...item.toJSON(), classes: assignments.filter((row) => row.chairpersonId === item.id) })) });
});

export const getChairpersonClasses = asyncHandler(async (req, res) => {
  let assignments;
  if (req.user.role === 'admin') {
    assignments = await ChairpersonClass.findAll();
  } else {
    const { chairperson, assignments: chairAssignments } = await getChairpersonAssignments(req.user);
    if (!chairperson) return res.status(404).json({ success: false, message: 'Chairperson profile not found.' });
    assignments = chairAssignments;
  }
  const coordinators = await coordinatorUsersForAssignments(assignments);
  const classes = assignments.map((assignment) => ({
    ...assignment.toJSON(),
    coordinators: coordinators.filter((coordinator) => classMatches(assignment, coordinator)).map((coordinator) => ({ id: coordinator.id, userId: coordinator.userId, name: coordinator.name, email: coordinator.email, phone: coordinator.phone })),
  }));
  return res.json({ success: true, classes });
});

export const getChairpersonLogs = asyncHandler(async (req, res) => {
  const { assignments } = await getChairpersonAssignments(req.user);
  const coordinators = await coordinatorUsersForAssignments(assignments);
  const userIds = coordinators.map((item) => item.userId).filter(Boolean);
  if (!userIds.length) return res.json({ success: true, count: 0, logs: [] });
  const logs = await ChangeLog.findAll({ where: { userId: userIds }, order: [['createdAt', 'DESC']] });
  const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'username'] });
  const userNames = new Map(users.map((user) => [user.id, user.name || user.username]));
  const visibleLogs = logs.filter((log) => {
    const details = log.details?.after || log.details?.student || log.details?.before || log.details;
    return assignments.some((assignment) => classMatches(assignment, details));
  }).map((log) => ({ ...log.toJSON(), actorName: userNames.get(log.userId) || 'Coordinator' }));
  return res.json({ success: true, count: visibleLogs.length, logs: visibleLogs });
});

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.findAll({ where: { [Op.or]: [{ senderId: req.user.id }, { receiverId: req.user.id }] }, order: [['createdAt', 'ASC']] });
  return res.json({ success: true, messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const receiverId = Number(req.body.receiverId);
  const content = req.body.content?.trim();
  if (!receiverId || !content) return res.status(400).json({ success: false, message: 'Recipient and message are required.' });
  const receiver = await User.findByPk(receiverId);
  if (!receiver || !['chairperson', 'coordinator'].includes(receiver.role)) return res.status(404).json({ success: false, message: 'Recipient not found.' });

  const senderAssignments = req.user.role === 'chairperson'
    ? (await getChairpersonAssignments(req.user)).assignments
    : await Coordinator.findAll({ where: { [Op.or]: [{ userId: req.user.id }, { email: req.user.username }] } });
  const receiverAssignments = receiver.role === 'chairperson'
    ? (await getChairpersonAssignments(receiver)).assignments
    : await Coordinator.findAll({ where: { [Op.or]: [{ userId: receiver.id }, { email: receiver.username }] } });
  if (!senderAssignments.some((one) => receiverAssignments.some((two) => classMatches(one, two)))) {
    return res.status(403).json({ success: false, message: 'You can message only coordinators or chairpersons for a shared class.' });
  }
  const message = await Message.create({ senderId: req.user.id, receiverId, content });
  return res.status(201).json({ success: true, message });
});

export const deleteChairperson = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const chairperson = await Chairperson.findByPk(id);
  if (!chairperson) {
    return res.status(404).json({ success: false, message: 'Chairperson not found.' });
  }

  await ChairpersonClass.destroy({ where: { chairpersonId: chairperson.id } });

  if (chairperson.userId) {
    await User.destroy({ where: { id: chairperson.userId } });
  }

  await chairperson.destroy();

  logger.info({ chairpersonId: id, deletedBy: req.user.id }, 'Chairperson deleted');
  return res.json({ success: true, message: 'Chairperson deleted successfully.' });
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
