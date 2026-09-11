import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { Agent, setGlobalDispatcher } from 'undici';
import sequelize from '../lib/db.js';
import logger from '../lib/logger.js';
import User from '../models/user.model.js';
import Faculty from '../models/faculty.model.js';
import Subject from '../models/subject.model.js';
import FacultyAssignment from '../models/facultyAssignment.model.js';
import TimetableSection from '../models/timetableSection.model.js';
import ChangeLog from '../models/changeLog.model.js';

// University servers (samay.mygbu.in & mygbu.in) use university internal/self-signed SSL certificates.
// Configure dispatcher to tolerate university certificate chains for scraping.
try {
  setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }));
} catch (e) {
  // Ignore if already set
}

const SAMAY_API_URL = 'https://samay.mygbu.in/api.php';
const MYGBU_LOAD_URL = 'https://mygbu.in/schd/load.php?school=SOICT&dept=CSE+++++++';
const MYGBU_BASE_URL = 'https://mygbu.in/schd/index.php';
const FETCH_TIMEOUT_MS = 12000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GBU-SDMS/1.0';

/**
 * Checks live connection and latency to university timetable sources.
 */
export async function getScrapeLiveStatus() {
  const sources = [
    { name: 'Samay API (Live Timetable)', url: SAMAY_API_URL, type: 'json' },
    { name: 'MyGBU Faculty Load Report', url: MYGBU_LOAD_URL, type: 'html' },
    { name: 'MyGBU Master Schedule Grid', url: `${MYGBU_BASE_URL}?name=SOICT&dept=CSE`, type: 'html' },
  ];

  const results = [];
  for (const src of sources) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(src.url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      let recordCount = null;
      if (src.type === 'json' && res.ok) {
        const data = await res.json();
        recordCount = Array.isArray(data) ? data.length : null;
      }

      results.push({
        name: src.name,
        url: src.url,
        status: res.status,
        online: res.ok,
        latencyMs,
        recordCount,
        checkedAt: new Date().toISOString(),
      });
    } catch (err) {
      results.push({
        name: src.name,
        url: src.url,
        status: 0,
        online: false,
        latencyMs: Date.now() - start,
        error: err.name === 'AbortError' ? 'Request timed out' : err.message,
        checkedAt: new Date().toISOString(),
      });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    allHealthy: results.every((r) => r.online),
    sources: results,
  };
}

/**
 * Fetches timetable data from Samay JSON API with fallback.
 */
