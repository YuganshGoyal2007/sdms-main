export function getSection14() {
  return `
---

# SECTION 14: Master Technical Glossary, File-by-File Codebase Index & Autonomous Agent Operational Protocol

This final section serves as the definitive reference lexicon and source file directory for Gautam Buddha University Student Data Management System (GBU-SDSM). It provides comprehensive definitions for academic and technical terminology, an exhaustive file-by-file index of every source artifact in the repository, and non-negotiable architectural invariants for autonomous engineering agents.

---

## 14.1 Comprehensive Technical Glossary & Domain Lexicon

| Term / Acronym | Classification | Formal Technical Definition & Operational Context in GBU-SDSM |
| :--- | :--- | :--- |
| **ACID** | Database Architecture | Atomicity, Consistency, Isolation, Durability. The four foundational transaction properties guaranteed by MySQL InnoDB engine and utilized via Sequelize managed transactions (\`sequelize.transaction\`) to ensure multi-table writes succeed or fail atomically. |
| **Bcrypt** | Cryptography | A Blowfish-based adaptive key derivation function designed by Niels Provos and David Mazières. Utilized with a work factor of 10 salt rounds to hash all user authentication passwords prior to database persistence. |
| **BOLA / IDOR** | Cybersecurity | Broken Object Level Authorization / Insecure Direct Object Reference. An access control flaw where an application uses user-supplied input to access an object directly without validating that the user is authorized for that specific resource. GBU-SDSM mitigates BOLA by enforcing mandatory tenancy scope filters (e.g., matching coordinator program/branch/section). |
| **CategoryView** | UI Component | A structured presentation component within the student details view that divides comprehensive student records into distinct visual sections: Personal, Contact, Academic, and Career/Placement. |
| **CORS** | Network Security | Cross-Origin Resource Sharing. A W3C mechanism using HTTP headers to tell browsers whether a web application running at one origin has permission to access resources from a server at a different origin. Configured in \`server.js\` with explicit origin whitelisting and \`credentials: true\`. |
| **CSP** | Network Security | Content Security Policy. An HTTP response header (\`Content-Security-Policy\`) enforced via Helmet middleware that restricts the sources from which scripts, styles, images, and frames can be loaded, preventing Cross-Site Scripting (XSS). |
| **CSRF** | Cybersecurity | Cross-Site Request Forgery. An attack that forces an end user to execute unwanted actions on a web application in which they are currently authenticated. GBU-SDSM prevents CSRF by requiring custom \`Authorization: Bearer\` headers for state-changing API operations. |
| **Defaulter** | Academic Domain | A student whose cumulative attendance percentage falls below the mandatory institutional threshold of 75.0%. Defaulters are highlighted in yellow/red on dashboards and are debarred from sitting for end-semester examinations unless granted formal administrative condonation. |
| **Dual-Token Engine**| Authentication | An authentication pattern combining short-lived Access Tokens (15-minute lifespan, stored in memory or client state) with long-lived Refresh Tokens (7-day lifespan, stored in HttpOnly, Secure, SameSite=Strict cookies) to balance high security with seamless user sessions. |
| **Enrollment Number**| Academic Domain | A unique 10-digit institutional identifier assigned to every matriculated student at Gautam Buddha University (e.g. \`2500100481\`). Serves as the primary immutable identifier across student dossiers, academic records, and login identifiers. |
| **FacultyAssignment**| Relational Entity | A database mapping table linking a specific instructor (\`facultyId\`) to a course subject (\`subjectId\`), academic program, branch, semester, and section, establishing instructor authority to mark class attendance and message students. |
| **Fuzzy Header Matching**| Data Engineering | A heuristic algorithm that normalizes spreadsheet column headers by stripping non-alphanumeric characters, lowercasing, and matching against an alias dictionary to automate student enrollment ingestion. |
| **HSTS** | Network Security | HTTP Strict Transport Security. An HTTP response header informing browsers that the site must only be accessed using HTTPS, preventing SSL-stripping man-in-the-middle attacks. Configured with a 1-year max-age. |
| **JWT** | Authentication | JSON Web Token (RFC 7519). A compact, URL-safe means of representing claims to be transferred between two parties. Signed using HMAC SHA-256 (\`HS256\`) parameterized by \`JWT_SECRET\`. |
| **Lateral Entry** | Academic Domain | An admission pathway whereby students holding an accredited 3-year engineering diploma or B.Sc. degree enter directly into the second year (3rd semester) of a four-year B.Tech program. |
| **Multer** | Middleware | Node.js middleware for handling \`multipart/form-data\` primarily used for uploading student spreadsheets and photographs. Configured with memory storage for zero-disk-leak spreadsheet parsing. |
| **OTP** | Security | One-Time Password. A 6-digit numeric cryptographic code generated via \`crypto.randomInt\` with a 10-minute expiration TTL used for password recovery workflows. |
| **PITR** | Infrastructure | Point-In-Time Recovery. The process of restoring a database to an exact historical timestamp by combining a full logical snapshot with incremental MySQL binary transaction logs. |
| **RBAC** | Authorization | Role-Based Access Control. An access governance mechanism that restricts system operations to authorized users based on their assigned role (\`admin\`, \`chairperson\`, \`coordinator\`, \`faculty\`, \`student\`). |
| **Redux Toolkit (RTK)**| Frontend Architecture | The official, opinionated toolset for efficient Redux state development. Powers application state slices (\`adminSlice\`, \`userSlice\`) with immutable state updates via Immer. |
| **SameSite Cookie** | Web Security | A cookie attribute instructing browsers whether cookies should be sent with cross-site requests. GBU-SDSM configures \`SameSite=Strict\` on refresh tokens to prevent cross-site exfiltration. |
| **Sequelize** | ORM | A promise-based Node.js Object-Relational Mapping library for MySQL that manages relational models, associations, migrations, lifecycle hooks, and parameterized queries. |
| **SheetJS (xlsx)** | Data Processing | A high-performance JavaScript spreadsheet parser and builder utilized in GBU-SDSM for both server-side bulk Excel ingestion and client-side data exports. |
| **SPA** | Web Architecture | Single Page Application. A web application architecture that interacts with the user by dynamically rewriting the current web page with data from the API server rather than loading entire new pages from the server. |
| **Tailwind CSS** | Styling Engine | A utility-first CSS framework providing responsive classes, color tokens, typography scales, and UI consistency across all GBU-SDSM portals. |
| **Tenancy Isolation**| Architecture | Logical partitioning of relational data ensuring that batch coordinators and faculty members can only read and mutate records belonging to their assigned classes and sections. |
| **Token Rotation** | Security | A security practice where every invocation of the refresh endpoint issues both a new access token and a brand-new refresh token while invalidating the old refresh token. |
| **Vite** | Build Tool | A frontend build tool that leverages native ES modules in development for instant server start and Rollup for production bundle optimization. |

---

## 14.2 Master Source File Index & Component Mapping

### 14.2.1 Backend Server & Middleware Architecture (\`backend/\`)
- **\`server.js\`**: Express application entry point; initializes HTTP listener, registers Helmet, CORS, body parsers, rate limiters, static file routes, API router mounts, and centralized error handler.
- **\`config/database.js\`**: Initializes Sequelize connection instance, configures connection pool parameters (\`max\`, \`min\`, \`acquire\`, \`idle\`), and exports database connection handle.
- **\`middleware/authMiddleware.js\`**: JWT verification middleware; extracts Bearer token, validates signature, looks up active user record, and populates \`req.user\`.
- **\`middleware/roleMiddleware.js\`**: Role authorization middleware factory; enforces role membership (\`verifyRole\`) and tenancy boundary constraints.
- **\`middleware/rateLimiter.js\`**: Express rate limiters for general API traffic (500 requests / 15 min) and authentication endpoints (10 requests / 15 min).
- **\`middleware/securityHeaders.js\`**: Helmet security headers configuration (CSP, X-Frame-Options, HSTS, nosniff).
- **\`middleware/requestLogger.js\`**: UUIDv4 correlation ID generator and HTTP request latency auditor.
- **\`middleware/multerUpload.js\`**: Memory and disk storage engines for file uploads with MIME filtering and size caps.

### 14.2.2 Backend Relational Models (\`backend/models/\`)
- **\`User.js\`**: Core identity model; stores email, username, enrollmentNo, password hash, role, status flags, OTP tokens, and token versions.
- **\`Student.js\`**: Comprehensive student record; demographic fields, academic parameters, category, address, and the 8 new internship and placement attributes.
- **\`Coordinator.js\`**: Academic batch coordinator; stores user foreign key, department, assigned program, branch, and section.
- **\`Chairperson.js\`**: Departmental executive model; maps user to departmental jurisdiction.
- **\`ChairpersonClass.js\`**: Junction table mapping Chairpersons to multiple academic classes and sections.
- **\`Faculty.js\`**: Faculty profile; employee code, designation, department, contact details.
- **\`FacultyAssignment.js\`**: Relational binding mapping faculty members to course subjects and class sections.
- **\`AttendanceSession.js\`**: Class attendance session header; subject, instructor, date, slot, session type, lock status.
- **\`AttendanceRecord.js\`**: Individual student attendance status row (\`Present\`, \`Absent\`, \`Late\`, \`Excused\`) for a session.
- **\`Course.js\` / \`Subject.js\`**: Course catalog; course name, code, credits, lecture/lab type, semester.
- **\`Timetable.js\`**: Weekly class schedule matrix mapping days, time slots, courses, venues, and instructors.
- **\`Message.js\`**: Inter-user and broadcast communications ledger.
- **\`AuditLog.js\`**: Immutable security audit trail recording administrative actions, overrides, and timestamps.

### 14.2.3 Backend API Controllers (\`backend/controllers/\`)
- **\`authController.js\`**: Authentication workflows: login, logout, me, refresh token, forgot password, OTP verification, reset password.
- **\`studentController.js\`**: Student management: query, filter, single create, update, delete, bulk upload, bulk edit, CSV export.
- **\`coordinatorController.js\`**: Coordinator scoped operations: class dashboard, class student roster, scoped single edit, scoped bulk edit.
- **\`chairpersonController.js\`**: Departmental management: cross-program metrics, class overview, faculty assignments, departmental student search.
- **\`facultyController.js\`**: Faculty operations: assigned classes, teaching schedule, student rosters, profile management.
- **\`attendanceController.js\`**: Attendance engine: session creation, atomic record marking, 24h edits, session locking, administrative overrides, percentage calculations.
- **\`messageController.js\`**: Communication engine: inbox queries, direct messaging, class broadcast, universal notification dispatch.
- **\`timetableController.js\`**: Timetable schedule retrieval and grid management.

### 14.2.4 Frontend Single Page Application (\`frontend/src/\`)
- **\`App.tsx\`**: Root router architecture; configures public, auth, and role-guarded portal routes.
- **\`main.tsx\`**: React DOM root mounting, Redux Provider binding, global style loading.
- **\`store/index.ts\`**: Redux Toolkit store initialization with typed hooks.
- **\`store/adminSlice.ts\`**: Administrative state slice managing student records, statistics, and filters.
- **\`store/userSlice.ts\`**: Authentication state slice managing session tokens, role, and current profile.
- **\`utils/api.ts\`**: Axios singleton with request token injector and response 401 refresh interceptor.
- **\`types/types.ts\`**: Canonical TypeScript type definitions and interfaces for all domain entities.
- **\`constants/index.ts\`**: Master university academic hierarchy (Schools, Departments, Programs, Degrees).

---

## 14.3 Common Developer & AI Agent Command Reference

| Operational Task | Shell / Terminal Command | Expected Output & Impact |
| :--- | :--- | :--- |
| **Install Backend Dependencies** | \`cd backend && npm install\` | Installs production and development Node.js packages into \`node_modules\`. |
| **Install Frontend Dependencies**| \`cd frontend && npm install\` | Installs Vite, React, Redux Toolkit, and Tailwind dependencies. |
| **Launch Backend Dev Server** | \`cd backend && npm run dev\` | Starts Express listener on \`http://localhost:5000\` with nodemon live-reloading. |
| **Launch Frontend Dev Server** | \`cd frontend && npm run dev\` | Starts Vite dev server on \`http://localhost:5173\` with Hot Module Replacement. |
| **Execute Database Migrations** | \`cd backend && npx sequelize-cli db:migrate\` | Applies pending database migrations to the configured MySQL schema. |
| **Rollback Last Migration** | \`cd backend && npx sequelize-cli db:migrate:undo\` | Reverts the most recent migration file transactionally. |
| **Run Production Frontend Build** | \`cd frontend && npm run build\` | Compiles TypeScript and produces optimized static bundle in \`frontend/dist/\`. |
| **PM2 Production Process Start** | \`pm2 start ecosystem.config.js --env production\` | Launches clustered Node.js API processes under daemon supervision. |
| **Inspect Production API Logs** | \`pm2 logs gbu-sdms-api --lines 100\` | Displays live streaming stdout and stderr log output. |
| **PM2 Zero-Downtime Reload** | \`pm2 reload gbu-sdms-api --update-env\` | Gracefully reloads worker processes sequentially without dropping active connections. |
| **Database Connection Test** | \`mysqladmin -u sdms_user -p ping\` | Verifies that the MySQL server daemon is responsive (\`mysqld is alive\`). |

---

## 14.4 Non-Negotiable Architectural Invariants for Autonomous AI Agents

When future autonomous AI agents (such as Google Antigravity or peer coding agents) are tasked with maintaining, extending, or refactoring GBU-SDSM, they must strictly comply with these seven core architectural invariants:

1. **Strict Tenancy Scoping on All Coordinator & Faculty Endpoints**:
   Never allow a coordinator to query, view, or modify students outside their assigned program, branch, and section. All Sequelize queries for coordinators must include the scope filter.
2. **Atomic Multi-Table Transactions**:
   Any operation modifying more than one relational table (e.g. creating student + user accounts, or creating attendance sessions + attendance records) must be executed inside a managed \`sequelize.transaction()\`. Never commit partial writes.
3. **In-Memory Buffer Streaming for Spreadsheets**:
   Never write uploaded Excel spreadsheets to disk. Always ingest files into memory via Multer and parse directly via \`xlsx.read(buffer)\` to avoid temporary file accumulation and disk leaks.
4. **Preservation of the 8 Career / Placement Schema Columns**:
   Never alter or remove \`internshipCompany\`, \`internshipDoj\`, \`internshipDoe\`, \`internshipIsPaid\`, \`internshipStipend\`, \`placementCompany\`, \`placementDoj\`, or \`placementIsPaid\` without executing an explicit, non-destructive migration.
5. **No Route-Redirect Disruption on In-Place Edits**:
   Maintain in-place modal/drawer editing experiences (using \`StudentForm.tsx\` and stopping event propagation with \`e.stopPropagation()\`) to ensure that coordinators and admins are never redirected back to dashboards when editing records.
6. **Double-Layered Defense on Passwords & Tokens**:
   Never store plaintext passwords; always salt with bcrypt at work factor 10. Store refresh tokens exclusively in \`HttpOnly\`, \`Secure\`, \`SameSite=Strict\` cookies.
7. **Comprehensive Error Redaction in Production**:
   Ensure that \`NODE_ENV === 'production'\` prevents stack traces or raw database error messages from leaking to client browsers.
`;
}
