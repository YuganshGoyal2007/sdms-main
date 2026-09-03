import { Op } from "sequelize";
import Coordinator from "../models/coordinator.model.js";
import User from "../models/user.model.js";
import ChangeLog from "../models/changeLog.model.js";
import Notification from "../models/notification.model.js";
import sequelize from "../lib/db.js";
import { getChairpersonLogs } from './chairperson.controller.js';
import Chairperson from '../models/chairperson.model.js';
import { asyncHandler } from "../lib/asyncHandler.js";
import logger from "../lib/logger.js";

export const getAdmins = asyncHandler(async (req, res) => {
    const admins = await Coordinator.findAll({
        include: [
            { model: User, as: 'user' },
            { model: User, as: 'creator' },
            { model: User, as: 'updater' }
        ]
    });
    res.status(200).json({
        success: true,
        count: admins.length,
        admins,
    });
});

export const getCoordinatorClasses = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    const conditions = [{ userId: req.user.id }];
    if (req.user.username) {
        conditions.push({ email: req.user.username });
    }

    const coordinators = await Coordinator.findAll({
        where: {
            [Op.or]: conditions,
            role: 'coordinator'
        },
        order: [
            ['school', 'ASC'],
            ['department', 'ASC'],
            ['program', 'ASC'],
            ['batch', 'ASC'],
            ['specialization', 'ASC']
        ]
    });

    const unique = new Map();
    coordinators.forEach((item) => {
        const key = [item.school, item.department, item.program, item.batch, item.specialization]
            .map((value) => String(value || '').trim().toLowerCase())
            .join('::');
        if (!unique.has(key)) {
            unique.set(key, item);
        }
    });

    return res.status(200).json({
        success: true,
        count: unique.size,
        classes: [...unique.values()].map((item) => ({
            id: item.id,
            school: item.school,
            department: item.department,
            program: item.program,
            batch: item.batch,
            specialization: item.specialization
        }))
    });
});

export const getAdminDetails = asyncHandler(async (req, res) => {
    if (req.user.role === 'admin') {
        return res.status(200).json({
            success: true,
            message: 'User details found successfully',
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.username,
                role: req.user.role,
            },
        });
    }

    if (req.user.role === 'chairperson') {
        const chairperson = await Chairperson.findOne({
            where: {
                [Op.or]: [
                    { userId: req.user.id },
                    { email: req.user.username },
                ],
            },
        });
        if (!chairperson) {
            return res.status(404).json({ success: false, message: 'Chairperson not found' });
        }
        return res.status(200).json({
            success: true,
            message: 'User details found successfully',
            user: chairperson,
        });
    }

    const userIdentifierConditions = [{ userId: req.user.id }];
    if (req.user.username) {
        userIdentifierConditions.push({ email: req.user.username });
    }

    const coordinators = await Coordinator.findAll({
        where: { [Op.or]: userIdentifierConditions },
        include: [
            { model: User, as: 'user' },
            { model: User, as: 'creator' },
            { model: User, as: 'updater' }
        ],
    });

    if (coordinators && coordinators.length > 0) {
        return res.status(200).json({
            success: true,
            message: 'User details found successfully',
            user: coordinators[0],
            coordinators: coordinators,
        });
    }
    return res.status(404).json({ success: false, message: 'Coordinator not found' });
});

export const addCoordinator = asyncHandler(async (req, res) => {
    const { coordinatorId, name, email, phone, school, department, program, batch, specialization } = req.body;
    const existing = await Coordinator.findOne({ where: { email, school, department, program, batch, specialization } });
    if (existing) {
        return res.status(409).json({
            success: false,
            message: 'Coordinator assignment already exists for this class'
        });
    }
    const newCoordinator = await Coordinator.create({
        coordinatorId,
        name,
        email,
        phone,
        school,
        department,
        program,
        batch,
        specialization,
        role: 'coordinator',
        createdBy: req.user.id
    });
    if (newCoordinator) {
        logger.info(
            { coordinatorId: newCoordinator.id, class: { school, department, program, batch, specialization }, createdBy: req.user.id },
            'Coordinator added'
        );
        res.status(200).json({
            success: true,
            message: 'Coordinator added successfully'
        });
    }
});

export const deleteCoordinator = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;

        const coordinator = await Coordinator.findByPk(id, { transaction });

        if (!coordinator) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Coordinator not found",
            });
        }

        if (coordinator.role === "admin") {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "Cannot delete super admin",
            });
        }

        if (coordinator.userId) {
            await User.destroy({ where: { id: coordinator.userId }, transaction });
        }
        await Coordinator.destroy({ where: { id: coordinator.id }, transaction });
        await transaction.commit();

        logger.info({ coordinatorId: id, deletedBy: req.user.id }, 'Coordinator deleted');
        return res.status(200).json({
            success: true,
            message: "Coordinator deleted successfully",
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

export const viewCoordinator = asyncHandler(async (req, res) => {
    const { school, department, program, batch, specialization } = req.body;
    const where = {};
    if (school) where.school = school;
    if (department) where.department = department;
    if (program) where.program = program;
    if (batch) where.batch = batch;
    if (specialization) where.specialization = specialization;

    const coordinators = await Coordinator.findAll({
        where,
        include: [
            { model: User, as: 'user' },
            { model: User, as: 'creator' },
            { model: User, as: 'updater' }
        ]
    });

    res.status(200).json({
        success: true,
        coordinators
    });
});

export const getChangeLogs = asyncHandler(async (req, res) => {
    if (req.user.role === 'chairperson') return getChairpersonLogs(req, res);
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const LIMIT = 200;
    const logs = await ChangeLog.findAll({
      where,
      attributes: ['id', 'userId', 'action', 'entity', 'entityId', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: LIMIT,
      raw: true,
    });
    const userIds = [...new Set(logs.map((log) => log.userId).filter(Boolean))];
    const users = userIds.length ? await User.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'username'] }) : [];
    const names = new Map(users.map((user) => [user.id, user.name || user.username]));
    const roles = new Map(users.map((user) => [user.id, user.role]));
    const visibleLogs = req.user.role === 'admin' ? logs.filter((log) => roles.get(log.userId) === 'coordinator') : logs;
    res.status(200).json({ success: true, count: visibleLogs.length, limit: LIMIT, logs: visibleLogs.map((log) => ({ ...log, actorName: names.get(log.userId) || 'System' })) });
});

export const getNotifications = asyncHandler(async (req, res) => {
    const role = req.user?.role;
    const where = role === 'admin'
        ? {}
        : role === 'chairperson'
            ? {
                [Op.or]: [
                    { toRole: 'chairperson' },
                    { toRole: 'admin' },
                ],
            }
            : {
                toRole: 'coordinator',
            };

    const notifications = await Notification.findAll({
        where,
        attributes: ['id', 'toRole', 'message', 'data', 'read', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'DESC']],
        limit: 50,
    });
    return res.status(200).json({ success: true, count: notifications.length, notifications });
});
