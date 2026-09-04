/**
 * Cross-role messaging system.
 *
 * Semantics:
 *   - Personal message: one Notification row with toUserId = target user.id, toRole = that user's role
 *   - Broadcast to role: one Notification row with toUserId = null, toRole = 'admin'|'coordinator'|'chairperson'
 *   - Class-scoped (chairperson → coordinators of a class): one row per coordinator with classKey set
 *
 * Authorization matrix (who can send to whom):
 *   admin      → admin, coordinator (single/bulk), chairperson (single/bulk), broadcast to role
 *   chairperson→ admin, coordinator (single of assigned class), broadcast to all assigned coordinators
 *   coordinator→ admin, chairperson (single of assigned class), students of assigned class
 *   student    → coordinator(s) of their assigned class
 *
 * Read path:
 *   - Each user sees: messages where toUserId = me.id  OR  toRole = my.role  OR  toRole = 'admin' (if I'm admin)
 *   - Excludes broadcast to roles I'm not in
 */
import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../lib/db.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import Coordinator from '../models/coordinator.model.js';
import Chairperson from '../models/chairperson.model.js';
import ChairpersonClass from '../models/chairpersonClass.model.js';
import Student from '../models/student.model.js';
import { getChairpersonAssignments } from './chairperson.controller.js';
import { getCoordinatorAssignedClasses } from './student.controller.js';
import logger from '../lib/logger.js';

const isAdmin = (u) => u?.role === 'admin';
const isCoord = (u) => u?.role === 'coordinator';
const isChair = (u) => u?.role === 'chairperson';
const isStudent = (u) => u?.role === 'student';

/**
 * Resolve target user ids given the recipient spec.
 * Returns { userIds: number[], role: string|null, scope: 'direct'|'broadcast'|'class', classKey?: string }
 */
const resolveRecipients = async (req) => {
    const { recipientType, recipientIds, recipientRole, classKey } = req.body;
    const sender = req.user;

    // Personal: recipientIds = array of user.id
    if (recipientType === 'users' && Array.isArray(recipientIds) && recipientIds.length > 0) {
        const targetUsers = await User.findAll({
            where: { id: recipientIds },
            attributes: ['id', 'role'],
        });
        if (!targetUsers.length) return null;
        return {
            userIds: targetUsers.map((u) => u.id),
            role: targetUsers[0].role,
            scope: 'direct',
        };
    }

    // Broadcast to a whole role
    if (recipientType === 'role' && recipientRole) {
        if (!['admin', 'coordinator', 'chairperson'].includes(recipientRole)) return null;
        return { userIds: [], role: recipientRole, scope: 'broadcast' };
    }

    // Class-scoped: send to all coordinators of a specific class
    if (recipientType === 'class' && classKey) {
        const [school, department, program, batch, specialization] = classKey.split('|');
        if (!school || !department || !program || !batch) return null;
        const coordinators = await Coordinator.findAll({
            where: { school, department, program, batch, specialization },
            attributes: ['userId'],
        });
        const userIds = coordinators.map((c) => c.userId).filter(Boolean);
        return { userIds, role: 'coordinator', scope: 'class', classKey };
    }

    // Students of a class
    if (recipientType === 'class-students' && classKey) {
        const [school, department, program, batch, specialization] = classKey.split('|');
        if (!school || !department || !program || !batch) return null;
        const students = await Student.findAll({
            where: { school, department, program, batch, specialization },
            attributes: ['userId', 'rollNo'],
        });
        return { userIds: students.map((s) => s.userId).filter(Boolean), role: 'student', scope: 'class', classKey };
    }

    return null;
};

/**
 * Authorization check for sender.
 */