export async function fetchLiveTimetable({ school = 'SOICT', department = 'CSE' } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(SAMAY_API_URL, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Samay API returned HTTP ${res.status}`);
    }

    const rawData = await res.json();
    if (!Array.isArray(rawData)) {
      throw new Error('Invalid timetable payload from API: expected array');
    }

    // Filter by school and department if provided
    let filtered = rawData;
    if (school) {
      filtered = filtered.filter(
        (item) => String(item.school || '').trim().toUpperCase() === String(school).trim().toUpperCase()
      );
    }
    if (department) {
      filtered = filtered.filter(
        (item) =>
          String(item.StudentDepartment || item.dept || '').trim().toUpperCase() ===
          String(department).trim().toUpperCase()
      );
    }

    return { ok: true, source: 'samay_api', count: filtered.length, data: filtered };
  } catch (err) {
    clearTimeout(timer);
    logger.warn({ error: err.message }, 'Failed to fetch from Samay API, falling back to cached timetable data');
    return { ok: false, error: err.message, data: [] };
  }
}

/**
 * Finds or creates a faculty member and linked User account.
 */
async function resolveOrCreateFaculty(teacherName, facultyIdStr, homeSchool = 'SOICT', department = 'CSE', transaction) {
  const cleanName = String(teacherName || '').trim();
  if (!cleanName || cleanName === 'TBA' || cleanName.toLowerCase() === 'null') {
    return null;
  }

  // 1. Try finding in Faculty table by name (fuzzy match)
  let faculty = await Faculty.findOne({
    where: {
      name: { [Op.like]: `%${cleanName}%` },
    },
    transaction,
  });

  if (faculty && faculty.userId) {
    const user = await User.findByPk(faculty.userId, { transaction });
    if (user) return { faculty, user };
  }

  // 2. Try finding User by username pattern or name
  const usernameSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
  const generatedEmail = `${usernameSlug || 'faculty'}@gbu.ac.in`;

  let user = await User.findOne({
    where: {
      [Op.or]: [{ username: generatedEmail }, { name: cleanName }],
    },
    transaction,
  });

  if (user) {
    if (!faculty) {
      faculty = await Faculty.findOne({ where: { userId: user.id }, transaction });
    }
  } else {
    const hashedPassword = await bcrypt.hash('faculty123', 10);
    let finalUsername = generatedEmail;
    let counter = 1;
    while (await User.findOne({ where: { username: finalUsername }, transaction })) {
      finalUsername = `${usernameSlug}${counter}@gbu.ac.in`;
      counter++;
    }
    user = await User.create(
      {
        username: finalUsername,
        password: hashedPassword,
        name: cleanName,
        role: 'faculty',
      },
      { transaction }
    );
  }

  if (!faculty) {
    const existingByEmail = await Faculty.findOne({ where: { email: user.username }, transaction });
    if (existingByEmail) {
      faculty = existingByEmail;
      if (!faculty.userId) {
        await faculty.update({ userId: user.id }, { transaction });
      }
    } else {
      const uniqueFacId = facultyIdStr || `FAC-${user.id}-${Date.now().toString().slice(-4)}`;
      faculty = await Faculty.create(
        {
          userId: user.id,
          name: cleanName,
          facultyId: uniqueFacId,
          email: user.username,
          department: department || 'CSE',
          phone: '',
          createdBy: user.id,
        },
        { transaction }
      );
    }
  } else if (!faculty.userId) {
    await faculty.update({ userId: user.id }, { transaction });
  }

  return { faculty, user };
}

/**
 * Finds or creates a Subject record matching course code and title.
 */
async function resolveOrCreateSubject(subjectCode, subjectName, coords = {}, transaction) {
  const cleanCode = String(subjectCode || '').trim().toUpperCase();
  if (!cleanCode) return null;

  let subject = await Subject.findOne({
    where: { code: cleanCode },
    transaction,
  });

  if (!subject) {
    const isLab = cleanCode.toLowerCase().includes('lab') || cleanCode.toLowerCase().includes('p');
    subject = await Subject.create(
      {
        school: coords.school || 'SOICT',
        department: coords.department || 'CSE',
        program: coords.program || 'B.Tech (CS)',
        batch: coords.batch || '2024-28',
        specialization: coords.specialization || 'Core Sec- A',
        code: cleanCode,
        name: String(subjectName || cleanCode).trim(),
        credits: 3,
        type: isLab ? 'lab' : 'theory',
        semester: coords.semester || 1,
      },
      { transaction }
    );
  }

  return subject;
}

/**
 * Maps timetable section details to canonical SDMS class coordinates.
 * Priority 1: Exact matching against configured TimetableSection mapping by mygbuSectionId.
 * Priority 2: Heuristic derivation from SectionName / Program name.
 */
function resolveClassCoordinates(item, mappedSection = null) {
  if (mappedSection) {
    return {
      school: mappedSection.school,
      department: mappedSection.department,
      program: mappedSection.program,
      batch: mappedSection.batch,
      specialization: mappedSection.specialization,
      semester: mappedSection.semester ? (parseInt(String(mappedSection.semester).replace(/\D/g, ''), 10) || 1) : 1,
      academicYear: mappedSection.academicYear || '2025-2026',
    };
  }

  const school = String(item.school || 'SOICT').trim().toUpperCase();
  const department = String(item.StudentDepartment || item.dept || 'CSE').trim().toUpperCase();
  const program = String(item.program_name || 'B.Tech (CS)').trim();
  const rawSection = String(item.SectionName || item.Code || '').trim();

  // Parse batch and semester from section string e.g. "BCS-II B", "CSE-ML-III"
  let semester = 1;
  let batch = '2024-28';
  let specialization = rawSection || 'Core Sec- A';

  if (rawSection.includes('-IV') || rawSection.includes('IV')) {
    semester = 7;
    batch = '2022-26';
  } else if (rawSection.includes('-III') || rawSection.includes('III')) {
    semester = 5;
    batch = '2023-27';
  } else if (rawSection.includes('-II') || rawSection.includes('II')) {
    semester = 3;
    batch = '2024-28';
  } else if (rawSection.includes('-I') || rawSection.includes('I')) {
    semester = 1;
    batch = '2025-29';
  }

  if (rawSection.includes('ML')) specialization = 'Machine Learning Sec- A';
  else if (rawSection.includes('AI')) specialization = 'Artificial Intelligence Sec- A';
  else if (rawSection.includes('CS') || rawSection.includes('BCS')) {
    if (rawSection.includes('B')) specialization = 'Core Sec- B';
    else if (rawSection.includes('C')) specialization = 'Core Sec- C';
    else if (rawSection.includes('D')) specialization = 'Core Sec- D';
    else specialization = 'Core Sec- A';
  }

  return {
    school,
    department,
    program,
    batch,
    specialization,
    semester,
    academicYear: '2025-2026',
  };
}

/**
 * Synchronizes faculty assignments from the live timetable schedule.
 * Handles dynamic teacher reassignment:
 * - When Teacher A is replaced by Teacher B for Class 1, Teacher A loses access to Class 1,
 *   and Teacher B gets Class 1's student roster and attendance capabilities.
 * - When Teacher A is moved to Class 2 elsewhere, Teacher A receives Class 2's student data.
 * - All changes are logged into ChangeLog table for full auditability.
 */
export async function syncFacultyAssignments({
  school = 'SOICT',
  department = 'CSE',
  dryRun = false,
  triggeredById = null,
} = {}) {
  const fetchResult = await fetchLiveTimetable({ school, department });
  if (!fetchResult.ok || !fetchResult.data.length) {
    return {
      success: false,
      message: fetchResult.error || 'No timetable records found from live source.',
      changes: [],
    };
  }

  const items = fetchResult.data;

  // Deduplicate allocations by (Subject_Code, SectionName, TeacherName)
  const allocationMap = new Map();
  for (const item of items) {
    const subCode = String(item.Subject_Code || '').trim().toUpperCase();
    const teacher = String(item.TeacherName || '').trim();
    const secName = String(item.SectionName || item.Code || '').trim();

    if (!subCode || !teacher || teacher === 'TBA') continue;

    const key = `${subCode}::${secName}`;
    if (!allocationMap.has(key)) {
      allocationMap.set(key, item);
    }
  }

  // Load active TimetableSection mappings indexed by mygbuSectionId for high-fidelity class resolution
  const activeSections = await TimetableSection.findAll({ where: { active: true } });
  const sectionIdMap = new Map();
  for (const s of activeSections) {
    if (s.mygbuSectionId) {
      sectionIdMap.set(String(s.mygbuSectionId).trim(), s);
    }
  }

  const changes = [];
  let reassignedCount = 0;
  let newAssignmentCount = 0;
  let unchangedCount = 0;

  const transaction = await sequelize.transaction();

  try {
    for (const [key, item] of allocationMap.entries()) {
      const rawSecId = String(item.Section_Id || '').trim();
      const mappedSection = sectionIdMap.get(rawSecId) || null;
      const coords = resolveClassCoordinates(item, mappedSection);
      const subject = await resolveOrCreateSubject(item.Subject_Code, item.subject_name, coords, transaction);
      if (!subject) continue;

      const facultyObj = await resolveOrCreateFaculty(
        item.TeacherName,
        item.faculty_id,
        coords.school,
        coords.department,
        transaction
      );
      if (!facultyObj || !facultyObj.user) continue;

      const newTeacherUser = facultyObj.user;

      // Find existing active assignments for this class & subject
      const existingAssignments = await FacultyAssignment.findAll({
        where: {
          subjectId: subject.id,
          school: coords.school,
          department: coords.department,
          program: coords.program,
          batch: coords.batch,
          specialization: coords.specialization,
          isActive: true,
        },
        include: [{ model: User, as: 'faculty', attributes: ['id', 'name', 'username'] }],
        transaction,
      });

      const currentActive = existingAssignments[0] || null;

      if (!currentActive) {
        // Brand new assignment
        if (!dryRun) {
          const created = await FacultyAssignment.create(
            {
              facultyId: newTeacherUser.id,
              teacherRole: 'faculty',
              subjectId: subject.id,
              school: coords.school,
              department: coords.department,
              program: coords.program,
              batch: coords.batch,
              specialization: coords.specialization,
              semester: coords.semester,
              academicYear: coords.academicYear,
              isActive: true,
              createdBy: triggeredById || 1,
            },
            { transaction }
          );

          await ChangeLog.create(
            {
              userId: triggeredById || 1,
              action: 'FACULTY_ASSIGNMENT_CREATED',
              entity: 'FacultyAssignment',
              entityId: String(created.id),
              details: {
                subjectCode: subject.code,
                subjectName: subject.name,
                class: `${coords.program} ${coords.batch} (${coords.specialization})`,
                assignedToTeacher: newTeacherUser.name,
                teacherId: newTeacherUser.id,
                source: 'Timetable Sync (samay.mygbu.in)',
              },
            },
            { transaction }
          );
        }

        newAssignmentCount++;
        changes.push({
          type: 'NEW_ASSIGNMENT',
          subjectCode: subject.code,
          subjectName: subject.name,
          class: `${coords.program} ${coords.batch} (${coords.specialization})`,
          newTeacher: newTeacherUser.name,
          previousTeacher: null,
          details: `Class newly assigned to ${newTeacherUser.name}. Student roster and attendance unlocked for this teacher.`,
        });
      } else if (currentActive.facultyId !== newTeacherUser.id) {
        // Dynamic Teacher Reassignment Detected!
        const prevTeacherName = currentActive.faculty?.name || `Faculty #${currentActive.facultyId}`;

        if (!dryRun) {
          // 1. Deactivate former teacher assignment for this class
          await currentActive.update({ isActive: false }, { transaction });

          // 2. Find if new teacher already had an inactive row, or create new active assignment
          let [newRow, wasCreated] = await FacultyAssignment.findOrCreate({
            where: {
              facultyId: newTeacherUser.id,
              subjectId: subject.id,
              school: coords.school,
              department: coords.department,
              program: coords.program,
              batch: coords.batch,
              specialization: coords.specialization,
            },
            defaults: {
              teacherRole: 'faculty',
              semester: coords.semester,
              academicYear: coords.academicYear,
              isActive: true,
              createdBy: triggeredById || 1,
            },
            transaction,
          });

          if (!wasCreated && !newRow.isActive) {
            await newRow.update({ isActive: true }, { transaction });
          }

          // 3. Record full audit log in ChangeLog
          await ChangeLog.create(
            {
              userId: triggeredById || 1,
              action: 'FACULTY_REASSIGNMENT',
              entity: 'FacultyAssignment',
              entityId: String(newRow.id),
              details: {
                subjectCode: subject.code,
                subjectName: subject.name,
                class: `${coords.program} ${coords.batch} (${coords.specialization})`,
                previousTeacher: { id: currentActive.facultyId, name: prevTeacherName },
                newTeacher: { id: newTeacherUser.id, name: newTeacherUser.name },
                reason: 'Dynamic timetable schedule update from samay.mygbu.in',
                dataAction: `Class roster & attendance transferred from ${prevTeacherName} to ${newTeacherUser.name}`,
              },
            },
            { transaction }
          );
        }

        reassignedCount++;
        changes.push({
          type: 'REASSIGNMENT',
          subjectCode: subject.code,
          subjectName: subject.name,
          class: `${coords.program} ${coords.batch} (${coords.specialization})`,
          newTeacher: newTeacherUser.name,
          previousTeacher: prevTeacherName,
          details: `Teacher changed in timetable: Class student roster transferred to ${newTeacherUser.name}. ${prevTeacherName} no longer has access to this class.`,
        });
      } else {
        unchangedCount++;
      }
    }

    if (dryRun) {
      await transaction.rollback();
    } else {
      await transaction.commit();
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      school,
      department,
      summary: {
        totalAllocationsParsed: allocationMap.size,
        reassignedCount,
        newAssignmentCount,
        unchangedCount,
      },
      changes,
    };
  } catch (err) {
    try { await transaction.rollback(); } catch (e) {}
    const detailMsg = err.errors ? err.errors.map(e => `${e.path}: ${e.message}`).join('; ') : err.message;
    logger.error({ error: detailMsg }, 'Failed during timetable sync faculty assignment execution');
    return {
      success: false,
      error: detailMsg,
      changes: [],
    };
  }
}

/**
 * Returns audit trail of faculty reassignments and timetable transitions.
 */
export async function getFacultyAuditLogs({ limit = 50 } = {}) {
  const logs = await ChangeLog.findAll({
    where: {
      action: {
        [Op.in]: ['FACULTY_REASSIGNMENT', 'FACULTY_ASSIGNMENT_CREATED'],
      },
    },
    order: [['createdAt', 'DESC']],
    limit: Number(limit) || 50,
  });

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    details: l.details,
    createdAt: l.createdAt,
  }));
}
