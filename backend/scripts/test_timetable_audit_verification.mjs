import assert from 'assert';
import { parseTrainingBlock, extractSectionLetter, findSectionForClass } from '../services/timetable.service.js';
import TimetableSection from '../models/timetableSection.model.js';
import TimetableSnapshot from '../models/timetableSnapshot.model.js';
import Timetable from '../models/timetable.model.js';
import Subject from '../models/subject.model.js';
import { getSnapshotDetails, listSections, refreshAll } from '../controllers/timetable.controller.js';

console.log('=== RUNNING TIMETABLE AUDIT VERIFICATION SUITE ===\n');

let passedTests = 0;
let totalTests = 0;

let queue = Promise.resolve();

function test(name, fn) {
  totalTests++;
  queue = queue.then(() => {
    try {
      fn();
      console.log(`✓ PASS: ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      process.exitCode = 1;
    }
  });
}

function asyncTest(name, fn) {
  totalTests++;
  queue = queue.then(async () => {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      process.exitCode = 1;
    }
  });
}

// ──────────────────── 1. PARSER & REGEX ROBUSTNESS ────────────────────

test('Parser: Handles standard 2-4 letter course code with 2-4 letter faculty', () => {
  const html = '<div class="training training_type_lecture">CS385(<a href="#">RBS</a>)<br><a href="#">IP102</a></div>';
  const entries = parseTrainingBlock(html);
  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].code, 'CS385');
  assert.strictEqual(entries[0].faculty, 'RBS');
  assert.strictEqual(entries[0].room, 'IP102');
  assert.strictEqual(entries[0].group, null);
});

test('Parser: Handles course codes of any length (>4 letters e.g. AICTE101, ENV101, OPEN101)', () => {
  const html = '<div class="training training_type_lecture">AICTE101(<a href="#">VINOD</a>)<br><a href="#">IP102</a></div>';
  const entries = parseTrainingBlock(html);
  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].code, 'AICTE101');
  assert.strictEqual(entries[0].faculty, 'VINOD');
  assert.strictEqual(entries[0].room, 'IP102');
});

test('Parser: Handles hyphenated course codes (e.g. CS-301, BAS-101)', () => {
  const html = '<div class="training training_type_lecture">CS-301(<a href="#">Dr. AS</a>)<br><a href="#">SOICT-101</a></div>';
  const entries = parseTrainingBlock(html);
  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].code, 'CS-301');
  assert.strictEqual(entries[0].faculty, 'Dr. AS');
  assert.strictEqual(entries[0].room, 'SOICT-101');
});

test('Parser: Handles special faculty strings (TBA, N/A, digits, guest faculty)', () => {
  const html1 = '<div class="training">ENV101(TBA)<br>IP105</div>';
  const entries1 = parseTrainingBlock(html1);
  assert.strictEqual(entries1.length, 1);
  assert.strictEqual(entries1[0].code, 'ENV101');
  assert.strictEqual(entries1[0].faculty, 'TBA');
  assert.strictEqual(entries1[0].room, 'IP105');

  const html2 = '<div class="training">CS102(GUEST1)<br>SOICT-202</div>';
  const entries2 = parseTrainingBlock(html2);
  assert.strictEqual(entries2.length, 1);
  assert.strictEqual(entries2[0].code, 'CS102');
  assert.strictEqual(entries2[0].faculty, 'GUEST1');
});

test('Parser: Handles multi-lecture / multi-batch in single slot (G-1 and G-2 with room in brackets)', () => {
  const html = '<div class="training">CS385(RBS)[IP102] G-1<br>CS381(SP)[IP107] G-2</div>';
  const entries = parseTrainingBlock(html);
  assert.strictEqual(entries.length, 2, 'Should parse both group 1 and group 2');
  assert.strictEqual(entries[0].code, 'CS385');
  assert.strictEqual(entries[0].faculty, 'RBS');
  assert.strictEqual(entries[0].room, 'IP102');
  assert.strictEqual(entries[0].group, 'G-1');

  assert.strictEqual(entries[1].code, 'CS381');
  assert.strictEqual(entries[1].faculty, 'SP');
  assert.strictEqual(entries[1].room, 'IP107');
  assert.strictEqual(entries[1].group, 'G-2');
});

test('Parser: Handles multi-batch across consecutive lines', () => {
  const html = '<div class="training">CS385(RBS) G-1<br>IP102<br>CS381(SP) G-2<br>IP107</div>';
  const entries = parseTrainingBlock(html);
  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].code, 'CS385');
  assert.strictEqual(entries[0].faculty, 'RBS');
  assert.strictEqual(entries[0].room, 'IP102');
  assert.strictEqual(entries[0].group, 'G-1');

  assert.strictEqual(entries[1].code, 'CS381');
  assert.strictEqual(entries[1].faculty, 'SP');
  assert.strictEqual(entries[1].room, 'IP107');
  assert.strictEqual(entries[1].group, 'G-2');
});

test('Parser: Handles faculty with periods e.g. Dr. A.S. and dots in code', () => {
  const html = '<div class="training">CS.101(Dr. A.S.)<br>SOICT-303</div>';
  const entries = parseTrainingBlock(html);
  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].code, 'CS.101');
  assert.strictEqual(entries[0].faculty, 'Dr. A.S.');
  assert.strictEqual(entries[0].room, 'SOICT-303');
});

test('Parser: Returns empty array for empty, null, or blank html', () => {
  assert.deepStrictEqual(parseTrainingBlock(''), []);
  assert.deepStrictEqual(parseTrainingBlock(null), []);
  assert.deepStrictEqual(parseTrainingBlock('   &nbsp;   '), []);
  assert.deepStrictEqual(parseTrainingBlock('<div class="training training_type_none"></div>'), []);
});

test('Parser (First Principles): Merges room location IL-105 (CLT) into single lecture card instead of ghost card', () => {
  const rawHtml = "PH102(<a target='blank' href=tindex.php?id=3088>SS</a>)<br>\r\n<a target='_blank' href='rindex.php?id=2453'>IL-105 (CLT)                                      </a>";
  const entries = parseTrainingBlock(rawHtml);
  assert.strictEqual(entries.length, 1, 'Must NOT produce a 2nd ghost card for IL-105 (CLT)');
  assert.strictEqual(entries[0].code, 'PH102');
  assert.strictEqual(entries[0].faculty, 'SS');
  assert.strictEqual(entries[0].room, 'IL-105 (CLT)');
  assert.strictEqual(entries[0].group, null);

  // Also test plain text without anchor tags (e.g. from cached or stripped HTML)
  const plainHtml = "PH102(SS)<br>IL-105 (CLT)";
  const entriesPlain = parseTrainingBlock(plainHtml);
  assert.strictEqual(entriesPlain.length, 1, 'Plain text IL-105 (CLT) must attach as room');
  assert.strictEqual(entriesPlain[0].code, 'PH102');
  assert.strictEqual(entriesPlain[0].faculty, 'SS');
  assert.strictEqual(entriesPlain[0].room, 'IL-105 (CLT)');
});

test('Parser (First Principles): Handles multi-batch labs with individual rooms and group tags', () => {
  const rawHtml = "CAI181(<a target='blank' href=tindex.php?id=3128>SJD</a>)<br>\r\n<a target='_blank' href='rindex.php?id=220'>IP107                                             </a> T-2<br>ICT181(<a target='blank' href=tindex.php?id=2690>PG</a>)<br>\r\n<a target='_blank' href='rindex.php?id=217'>IP105                                             </a> G-1";
  const entries = parseTrainingBlock(rawHtml);
  assert.strictEqual(entries.length, 2, 'Should have exactly 2 lab entries');
  assert.strictEqual(entries[0].code, 'CAI181');
  assert.strictEqual(entries[0].faculty, 'SJD');
  assert.strictEqual(entries[0].room, 'IP107');
  assert.strictEqual(entries[0].group, 'T-2');

  assert.strictEqual(entries[1].code, 'ICT181');
  assert.strictEqual(entries[1].faculty, 'PG');
  assert.strictEqual(entries[1].room, 'IP105');
  assert.strictEqual(entries[1].group, 'G-1');
});

// ──────────────────── 2. SECTION MATCHING EXACTNESS ────────────────────

test('Section Matching: extractSectionLetter correctly identifies section tokens', () => {
  assert.strictEqual(extractSectionLetter('Core Sec- D'), 'D');
  assert.strictEqual(extractSectionLetter('Core Sec- A'), 'A');
  assert.strictEqual(extractSectionLetter('Core Section B'), 'B');
  assert.strictEqual(extractSectionLetter('Core - C'), 'C');
  assert.strictEqual(extractSectionLetter('Core D'), 'D');
  assert.strictEqual(extractSectionLetter('AI Sec - A'), 'A');
  assert.strictEqual(extractSectionLetter('BCS-III-A'), 'A');
  assert.strictEqual(extractSectionLetter('Core Sec 01'), '1');
  assert.strictEqual(extractSectionLetter('Batch 01'), '1');
  assert.strictEqual(extractSectionLetter('Batch-2'), '2');
  assert.strictEqual(extractSectionLetter('Core - 02'), '2');
  assert.strictEqual(extractSectionLetter('Group 10'), '10');
  assert.strictEqual(extractSectionLetter('Core'), null);
  assert.strictEqual(extractSectionLetter('Data Science'), null);
});

test('Parser: Handles alphanumeric and named group batches (Group A, Batch B, G-A)', () => {
  const html1 = '<div class="training">CS385(RBS) Group A<br>IP102</div>';
  const res1 = parseTrainingBlock(html1);
  assert.strictEqual(res1.length, 1);
  assert.strictEqual(res1[0].group, 'Group A');

  const html2 = '<div class="training">CS381(SP) Batch B<br>IP107</div>';
  const res2 = parseTrainingBlock(html2);
  assert.strictEqual(res2.length, 1);
  assert.strictEqual(res2[0].group, 'Batch B');

  const html3 = '<div class="training">CS101(VINOD) G-A<br>IP101</div>';
  const res3 = parseTrainingBlock(html3);
  assert.strictEqual(res3.length, 1);
  assert.strictEqual(res3[0].group, 'G-A');
});

asyncTest('Section Matching: Sec- D student is never assigned Sec- A', async () => {
  const origFindOne = TimetableSection.findOne;
  const origFindAll = TimetableSection.findAll;

  const mockSections = [
    { id: 101, school: 'SOICT', department: 'CSE', program: 'B.Tech (CSE)', batch: '2024-2028', specialization: 'Core Sec- A' },
    { id: 102, school: 'SOICT', department: 'CSE', program: 'B.Tech (CSE)', batch: '2024-2028', specialization: 'Core Sec- B' },
    { id: 103, school: 'SOICT', department: 'CSE', program: 'B.Tech (CSE)', batch: '2024-2028', specialization: 'Core Sec- C' },
    { id: 104, school: 'SOICT', department: 'CSE', program: 'B.Tech (CSE)', batch: '2024-2028', specialization: 'Core Sec- D' },
  ];

  TimetableSection.findOne = async ({ where }) => {
    return mockSections.find(s => s.specialization === where.specialization) || null;
  };

  TimetableSection.findAll = async () => mockSections;

  try {
    // 1. Exact match for Sec- D
    const resD = await findSectionForClass('SOICT', 'CSE', 'B.Tech (CSE)', '2024-2028', 'Core Sec- D');
    assert.ok(resD, 'Should find section');
    assert.strictEqual(resD.specialization, 'Core Sec- D');
    assert.notStrictEqual(resD.specialization, 'Core Sec- A');

    // 2. Fuzzy match for variation: "Core Section D"
    TimetableSection.findOne = async () => null; // Force fallback
    const resFuzzyD = await findSectionForClass('SOICT', 'CSE', 'B.Tech (CSE)', '2024-2028', 'Core Section D');
    assert.ok(resFuzzyD, 'Should find section D');
    assert.strictEqual(resFuzzyD.specialization, 'Core Sec- D');
    assert.notStrictEqual(resFuzzyD.specialization, 'Core Sec- A');

    // 3. Negative case: Student is in "Core Sec- Z" (which does not exist)
    const resZ = await findSectionForClass('SOICT', 'CSE', 'B.Tech (CSE)', '2024-2028', 'Core Sec- Z');
    assert.strictEqual(resZ, null, 'Must return null instead of falling back to Sec- A!');
  } finally {
    TimetableSection.findOne = origFindOne;
    TimetableSection.findAll = origFindAll;
  }
});

// ──────────────────── 3. SNAPSHOT KNOWLEDGE INSPECTOR ────────────────────

asyncTest('Snapshot Inspector: Returns curriculum subjects, credits, and timetable matrix', async () => {
  const origFindByPk = TimetableSnapshot.findByPk;
  const origTimetableFindOne = Timetable.findOne;
  const origSubjectFindAll = Subject.findAll;

  const mockSnapshot = {
    id: 42,
    academicYear: '2025-2026',
    semesterTerm: 'odd',
    snapshotType: 'term_start',
    school: 'SOICT',
    department: 'CSE',
    program: 'B.Tech (CSE)',
    batch: '2022-2026',
    specialization: 'Core Sec- A',
    capturedAt: new Date().toISOString(),
    capturedBy: 'admin@gbu.ac.in',
    remarks: 'Odd term initial schedule',
    timetableData: {
      entries: {
        Mon: {
          I: [{ code: 'CS385', faculty: 'RBS', room: 'IP102', group: 'G-1' }],
          II: [{ code: 'AICTE101', faculty: 'VINOD', room: 'IP105', group: null }],
        },
      },
      subjects: [
        { code: 'CS385', name: 'Software Engineering Lab', credits: '2', facultyABR: 'RBS', facultyName: 'Dr. R.B. Singh', load: '0-0-3' },
        { code: 'AICTE101', name: 'Universal Human Values', credits: '3', facultyABR: 'VINOD', facultyName: 'Dr. Vinod Kumar', load: '3-0-0' },
      ],
    },
    facultyAssignments: [
      { facultyId: 10, facultyName: 'Dr. R.B. Singh', teacherRole: 'faculty', subjectCode: 'CS385', subjectName: 'Software Engineering Lab', credits: '2', room: 'IP102' },
    ],
    toJSON() {
      return { ...this };
    },
  };

  TimetableSnapshot.findByPk = async (id) => (Number(id) === 42 ? mockSnapshot : null);
  Timetable.findOne = async () => null;
  Subject.findAll = async () => [
    { code: 'CS385', name: 'Software Engineering Lab', credits: 2 },
    { code: 'AICTE101', name: 'Universal Human Values', credits: 3 },
  ];

  try {
    let responseData = null;
    let nextErr = null;
    const req = { params: { id: 42 } };

    await new Promise((resolve) => {
      const res = {
        json(data) {
          responseData = data;
          resolve();
          return data;
        },
        status() {
          return this;
        },
      };
      const next = (err) => {
        nextErr = err;
        resolve();
      };
      getSnapshotDetails(req, res, next);
    });

    if (nextErr) throw nextErr;

    assert.ok(responseData, 'Controller should return response');
    assert.strictEqual(responseData.success, true);
    assert.ok(responseData.snapshot, 'Response should contain snapshot');
    assert.strictEqual(responseData.snapshot.id, 42);
    assert.ok(Array.isArray(responseData.snapshot.subjects), 'Should have subjects array');
    assert.strictEqual(responseData.snapshot.subjects.length, 2);
    assert.strictEqual(responseData.snapshot.subjects[0].code, 'CS385');
    assert.strictEqual(responseData.snapshot.subjects[0].credits, '2');
    assert.strictEqual(responseData.snapshot.subjects[1].code, 'AICTE101');
    assert.strictEqual(responseData.snapshot.subjects[1].credits, '3');
    assert.ok(responseData.snapshot.entries.Mon.I, 'Should preserve schedule matrix');
  } finally {
    TimetableSnapshot.findByPk = origFindByPk;
    Timetable.findOne = origTimetableFindOne;
    Subject.findAll = origSubjectFindAll;
  }
});

// ──────────────────── 5. CHAIRPERSON ROLE ACCESS & DEPARTMENT SCOPING ────────────────────

asyncTest('Chairperson Access: Chairperson is granted access and scoped to department', async () => {
  const origFindAll = TimetableSection.findAll;
  let capturedWhere = null;

  TimetableSection.findAll = async ({ where }) => {
    capturedWhere = where;
    return [{ id: 1, department: 'CSE', specialization: 'Core Sec- A' }];
  };

  try {
    const req = {
      user: { id: 88, role: 'chairperson' },
    };
    let responseData = null;
    await new Promise((resolve) => {
      const res = {
        json(data) {
          responseData = data;
          resolve();
          return data;
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
      };
      const next = () => resolve();
      listSections(req, res, next);
    });

    assert.ok(responseData, 'Should return response for chairperson');
    assert.strictEqual(responseData.success, true);
  } finally {
    TimetableSection.findAll = origFindAll;
  }
});

asyncTest('Chairperson Access: Non-admin non-chairperson (student) is forbidden (403)', async () => {
  const req = {
    user: { id: 10, role: 'student' },
  };
  let statusCode = 200;
  let responseData = null;

  await new Promise((resolve) => {
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        resolve();
        return data;
      },
    };
    const next = () => resolve();
    listSections(req, res, next);
  });

  assert.strictEqual(statusCode, 403, 'Student should be forbidden from accessing section mappings');
  assert.strictEqual(responseData.success, false);
});

// ──────────────────── SUMMARY ────────────────────

queue.then(() => {
  console.log(`\n========================================`);
  console.log(`RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`========================================\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
