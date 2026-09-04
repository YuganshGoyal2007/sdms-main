import { Op } from 'sequelize';
import { asyncHandler } from '../lib/asyncHandler.js';
import sequelize from '../lib/db.js';
import Timetable from '../models/timetable.model.js';
import TimetableSection from '../models/timetableSection.model.js';
import { getTimetableForStudent, refreshTimetable, refreshAllTimetables } from '../services/timetable.service.js';
import logger from '../lib/logger.js';

const isAdmin = (u) => u?.role === 'admin';
const isStudent = (u) => u?.role === 'student';

/* ──────────────────── GET /timetable/me (student) ──────────────────── */

export const getMyTimetable = asyncHandler(async (req, res) => {
    const result = await getTimetableForStudent(req.user.id);
    if (!result.ok) {
        return res.status(404).json(result);
    }
    res.json({
        success: true,
        timetable: {
            id: result.timetable.id,
            school: result.timetable.school,
            department: result.timetable.department,
            program: result.timetable.program,
            batch: result.timetable.batch,
            specialization: result.timetable.specialization,
            entries: result.timetable.entries,
            subjects: result.timetable.subjects || [],
            semester: result.timetable.semester,
            academicYear: result.timetable.academicYear,
            sourceUrl: result.timetable.sourceUrl,
            lastFetchedAt: result.timetable.lastFetchedAt,
            lastChangedAt: result.timetable.lastChangedAt,
            fetchStatus: result.timetable.fetchStatus,
            isStale: result.timetable.isStale,
        },
        section: {
            label: result.section.label,
            mygbuSchool: result.section.mygbuSchool,
            mygbuDepartment: result.section.mygbuDepartment,
            mygbuSectionId: result.section.mygbuSectionId,
        },
    });
});

/* ──────────────────── GET /timetable/section/:school/:dept/:program/:batch/:spec ─────── */

export const getTimetableForClass = asyncHandler(async (req, res) => {
    const { school, department, program, batch, specialization } = req.params;
    let timetable = await Timetable.findOne({ where: { school, department, program, batch, specialization } });
    if (!timetable || timetable.isStale) {
        const r = await refreshTimetable({ school, department, program, batch, specialization, silent: true });
        if (!r.ok) {
            if (timetable) {
                return res.json({ success: true, timetable, stale: true, error: r.error });
            }
            return res.status(404).json({ success: false, error: r.error });
        }
        timetable = r.timetable;
    }
    res.json({ success: true, timetable });
});

/* ──────────────────── POST /timetable/refresh (admin or student) ──────────────────── */

export const refreshMyTimetable = asyncHandler(async (req, res) => {
    let result;
    if (isStudent(req.user)) {
        result = await getTimetableForStudent(req.user.id);
        if (!result.ok) return res.status(404).json(result);
        result = await refreshTimetable({
            school: result.studentClass.school,
            department: result.studentClass.department,
            program: result.studentClass.program,
            batch: result.studentClass.batch,
            specialization: result.studentClass.specialization,
            force: true,
        });
    } else {
        // Admin/coordinator/ chairperson can refresh by query
        const { school, department, program, batch, specialization } = req.query;
        if (!school || !department || !program || !batch || !specialization) {
            return res.status(400).json({ success: false, error: 'Missing class query params' });
        }
        result = await refreshTimetable({ school, department, program, batch, specialization, force: true });
    }
    if (!result.ok) {
        return res.status(500).json(result);
    }
    res.json({ success: true, changed: result.changed, timetable: result.timetable });
});

/* ──────────────────── POST /timetable/refresh-all (admin only) ──────────────────── */

export const refreshAll = asyncHandler(async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, error: 'Admin only' });
    }
    const results = await refreshAllTimetables();
    const success = results.filter((r) => r.ok).length;
    const changed = results.filter((r) => r.changed).length;
    logger.info({ adminId: req.user.id, success, changed, total: results.length }, 'All timetables refreshed');
    res.json({ success: true, summary: { total: results.length, success, changed }, results });
});

/* ──────────────────── GET /timetable/sections (admin) ──────────────────── */

export const listSections = asyncHandler(async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, error: 'Admin only' });
    }
    const sections = await TimetableSection.findAll({ order: [['batch', 'DESC'], ['specialization', 'ASC']] });
    res.json({ success: true, sections });
});

/* ──────────────────── POST /timetable/sections (admin) ──────────────────── */