const authorizeSend = async (sender, recipient) => {
    if (!sender || !recipient) return false;
    const { role: rRole, userIds, scope } = recipient;

    if (isAdmin(sender)) {
        // admin can send anywhere
        return true;
    }

    if (isChair(sender)) {
        // chairperson can send to admin OR to coordinators of assigned classes
        if (rRole === 'admin') return true;
        if (rRole === 'coordinator' && userIds.length > 0) {
            const { assignments } = await getChairpersonAssignments(sender);
            const allowedUserIds = new Set();
            for (const a of assignments) {
                const coords = await Coordinator.findAll({
                    where: {
                        school: a.school, department: a.department, program: a.program,
                        batch: a.batch, specialization: a.specialization,
                    },
                    attributes: ['userId'],
                });
                coords.forEach((c) => c.userId && allowedUserIds.add(c.userId));
            }
            return userIds.every((id) => allowedUserIds.has(id));
        }
        if (rRole === 'coordinator' && scope === 'broadcast') {
            const { assignments } = await getChairpersonAssignments(sender);
            return assignments.length > 0;
        }
        return false;
    }

    if (isCoord(sender)) {
        // coordinator can send to admin, chairperson (of assigned class), or students of assigned class
        if (rRole === 'admin') return true;
        if (rRole === 'student' && scope === 'class') return true;
        if (rRole === 'chairperson' && userIds.length > 0) {
            const assignments = await getCoordinatorAssignedClasses(sender);
            if (!assignments.length) return false;
            const chairs = await ChairpersonClass.findAll({
                where: {
                    [Op.or]: assignments.map((a) => ({
                        school: a.school, department: a.department, program: a.program,
                        batch: a.batch, specialization: a.specialization,
                    })),
                },
                attributes: ['chairpersonId'],
            });
            const chairIds = new Set();
            for (const cc of chairs) {
                const ch = await Chairperson.findByPk(cc.chairpersonId, { attributes: ['userId'] });
                if (ch?.userId) chairIds.add(ch.userId);
            }
            return userIds.every((id) => chairIds.has(id));
        }
        if (rRole === 'chairperson' && scope === 'broadcast') {
            const assignments = await getCoordinatorAssignedClasses(sender);
            return assignments.length > 0;
        }
        return false;
    }

    if (isStudent(sender)) {
        // student can send to coordinators of their assigned class
        if (rRole === 'coordinator' && scope === 'class') {
            if (!userIds.length) return true; // empty class, will be rejected
            // Verify the student is actually in that class
            const myStudent = await Student.findOne({ where: { userId: sender.id } });
            if (!myStudent) return false;
            const [school, department, program, batch, specialization] = (recipient.classKey || '').split('|');
            return (
                myStudent.school === school &&
                myStudent.department === department &&
                myStudent.program === program &&
                myStudent.batch === batch &&
                (myStudent.specialization || '') === (specialization || '')
            );
        }
        return false;
    }

    return false;
};

/* ──────────────────── POST /messages ──────────────────── */

export const sendMessage = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content?.trim()) {
        return res.status(400).json({ success: false, message: 'Message content is required.' });
    }
    if (isStudent(req.user) && content.length > 500) {
        return res.status(400).json({ success: false, message: 'Message too long (max 500 chars).' });
    }

    const recipient = await resolveRecipients(req);
    if (!recipient) {
        return res.status(400).json({ success: false, message: 'Invalid or empty recipient list.' });
    }

    const allowed = await authorizeSend(req.user, recipient);
    if (!allowed) {
        return res.status(403).json({ success: false, message: 'You are not allowed to message these recipients.' });
    }

    const senderMeta = {
        fromUserId: req.user.id,
        fromRole: req.user.role,
        fromName: req.user.name || req.user.username || `User #${req.user.id}`,
    };

    const baseData = {
        ...senderMeta,
        classKey: recipient.classKey || null,
        scope: recipient.scope,
    };

    const rowsToCreate = [];

    if (recipient.scope === 'broadcast') {
        rowsToCreate.push({
            toUserId: null,
            toRole: recipient.role,
            message: content.trim(),
            data: baseData,
            scope: 'broadcast',
        });
    } else if (recipient.scope === 'class' || recipient.scope === 'direct') {
        for (const uid of recipient.userIds) {
            const targetUser = await User.findByPk(uid, { attributes: ['role'] });
            if (!targetUser) continue;
            rowsToCreate.push({
                toUserId: uid,
                toRole: targetUser.role,
                message: content.trim(),
                data: baseData,
                scope: recipient.scope,
                classKey: recipient.classKey || null,
            });
        }
    }

    if (!rowsToCreate.length) {
        return res.status(400).json({ success: false, message: 'No valid recipients resolved.' });
    }

    const created = await Notification.bulkCreate(rowsToCreate);
    logger.info(
        { fromUserId: req.user.id, fromRole: req.user.role, count: created.length, scope: recipient.scope, role: recipient.role },
        'Message sent'
    );

    return res.status(201).json({
        success: true,
        message: `Message sent to ${created.length} recipient(s).`,
        count: created.length,
    });
});

/* ──────────────────── GET /messages/inbox ──────────────────── */

