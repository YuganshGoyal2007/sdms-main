/**
 * Fetches timetables from https://mygbu.in/schd/ and caches them in the Timetables table.
 *
 * The mygbu.in page structure (per section):
 *   <h3>B.Tech (CS) (BCS-III-A)</h3>  ← class label
 *   <table>
 *     <thead>
 *       <tr><th>Day</th><th>I</th><th>II</th>...<th>XI</th></tr>  (each <th> has a nested slot+time)
 *     </thead>
 *     <tbody>
 *       <tr><td>Mon</td><td>CS385(RBS)[IP102] G-1<br>CS381(SP)[IP107] G-2</td>...
 *
 * So we parse the table: header columns are slot ids + times, body rows are days with one or more
 * class entries per cell.
 */
import crypto from 'crypto';
import { Op } from 'sequelize';
import Timetable from '../models/timetable.model.js';
import TimetableSection from '../models/timetableSection.model.js';
import Student from '../models/student.model.js';
import logger from '../lib/logger.js';

const MYGBU_BASE = 'https://mygbu.in/schd/index.php';
const FETCH_TIMEOUT_MS = 15000;
const USER_AGENT = 'GBU-SDMS-TimetableBot/1.0 (+https://sdms.gbu.ac.in)';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Strip HTML tags but keep <br> as a separator.
 */