export const createSection = asyncHandler(async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, error: 'Admin only' });
    }
    const { school, department, program, batch, specialization, mygbuSchool, mygbuDepartment, mygbuSectionId, label, academicYear, semester } = req.body;
    if (!school || !department || !program || !batch || !specialization || !mygbuSectionId) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const section = await TimetableSection.create({
        school, department, program, batch, specialization,
        mygbuSchool: mygbuSchool || 'SOICT',
        mygbuDepartment: mygbuDepartment || 'CSE',
        mygbuSectionId,
        label, academicYear, semester,
        active: true,
    });
    res.status(201).json({ success: true, section });
});

/* ──────────────────── POST /timetable/sections/bulk (admin) ──────────────────── */
/**
 * Bulk-create section mappings. Accepts { sections: [...] } and skips rows
 * that conflict with existing UNIQUE constraints (no error, just reports skipped).
 */
export const bulkCreateSections = asyncHandler(async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, error: 'Admin only' });
    }
    const sections = Array.isArray(req.body?.sections) ? req.body.sections : [];
    if (!sections.length) {
        return res.status(400).json({ success: false, error: 'sections array is required' });
    }
    let created = 0;
    let skipped = 0;
    const errors = [];
    for (const s of sections) {
        const { school, department, program, batch, specialization, mygbuSectionId } = s;
        if (!school || !department || !program || !batch || !specialization || !mygbuSectionId) {
            errors.push({ ...s, error: 'Missing required fields' });
            skipped += 1;
            continue;
        }
        try {
            const [row, wasCreated] = await TimetableSection.findOrCreate({
                where: { school, department, program, batch, specialization, academicYear: s.academicYear || '2026-27' },
                defaults: {
                    mygbuSchool: s.mygbuSchool || 'SOICT',
                    mygbuDepartment: s.mygbuDepartment || 'CSE',
                    mygbuSectionId,
                    label: s.label || null,
                    semester: s.semester || 'Odd',
                    active: true,
                },
            });
            if (wasCreated) created += 1; else skipped += 1;
        } catch (e) {
            errors.push({ ...s, error: e.message });
            skipped += 1;
        }
    }
    res.json({ success: true, created, skipped, errors });
});

/* ──────────────────── GET /timetable/discover (admin) ──────────────────── */
/**
 * Auto-discover: list all student 5-tuples that DON'T have a TimetableSection mapping,
 * so the admin knows what to add. Returns suggested section IDs based on simple rules.
 */
export const discoverMissing = asyncHandler(async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, error: 'Admin only' });
    }
    // Get all distinct student classes
    const [classes] = await sequelize.query(`
        SELECT DISTINCT school, department, program, batch, specialization,
               COUNT(*) as studentCount
        FROM Students
        WHERE userId IS NOT NULL
        GROUP BY school, department, program, batch, specialization
        ORDER BY batch DESC, specialization
    `);
    // Find which are missing mappings
    const missing = [];
    for (const cls of classes) {
        const section = await TimetableSection.findOne({
            where: {
                school: cls.school,
                department: cls.department,
                program: cls.program,
                batch: cls.batch,
                specialization: cls.specialization,
                active: true,
            },
        });
        if (!section) {
            missing.push({
                ...cls,
                suggested: suggestSectionId(cls),
            });
        }
    }
    res.json({ success: true, total: classes.length, missingCount: missing.length, missing });
});

/* Simple heuristic for suggesting a section id from the 5-tuple */
const suggestSectionId = (cls) => {
    // Best-effort guess: BCS-II A/B/C/D depending on year
    // Without authoritative mapping, we just return null and admin must pick
    return null;
};

/* ──────────────────── DELETE /timetable/sections/:id (admin) ──────────────────── */

export const deleteSection = asyncHandler(async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, error: 'Admin only' });
    }
    const section = await TimetableSection.findByPk(req.params.id);
    if (!section) return res.status(404).json({ success: false, error: 'Not found' });
    await section.destroy();
    res.json({ success: true });
});

/* ──────────────────── GET /timetable/changes-since (student) ──────────────────── */
/**
 * Used by the bell-icon polling: returns whether the student's timetable was
 * updated since the last time they saw it (lastSeenAt query param, ISO date).
 */
export const hasChangesSince = asyncHandler(async (req, res) => {
    const lastSeenAt = req.query.lastSeenAt ? new Date(req.query.lastSeenAt) : new Date(0);
    if (Number.isNaN(lastSeenAt.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid lastSeenAt' });
    }
    const result = await getTimetableForStudent(req.user.id);
    if (!result.ok) {
        return res.json({ success: true, changed: false, error: result.error });
    }
    const changed = result.timetable.lastChangedAt
        ? new Date(result.timetable.lastChangedAt).getTime() > lastSeenAt.getTime()
        : false;
    res.json({
        success: true,
        changed,
        lastChangedAt: result.timetable.lastChangedAt,
        lastFetchedAt: result.timetable.lastFetchedAt,
    });
});
