import { Op } from 'sequelize';
import { asyncHandler } from '../lib/asyncHandler.js';
import sequelize from '../lib/db.js';
import Timetable from '../models/timetable.model.js';
import TimetableSection from '../models/timetableSection.model.js';
import TimetableSnapshot from '../models/timetableSnapshot.model.js';
import FacultyAssignment from '../models/facultyAssignment.model.js';
import Subject from '../models/subject.model.js';
import User from '../models/user.model.js';
import { getChairpersonAssignments } from './chairperson.controller.js';
import { getTimetableForStudent, refreshTimetable, refreshAllTimetables, findSectionForClass, fetchSection } from '../services/timetable.service.js';
import { getScrapeLiveStatus, syncFacultyAssignments, getFacultyAuditLogs } from '../services/timetableSync.service.js';
import logger from '../lib/logger.js';

const isAdmin = (u) => u?.role === 'admin';
const isStudent = (u) => u?.role === 'student';

const resolveChairpersonDepts = async (user) => {
    try {
        if (!user || user.role !== 'chairperson') return [];
        const result = await getChairpersonAssignments(user);
        const assignments = result?.assignments || [];
        return [...new Set(assignments.map((a) => a.department).filter(Boolean))];
    } catch (err) {
        logger.warn({ err: err.message }, 'Failed to resolve chairperson department assignments, falling back to empty list');
        return [];
    }
};

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
        studentClass: result.studentClass,
    });
});

/* ──────────────────── GET /timetable/section/:school/:dept/:program/:batch/:spec ─────── */

export const getTimetableForClass = asyncHandler(async (req, res) => {
    const { school, department, program, batch, specialization } = req.params;
    const section = await findSectionForClass(school, department, program, batch, specialization);
    const lookupSchool = section ? section.school : school;
    const lookupDept = section ? section.department : department;
    const lookupProg = section ? section.program : program;
    const lookupBatch = section ? section.batch : batch;
    const lookupSpec = section ? section.specialization : specialization;

    let timetable = await Timetable.findOne({
        where: {
            school: lookupSchool,
            department: lookupDept,
            program: lookupProg,
            batch: lookupBatch,
            specialization: lookupSpec
        }
    });

    const currentSourceMarker = section ? `section=${section.mygbuSectionId}` : null;
    const isStaleMapping = Boolean(section && timetable && timetable.sourceUrl && !timetable.sourceUrl.includes(currentSourceMarker));

    let existingTotalLectures = 0;
    if (timetable?.entries) {
        const rawEntries = typeof timetable.entries === 'string' ? JSON.parse(timetable.entries) : timetable.entries;
        existingTotalLectures = Object.values(rawEntries).reduce((acc, dayObj) => {
            if (!dayObj || typeof dayObj !== 'object') return acc;
            return acc + Object.values(dayObj).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
        }, 0);
    }

    const shouldRefresh = !timetable || timetable.isStale || isStaleMapping || existingTotalLectures === 0 || req.query.force === 'true';

    if (shouldRefresh) {
        const r = await refreshTimetable({
            school: lookupSchool,
            department: lookupDept,
            program: lookupProg,
            batch: lookupBatch,
            specialization: lookupSpec,
            force: isStaleMapping || existingTotalLectures === 0 || req.query.force === 'true',
            silent: true,
        });
        if (!r.ok) {
            if (timetable) {
                return res.json({ success: true, timetable, section, stale: true, error: r.error, totalLectures: existingTotalLectures });
            }
            return res.status(404).json({ success: false, error: r.error, section });
        }
        timetable = r.timetable;
        if (r.totalLectures !== undefined) {
            existingTotalLectures = r.totalLectures;
        }
    }
    res.json({ success: true, timetable, section, totalLectures: existingTotalLectures, isEmpty: existingTotalLectures === 0 });
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
        if (result.timetable) {
            return res.json({ success: true, stale: true, timetable: result.timetable, error: result.error, changed: false });
        }
        return res.status(502).json({ success: false, error: result.error || 'Failed to refresh timetable from university portal' });
    }

    let totalLectures = result.totalLectures;
    if (totalLectures === undefined && result.timetable?.entries) {
        const rawEntries = typeof result.timetable.entries === 'string' ? JSON.parse(result.timetable.entries) : result.timetable.entries;
        totalLectures = Object.values(rawEntries).reduce((acc, dayObj) => {
            if (!dayObj || typeof dayObj !== 'object') return acc;
            return acc + Object.values(dayObj).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
        }, 0);
    }

    res.json({
        success: true,
        changed: result.changed,
        timetable: result.timetable,
        section: result.section,
        totalLectures: totalLectures ?? 0,
        isEmpty: (totalLectures ?? 0) === 0
    });
});

