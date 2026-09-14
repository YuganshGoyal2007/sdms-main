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
import { Agent, setGlobalDispatcher } from 'undici';
import Timetable from '../models/timetable.model.js';
import TimetableSection from '../models/timetableSection.model.js';
import Student from '../models/student.model.js';
import logger from '../lib/logger.js';
import { syncFacultyAssignments } from './timetableSync.service.js';

// Tolerate university internal/self-signed SSL certificates for timetable scraper
try {
  setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }));
} catch (e) {
  // Ignore if already set
}

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
 * Checks whether a code + parenthetical matches room pattern rather than a course
 */
function isRoomPattern(code, paren) {
    const cleanCode = (code || '').trim();
    const cleanParen = (paren || '').trim();

    // 1. Room code prefixes: IL, IP, LP, LL, EP, EL, VP, VL, CCC, RL, LH, CR, LAB, ROOM, HALL
    const roomCodePattern = /^(?:IL|IP|LP|LL|EP|EL|VP|VL|CCC|RL|LH|CR|LAB|ROOM|HALL)[\s\-_]?\d+/i;
    // 2. Building / complex abbreviations
    const buildingPattern = /^(?:CLT|RLT|SOICT|SOE|SOM|SOVSAS|SOHSS|SOLJG|SOBT|ADMIN|CCC|BLDG|BLOCK|LAB)$/i;

    if (roomCodePattern.test(cleanCode)) {
        if (!cleanParen || buildingPattern.test(cleanParen)) {
            return true;
        }
    }

    if (buildingPattern.test(cleanParen) && /^[A-Z]{1,4}[\s\-_]?\d+/i.test(cleanCode)) {
        return true;
    }

    return false;
}

/**
 * Parse one or more training blocks or multi-lecture cells.
 * Supports:
 * - Codes of any length (e.g. AICTE101, ENV101, OPEN101, CS-301, CS385)
 * - Faculty abbreviations/names of any length (e.g. VINOD, PRIYA, TBA, N/A, Dr. AS, digits)
 * - Multi-lecture / multi-batch cells (e.g. G-1 and G-2 in the same slot)
 * - Room detection with building parentheticals (e.g. IL-105 (CLT)) attached to entry.room
 * Returns array of { code, faculty, room, group } objects (empty array if empty).
 */
