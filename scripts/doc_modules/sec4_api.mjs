export function getSection4() {
  return `
---

# SECTION 4: Comprehensive RESTful API Specification (All 11 Route Handlers)

## 4.1 Global API Conventions & Protocol Standards

GBU-SDSM exposes an enterprise RESTful JSON API adhering to strict architectural invariants:
- **Base URI Path**: \`/api/v1\` (with legacy alias \`/api\` supported for backward compatibility).
- **Protocol**: HTTPS in staging/production, HTTP in local development.
- **Payload Format**: \`application/json\` for standard transactions; \`multipart/form-data\` for file and binary document streaming.
- **Character Encoding**: UTF-8.
- **Standard Success Response Envelope**:
  \`\`\`json
  {
    "success": true,
    "statusCode": 200,
    "message": "Operation completed successfully",
    "data": { ... },
    "meta": {
      "timestamp": "2026-09-05T06:15:30.123Z",
      "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
  }
  \`\`\`
- **Standard Paginated Response Envelope**:
  \`\`\`json
  {
    "success": true,
    "statusCode": 200,
    "data": [ ... ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 25,
      "totalRecords": 348,
      "totalPages": 14,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  \`\`\`
- **Standard Error Response Envelope**:
  \`\`\`json
  {
    "success": false,
    "statusCode": 400,
    "message": "Validation failed on input parameters",
    "errors": [
      { "field": "enrollmentNo", "message": "Enrollment number must follow GBU format (e.g. 2500100481)" }
    ],
    "meta": {
      "timestamp": "2026-09-05T06:15:30.123Z",
      "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
  }
  \`\`\`

---

## 4.2 Authentication & Identity Endpoints (\`/api/auth\`)

### 4.2.1 \`POST /api/auth/login\`
- **Description**: Authenticates a user using email, username, or enrollment number, returning an access token and issuing a refresh cookie.
- **Authorization**: Public / Unauthenticated. Rate limited to 10 requests per 15 minutes.
- **Request Body**:
  \`\`\`json
  {
    "identifier": "faculty.cs@gbu.ac.in",
    "password": "SecurePassword123!",
    "role": "faculty"
  }
  \`\`\`
- **Internal Execution Flow**:
  1. Sanitizes inputs; asserts \`identifier\` and \`password\` are non-empty strings.
  2. Queries \`User\` model matching \`email\`, \`username\`, or \`enrollmentNo\` using \`Sequelize.Op.or\`.
  3. Verifies \`user.isActive === true\` and \`user.isApproved === true\`.
  4. Calls \`bcrypt.compare(password, user.password)\`. If false, increments \`failedLoginAttempts\`.
  5. If valid, updates \`lastLoginAt = new Date()\`, resets \`failedLoginAttempts = 0\`.
  6. Generates 15-minute JWT Access Token signed with \`JWT_SECRET\`.
  7. Generates 7-day JWT Refresh Token signed with \`REFRESH_TOKEN_SECRET\`.
  8. Sets HTTP-Only Cookie \`refreshToken\`.
- **Success Response (200 OK)**:
  \`\`\`json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 42,
      "email": "faculty.cs@gbu.ac.in",
      "role": "faculty",
      "name": "Dr. Ramesh Sharma",
      "program": "B.Tech",
      "branch": "Computer Science and Engineering",
      "section": "A"
    }
  }
  \`\`\`

### 4.2.2 \`POST /api/auth/logout\`
- **Description**: Terminates session, clears HTTP-only cookie, and increments token version.
- **Authorization**: Bearer Access Token required.
- **Response (200 OK)**:
  \`\`\`json
  { "success": true, "message": "Logged out successfully" }
  \`\`\`

### 4.2.3 \`GET /api/auth/me\`
- **Description**: Retrieves current authenticated identity, profile parameters, and associated role records.
- **Authorization**: Bearer Access Token.
- **Response (200 OK)**:
  \`\`\`json
  {
    "success": true,
    "user": {
      "id": 42,
      "name": "Dr. Ramesh Sharma",
      "email": "faculty.cs@gbu.ac.in",
      "role": "faculty",
      "department": "Computer Science",
      "designation": "Associate Professor"
    }
  }
  \`\`\`

### 4.2.4 \`POST /api/auth/refresh-token\`
- **Description**: Exchanges a valid \`refreshToken\` cookie for a fresh access token.
- **Authorization**: Public endpoint; requires valid \`refreshToken\` cookie.
- **Response (200 OK)**:
  \`\`\`json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  \`\`\`

### 4.2.5 \`POST /api/auth/forgot-password\`
- **Request Body**: \`{ "email": "student@gbu.ac.in" }\`
- **Behavior**: Generates 6-digit cryptographic OTP, writes to \`users.resetPasswordOtp\` with 10-minute expiry, dispatches email notification.
- **Response (200 OK)**: \`{ "success": true, "message": "OTP sent to registered email" }\`

### 4.2.6 \`POST /api/auth/verify-reset-otp\`
- **Request Body**: \`{ "email": "student@gbu.ac.in", "otp": "489201" }\`
- **Response (200 OK)**: \`{ "success": true, "message": "OTP verified successfully" }\`

### 4.2.7 \`POST /api/auth/reset-password\`
- **Request Body**: \`{ "email": "student@gbu.ac.in", "otp": "489201", "newPassword": "NewSecurePassword456!" }\`
- **Behavior**: Validates OTP and TTL; hashes \`newPassword\` with bcrypt (10 rounds); clears OTP fields.
- **Response (200 OK)**: \`{ "success": true, "message": "Password reset successfully. Please login with new credentials." }\`

---

## 4.3 Student Administration Endpoints (\`/api/admin/students\`)

### 4.3.1 \`GET /api/admin/students\`
- **Description**: Retrieves a paginated, filterable collection of student records.
- **Authorization**: Role: \`admin\`.
- **Query Parameters**:
  - \`page\` (default \`1\`): Positive integer page index.
  - \`limit\` (default \`25\`): Records per page (max \`200\`).
  - \`program\`: e.g. \`"B.Tech"\`.
  - \`branch\`: e.g. \`"Computer Science and Engineering"\`.
  - \`year\`: e.g. \`3\` or \`semester\`: \`5\`.
  - \`section\`: e.g. \`"A"\`.
  - \`search\`: Substring match across \`name\`, \`enrollmentNo\`, \`rollNumber\`, \`email\`.
  - \`sort\`: Attribute to sort by (\`enrollmentNo\`, \`name\`, \`createdAt\`).
  - \`order\`: \`ASC\` or \`DESC\`.
- **Internal Execution Flow**:
  1. Parses query parameters and constructs a Sequelize \`whereClause\`.
  2. Substring search combines fields via \`[Op.or]: [{ name: { [Op.like]: \`%\${search}%\` } }, ...]\`.
  3. Executes \`Student.findAndCountAll({ where: whereClause, limit, offset, order, include: [User] })\`.
  4. Calculates \`totalPages = Math.ceil(count / limit)\`.
- **Success Response (200 OK)**:
  \`\`\`json
  {
    "success": true,
    "students": [
      {
        "id": 101,
        "enrollmentNo": "2500100481",
        "name": "Aarav Sharma",
        "program": "B.Tech",
        "branch": "Computer Science and Engineering",
        "year": 3,
        "section": "A",
        "cgpa": 8.75,
        "placed": true,
        "company": "Tata Consultancy Services",
        "package": "7.5 LPA"
      }
    ],
    "pagination": { "currentPage": 1, "pageSize": 25, "totalRecords": 1, "totalPages": 1 }
  }
  \`\`\`

### 4.3.2 \`GET /api/admin/students/:id\`
- **Description**: Retrieves complete record for a single student, including academic history, placement parameters, and category breakdown.
- **Authorization**: Role: \`admin\`.
- **URL Parameter**: \`id\` (Integer primary key).
- **Response (200 OK)**: Full student JSON object matching the complete Student schema.

### 4.3.3 \`POST /api/admin/students\`
- **Description**: Creates a new student profile and generates an associated \`User\` record.
- **Authorization**: Role: \`admin\`.
- **Request Body Schema**:
  \`\`\`json
  {
    "name": "Neha Verma",
    "enrollmentNo": "2500100482",
    "email": "neha.v@gbu.ac.in",
    "program": "B.Tech",
    "branch": "Information Technology",
    "year": 2,
    "section": "B",
    "gender": "Female",
    "category": "GEN",
    "dob": "2004-05-18",
    "mobileNumber": "9876543210"
  }
  \`\`\`
- **Transactional Logic**:
  1. Begins managed transaction (\`sequelize.transaction\`).
  2. Verifies that \`enrollmentNo\` and \`email\` do not collide with existing records.
  3. Creates \`User\` entry with default password (e.g. \`Student@GBU2026\`) hashed with bcrypt.
  4. Creates \`Student\` entry with foreign key \`userId: user.id\`.
  5. Commits transaction; returns created student object.

### 4.3.4 \`PUT /api/admin/students/:id\`
- **Description**: Updates all attributes of an existing student, including demographic, academic, internship, and placement details.
- **Authorization**: Role: \`admin\`.
- **Request Body**: Key-value pairs matching editable student attributes:
  \`\`\`json
  {
    "name": "Neha Verma",
    "cgpa": 8.92,
    "hasInternship": true,
    "internshipCompany": "Microsoft India",
    "internshipDoj": "2026-06-01",
    "internshipDoe": "2026-08-01",
    "internshipIsPaid": true,
    "internshipStipend": "50000/month",
    "placed": true,
    "company": "Microsoft",
    "package": "24 LPA",
    "placementDoj": "2027-07-01",
    "placementIsPaid": true
  }
  \`\`\`

### 4.3.5 \`DELETE /api/admin/students/:id\`
- **Description**: Deletes student record and cascades to attendance entries and associated user account.
- **Authorization**: Role: \`admin\`.
- **Response (200 OK)**: \`{ "success": true, "message": "Student record deleted successfully" }\`

### 4.3.6 \`POST /api/admin/students/bulk-upload\`
- **Description**: Ingests an Excel spreadsheet (\`.xlsx\` / \`.xls\`) or CSV file, parses rows in memory, performs fuzzy header matching, validates field constraints, and batch-inserts student and user records.
- **Authorization**: Role: \`admin\`. Content-Type: \`multipart/form-data\`.
- **Form Field**: \`file\` (Binary Excel buffer).
- **Processing Details**: See Section 8.2 for complete heuristic matching algorithm and error reporting.

### 4.3.7 \`POST /api/admin/students/bulk-edit\`
- **Description**: Performs batch updates across an array of selected student IDs. Used for advancing academic semesters, reassigning sections, or batch-updating placement/fee statuses.
- **Authorization**: Role: \`admin\`.
- **Request Body Schema**:
  \`\`\`json
  {
    "studentIds": [101, 102, 103, 104],
    "updates": {
      "year": 4,
      "section": "A",
      "status": "Active"
    }
  }
  \`\`\`
- **Internal Execution Flow**:
  1. Validates that \`studentIds\` is a non-empty array of valid integers.
  2. Whitelists fields within \`updates\` to prevent unauthorized attribute overwriting.
  3. Executes atomic update: \`Student.update(updates, { where: { id: { [Op.in]: studentIds } } })\`.
  4. Returns count of modified records: \`{ "success": true, "updatedCount": 4 }\`.

---

## 4.4 Coordinator Endpoints (\`/api/coordinator\`)

### 4.4.1 \`GET /api/coordinator/dashboard\`
- **Description**: Returns analytical summary for the coordinator's assigned program, branch, and section.
- **Authorization**: Role: \`coordinator\`.
- **Execution Logic**:
  1. Resolves coordinator record from \`req.user.id\`.
  2. Queries total students enrolled in coordinator's class (\`program\`, \`branch\`, \`section\`).
  3. Computes average class attendance percentage across all attendance sessions.
  4. Retrieves recent 5 attendance sessions and unread broadcast messages.
- **Success Response (200 OK)**:
  \`\`\`json
  {
    "success": true,
    "data": {
      "assignedClass": {
        "program": "B.Tech",
        "branch": "Computer Science and Engineering",
        "section": "A",
        "semester": 6
      },
      "totalStudents": 64,
      "averageAttendance": 81.4,
      "defaultersCount": 7,
      "recentSessions": [ ... ]
    }
  }
  \`\`\`

### 4.4.2 \`GET /api/coordinator/students\`
- **Description**: Retrieves list of students belonging *strictly* to the coordinator's assigned class.
- **Authorization**: Role: \`coordinator\`.
- **Security Constraint**: Controller enforces \`where: { program: coord.program, branch: coord.branch, section: coord.section }\`. Coordinator cannot access student data outside this boundary.

### 4.4.3 \`PUT /api/coordinator/students/:id\`
- **Description**: Updates an individual student profile within the coordinator's assigned class.
- **Authorization**: Role: \`coordinator\`.
- **Constraint**: Checks ownership prior to executing update. If \`student.section !== coord.section\`, immediately rejects with HTTP \`403 Forbidden\`.

### 4.4.4 \`POST /api/coordinator/students/bulk-edit\`
- **Description**: Bulk updates demographic or academic attributes for multiple students in the coordinator's class.
- **Authorization**: Role: \`coordinator\`.
- **Safety Enforcement**: Enforces \`where: { id: { [Op.in]: studentIds }, section: coord.section, branch: coord.branch }\` ensuring that cross-class student IDs passed by tampering are silently excluded from modification.

---

## 4.5 Chairperson Endpoints (\`/api/chairperson\`)

### 4.5.1 \`GET /api/chairperson/dashboard\`
- **Description**: Provides multi-class departmental overview for executive monitoring.
- **Authorization**: Role: \`chairperson\`.
- **Execution Logic**:
  1. Queries all programs and classes associated with the chairperson via \`ChairpersonClass\` join table.
  2. Aggregates student counts, gender ratios, category distributions, and overall department attendance.
  3. Returns active faculty count and list of unassigned courses.

### 4.5.2 \`GET /api/chairperson/classes\`
- **Description**: Returns all classes and sections overseen by the chairperson.
- **Response**: Array of class objects with program, branch, semester, section, and student counts.

### 4.5.3 \`GET /api/chairperson/students\`
- **Description**: Retrieves students across all classes assigned to the chairperson, supporting multi-class filtering and departmental analytics.

### 4.5.4 \`POST /api/chairperson/faculty/assign\`
- **Description**: Assigns a faculty member to teach a subject in a specific class and section.
- **Authorization**: Role: \`chairperson\` or \`admin\`.
- **Request Body**:
  \`\`\`json
  {
    "facultyId": 14,
    "subject": "Distributed Systems",
    "subjectCode": "CS402",
    "program": "B.Tech",
    "branch": "Computer Science and Engineering",
    "semester": 6,
    "section": "A",
    "academicYear": "2025-2026"
  }
  \`\`\`
- **Execution Flow**: Inserts record into \`faculty_assignments\` table.

---

## 4.6 Faculty Endpoints (\`/api/faculty\`)

### 4.6.1 \`GET /api/faculty/dashboard\`
- **Description**: Returns faculty operational dashboard metrics: assigned teaching courses, number of active classes, upcoming timetable sessions, and recent attendance entries.
- **Authorization**: Role: \`faculty\`.

### 4.6.2 \`GET /api/faculty/classes\`
- **Description**: Lists all courses, sections, and classes assigned to the logged-in faculty member.
- **Authorization**: Role: \`faculty\`.
- **Execution Logic**:
  1. Identifies faculty record from \`req.user.id\` or email.
  2. Queries \`FacultyAssignment.findAll({ where: { facultyId: faculty.id } })\`.
  3. Groups by \`program\`, \`branch\`, \`section\`, and \`subjectCode\`.
  4. Annotates each class with enrolled student count.

### 4.6.3 \`GET /api/faculty/classes/:classId/roster\`
- **Description**: Returns full list of enrolled students for a specific assigned class, ordered by enrollment number. Used directly to populate the attendance marking interface.
- **Authorization**: Role: \`faculty\`.
- **Response**:
  \`\`\`json
  {
    "success": true,
    "classDetails": { "subject": "Machine Learning", "section": "A" },
    "roster": [
      { "studentId": 101, "enrollmentNo": "2500100481", "name": "Aarav Sharma", "rollNumber": "01" }
    ]
  }
  \`\`\`

---

## 4.7 Attendance System Endpoints (\`/api/attendance\`)

### 4.7.1 \`POST /api/attendance/sessions\`
- **Description**: Initializes an attendance session for a class and marks the attendance status for every student in a single atomic database transaction.
- **Authorization**: Role: \`faculty\`, \`coordinator\`, or \`admin\`.
- **Request Body Schema**:
  \`\`\`json
  {
    "program": "B.Tech",
    "branch": "Computer Science and Engineering",
    "semester": 6,
    "section": "A",
    "subject": "Cloud Computing",
    "subjectCode": "CS406",
    "sessionDate": "2026-09-05",
    "sessionType": "Lecture",
    "topicCovered": "Containerization with Docker & Kubernetes",
    "records": [
      { "studentId": 101, "status": "Present", "remarks": "" },
      { "studentId": 102, "status": "Absent", "remarks": "Medical leave requested" }
    ]
  }
  \`\`\`
- **Internal Execution Flow**:
  1. Initiates database transaction (\`t = await sequelize.transaction()\`).
  2. Verifies that duplicate session does not exist for same subject, class, section, date, and slot.
  3. Creates \`AttendanceSession\` row.
  4. Formats attendance records with foreign key \`sessionId: session.id\`.
  5. Bulk inserts records via \`AttendanceRecord.bulkCreate(records, { transaction: t })\`.
  6. Commits transaction \`await t.commit()\`.

### 4.7.2 \`PUT /api/attendance/sessions/:sessionId\`
- **Description**: Modifies attendance records for an existing session.
- **Authorization**: Session creator (within 24 hours), Coordinator (assigned section), or Admin.
- **Constraint**: If \`session.isLocked === true\`, modifications are rejected unless caller has \`admin\` role.

### 4.7.3 \`PUT /api/attendance/sessions/:sessionId/lock\`
- **Description**: Locks an attendance session against further alterations.
- **Authorization**: Role: \`coordinator\` or \`admin\`.

### 4.7.4 \`GET /api/attendance/student/:studentId\`
- **Description**: Returns calculated attendance metrics for an individual student: overall attendance percentage, subject-by-subject percentage, total sessions conducted, sessions attended, and sessions missed.
- **Authorization**: Student (own profile), Faculty/Coordinator (assigned class), Admin.
- **Mathematical Formula**:
  $$\\text{Attendance Percentage} = \\left( \\frac{\\sum \\text{Present Sessions} + (0.5 \\times \\sum \\text{Late Sessions})}{\\sum \\text{Total Eligible Sessions}} \\right) \\times 100$$

---

## 4.8 Messaging & Communication Endpoints (\`/api/messages\`)

### 4.8.1 \`GET /api/messages/inbox\`
- **Description**: Fetches paginated inbox messages received by the authenticated user, ordered by timestamp descending.
- **Query Params**: \`page\`, \`limit\`, \`unreadOnly\` (boolean).

### 4.8.2 \`POST /api/messages/send\`
- **Description**: Sends a message to an individual user, a specific class, or a role group.
- **Authorization**: Authenticated users.
- **Request Body Schema**:
  \`\`\`json
  {
    "recipientType": "Class",
    "targetProgram": "B.Tech",
    "targetBranch": "Computer Science and Engineering",
    "targetSection": "A",
    "subject": "Midterm Examination Schedule Announcement",
    "content": "The midterm examination for Distributed Systems will be held on Monday at 10:00 AM.",
    "priority": "High"
  }
  \`\`\`
- **Execution Flow**:
  - If \`recipientType === 'Individual'\`: Writes single record to \`messages\` table with \`recipientId\`.
  - If \`recipientType === 'Class'\`: Broadcasts message to all students enrolled in specified program/branch/section.
  - If \`recipientType === 'Universal'\`: Accessible only by Admin; broadcasts to entire institution.

### 4.8.3 \`PUT /api/messages/:messageId/read\`
- **Description**: Marks message as read (\`isRead = true\`, \`readAt = new Date()\`).

---

## 4.9 Timetable & Teaching Endpoints (\`/api/timetable\` & \`/api/teaching\`)

### 4.9.1 \`GET /api/timetable/:program/:branch/:semester/:section\`
- **Description**: Returns weekly class timetable (Monday through Saturday, 9:00 AM to 5:00 PM) including course name, code, faculty instructor, and classroom venue.

### 4.9.2 \`POST /api/timetable\`
- **Description**: Upserts timetable schedule matrix for a specific section.
- **Authorization**: Role: \`coordinator\`, \`chairperson\`, \`admin\`.

### 4.9.3 \`GET /api/teaching/assignments\`
- **Description**: Retrieves all faculty teaching assignments with associated user and course metadata.

---

## 4.10 Specialization & Academic Classification Endpoints (\`/api/specialization\`)

### 4.10.1 \`GET /api/specialization/programs\`
- **Description**: Returns institutional hierarchy of academic programs (e.g. B.Tech, M.Tech, MCA, MBA), active branches, and elective specialization tracks (e.g. AI & ML, Cyber Security, Data Science, Cloud Computing).

### 4.10.2 \`POST /api/specialization/assign\`
- **Description**: Updates elective specialization track for a student or batch of students.
- **Authorization**: Role: \`coordinator\`, \`admin\`.
`;
}