/* ──────────────────── POST /timetable/refresh-all (admin & chairperson) ──────────────────── */

export const refreshAll = asyncHandler(async (req, res) => {
    if (!isAdmin(req.user) && req.user?.role !== 'chairperson') {
        return res.status(403).json({ success: false, error: 'Unauthorized: Admin or Chairperson only' });
    }
    let where = { active: true };
    if (req.user?.role === 'chairperson') {
        const depts = await resolveChairpersonDepts(req.user);
        if (depts.length > 0) {
            where.department = { [Op.in]: depts };
        } else {
            return res.json({ success: true, summary: { total: 0, success: 0, changed: 0 }, results: [] });
        }
    }
    const results = await refreshAllTimetables({ where });
    const success = results.filter((r) => r.ok).length;
    const changed = results.filter((r) => r.changed).length;
    logger.info({ userId: req.user.id, role: req.user.role, success, changed, total: results.length }, 'Timetables refreshed');
    res.json({ success: true, summary: { total: results.length, success, changed }, results });
});

/* ──────────────────── GET /timetable/sections (admin & chairperson) ──────────────────── */

export const listSections = asyncHandler(async (req, res) => {
    if (!isAdmin(req.user) && req.user?.role !== 'chairperson') {
        return res.status(403).json({ success: false, error: 'Unauthorized: Admin or Chairperson only' });
    }
    const where = {};
    if (req.user?.role === 'chairperson') {
        const depts = await resolveChairpersonDepts(req.user);
        if (depts.length > 0) {
            where.department = { [Op.in]: depts };
        } else {
            return res.json({ success: true, sections: [] });
        }
    }
    const sections = await TimetableSection.findAll({
        where,
        order: [['batch', 'DESC'], ['specialization', 'ASC']],
    });
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

/* ──────────────────── GET /timetable/discover (admin & chairperson) ──────────────────── */
/**
 * Auto-discover: list all student 5-tuples that DON'T have a TimetableSection mapping,
 * so the admin knows what to add. Returns suggested section IDs based on simple rules.
 */
export const discoverMissing = asyncHandler(async (req, res) => {
    if (!isAdmin(req.user) && req.user?.role !== 'chairperson') {
        return res.status(403).json({ success: false, error: 'Unauthorized: Admin or Chairperson only' });
    }
    let deptFilter = '';
    const replacements = {};
    if (req.user?.role === 'chairperson') {
        const depts = await resolveChairpersonDepts(req.user);
        if (depts.length > 0) {
            deptFilter = 'AND department IN (:depts)';
            replacements.depts = depts;
        } else {
            return res.json({ success: true, count: 0, missing: [] });
        }
    }
    // Get all distinct student classes
    const [classes] = await sequelize.query(`
        SELECT DISTINCT school, department, program, batch, specialization,
               COUNT(*) as studentCount
        FROM students
        WHERE rollNo IS NOT NULL AND rollNo != '' ${deptFilter}
        GROUP BY school, department, program, batch, specialization
        ORDER BY batch DESC, specialization
    `, { replacements });
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

/* ──────────────────── GET /timetable/scrape-live-status (admin) ──────────────────── */
export const getScrapeStatusController = asyncHandler(async (req, res) => {
    const status = await getScrapeLiveStatus();
    res.json({ success: true, ...status });
});

/* ──────────────────── POST /timetable/sync-faculty (admin) ──────────────────── */
export const syncFacultyController = asyncHandler(async (req, res) => {
    const { school = 'SOICT', department = 'CSE', dryRun = false } = req.body || {};
    const result = await syncFacultyAssignments({
        school,
        department,
        dryRun,
        triggeredById: req.user?.id,
    });
    res.json(result);
});

/* ──────────────────── GET /timetable/faculty-audit-log (admin) ──────────────────── */
export const getFacultyAuditLogController = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = await getFacultyAuditLogs({ limit });
    res.json({ success: true, logs });
});

/* ──────────────────── POST /timetable/preview-section (dry run test) ──────────────────── */
export const previewSectionController = asyncHandler(async (req, res) => {
    const { mygbuSchool = 'SOICT', mygbuDepartment = 'CSE', mygbuSectionId } = req.body || {};
    if (!mygbuSectionId || !String(mygbuSectionId).trim()) {
        return res.status(400).json({ success: false, error: 'mygbuSectionId is required' });
    }
    const cleanSectionId = String(mygbuSectionId).trim();
    const result = await fetchSection({
        mygbuSchool,
        mygbuDepartment,
        mygbuSectionId: cleanSectionId,
    }, { force: true });

    if (!result.ok) {
        return res.status(400).json({ success: false, error: result.error || 'Failed to fetch section from mygbu.in' });
    }

    res.json({
        success: true,
        isDryRun: true,
        sectionId: cleanSectionId,
        mygbuSectionId: cleanSectionId,
        label: result.label,
        entries: result.entries,
        subjects: result.subjects || [],
        totalLectures: result.totalLectures,
        isEmpty: result.isEmpty,
        sourceUrl: result.sourceUrl,
        message: `Dry Run Preview: Successfully parsed ${result.totalLectures} lectures for Section ${cleanSectionId}. No mapping was saved or data manipulated.`,
    });
});

/* ──────────────────── TIMETABLE SNAPSHOT ENGINE ──────────────────── */

/**
 * POST /timetable/snapshots/capture
 * Captures historical snapshot of timetables and active faculty assignments
 * at semester milestones (start and end).
 */
export const captureTimetableSnapshot = asyncHandler(async (req, res) => {
    if (!isAdmin(req.user) && req.user?.role !== 'chairperson') {
        return res.status(403).json({ success: false, error: 'Unauthorized: Admin or Chairperson only' });
    }

    let {
        school = 'SOICT',
        department = 'CSE',
        program,
        batch,
        specialization,
        academicYear = '2025-2026',
        semesterTerm = 'odd',
        snapshotType = 'manual',
        remarks = '',
    } = req.body || {};

    if (req.user?.role === 'chairperson') {
        const depts = await resolveChairpersonDepts(req.user);
        if (depts.length === 0) {
            return res.status(403).json({ success: false, message: 'No department assigned to this chairperson' });
        }
        if (!department || !depts.includes(department)) {
            department = depts[0];
        }
    }

    const whereClause = { school, department };
    if (program) whereClause.program = program;
    if (batch) whereClause.batch = batch;
    if (specialization) whereClause.specialization = specialization;

    const timetables = await Timetable.findAll({ where: whereClause });
    if (!timetables || timetables.length === 0) {
        return res.status(404).json({ success: false, message: 'No timetables found matching criteria' });
    }

    const facultyAssignments = await FacultyAssignment.findAll({
        where: { school, department },
        include: [
            { model: User, as: 'faculty', attributes: ['id', 'name', 'email'] },
            { model: Subject, as: 'subject', attributes: ['id', 'code', 'name', 'credits'] },
        ],
    }).catch(() => []);

    const mappedAssignments = facultyAssignments.map((fa) => {
        const plain = fa.toJSON ? fa.toJSON() : fa;
        return {
            id: plain.id,
            facultyId: plain.facultyId,
            facultyName: plain.faculty?.name || plain.faculty?.email || plain.facultyName || '—',
            teacherRole: plain.teacherRole,
            subjectId: plain.subjectId,
            subjectCode: plain.subject?.code || plain.subjectCode || '—',
            subjectName: plain.subject?.name || plain.subjectName || '—',
            credits: plain.subject?.credits || plain.credits || '—',
            school: plain.school,
            department: plain.department,
            program: plain.program,
            batch: plain.batch,
            specialization: plain.specialization,
            semester: plain.semester,
            academicYear: plain.academicYear,
        };
    });

    const createdSnapshots = [];
    for (const tt of timetables) {
        const matchingAssignments = mappedAssignments.filter(
            (fa) => (!fa.program || fa.program === tt.program) && (!fa.batch || fa.batch === tt.batch)
        );

        const snapshot = await TimetableSnapshot.create({
            academicYear: academicYear || tt.academicYear || '2025-2026',
            semesterTerm: semesterTerm || (tt.semester?.toLowerCase().includes('even') ? 'even' : 'odd'),
            snapshotType,
            school: tt.school,
            department: tt.department,
            program: tt.program,
            batch: tt.batch,
            specialization: tt.specialization || 'None',
            timetableData: {
                entries: tt.entries || {},
                subjects: tt.subjects || [],
            },
            facultyAssignments: matchingAssignments,
            capturedAt: new Date(),
            capturedBy: req.user?.email || req.user?.username || 'system',
            remarks: remarks || `Snapshot captured for ${tt.program} ${tt.batch} (${snapshotType})`,
        });
        createdSnapshots.push(snapshot);
    }

    logger.info(
        { count: createdSnapshots.length, school, department, snapshotType, user: req.user?.username },
        'Timetable snapshot(s) captured successfully'
    );

    res.json({
        success: true,
        message: `Successfully captured ${createdSnapshots.length} timetable snapshot(s)`,
        count: createdSnapshots.length,
        snapshots: createdSnapshots,
    });
});

/**
 * GET /timetable/snapshots
 * Query historical snapshots with academic year, term, and class filters.
 */
export const getTimetableSnapshots = asyncHandler(async (req, res) => {
    const { academicYear, semesterTerm, snapshotType, school, department, program, batch } = req.query;
    const where = {};
    if (academicYear) where.academicYear = academicYear;
    if (semesterTerm) where.semesterTerm = semesterTerm;
    if (snapshotType) where.snapshotType = snapshotType;
    if (school) where.school = school;
    if (department) where.department = department;
    if (program) where.program = program;
    if (batch) where.batch = batch;

    if (req.user?.role === 'chairperson') {
        const depts = await resolveChairpersonDepts(req.user);
        if (depts.length > 0) {
            where.department = { [Op.in]: depts };
        } else {
            return res.json({ success: true, count: 0, snapshots: [] });
        }
    }

    const snapshots = await TimetableSnapshot.findAll({
        where,
        attributes: [
            'id',
            'academicYear',
            'semesterTerm',
            'snapshotType',
            'school',
            'department',
            'program',
            'batch',
            'specialization',
            'capturedAt',
            'capturedBy',
            'remarks',
            'createdAt',
        ],
        order: [['capturedAt', 'DESC']],
    });

    res.json({ success: true, count: snapshots.length, snapshots });
});

/**
 * GET /timetable/snapshots/:id
 * Fetch complete matrix, subjects list, credits, and faculty allocations for historical knowledge inspection.
 */
export const getSnapshotDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const snapshot = await TimetableSnapshot.findByPk(id);
    if (!snapshot) {
        return res.status(404).json({ success: false, error: 'Snapshot not found' });
    }

    let entries = {};
    let subjects = [];

    if (snapshot.timetableData) {
        if (snapshot.timetableData.entries && typeof snapshot.timetableData.entries === 'object') {
            entries = snapshot.timetableData.entries;
            subjects = Array.isArray(snapshot.timetableData.subjects) ? snapshot.timetableData.subjects : [];
        } else {
            // Backward compatibility: timetableData directly holds entries
            entries = snapshot.timetableData;
        }
    }

    // If subjects was not stored in timetableData, recover from Timetable or entries matrix
    if (subjects.length === 0) {
        const tt = await Timetable.findOne({
            where: {
                school: snapshot.school,
                department: snapshot.department,
                program: snapshot.program,
                batch: snapshot.batch,
                specialization: snapshot.specialization,
            },
        });
        if (tt && Array.isArray(tt.subjects) && tt.subjects.length > 0) {
            subjects = tt.subjects;
        } else {
            // Extract unique subjects from entries matrix
            const seenCodes = new Set();
            for (const day of Object.keys(entries || {})) {
                for (const slot of Object.keys(entries[day] || {})) {
                    const slotEntries = Array.isArray(entries[day][slot]) ? entries[day][slot] : [];
                    for (const entry of slotEntries) {
                        if (entry.code && !seenCodes.has(entry.code)) {
                            seenCodes.add(entry.code);
                            const fa = (snapshot.facultyAssignments || []).find(
                                (a) => a.subjectCode === entry.code
                            );
                            subjects.push({
                                code: entry.code,
                                name: fa?.subjectName || entry.code,
                                credits: fa?.credits || '—',
                                facultyABR: entry.faculty || '',
                                facultyName: fa?.facultyName || entry.faculty || '',
                                load: '—',
                            });
                        }
                    }
                }
            }
        }
    }

    // Enrich missing subject names and credits from Subject table
    if (subjects.length > 0) {
        const codes = subjects.map((s) => s.code).filter(Boolean);
        if (codes.length > 0) {
            const dbSubjects = await Subject.findAll({
                where: { code: { [Op.in]: codes } },
                attributes: ['code', 'name', 'credits'],
            }).catch(() => []);
            const dbMap = new Map(dbSubjects.map((s) => [s.code, s]));
            subjects = subjects.map((s) => {
                const match = dbMap.get(s.code);
                return {
                    ...s,
                    name: (s.name && s.name !== s.code) ? s.name : (match?.name || s.name || s.code),
                    credits: s.credits && s.credits !== '—' && s.credits !== '' ? s.credits : (match?.credits ? String(match.credits) : '—'),
                };
            });
        }
    }

    res.json({
        success: true,
        snapshot: {
            ...snapshot.toJSON(),
            entries,
            subjects,
        },
    });
});