const stripHtml = (html) => {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, ' || ')
        .replace(/<\/?[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim();
};

const SLOT_BY_INDEX = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

/**
 * Parse a single <div class="training"> block.
 * Looks like:
 *   <div class="training training_type_lecture">
 *     CS385(<a href="tindex.php?id=28">RBS</a>)<br>
 *     <a href="rindex.php?id=209">IP102</a>
 *   </div>
 * Returns { code, faculty, room, group } or null if empty.
 */
const parseTrainingBlock = (rawHtml) => {
    const text = stripHtml(rawHtml);
    if (!text || !text.trim()) return null;

    // Split into "subject" + "room" lines (separated by " || " from <br>)
    const parts = text.split('||').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return null;

    // First part: "CS385(RBS)" or "CS385(RBS) G-1"
    const firstM = parts[0].match(/^([A-Z]{2,4}\d{2,4}[A-Z]?)\s*\(([A-Z]{2,4})\)\s*(.*)$/);
    if (!firstM) return null;
    const code = firstM[1];
    const faculty = firstM[2];
    const group = firstM[3].trim() || null;

    // Second part is the room (if present)
    const room = parts[1] || '';
    return { code, faculty, room, group };
};

/**
 * Parse the mygbu.in timetable page.
 *
 * Structure:
 *   <h6 class="border-bottom border-gray pb-2 mb-0">B.Tech. ... (CSE-CS-IV) <a ...>PRINT</a></h6>
 *   <table class="table table-bordered">
 *     <tbody>
 *       <tr class="lesson_0">
 *         <th class="time">Mon</th>
 *         <td class="lesson_cell day_1"><div class="training training_type_lecture">CS385(<a>RBS</a>)<br><a>IP102</a></div></td>
 *         <td class="lesson_cell day_2"><div class="training training_type_none"></div></td>
 *         ...
 *       </tr>
 *       ...
 *     </tbody>
 *   </table>
 */
const parseTimetablePage = (html) => {
    // Extract class label from <h6>...</h6>
    const labelMatch = html.match(/<h6[^>]*>([\s\S]*?)<\/h6>/i);
    const classLabel = labelMatch ? stripHtml(labelMatch[1]).replace(/\s+PRINT\s*$/i, '').trim() : null;

    // Find the main timetable <table> — the one with class="table table-bordered"
    const mainTableMatch = html.match(/<table\s+class=["']table\s+table-bordered["'][^>]*>([\s\S]*?)<\/table>/i);
    if (!mainTableMatch) return { label: classLabel, entries: {}, subjects: [] };

    const tableHtml = mainTableMatch[1];
    const result = { label: classLabel, entries: {}, subjects: [] };

    // Walk every <tr class="lesson_X"> in the table — these are the day rows
    const rowRegex = /<tr[^>]*class=["']lesson_\d+["'][^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const rowHtml = rowMatch[1];

        // Day name from <th class="time">Mon</th>
        const dayMatch = rowHtml.match(/<th[^>]*class=["']time["'][^>]*>([\s\S]*?)<\/th>/i);
        if (!dayMatch) continue;
        const dayName = stripHtml(dayMatch[1]).trim();
        if (!DAY_NAMES.includes(dayName)) continue;

        result.entries[dayName] = {};

        // Each cell is <td class="lesson_cell day_1">...</td> where the number is the slot index (1..11)
        const cellRegex = /<td[^>]*class=["']lesson_cell\s+day_(\d+)["'][^>]*>([\s\S]*?)<\/td>/gi;
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
            const slotIndex = parseInt(cellMatch[1], 10);
            if (slotIndex < 1 || slotIndex > SLOT_BY_INDEX.length) continue;
            const slot = SLOT_BY_INDEX[slotIndex - 1];

            // Extract <div class="training">...</div> content (skip empty divs with class training_type_none)
            const divMatch = cellMatch[2].match(/<div[^>]*class=["']training[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
            if (!divMatch) continue;
            const innerHtml = divMatch[1];
            // Empty cells: <div class="training training_type_none"></div> with only &nbsp; whitespace
            if (!innerHtml || /^\s*$/.test(innerHtml.replace(/&nbsp;/g, '').replace(/<[^>]+>/g, ''))) continue;
            const entry = parseTrainingBlock(innerHtml);
            if (entry) {
                if (!result.entries[dayName][slot]) result.entries[dayName][slot] = [];
                result.entries[dayName][slot].push(entry);
            }
        }
    }

    // Extract subject list from the second table (myTable2)
    const remarksIdx = html.indexOf('Remarks');
    if (remarksIdx >= 0) {
        const rest = html.substring(remarksIdx);
        const subTableMatch = rest.match(/<table[^>]*class=["']?myTable2["']?[^>]*>([\s\S]*?)<\/table>/i)
            || rest.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
        if (subTableMatch) {
            const trs = subTableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
            for (let i = 1; i < trs.length; i++) { // skip header row
                const tds = (trs[i].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map((td) => stripHtml(td));
                if (tds.length < 5) continue;
                if (!/^[A-Z]{2,4}\d{2,4}/.test(tds[0] || '')) continue;
                result.subjects.push({
                    code: tds[0] || '',
                    name: (tds[1] || '').trim(),
                    credits: tds[2] || '',
                    facultyABR: tds[3] || '',
                    facultyName: tds[4] || '',
                    load: tds[5] || '',
                });
            }
        }
    }

    return result;
};

/**
 * Normalize entries object so the hash is stable (no key order issues).
 */
const normalizeEntries = (entries) => {
    const out = {};
    for (const day of DAY_NAMES) {
        out[day] = {};
        const dayObj = entries[day] || {};
        for (const slot of Object.keys(dayObj).sort()) {
            out[day][slot] = dayObj[slot].map((e) => ({
                code: e.code || '',
                faculty: e.faculty || '',
                room: e.room || '',
                group: e.group || null,
            }));
        }
    }
    return out;
};

const hashEntries = (entries) =>
    crypto.createHash('sha256').update(JSON.stringify(normalizeEntries(entries))).digest('hex');

/**
 * Fetch a single section. Returns { ok, label, entries, subjects, error }.
 */
export const fetchSection = async (section, { force = false } = {}) => {
    const url = `${MYGBU_BASE}?name=${encodeURIComponent(section.mygbuSchool)}&dept=${encodeURIComponent(section.mygbuDepartment)}&section=${encodeURIComponent(section.mygbuSectionId)}`;
    if (force) logger.info({ url, sectionId: section.id }, 'Force-fetching timetable');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
            signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
            return { ok: false, error: `mygbu.in returned HTTP ${res.status}` };
        }
        const html = await res.text();
        const parsed = parseTimetablePage(html);
        if (!parsed.entries || Object.keys(parsed.entries).every((d) => Object.keys(parsed.entries[d] || {}).length === 0)) {
            return { ok: false, error: 'Could not parse timetable from HTML (empty grid)' };
        }
        return { ok: true, ...parsed, sourceUrl: url };
    } catch (err) {
        clearTimeout(timer);
        return { ok: false, error: err.name === 'AbortError' ? 'Request timed out' : err.message };
    }
};

/**
 * Find a section mapping for a given class key.
 */
export const findSectionForClass = async (school, department, program, batch, specialization, academicYear) => {
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const where = { school, department, program, batch, specialization, active: true };
    if (academicYear) where.academicYear = academicYear;
    const exact = await TimetableSection.findOne({ where });
    if (exact) return exact;

    // Fuzzy fallback: query all active sections matching school, department, batch
    const all = await TimetableSection.findAll({
        where: {
            school: { [Op.like]: (school || '').trim() },
            department: { [Op.like]: (department || '').trim() },
            batch: { [Op.like]: (batch || '').trim() },
            active: true,
        },
    });
    if (!all.length) {
        // Fallback: search across all departments if department string differs slightly
        const anyDept = await TimetableSection.findAll({
            where: {
                batch: { [Op.like]: (batch || '').trim() },
                active: true,
            },
        });
        all.push(...anyDept);
    }

    const target = norm(specialization);

    // 1. Exact normalized match (e.g. 'Core Sec-B' vs 'Core Sec- B')
    const match1 = all.find((s) => norm(s.specialization) === target);
    if (match1) return match1;

    // 2. Starts-with match or prefix match (e.g. 'AI Sec - A' starts with 'AI', 'Cyber Security Sec - A' starts with 'Cyber Security')
    const match2 = all.find((s) => {
        const sNorm = norm(s.specialization);
        if (target.startsWith(sNorm) || sNorm.startsWith(target)) {
            const w1 = (s.specialization.split(/[\s\-]/)[0] || '').toLowerCase();
            const w2 = (specialization.split(/[\s\-]/)[0] || '').toLowerCase();
            return w1 === w2;
        }
        return false;
    });
    if (match2) return match2;

    // 3. Fallback: section contains student keyword or student keyword contains section
    return all.find((s) => {
        const sNorm = norm(s.specialization);
        return sNorm.includes(target) || target.includes(sNorm);
    }) || null;
};

/**
 * Fetch + cache the timetable for one class. Returns the Timetable row.
 * If forceRefresh=false and a recent cached row exists (< TIMETABLE_CACHE_TTL_MIN), returns it.
 */
const TIMETABLE_CACHE_TTL_MIN = 30;

export const refreshTimetable = async ({ school, department, program, batch, specialization, force = false, silent = false } = {}) => {
    let section = await TimetableSection.findOne({
        where: { school, department, program, batch, specialization, active: true },
    });
    if (!section) {
        section = await findSectionForClass(school, department, program, batch, specialization);
    }
    if (!section) {
        return { ok: false, error: `No TimetableSection mapping for this class (${school}/${department}/${program}/${batch}/${specialization}). Ask admin to map it.` };
    }

    // Use canonical section coordinates for timetable cache
    const canonicalSchool = section.school;
    const canonicalDept = section.department;
    const canonicalProg = section.program;
    const canonicalBatch = section.batch;
    const canonicalSpec = section.specialization;

    // Check existing cache
    let existing = await Timetable.findOne({
        where: {
            school: canonicalSchool,
            department: canonicalDept,
            program: canonicalProg,
            batch: canonicalBatch,
            specialization: canonicalSpec,
        }
    });

    if (!force && existing && existing.lastFetchedAt) {
        const ageMin = (Date.now() - new Date(existing.lastFetchedAt).getTime()) / 60000;
        if (ageMin < TIMETABLE_CACHE_TTL_MIN && existing.fetchStatus === 'ok') {
            return { ok: true, timetable: existing, cached: true };
        }
    }

    if (!silent) logger.info({ class: `${canonicalSchool}/${canonicalDept}/${canonicalProg}/${canonicalBatch}/${canonicalSpec}`, sectionId: section.id }, 'Refreshing timetable from mygbu.in');

    const result = await fetchSection(section, { force });
    if (!result.ok) {
        if (existing) {
            existing.isStale = true;
            existing.fetchStatus = 'error';
            existing.fetchError = result.error;
            existing.lastFetchedAt = new Date();
            await existing.save();
        }
        return { ok: false, error: result.error };
    }

    const newHash = hashEntries(result.entries);
    const changed = !existing || existing.contentHash !== newHash;
    const now = new Date();

    if (existing) {
        existing.entries = result.entries;
        existing.subjects = result.subjects;
        existing.contentHash = newHash;
        existing.lastFetchedAt = now;
        existing.lastChangedAt = changed ? now : existing.lastChangedAt;
        existing.sourceUrl = result.sourceUrl;
        existing.fetchStatus = 'ok';
        existing.fetchError = null;
        existing.isStale = false;
        existing.semester = section.semester || existing.semester;
        existing.academicYear = section.academicYear || existing.academicYear;
        await existing.save();
        return { ok: true, timetable: existing, changed };
    }

    const created = await Timetable.create({
        school: canonicalSchool,
        department: canonicalDept,
        program: canonicalProg,
        batch: canonicalBatch,
        specialization: canonicalSpec,
        entries: result.entries,
        subjects: result.subjects,
        contentHash: newHash,
        sourceUrl: result.sourceUrl,
        lastFetchedAt: now,
        lastChangedAt: now,
        fetchStatus: 'ok',
        fetchError: null,
        isStale: false,
        semester: section.semester,
        academicYear: section.academicYear,
    });
    return { ok: true, timetable: created, changed: true };
};

/**
 * Refresh all active sections. Used by the cron + admin "Refresh all" button.
 */
export const refreshAllTimetables = async () => {
    const sections = await TimetableSection.findAll({ where: { active: true } });
    const results = [];
    for (const s of sections) {
        const r = await refreshTimetable({
            school: s.school,
            department: s.department,
            program: s.program,
            batch: s.batch,
            specialization: s.specialization,
            silent: true,
        });
        results.push({
            sectionId: s.id,
            class: `${s.school}/${s.department}/${s.program}/${s.batch}/${s.specialization}`,
            ...r,
        });
    }
    return results;
};

/**
 * Get the timetable for a student's class.
 * Auto-fetches if missing or stale, OR if the section's mygbuSectionId has changed
 * since the last fetch (admin may have remapped the class to a different section).
 */
export const getTimetableForStudent = async (userId) => {
    const me = await Student.findOne({ where: { userId } });
    if (!me) return { ok: false, error: 'Student record not found' };

    // Ensure a section mapping exists
    const section = await findSectionForClass(me.school, me.department, me.program, me.batch, me.specialization);
    if (!section) {
        return { ok: false, error: `No timetable mapping for your class. Ask admin to add one (${me.school} / ${me.department} / ${me.program} / ${me.batch} / ${me.specialization})` };
    }

    // Ensure timetable is cached under canonical section coordinates
    let timetable = await Timetable.findOne({
        where: {
            school: section.school,
            department: section.department,
            program: section.program,
            batch: section.batch,
            specialization: section.specialization,
        },
    });

    // Detect stale mapping: cached sourceUrl doesn't include the current section ID
    const currentSourceMarker = `section=${section.mygbuSectionId}`;
    const isStaleMapping = timetable && timetable.sourceUrl && !timetable.sourceUrl.includes(currentSourceMarker);

    if (!timetable || timetable.fetchStatus !== 'ok' || timetable.isStale || isStaleMapping) {
        const refresh = await refreshTimetable({
            school: section.school,
            department: section.department,
            program: section.program,
            batch: section.batch,
            specialization: section.specialization,
            force: timetable?.isStale === true || isStaleMapping === true,
            silent: true,
        });
        if (!refresh.ok) {
            return { ok: false, error: refresh.error, stale: !!timetable, timetable };
        }
        timetable = refresh.timetable;
    }

    return {
        ok: true,
        timetable,
        section,
        studentClass: {
            school: me.school,
            department: me.department,
            program: me.program,
            batch: me.batch,
            specialization: me.specialization,
        },
    };
};
