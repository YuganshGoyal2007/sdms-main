export function getSection11() {
  return `
---

# SECTION 11: Comprehensive Quality Assurance Playbooks & Test Verification Matrix

This section establishes the formal Quality Assurance (QA) verification framework for the Gautam Buddha University Student Data Management System. It contains 48 rigorous test cases spanning authentication, authorization, student administration, attendance workflows, communication channels, and timetable scheduling.

---

## 11.1 QA Testing Philosophy & Testing Pyramid Architecture

GBU-SDSM adheres to a multi-tiered test verification architecture:
- **Unit Testing Layer**: Isolates individual functions, utility algorithms (fuzzy header normalizer, attendance percentage calculator), and data transformation hooks.
- **Integration Testing Layer**: Exercises Express route controllers, middleware chains, database transactions, and Sequelize model hooks against an active test database.
- **End-to-End (E2E) & Acceptance Layer**: Simulates real user and autonomous agent journeys through browser workflows, verifying DOM updates, modal transitions, and asynchronous Redux state synchronization.

\`\`\`mermaid
pie title SDSM Test Coverage Distribution
    "Unit Tests (Algorithms & Utils)" : 35
    "Integration Tests (APIs & Transactions)" : 40
    "End-to-End Tests (Portals & Workflows)" : 25
\`\`\`

---

## 11.2 Authentication & Session QA Test Suite

### TC-AUTH-01: Super Administrator Login Verification
- **Pre-conditions**: Database populated with default administrator account (\`admin@gbu.ac.in\`).
- **Input Parameters**: \`{ "identifier": "admin@gbu.ac.in", "password": "AdminSecurePassword2026!", "role": "admin" }\`.
- **Execution Steps**:
  1. Dispatch HTTP POST to \`/api/auth/login\`.
  2. Inspect response status code and JSON envelope.
  3. Inspect Set-Cookie header for \`refreshToken\`.
- **Expected Results**: Status code \`200 OK\`. Payload contains valid JWT \`token\` with claim \`role: "admin"\`. \`refreshToken\` cookie issued with \`HttpOnly\`, \`SameSite=Strict\`, and \`Path=/api/auth\`.
- **Pass / Fail Invariants**: Response time must be $< 250\\text{ms}$. No password or hash strings leaked in payload.

### TC-AUTH-02: Faculty Login with Email & Course Binding
- **Pre-conditions**: Active faculty user record with associated teaching assignment.
- **Input Parameters**: \`{ "identifier": "faculty.cs@gbu.ac.in", "password": "FacultyPassword123!", "role": "faculty" }\`.
- **Execution Steps**: Authenticate via login API; parse returned token; query \`GET /api/faculty/classes\`.
- **Expected Results**: Status code \`200 OK\`. Class list contains assigned courses with active semester and section metadata.

### TC-AUTH-03: Student Login with Enrollment Number & Initial Password
- **Pre-conditions**: Student enrolled with enrollment number \`2500100481\` and default university password \`GBU@2500100481\`.
- **Input Parameters**: \`{ "identifier": "2500100481", "password": "GBU@2500100481", "role": "student" }\`.
- **Execution Steps**: Submit login payload. Verify response payload.
- **Expected Results**: Status code \`200 OK\`. Returned student profile shows student name, enrolled program (\`B.Tech\`), branch (\`Computer Science and Engineering\`), and section (\`A\`).

### TC-AUTH-04: Credential Mismatch & Rate Limiter Increment
- **Pre-conditions**: Registered user exists.
- **Input Parameters**: Valid identifier, incorrect candidate password.
- **Execution Steps**: Post incorrect credentials. Repeat 5 times consecutively within 60 seconds.
- **Expected Results**: Attempts 1 through 4 return \`401 Unauthorized\` with generic error message *"Invalid credentials"*. Attempt 5 triggers account temporary lock flag. Attempt 6 returns \`429 Too Many Requests\` or \`403 Forbidden\` with lockout delay metadata.

### TC-AUTH-05: Silent Access Token Refresh Pipeline
- **Pre-conditions**: User possesses valid \`refreshToken\` cookie; access token has expired ($> 15\\text{ minutes}$).
- **Execution Steps**: Dispatch \`GET /api/auth/me\` with expired Bearer token.
- **Expected Results**: Backend returns \`401 Unauthorized\` (\`TOKEN_EXPIRED\`). Frontend Axios interceptor catches 401, issues \`POST /api/auth/refresh-token\`, receives fresh access token, updates Redux store and \`localStorage\`, and replays original request transparently to the user.

### TC-AUTH-06: Compromised Refresh Token Reuse & Revocation Cascading
- **Pre-conditions**: Refresh token $R_1$ is exchanged for $R_2$ (incrementing \`tokenVersion\` from 1 to 2).
- **Execution Steps**: Malicious actor attempts to submit rotated token $R_1$ to \`/api/auth/refresh-token\`.
- **Expected Results**: Server detects \`tokenVersion\` claim mismatch ($1 \\ne 2$). Transaction immediately marks all sessions for that \`userId\` as revoked, increments \`tokenVersion\` to 3, and returns \`401 Unauthorized\` (*"Session compromised; re-authentication mandatory"*).

### TC-AUTH-07: Password Reset One-Time Password (OTP) Generation
- **Execution Steps**: Dispatch \`POST /api/auth/forgot-password\` with registered email.
- **Expected Results**: Status code \`200 OK\`. Database user row updates with 6-digit numeric OTP and 10-minute expiry timestamp. SMTP service logs successful dispatch.

### TC-AUTH-08: Password Reset OTP Expiration Validation
- **Execution Steps**: Attempt verification of OTP with an artificially aged \`resetPasswordExpires\` ($> 10\\text{ minutes}$ in the past).
- **Expected Results**: Status code \`400 Bad Request\` with message *"OTP has expired. Please request a new code."*

---

## 11.3 Student Administration QA Test Suite

### TC-STUD-01: Single Student Profile Creation
- **Pre-conditions**: Admin logged in.
- **Input Parameters**: Complete demographic, academic, and contact JSON object.
- **Execution Steps**: Dispatch \`POST /api/admin/students\`.
- **Expected Results**: Status code \`201 Created\`. Database creates both \`users\` row and \`students\` row with matching foreign key in a single atomic transaction.

### TC-STUD-02: Duplicate Enrollment Number Collision Prevention
- **Execution Steps**: Submit student creation payload containing an existing enrollment number (\`2500100481\`).
- **Expected Results**: Status code \`409 Conflict\`. Transaction automatically rolls back. No duplicate record inserted.

### TC-STUD-03: Bulk Excel Spreadsheet Upload with Standard Headers
- **Pre-conditions**: Excel file (\`roster_valid.xlsx\`) containing 50 valid student rows with canonical column headers.
- **Execution Steps**: Dispatch multipart upload to \`/api/admin/students/bulk-upload\`.
- **Expected Results**: Status code \`200 OK\`. Ingestion summary returns \`{ insertedCount: 50, updatedCount: 0, skippedCount: 0, errors: [] }\`.

### TC-STUD-04: Bulk Excel Upload with Fuzzy Aliased Headers
- **Pre-conditions**: Spreadsheet with headers renamed: \`"Roll Number"\`, \`"Candidate Name"\`, \`"Email ID"\`, \`"Discipline"\`, \`"Date of Birth"\`.
- **Execution Steps**: Dispatch upload to \`/api/admin/students/bulk-upload\`.
- **Expected Results**: Normalization engine maps all aliased headers correctly to schema attributes without manual intervention; 100% of rows ingested successfully.

### TC-STUD-05: Bulk Excel Upload Transaction Rollback on Schema Violation
- **Pre-conditions**: Spreadsheet containing 49 valid rows and 1 corrupted row (invalid enrollment number format and missing name).
- **Execution Steps**: Dispatch upload to \`/api/admin/students/bulk-upload\`.
- **Expected Results**: The atomic transaction rolls back all 50 rows. Response returns \`400 Bad Request\` with detailed row-level error log pointing directly to row 38.

### TC-STUD-06: Student Profile CategoryView Display
- **Execution Steps**: Open student detail modal in Coordinator or Admin portal.
- **Expected Results**: \`CategoryView\` renders segmented cards: Personal, Academic, Contact, Address, and Placement/Internship sections. All 8 new internship and placement fields display formatted values (Company name, formatted DOJ/DOE dates, Paid/Unpaid badge, Stipend, Package).

### TC-STUD-07: Single Student Edit with Internship & Placement Attributes
- **Execution Steps**: Coordinator opens edit form for an assigned student, inputs:
  - \`internshipCompany: "Google India"\`
  - \`internshipDoj: "2026-06-01"\`
  - \`internshipDoe: "2026-08-31"\`
  - \`internshipIsPaid: true\`
  - \`internshipStipend: "100000/month"\`
  - \`placed: true\`
  - \`company: "Google"\`
  - \`package: "32 LPA"\`
  - \`placementDoj: "2027-07-15"\`
  - \`placementIsPaid: true\`
  Submits form via \`PUT /api/coordinator/students/:id\`.
- **Expected Results**: Status code \`200 OK\`. Database updates all 8 attributes. Modal closes smoothly without dashboard redirection.

### TC-STUD-08: Chronological Date Validation Invariant
- **Execution Steps**: Input \`internshipDoj = "2026-09-01"\` and \`internshipDoe = "2026-05-01"\` (Exit date before Joining date).
- **Expected Results**: Frontend validation highlights date fields in red with message *"Internship completion date must occur after joining date"*. Submission is prevented.

### TC-STUD-09: Coordinator Data Isolation & Tampering Defense
- **Pre-conditions**: Coordinator $C_1$ is assigned to Section A. Student $S_2$ belongs to Section B.
- **Execution Steps**: $C_1$ crafts an HTTP \`PUT /api/coordinator/students/:id\` targeting student $S_2$'s ID.
- **Expected Results**: Controller checks coordinator's assigned section against $S_2$'s section, rejects request with \`403 Forbidden\` (*"Unauthorized: Student does not belong to your assigned section"*).

### TC-STUD-10: Multi-Select Bulk Edit in Coordinator Portal
- **Execution Steps**: Coordinator selects 15 students in Section A, clicks "Bulk Edit", sets \`year: 4\`, \`semester: 7\`, clicks "Apply Changes".
- **Expected Results**: Bulk edit API executes scoped update. All 15 selected students advance to Year 4, Semester 7. Students in Section B remain unaffected.

---

## 11.4 Attendance Marking & Auditing QA Test Suite

### TC-ATT-01: Faculty Assigned Class Roster Loading
- **Execution Steps**: Faculty member navigates to \`/faculty/attendance\`, selects assigned course from dropdown.
- **Expected Results**: API queries enrolled students matching course's program, branch, and section; roster table populates with student roll numbers, names, and default status set to "Present".

### TC-ATT-02: Attendance Session Submission & Record Creation
- **Execution Steps**: Instructor marks 3 students "Absent", adds topic *"Binary Search Trees & AVL Balancing"*, clicks "Submit Attendance".
- **Expected Results**: Status code \`201 Created\`. \`attendance_sessions\` record created; corresponding \`attendance_records\` rows inserted in atomic transaction.

### TC-ATT-03: Duplicate Attendance Session Prevention
- **Execution Steps**: Instructor attempts to mark a second attendance session for the identical class, date, and lecture slot.
- **Expected Results**: Status code \`409 Conflict\` with message *"An attendance session has already been recorded for this course and time slot today"*.

### TC-ATT-04: Session Modification Within 24-Hour Grace Window
- **Execution Steps**: Instructor modifies an attendance record 4 hours after session submission (changing a student from "Absent" to "Present" with remark *"Arrived with verified medical slip"*).
- **Expected Results**: Status code \`200 OK\`. Record updates; audit log records the modification timestamp and user ID.

### TC-ATT-05: Session Modification Lockout After 24 Hours
- **Execution Steps**: Faculty attempts to modify an attendance session recorded 48 hours earlier.
- **Expected Results**: Status code \`403 Forbidden\` with message *"Attendance session is locked. Historical edits require administrative authorization."*

### TC-ATT-06: Administrative Override on Locked Session
- **Execution Steps**: Administrator opens historical session, modifies status, enters mandatory audit remark *"Dean approval memo #402"*.
- **Expected Results**: Status code \`200 OK\`. Record modified; audit trail permanently binds the administrative identity and override justification.

### TC-ATT-07: Attendance Percentage Calculation Accuracy
- **Pre-conditions**: Student has 40 total conducted sessions: 32 Present, 4 Late, 4 Absent.
- **Calculation Verification**:
  $$\\text{Weighted Score} = 32 + (0.5 \\times 4) = 34.0$$
  $$\\text{Percentage} = \\left( \\frac{34.0}{40} \\right) \\times 100 = 85.0\\%$$
- **Expected Results**: \`GET /api/attendance/student/:id\` returns exactly \`85.00%\`.

### TC-ATT-08: Defaulter List Generation Threshold
- **Pre-conditions**: Class with 60 students; 8 students have attendance $< 75.0\\%$.
- **Execution Steps**: Coordinator queries defaulter report.
- **Expected Results**: Report lists exactly the 8 defaulter students, highlighting their attendance in amber/red with contact information for institutional notice generation.

---

## 11.5 Messaging & Communication QA Test Suite

### TC-MSG-01: Direct Message Delivery
- **Execution Steps**: Coordinator sends direct message to Faculty member via \`POST /api/messages/send\`.
- **Expected Results**: Message record created with \`recipientId: faculty.userId\`. Faculty inbox shows unread message with sender name and badge.

### TC-MSG-02: Class Broadcast Announcement Dispatch
- **Execution Steps**: Coordinator selects "Class Broadcast", inputs subject and content, submits.
- **Expected Results**: System queries all active students in coordinator's class section; inserts broadcast record; each student sees announcement in their portal inbox.

### TC-MSG-03: Universal Broadcast Authorization Guard
- **Execution Steps**: Coordinator or Faculty attempts to send a message with \`recipientType: "Universal"\`.
- **Expected Results**: Request terminated with \`403 Forbidden\` (*"Universal broadcasts are strictly restricted to system administrators"*).
`;
}
