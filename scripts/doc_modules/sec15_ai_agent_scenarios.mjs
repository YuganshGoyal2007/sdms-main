export function getSection15() {
  return `
---

# SECTION 15: Autonomous AI Agent Execution Scenarios & Comprehensive Code Modification Runbooks

This section provides explicit, step-by-step implementation playbooks designed specifically for autonomous AI coding agents (such as Google Antigravity, Devin, Claude Engineer, or OpenAI Codex). It walks through complex end-to-end development scenarios, demonstrating exactly which files to edit, which database migrations to run, and how to verify system stability.

---

## 15.1 Autonomous AI Agent Persona & Operational Protocols

When an autonomous AI agent is initialized to maintain, refactor, or enhance the GBU-SDSM codebase, the agent must adhere to the following behavioral and cognitive directives:

\`\`\`mermaid
flowchart TD
    Init[Agent Task Ingestion] --> Audit[Codebase & Database Audit]
    Audit --> Plan[Formulate Step-by-Step Implementation Plan]
    Plan --> CheckScope[Verify Tenancy & RBAC Boundaries]
    CheckScope --> Migrate[Execute Non-Destructive Migrations]
    Migrate --> BackendMod[Implement Backend Controllers & Models]
    BackendMod --> FrontMod[Update TypeScript Interfaces & React Components]
    FrontMod --> TestVerify[Execute Unit, Integration & QA Suites]
    TestVerify --> VerifyLogs[Inspect Server Logs & Confirm Zero Regressions]
    VerifyLogs --> Done[Deliver Verified Task Artifacts]
\`\`\`

1. **Non-Destructive Database Modifications**: Always write backward-compatible Sequelize migrations. Never drop existing columns without a four-phase expand-and-contract migration cycle.
2. **Strict Static Typing**: When adding new attributes or domain entities, update the canonical TypeScript interfaces in \`frontend/src/types/types.ts\` first, ensuring no compile-time type errors (\`tsc --noEmit\`).
3. **Preservation of Core Bug Fixes**: Always retain event propagation stops (\`e.stopPropagation()\`) in table action buttons, keep in-place modal drawers rather than route transitions for edits, preserve the 8 career timeline columns, and maintain fuzzy spreadsheet header matching.

---

## 15.2 Scenario 1: Implementing a New Academic Program (M.Sc. in Data Science)

### 15.2.1 Objective
Introduce a new postgraduate degree program, **Master of Science in Data Science (M.Sc. DS)**, under the School of Information and Communication Technology (SOICT), Department of Computer Science and Engineering (CSE), with sections A and B across 4 academic semesters.

### 15.2.2 Step 1: Update Frontend University Hierarchy Constants
Navigate to \`frontend/src/constants/index.ts\` and locate the \`cse\` program array. Append the new program definition:
\`\`\`typescript
// frontend/src/constants/index.ts
export const cse: Program[] = [
  { _id: '1', code: 'btech', name: 'B.Tech' },
  { _id: '2', code: 'mtech', name: 'M.Tech' },
  { _id: '3', code: 'int', name: 'B.Tech + M.Tech' },
  { _id: '4', code: 'phd', name: 'Ph.D.' },
  { _id: '5', code: 'msc_ds', name: 'M.Sc. (Data Science)' } // [NEW PROGRAM ENTRY]
];
\`\`\`

### 15.2.3 Step 2: Update Backend Validation Schema
Navigate to \`backend/validators/studentValidator.js\` and ensure the program whitelist accepts the new program identifier:
\`\`\`javascript
const validPrograms = [
  'B.Tech',
  'M.Tech',
  'B.Tech + M.Tech',
  'BCA',
  'MCA',
  'MBA',
  'Ph.D.',
  'M.Sc. (Data Science)' // [NEW WHITELIST ENTRY]
];
\`\`\`

### 15.2.4 Step 3: Seed Default Course Catalog
Create a Sequelize seed script (\`backend/seeders/20260905-seed-msc-ds-courses.js\`) to populate foundational courses:
\`\`\`javascript
'use strict';

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.bulkInsert('subjects', [
      {
        name: 'Advanced Statistical Methods for Data Science',
        code: 'DS501',
        credits: 4,
        type: 'theory',
        semester: 1,
        program: 'M.Sc. (Data Science)',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Deep Learning & Neural Architectures',
        code: 'DS503',
        credits: 4,
        type: 'theory',
        semester: 1,
        program: 'M.Sc. (Data Science)',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Data Engineering & Cloud Pipelines Lab',
        code: 'DS505',
        credits: 2,
        type: 'lab',
        semester: 1,
        program: 'M.Sc. (Data Science)',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('subjects', { program: 'M.Sc. (Data Science)' });
  }
};
\`\`\`
Execute the seed script:
\`\`\`bash
cd backend && npx sequelize-cli db:seed --seed 20260905-seed-msc-ds-courses.js
\`\`\`

---

## 15.3 Scenario 2: Adding QR Code Attendance Marking Mode

### 15.3.1 Objective
Empower instructors to display a dynamic, time-sensitive QR code on the lecture hall projector that enrolled students scan via mobile camera to record their own attendance with cryptographic proof of physical classroom presence.

### 15.3.2 Step 1: Database Migration for QR Attendance Tokens
Create a new migration (\`backend/migrations/20260905-add-qr-token-to-attendance-sessions.js\`):
\`\`\`javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('attendance_sessions', 'qrSessionToken', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.addColumn('attendance_sessions', 'qrTokenExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.addColumn('attendance_records', 'verificationMethod', {
      type: Sequelize.ENUM('manual', 'qr_scan', 'biometric', 'rfid'),
      allowNull: false,
      defaultValue: 'manual'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('attendance_sessions', 'qrSessionToken');
    await queryInterface.removeColumn('attendance_sessions', 'qrTokenExpiresAt');
    await queryInterface.removeColumn('attendance_records', 'verificationMethod');
  }
};
\`\`\`

### 15.3.3 Step 2: Backend Dynamic QR Generator & Verification Controller
Add to \`backend/controllers/attendanceController.js\`:
\`\`\`javascript
const crypto = require('crypto');

// Generate 30-second rotating QR token
exports.generateSessionQrToken = async (req, res) => {
  const { sessionId } = req.params;
  const session = await AttendanceSession.findByPk(sessionId);
  if (!session) return res.status(404).json({ success: false, message: "Session not found" });

  const randomToken = crypto.randomBytes(32).toString('hex');
  session.qrSessionToken = randomToken;
  session.qrTokenExpiresAt = new Date(Date.now() + 30 * 1000); // 30-second TTL
  await session.save();

  return res.json({
    success: true,
    token: randomToken,
    expiresAt: session.qrTokenExpiresAt
  });
};

// Student scans QR and submits token
exports.claimQrAttendance = async (req, res) => {
  const { sessionId, token } = req.body;
  const student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) return res.status(403).json({ success: false, message: "Only enrolled students can scan" });

  const session = await AttendanceSession.findByPk(sessionId);
  if (!session) return res.status(404).json({ success: false, message: "Session not found" });

  if (session.qrSessionToken !== token || new Date() > session.qrTokenExpiresAt) {
    return res.status(400).json({ success: false, message: "QR token expired or invalid" });
  }

  // Upsert attendance record
  await AttendanceRecord.upsert({
    sessionId: session.id,
    studentId: student.id,
    status: 'Present',
    verificationMethod: 'qr_scan',
    remarks: 'Verified via dynamic classroom QR scan'
  });

  return res.json({ success: true, message: "Attendance recorded successfully" });
};
\`\`\`

---

## 15.4 Scenario 3: Building a Departmental Placement Analytics Pipeline

### 15.4.1 Objective
Provide university executives and placement cell officers with aggregated analytics: highest CTC package, average CTC package, placement rate percentage per branch, and top corporate recruiters.

### 15.4.2 SQL Aggregation Engine
Implement analytical queries within \`backend/controllers/reportController.js\`:
\`\`\`javascript
exports.getDepartmentPlacementAnalytics = async (req, res) => {
  try {
    const { department, academicYear } = req.query;

    const summaryStats = await sequelize.query(\`
      SELECT 
        s.branch,
        COUNT(s.id) AS totalEligible,
        SUM(CASE WHEN s.placed = 1 THEN 1 ELSE 0 END) AS totalPlaced,
        ROUND((SUM(CASE WHEN s.placed = 1 THEN 1 ELSE 0 END) / COUNT(s.id)) * 100, 2) AS placementPercentage,
        MAX(CAST(REGEXP_REPLACE(s.package, '[^0-9.]', '') AS DECIMAL(10,2))) AS highestPackageLPA,
        ROUND(AVG(CASE WHEN s.placed = 1 THEN CAST(REGEXP_REPLACE(s.package, '[^0-9.]', '') AS DECIMAL(10,2)) ELSE NULL END), 2) AS averagePackageLPA
      FROM students s
      WHERE (:department IS NULL OR s.department = :department)
      GROUP BY s.branch
    \`, {
      replacements: { department: department || null },
      type: QueryTypes.SELECT
    });

    const topRecruiters = await sequelize.query(\`
      SELECT 
        s.company,
        COUNT(s.id) AS offersCount,
        MAX(CAST(REGEXP_REPLACE(s.package, '[^0-9.]', '') AS DECIMAL(10,2))) AS maxOfferedPackage
      FROM students s
      WHERE s.placed = 1 AND s.company IS NOT NULL
      GROUP BY s.company
      ORDER BY offersCount DESC
      LIMIT 10
    \`, { type: QueryTypes.SELECT });

    return res.json({
      success: true,
      data: {
        summaryStats,
        topRecruiters
      }
    });
  } catch (error) {
    console.error("Error computing placement analytics:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
\`\`\`

---

## 15.5 Scenario 4: Automated Database Migration & Rollback Protocol

When schema modifications are required:
1. **Generate Migration Boilerplate**:
   \`\`\`bash
   cd backend && npx sequelize-cli migration:generate --name add-fields-to-students
   \`\`\`
2. **Implement \`up\` and \`down\` Methods**:
   Ensure that every addition in \`up\` is mirrored by a precise deletion in \`down\` within an explicit transaction.
3. **Execute Migration in Staging**:
   \`\`\`bash
   npx sequelize-cli db:migrate
   \`\`\`
4. **Test Rollback Integrity**:
   \`\`\`bash
   npx sequelize-cli db:migrate:undo
   \`\`\`
   Verify that database schema matches original state before reapplying.
5. **Reapply Migration & Update Models**:
   \`\`\`bash
   npx sequelize-cli db:migrate
   \`\`\`
   Update corresponding Sequelize model attributes in \`backend/models/\`.

---

## 15.6 Scenario 5: Production Incident Triage Runbook

When alerted to a production incident (such as unexpected 500 responses or unresponsive APIs):

\`\`\`
Step 1: Check Process Health
$ pm2 list
Verify process status (online vs errored vs restart count).

Step 2: Inspect Real-Time Error Logs
$ pm2 logs gbu-sdms-api --err --lines 50
Extract stack trace and identify failing module.

Step 3: Correlate Inbound Request ID
Match client error message 'correlationId' with server logs to locate exact request body and parameters.

Step 4: Check Database Connectivity & Pool
$ mysqladmin -u sdms_user -p ping
Inspect active threads: SHOW FULL PROCESSLIST;

Step 5: Apply Code Fix & Execute Zero-Downtime Reload
$ git pull origin main
$ pm2 reload gbu-sdms-api --update-env

Step 6: Run Health Check
$ curl -I https://sdms.gbu.ac.in/api/health
Verify HTTP 200 OK and response latency < 100ms.
\`\`\`
`;
}