export const getInbox = asyncHandler(async (req, res) => {
    const me = req.user;
    const where = {
        [Op.or]: [
            { toUserId: me.id },
        ],
    };

    // For non-admin, also include role-broadcasts to my role
    if (!isAdmin(me)) {
        where[Op.or].push({ toUserId: null, toRole: me.role });
    }

    const messages = await Notification.findAll({
        where,
        attributes: ['id', 'toUserId', 'toRole', 'message', 'read', 'createdAt', 'data', 'scope', 'classKey'],
        order: [['createdAt', 'DESC']],
        limit: 100,
        raw: true,
    });

    return res.status(200).json({ success: true, messages });
});

/* ──────────────────── GET /messages/sent ──────────────────── */

export const getSent = asyncHandler(async (req, res) => {
    const messages = await Notification.findAll({
        where: literal(`JSON_EXTRACT(data, '$.fromUserId') = ${sequelize.escape(req.user.id)}`),
        attributes: ['id', 'toUserId', 'toRole', 'message', 'createdAt', 'data', 'scope'],
        order: [['createdAt', 'DESC']],
        limit: 100,
        raw: true,
    });

    return res.status(200).json({ success: true, messages });
});

/* ──────────────────── PATCH /messages/:id/read ──────────────────── */

export const markRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const note = await Notification.findByPk(id);
    if (!note) {
        return res.status(404).json({ success: false, message: 'Message not found.' });
    }
    if (note.toUserId !== req.user.id && note.toRole !== req.user.role) {
        return res.status(403).json({ success: false, message: 'Not your message.' });
    }
    note.read = true;
    await note.save();
    return res.status(200).json({ success: true });
});

/* ──────────────────── GET /messages/unread-count ──────────────────── */

export const unreadCount = asyncHandler(async (req, res) => {
    const me = req.user;
    const where = {
        read: false,
        [Op.or]: [{ toUserId: me.id }],
    };
    if (!isAdmin(me)) {
        where[Op.or].push({ toUserId: null, toRole: me.role });
    }
    const count = await Notification.count({ where });
    return res.status(200).json({ success: true, count });
});

/* ──────────────────── helpers: build same scope as getInbox ──────────────────── */

const buildInboxWhere = (me) => {
    const where = {
        [Op.or]: [{ toUserId: me.id }],
    };
    if (!isAdmin(me)) {
        where[Op.or].push({ toUserId: null, toRole: me.role });
    }
    return where;
};

/* ──────────────────── PATCH /messages/mark-all-read ──────────────────── */

export const markAllRead = asyncHandler(async (req, res) => {
    const where = buildInboxWhere(req.user);
    const [count] = await Notification.update(
        { read: true },
        { where }
    );
    return res.status(200).json({ success: true, count });
});

/* ──────────────────── DELETE /messages/:id ──────────────────── */

export const deleteMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const note = await Notification.findByPk(id);
    if (!note) {
        return res.status(404).json({ success: false, message: 'Message not found.' });
    }
    // Can only delete messages addressed to me (inbox) or sent by me (sent)
    const isInbox = note.toUserId === req.user.id || (!note.toUserId && note.toRole === req.user.role);
    const isSent = note.data?.fromUserId === req.user.id;
    if (!isInbox && !isSent) {
        return res.status(403).json({ success: false, message: 'Not your message.' });
    }
    await note.destroy();
    return res.status(200).json({ success: true });
});

/* ──────────────────── DELETE /messages/inbox (clear) ──────────────────── */
/**
 * "Clear inbox" — delete every message currently in my inbox.
 * Optionally accept { keepUnread: boolean } (default true) to keep unread.
 */
export const clearInbox = asyncHandler(async (req, res) => {
    const where = buildInboxWhere(req.user);
    if (req.body?.keepUnread !== false) {
        where.read = true; // default: only delete already-read messages
    }
    const count = await Notification.destroy({ where });
    logger.info({ userId: req.user.id, role: req.user.role, deleted: count, keepUnread: req.body?.keepUnread !== false }, 'Inbox cleared');
    return res.status(200).json({ success: true, count });
});

/* ──────────────────── DELETE /messages/sent (clear) ──────────────────── */

export const clearSent = asyncHandler(async (req, res) => {
    const where = literal(`JSON_EXTRACT(data, '$.fromUserId') = ${sequelize.escape(req.user.id)}`);
    const count = await Notification.destroy({ where });
    logger.info({ userId: req.user.id, deleted: count }, 'Sent cleared');
    return res.status(200).json({ success: true, count });
});