export const parseTrainingBlock = (rawHtml) => {
    if (!rawHtml || !rawHtml.trim()) return [];

    // Replace <a ... href='*rindex.php*'>Room</a> with [[ROOM:Room]]
    // and <a ... href='*tindex.php*'>Teacher</a> with [[TEACHER:Teacher]]
    let annotated = rawHtml.replace(/<a\b[^>]*href=['"]?[^'"]*rindex[^>]*>([\s\S]*?)<\/a>/gi, (m, g1) => {
        const text = g1.replace(/<[^>]+>/g, '').trim();
        return ` [[ROOM:${text}]] `;
    });

    annotated = annotated.replace(/<a\b[^>]*href=['"]?[^'"]*tindex[^>]*>([\s\S]*?)<\/a>/gi, (m, g1) => {
        const text = g1.replace(/<[^>]+>/g, '').trim();
        return ` [[TEACHER:${text}]] `;
    });

    // Replace <br> with newline or split token
    annotated = annotated.replace(/<br\s*\/?>/gi, '\n');
    annotated = annotated.replace(/\|\|/g, '\n');
    // Strip remaining HTML tags
    annotated = annotated.replace(/<\/?[^>]+>/g, ' ');
    annotated = annotated.replace(/&nbsp;/gi, ' ');
    annotated = annotated.replace(/&amp;/gi, '&');
    annotated = annotated.replace(/&lt;/gi, '<');
    annotated = annotated.replace(/&gt;/gi, '>');

    // Normalize lines
    const rawLines = annotated.split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (rawLines.length === 0) return [];

    // In case multiple lectures are concatenated on a single line with whitespace, split before each course code
    const lines = [];
    for (const rawLine of rawLines) {
        const splitByCourse = rawLine.split(/(?<=\S)\s+(?=[A-Za-z0-9\-_./]+\s*\([^)]*\))/).map((s) => s.trim()).filter(Boolean);
        lines.push(...splitByCourse);
    }

    const entries = [];
    let current = null;

    const extractDetails = (text, targetEntry) => {
        let rem = text;

        // Check for explicit [[ROOM:...]]
        const roomTokenMatch = rem.match(/\[\[ROOM:([\s\S]*?)\]\]/);
        if (roomTokenMatch) {
            const foundRoom = roomTokenMatch[1].trim();
            targetEntry.room = targetEntry.room ? `${targetEntry.room} ${foundRoom}`.trim() : foundRoom;
            rem = rem.replace(roomTokenMatch[0], ' ').trim();
        }

        // Check for bracketed room e.g. [IP102], [SOICT-101]
        const bracketRoomMatch = rem.match(/\[([^\]]+)\]/);
        if (bracketRoomMatch && !bracketRoomMatch[1].startsWith('ROOM:') && !bracketRoomMatch[1].startsWith('TEACHER:')) {
            const foundRoom = bracketRoomMatch[1].trim();
            targetEntry.room = targetEntry.room ? `${targetEntry.room} ${foundRoom}`.trim() : foundRoom;
            rem = rem.replace(bracketRoomMatch[0], ' ').trim();
        }

        // Check for group / batch / tutorial (G-1, G-2, Group A, Batch-1, T-1, etc.)
        const groupMatch = rem.match(/\b(G(?:roup)?\s*[-#]?\s*[A-Za-z0-9]+|Batch\s*[-#]?\s*[A-Za-z0-9]+|T\s*[-#]?\s*\d+|G[-#][A-Za-z0-9]+)\b/i);
        if (groupMatch) {
            targetEntry.group = groupMatch[1].trim();
            rem = rem.replace(groupMatch[0], ' ').trim();
        }

        // If rem still has remaining text
        if (rem) {
            if (!targetEntry.room) {
                targetEntry.room = rem;
            } else if (!targetEntry.room.includes(rem)) {
                targetEntry.room = `${targetEntry.room} ${rem}`.trim();
            }
        }
    };

    for (const line of lines) {
        const courseMatch = line.match(/^([A-Za-z0-9\-_./]+)\s*\(([^)]*)\)\s*(.*)$/);

        if (courseMatch) {
            let potentialCode = courseMatch[1].trim();
            let potentialFaculty = courseMatch[2].trim();
            let rest = courseMatch[3].trim();

            const teacherMatch = potentialFaculty.match(/\[\[TEACHER:([\s\S]*?)\]\]/);
            if (teacherMatch) {
                potentialFaculty = teacherMatch[1].trim();
            }

            // Check if this is a room with building name in parens (e.g. "IL-105 (CLT)")
            if (isRoomPattern(potentialCode, potentialFaculty)) {
                const roomStr = `${potentialCode} (${potentialFaculty})`.trim();
                if (current) {
                    current.room = current.room ? `${current.room} ${roomStr}`.trim() : roomStr;
                    if (rest) {
                        extractDetails(rest, current);
                    }
                } else {
                    current = { code: potentialCode, faculty: '', room: roomStr, group: null };
                }
                continue;
            }

            // Genuine course code
            if (current) {
                entries.push(current);
            }

            current = {
                code: potentialCode,
                faculty: potentialFaculty,
                room: '',
                group: null,
            };

            if (rest) {
                extractDetails(rest, current);
            }
        } else if (current) {
            extractDetails(line, current);
        } else {
            const plain = line.replace(/\[\[(?:ROOM|TEACHER):([\s\S]*?)\]\]/g, '$1').trim();
            if (plain) {
                current = { code: plain, faculty: '', room: '', group: null };
            }
        }
    }

    if (current) {
        entries.push(current);
    }

    // Clean up rooms and faculty tokens
    for (const entry of entries) {
        if (entry.room) {
            entry.room = entry.room
                .replace(/\[\[ROOM:([\s\S]*?)\]\]/g, '$1')
                .replace(/\s+/g, ' ')
                .trim();
        }
        if (entry.faculty) {
            entry.faculty = entry.faculty
                .replace(/\[\[TEACHER:([\s\S]*?)\]\]/g, '$1')
                .replace(/\s+/g, ' ')
                .trim();
        }
    }

    // Deduplicate identical entries in the same cell
    const unique = [];
    for (const entry of entries) {
        const isDup = unique.some((u) =>
            u.code === entry.code &&
            u.faculty === entry.faculty &&
            u.room === entry.room &&
            u.group === entry.group
        );
        if (!isDup) unique.push(entry);
    }

    return unique;
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
        const cellRegex = /<td[^>]*class=["'][^"']*\bday_(\d+)\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/gi;
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
            const slotIndex = parseInt(cellMatch[1], 10);
            if (slotIndex < 1 || slotIndex > SLOT_BY_INDEX.length) continue;
            const slot = SLOT_BY_INDEX[slotIndex - 1];

            // Extract all <div class="training ..."> blocks inside this cell
            const divRegex = /<div[^>]*class=["'][^"']*\btraining\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
            let divMatch;
            let foundDivs = false;
            while ((divMatch = divRegex.exec(cellMatch[2])) !== null) {
                foundDivs = true;
                const innerHtml = divMatch[1];
                if (!innerHtml || /^\s*$/.test(innerHtml.replace(/&nbsp;/g, '').replace(/<[^>]+>/g, ''))) continue;
                const parsedEntries = parseTrainingBlock(innerHtml);
                if (parsedEntries && parsedEntries.length > 0) {
                    if (!result.entries[dayName][slot]) result.entries[dayName][slot] = [];
                    result.entries[dayName][slot].push(...parsedEntries);
                }
            }
            // If no training div was matched, but cell has content, parse cell content directly
            if (!foundDivs) {
                const cellContent = cellMatch[2];
                if (cellContent && !/^\s*$/.test(cellContent.replace(/&nbsp;/g, '').replace(/<[^>]+>/g, ''))) {
                    const parsedEntries = parseTrainingBlock(cellContent);
                    if (parsedEntries && parsedEntries.length > 0) {
                        if (!result.entries[dayName][slot]) result.entries[dayName][slot] = [];
                        result.entries[dayName][slot].push(...parsedEntries);
                    }
                }
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
                if (!/^[A-Za-z0-9\-_./]+/.test(tds[0] || '')) continue;
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
        if (!parsed.entries) {
            return { ok: false, error: 'Could not parse timetable structure from HTML' };
        }
        const totalLectures = Object.values(parsed.entries).reduce((acc, dayObj) => {
            if (!dayObj || typeof dayObj !== 'object') return acc;
            return acc + Object.values(dayObj).reduce((sum, slotArr) => sum + (Array.isArray(slotArr) ? slotArr.length : 0), 0);
        }, 0);
        return { ok: true, ...parsed, totalLectures, isEmpty: totalLectures === 0, sourceUrl: url };
    } catch (err) {
        clearTimeout(timer);
        return { ok: false, error: err.name === 'AbortError' ? 'Request timed out' : err.message };
    }
};

/**
 * Extracts explicit section letter or identifier from specialization string.
 * Examples:
 *   "Core Sec- D" -> "D"
 *   "Core Sec- A" -> "A"
 *   "Core Section B" -> "B"
 *   "AI Sec - A" -> "A"
 *   "Core - D" -> "D"
 *   "Core" -> null
 */
export const extractSectionLetter = (str) => {
    if (!str) return null;
    const s = String(str).trim();
    // Explicit Section / Sec / Grp / Group / Batch (word-boundary delimited, supports letters or multi-digits e.g. Sec-A, Sec 01, Batch-2, Group 10)
    const explicit = s.match(/\b(?:section|sec|grp|group|batch)[\s.\-_]*([A-Za-z0-9]+)\b/i);
    if (explicit) {
        const val = explicit[1].toUpperCase();
        return /^\d+$/.test(val) ? String(parseInt(val, 10)) : val;
    }

    // Trailing isolated letter or 1-2 digits (e.g. "Core - D", "Core D", "BCS-III-A", "Core - 02")
    const trailing = s.match(/(?:^|[\s\-_(])([A-Za-z]|\d{1,2})\)?$/i);
    if (trailing) {
        const val = trailing[1].toUpperCase();
        return /^\d+$/.test(val) ? String(parseInt(val, 10)) : val;
    }

    return null;
};

/**
 * Find a section mapping for a given class key.
 * Enforces strict section letter matching to prevent prefix collisions
 * (e.g. Core Sec- D must never match Core Sec- A).
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
    const targetLetter = extractSectionLetter(specialization);

    // 1. Exact normalized match (e.g. 'Core Sec-B' vs 'Core Sec- B')
    const match1 = all.find((s) => norm(s.specialization) === target);
    if (match1) return match1;

    // Disqualify any candidate sections that have a conflicting explicit section letter.
    // If target has letter 'D', candidate sections with letter 'A', 'B', 'C' are strictly dropped!
    const eligibleSections = all.filter((s) => {
        if (!targetLetter) return true;
        const candLetter = extractSectionLetter(s.specialization);
        if (candLetter && candLetter !== targetLetter) {
            return false;
        }
        return true;
    });

    const stripSectionPattern = /\b(?:section|sec|grp|group|batch)[\s.\-_]*[A-Za-z0-9]+\b|[\s\-_](?:[A-Za-z]|\d{1,2})\)?$/gi;

    // 2. Candidate with same section letter and matching base specialization
    if (targetLetter) {
        const baseSpec = specialization.replace(stripSectionPattern, '').trim();
        const baseTargetNorm = norm(baseSpec);

        const matchLetter = eligibleSections.find((s) => {
            const candLetter = extractSectionLetter(s.specialization);
            if (candLetter !== targetLetter) return false;
            if (!baseTargetNorm) return true;
            const candBase = s.specialization.replace(stripSectionPattern, '').trim();
            const candBaseNorm = norm(candBase);
            return candBaseNorm === baseTargetNorm || candBaseNorm.includes(baseTargetNorm) || baseTargetNorm.includes(candBaseNorm);
        });
        if (matchLetter) return matchLetter;
    }

    // 3. Fallback normalized inclusion match among eligible candidates (only when no letter conflict)
    const matchInclusion = eligibleSections.find((s) => {
        const sNorm = norm(s.specialization);
        return sNorm.includes(target) || target.includes(sNorm);
    });
    if (matchInclusion) return matchInclusion;

    // 4. Auto-Discovery Fallback: Resolve canonical mygbu section ID by program, batch, and specialization
    const autoResolved = autoResolveMygbuSection({ school, department, program, batch, specialization });
    if (autoResolved) {
        const resolvedLetter = extractSectionLetter(autoResolved.label);
        if (targetLetter && resolvedLetter && targetLetter !== resolvedLetter) {
            return null;
        }
        try {
            const [persistedSection] = await TimetableSection.findOrCreate({
                where: {
                    school: (school || 'soict').toLowerCase(),
                    department: (department || 'cse').toLowerCase(),
                    program: program || 'B.Tech',
                    batch: (batch || '').trim(),
                    specialization: (specialization || '').trim(),
                },
                defaults: {
                    mygbuSchool: autoResolved.mygbuSchool || 'SOICT',
                    mygbuDepartment: autoResolved.mygbuDepartment || 'CSE',
                    mygbuSectionId: String(autoResolved.mygbuSectionId),
                    label: autoResolved.label,
                    academicYear: academicYear || autoResolved.academicYear || '2026-27',
                    semester: autoResolved.semester || 'Odd',
                    active: true,
                },
            });
            logger.info(
                { class: `${school}/${department}/${program}/${batch}/${specialization}`, sectionId: autoResolved.mygbuSectionId, label: autoResolved.label },
                'Auto-discovered and persisted timetable section mapping'
            );
            return persistedSection;
        } catch (err) {
            logger.warn({ err: err.message }, 'Failed to persist auto-discovered timetable section, using memory instance');
            return TimetableSection.build({
                school: (school || 'soict').toLowerCase(),
                department: (department || 'cse').toLowerCase(),
                program: program || 'B.Tech',
                batch: (batch || '').trim(),
                specialization: (specialization || '').trim(),
                mygbuSchool: autoResolved.mygbuSchool || 'SOICT',
                mygbuDepartment: autoResolved.mygbuDepartment || 'CSE',
                mygbuSectionId: String(autoResolved.mygbuSectionId),
                label: autoResolved.label,
                academicYear: academicYear || autoResolved.academicYear || '2026-27',
                semester: autoResolved.semester || 'Odd',
                active: true,
            });
        }
    }

    return null;
};

/**
 * Auto-discovery rule engine: resolves canonical mygbu section IDs and labels
 * for university classes when explicit database mappings have not yet been manually entered.
 */
export const autoResolveMygbuSection = ({ school, department, program, batch, specialization }) => {
    const sSchool = String(school || '').toLowerCase().trim();
    const sDept = String(department || '').toLowerCase().trim();
    const sProg = String(program || '').trim();
    const sBatch = String(batch || '').trim();
    const sSpec = String(specialization || '').trim();

    const targetLetter = extractSectionLetter(sSpec);
    const specNorm = sSpec.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Integrated B.Tech-M.Tech (5-Year)
    if (sProg.toLowerCase().includes('integrated') || sProg.includes('+') || sBatch.includes('2021-26') || sBatch.includes('2022-27') || sBatch.includes('2023-28') || sBatch.includes('2024-29') || sBatch.includes('2025-30')) {
        if (sBatch.includes('2021-26')) {
            if (specNorm.includes('air')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1333', label: 'MT-AIR-II-A', semester: 'Sem 9' };
            if (specNorm.includes('data') || specNorm.includes('ds')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1377', label: 'MT-DS-II', semester: 'Sem 9' };
            if (specNorm.includes('se') || specNorm.includes('software')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '31', label: 'MT-SE-II', semester: 'Sem 9' };
            return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1333', label: 'MT-AIR-II-A', semester: 'Sem 9' };
        }
        if (sBatch.includes('2022-27')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2433', label: 'CS-IV-A', semester: 'Sem 7' };
        if (sBatch.includes('2023-28')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '19', label: 'CS-III-A', semester: 'Sem 5' };
        if (sBatch.includes('2024-29')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '21', label: 'CS-II-A', semester: 'Sem 3' };
        if (sBatch.includes('2025-30')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1311', label: 'CS-I-A', semester: 'Sem 1' };
    }

    // 2. M.Tech (2-Year)
    if (sProg.toLowerCase().includes('m.tech') || sBatch.includes('2024-26') || sBatch.includes('2025-27')) {
        if (sBatch.includes('2024-26')) {
            if (specNorm.includes('ds') || specNorm.includes('data')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1377', label: 'MT-DS-II', semester: 'Sem 3' };
            if (specNorm.includes('air')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1333', label: 'MT-AIR-II-A', semester: 'Sem 3' };
            return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1333', label: 'MT-AIR-II-A', semester: 'Sem 3' };
        }
        if (sBatch.includes('2025-27')) {
            return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1308', label: 'MT-SE-I', semester: 'Sem 1' };
        }
    }

    // 3. B.Tech (4-Year) - By Batch
    // Batch 2026-30 (Year 1 / Semester 1 & 2)
    if (sBatch.includes('2026-30') || sBatch.includes('2026-2030')) {
        if (specNorm.includes('ai')) {
            if (targetLetter && targetLetter !== 'A' && targetLetter !== 'B') return null;
            return targetLetter === 'B'
                ? { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2461', label: 'BAI-I-B', semester: 'Sem 1' }
                : { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1249', label: 'BAI-I-A', semester: 'Sem 1' };
        }
        if (specNorm.includes('cyber') || specNorm.includes('cs')) {
            return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1337', label: 'CSE-CS-I', semester: 'Sem 1' };
        }
        if (specNorm.includes('data') || specNorm.includes('ds')) {
            return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1339', label: 'CSE-DS-I', semester: 'Sem 1' };
        }
        if (targetLetter === 'B') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1239', label: 'BCS-I-B', semester: 'Sem 1' };
        if (targetLetter === 'C') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2495', label: 'BCS-I-C', semester: 'Sem 1' };
        if (!targetLetter || targetLetter === 'A') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1', label: 'BCS-I-A', semester: 'Sem 1' };
        return null;
    }

    // Batch 2025-29 (Year 2 / Semester 3 & 4)
    if (sBatch.includes('2025-29') || sBatch.includes('2025-2029')) {
        if (specNorm.includes('ai')) {
            if (targetLetter && targetLetter !== 'A' && targetLetter !== 'B') return null;
            return targetLetter === 'B'
                ? { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2541', label: 'BAI-II-B', semester: 'Sem 3' }
                : { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1277', label: 'BAI-II', semester: 'Sem 3' };
        }
        if (specNorm.includes('cyber')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1400', label: 'CSE-CS-II', semester: 'Sem 3' };
        if (specNorm.includes('data') || specNorm.includes('ds')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1401', label: 'CSE-DS-II', semester: 'Sem 3' };
        if (targetLetter === 'B') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1299', label: 'BCS-II B', semester: 'Sem 3' };
        if (targetLetter === 'C') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1309', label: 'BCS-II C', semester: 'Sem 3' };
        if (targetLetter === 'D' || targetLetter === 'E') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2536', label: 'BCS-II D', semester: 'Sem 3' };
        if (!targetLetter || targetLetter === 'A') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1298', label: 'BCS-II A', semester: 'Sem 3' };
        return null;
    }

    // Batch 2024-28 (Year 3 / Semester 5 & 6)
    if (sBatch.includes('2024-28') || sBatch.includes('2024-2028')) {
        if (specNorm.includes('ai')) {
            if (targetLetter && targetLetter !== 'A' && targetLetter !== 'B') return null;
            return targetLetter === 'B'
                ? { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2586', label: 'BAI-III-B', semester: 'Sem 5' }
                : { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1278', label: 'BAI-III', semester: 'Sem 5' };
        }
        if (specNorm.includes('cyber')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2439', label: 'CSE-CS-III', semester: 'Sem 5' };
        if (specNorm.includes('data') || specNorm.includes('ds')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2442', label: 'CSE-DS-III', semester: 'Sem 5' };
        if (specNorm.includes('machine') || specNorm.includes('ml')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2441', label: 'CSE-ML-III', semester: 'Sem 5' };
        if (targetLetter === 'B') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1327', label: 'BCS-III-B', semester: 'Sem 5' };
        if (targetLetter === 'C') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1328', label: 'BCS-III-C', semester: 'Sem 5' };
        if (targetLetter === 'D') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2590', label: 'BCS-III-D', semester: 'Sem 5' };
        if (!targetLetter || targetLetter === 'A') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1282', label: 'BCS-III-A', semester: 'Sem 5' };
        return null;
    }

    // Batch 2023-27 & 2022-26 (Year 4 / Semester 7 & 8)
    if (sBatch.includes('2023-27') || sBatch.includes('2023-2027') || sBatch.includes('2022-26') || sBatch.includes('2022-2026')) {
        if (specNorm.includes('ai')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1279', label: 'BAI-IV', semester: 'Sem 7' };
        if (specNorm.includes('cyber')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2486', label: 'CSE-CS-IV', semester: 'Sem 7' };
        if (specNorm.includes('data') || specNorm.includes('ds')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2487', label: 'CSE-DS-IV', semester: 'Sem 7' };
        if (specNorm.includes('machine') || specNorm.includes('ml')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2488', label: 'CSE-ML-IV', semester: 'Sem 7' };
        if (targetLetter === 'B' || targetLetter === 'C' || targetLetter === 'D') {
            return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1406', label: 'BCS-IV-B', semester: 'Sem 7' };
        }
        if (!targetLetter || targetLetter === 'A') return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1283', label: 'BCS-IV-A', semester: 'Sem 7' };
        return null;
    }

    if (targetLetter && targetLetter !== 'A') return null;

    // Generic fallbacks for SOICT/CSE
    if (specNorm.includes('ai')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1279', label: 'BAI-IV', semester: 'Odd' };
    if (specNorm.includes('data') || specNorm.includes('ds')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2487', label: 'CSE-DS-IV', semester: 'Odd' };
    if (specNorm.includes('cyber')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2486', label: 'CSE-CS-IV', semester: 'Odd' };
    if (specNorm.includes('machine') || specNorm.includes('ml')) return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '2488', label: 'CSE-ML-IV', semester: 'Odd' };

    return { mygbuSchool: 'SOICT', mygbuDepartment: 'CSE', mygbuSectionId: '1283', label: 'BCS-IV-A', semester: 'Odd' };
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

    const currentSourceMarker = `section=${section.mygbuSectionId}`;
    const isStaleMapping = Boolean(existing && existing.sourceUrl && !existing.sourceUrl.includes(currentSourceMarker));

    let existingTotalLectures = 0;
    if (existing && existing.entries) {
        const rawEntries = typeof existing.entries === 'string' ? JSON.parse(existing.entries) : existing.entries;
        existingTotalLectures = Object.values(rawEntries).reduce((acc, dayObj) => {
            if (!dayObj || typeof dayObj !== 'object') return acc;
            return acc + Object.values(dayObj).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
        }, 0);
    }

    if (!force && !isStaleMapping && existing && existing.lastFetchedAt && existingTotalLectures > 0) {
        const ageMin = (Date.now() - new Date(existing.lastFetchedAt).getTime()) / 60000;
        if (ageMin < TIMETABLE_CACHE_TTL_MIN && existing.fetchStatus === 'ok') {
            return { ok: true, timetable: existing, cached: true, section, totalLectures: existingTotalLectures, isEmpty: false };
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

        // When timetable content changed, trigger automatic faculty reassignment
        // in the background (fire-and-forget) so teacher moves are picked up
        // without waiting for the 30-min background cron or admin click.
        if (changed) {
            syncFacultyAssignments({
                school: canonicalSchool,
                department: canonicalDept,
                dryRun: false,
                triggeredById: null,
            }).then((syncResult) => {
                if (syncResult.success && syncResult.summary.reassignedCount > 0) {
                    logger.info(
                        { school: canonicalSchool, dept: canonicalDept, reassigned: syncResult.summary.reassignedCount },
                        'Auto-sync triggered by timetable content change: faculty reassignments applied'
                    );
                }
            }).catch((err) => {
                logger.warn({ error: err.message }, 'Auto-sync triggered by timetable change failed (non-blocking)');
            });
        }

        return { ok: true, timetable: existing, changed, totalLectures: result.totalLectures, isEmpty: result.totalLectures === 0, section };
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
    return { ok: true, timetable: created, changed: true, totalLectures: result.totalLectures, isEmpty: result.totalLectures === 0, section };
};

/**
 * Refresh all active sections. Used by the cron + admin "Refresh all" button.
 */
export const refreshAllTimetables = async ({ where = { active: true } } = {}) => {
    const sections = await TimetableSection.findAll({ where });
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