/* ──────────────────── GET /messages/recipients ──────────────────── */
/**
 * Returns a list of people I can message, grouped by type.
 */
export const getRecipients = asyncHandler(async (req, res) => {
    const me = req.user;
    const result = {
        admins: [],
        chairpersons: [],
        coordinators: [],
        students: [],
        classes: [],
    };

    if (isAdmin(me)) {
        const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id', 'name', 'username'] });
        result.admins = admins.filter((a) => a.id !== me.id);
        const chairs = await Chairperson.findAll({ attributes: ['id', 'userId', 'name', 'email'] });
        result.chairpersons = chairs;
        const coords = await Coordinator.findAll({
            attributes: ['id', 'userId', 'name', 'email', 'school', 'department', 'program', 'batch', 'specialization'],
        });
        result.coordinators = coords;
    } else if (isChair(me)) {
        // chairperson can message: admin + their assigned coordinators (per class)
        const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id', 'name', 'username'] });
        result.admins = admins;

        const { assignments } = await getChairpersonAssignments(me);
        const coordMap = new Map();
        for (const a of assignments) {
            const coords = await Coordinator.findAll({
                where: {
                    school: a.school, department: a.department, program: a.program,
                    batch: a.batch, specialization: a.specialization,
                },
                attributes: ['id', 'userId', 'name', 'email'],
            });
            coords.forEach((c) => {
                if (!coordMap.has(c.id)) {
                    coordMap.set(c.id, { ...c.toJSON(), classKey: `${a.school}|${a.department}|${a.program}|${a.batch}|${a.specialization}` });
                }
            });
        }
        result.coordinators = Array.from(coordMap.values());
        result.classes = assignments.map((a) => ({
            classKey: `${a.school}|${a.department}|${a.program}|${a.batch}|${a.specialization}`,
            label: `${a.program} ${a.batch} — ${a.specialization}`,
            school: a.school,
            department: a.department,
            program: a.program,
            batch: a.batch,
            specialization: a.specialization,
        }));
    } else if (isCoord(me)) {
        // coordinator can message: admin + chairperson of assigned class
        const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id', 'name', 'username'] });
        result.admins = admins;

        const assignments = await getCoordinatorAssignedClasses(me);
        const chairMap = new Map();
        for (const a of assignments) {
            const cls = await ChairpersonClass.findAll({
                where: {
                    school: a.school, department: a.department, program: a.program,
                    batch: a.batch, specialization: a.specialization,
                },
                attributes: ['chairpersonId'],
            });
            for (const cc of cls) {
                if (!chairMap.has(cc.chairpersonId)) {
                    const chair = await Chairperson.findByPk(cc.chairpersonId, {
                        attributes: ['id', 'userId', 'name', 'email'],
                    });
                    if (chair) chairMap.set(cc.chairpersonId, chair);
                }
            }
            // also students of this class
            const students = await Student.findAll({
                where: {
                    school: a.school, department: a.department, program: a.program,
                    batch: a.batch, specialization: a.specialization,
                },
                attributes: ['id', 'rollNo', 'fullName', 'email', 'userId'],
                limit: 200,
            });
            students.forEach((s) => {
                result.students.push({
                    ...s.toJSON(),
                    classKey: `${a.school}|${a.department}|${a.program}|${a.batch}|${a.specialization}`,
                });
            });
        }
        result.chairpersons = Array.from(chairMap.values());
        result.classes = assignments.map((a) => ({
            classKey: `${a.school}|${a.department}|${a.program}|${a.batch}|${a.specialization}`,
            label: `${a.program} ${a.batch} — ${a.specialization}`,
            school: a.school,
            department: a.department,
            program: a.program,
            batch: a.batch,
            specialization: a.specialization,
        }));
    } else if (isStudent(me)) {
        // student can only message their coordinators
        const myStudent = await Student.findOne({ where: { userId: me.id } });
        if (myStudent) {
            const coords = await Coordinator.findAll({
                where: {
                    school: myStudent.school, department: myStudent.department,
                    program: myStudent.program, batch: myStudent.batch,
                    specialization: myStudent.specialization,
                },
                attributes: ['id', 'userId', 'name', 'email'],
            });
            result.coordinators = coords;
        }
    }

    return res.status(200).json({ success: true, recipients: result });
});
