export function getSection2() {
  return `# SECTION 2: RELATIONAL DATABASE ARCHITECTURE & COMPLETE DATA DICTIONARY

## 2.1 Database Engine, Dialect & Connection Pooling
The GBU-SDSM persistence tier relies on MySQL 8.x executing with the InnoDB storage engine to guarantee full Atomicity, Consistency, Isolation, and Durability (ACID) compliance across all multi-row and multi-table operations. The database interface is managed via Sequelize ORM (\`v6.37.3\`), configured in \`backend/lib/db.js\`.

### Connection Configuration & Session Optimization
The backend initializes a pooled database connection with dynamic environment fallback and performance tuning:
- **Host & Port**: Configurable via \`DB_HOST\` (default \`localhost\`) and \`DB_PORT\` (default \`3306\`).
- **Database Name**: \`gbu_sdms\` (configured via \`DB_NAME\`).
- **Character Encoding**: \`utf8mb4\` character set with \`utf8mb4_unicode_ci\` collation, ensuring full support for multilingual characters, diacritics, and symbols.
- **Connection Pool Parameters**:
  - \`max: 25\`: Maximum concurrent active connections in the pool.
  - \`min: 4\`: Minimum idle connections preserved to prevent cold-start latency.
  - \`acquire: 30000\`: Maximum timeout in milliseconds before throwing a connection acquisition error.
  - \`idle: 30000\`: Maximum idle time before an unused connection is terminated.
- **Session Memory Tuning (MySQL Specific)**:
  On every successful connection establishment, the backend executes session-level memory configuration queries:
  1. \`SET SESSION sort_buffer_size = 4 * 1024 * 1024;\` (4MB sort buffer, optimizing sorting operations during large class student roster queries).
  2. \`SET SESSION tmp_table_size = 64 * 1024 * 1024;\` (64MB memory table size, preventing in-memory joins from spilling to disk).
  3. \`SET SESSION max_heap_table_size = 64 * 1024 * 1024;\` (64MB maximum heap table size, aligning with \`tmp_table_size\`).

## 2.2 Entity Relationship Diagram (ERD)

The following Mermaid ERD visualizes the structural associations and foreign key constraints between all database entities:

\`\`\`mermaid
erDiagram
    USERS ||--o| STUDENTS : "authenticates (userId)"
    USERS ||--o| COORDINATORS : "acts_as (userId)"
    USERS ||--o| CHAIRPERSONS : "acts_as (userId)"
    USERS ||--o| FACULTY : "acts_as (userId)"
    USERS ||--o{ MESSAGES : "sends (senderId)"
    USERS ||--o{ MESSAGE_RECIPIENTS : "receives (recipientId)"
    USERS ||--o{ CHANGE_LOGS : "logs_action (userId)"

    COORDINATORS ||--o{ STUDENTS : "manages_assigned_classes"
    CHAIRPERSONS ||--o{ CHAIRPERSON_CLASSES : "delegated_to (chairpersonId)"

    FACULTY ||--o{ FACULTY_ASSIGNMENTS : "assigned_to (facultyId)"
    SUBJECTS ||--o{ FACULTY_ASSIGNMENTS : "taught_as (subjectId)"

    FACULTY ||--o{ ATTENDANCE_SESSIONS : "conducts (teacherId)"
    SUBJECTS ||--o{ ATTENDANCE_SESSIONS : "session_for (subjectId)"
    ATTENDANCE_SESSIONS ||--|{ ATTENDANCE_RECORDS : "contains (sessionId)"
    STUDENTS ||--o{ ATTENDANCE_RECORDS : "marked_in (studentId)"

    MESSAGES ||--|{ MESSAGE_RECIPIENTS : "delivers_to (messageId)"
    TIMETABLES ||--|{ TIMETABLE_SECTIONS : "divides_into (timetableId)"

    USERS {
        int id PK
        string username UK
        string email UK
        string password
        string role
        string resetOtp
        datetime otpExpires
        datetime createdAt
        datetime updatedAt
    }

    STUDENTS {
        int id PK
        int userId FK
        string rollNo UK
        string enrollmentNo UK
        string fullName
        string school
        string department
        string program
        string batch
        string specialization
        string fatherName
        string motherName
        string gender
        date dob
        string category
        string nationalId
        string mobile
        string email
        text address
        string hosteller
        string enrollmentStatus
        string admissionType
        string twelfthCompartment
        string admissionYear
        json semesters
        json yearCGPA
        string internshipStatus
        string internshipCompany
        string internshipDOJ
        string internshipDOE
        string internshipType
        string placementStatus
        string placementCompany
        string placementDOJ
        string placementDOE
        string placementType
        longtext photo
        enum status
        int createdBy FK
        int updatedBy FK
        datetime createdAt
        datetime updatedAt
    }

    COORDINATORS {
        int id PK
        int userId FK
        string name
        string email UK
        string phone
        string school
        string department
        string program
        string batch
        string specialization
        datetime createdAt
        datetime updatedAt
    }

    CHAIRPERSONS {
        int id PK
        int userId FK
        string name
        string email UK
        string phone
        string school
        datetime createdAt
        datetime updatedAt
    }

    CHAIRPERSON_CLASSES {
        int id PK
        int chairpersonId FK
        string school
        string department
        string program
        string batch
        string specialization
        datetime createdAt
        datetime updatedAt
    }

    FACULTY {
        int id PK
        int userId FK
        string name
        string email UK
        string phone
        string department
        string designation
        string qualifications
        datetime createdAt
        datetime updatedAt
    }

    FACULTY_ASSIGNMENTS {
        int id PK
        int facultyId FK
        int subjectId FK
        string school
        string department
        string program
        string batch
        string specialization
        string academicYear
        int semester
        datetime createdAt
        datetime updatedAt
    }

    SUBJECTS {
        int id PK
        string code UK
        string name
        string department
        int semester
        int credits
        string type
        datetime createdAt
        datetime updatedAt
    }

    ATTENDANCE_SESSIONS {
        int id PK
        int teacherId FK
        int subjectId FK
        string classKey
        date date
        string slot
        string room
        boolean isLocked
        datetime lockedAt
        int lockedBy FK
        datetime createdAt
        datetime updatedAt
    }

    ATTENDANCE_RECORDS {
        int id PK
        int sessionId FK
        int studentId FK
        string rollNo
        enum status
        text remarks
        datetime createdAt
        datetime updatedAt
    }

    MESSAGES {
        int id PK
        int senderId FK
        string title
        text content
        enum targetType
        string targetClass
        datetime createdAt
        datetime updatedAt
    }

    MESSAGE_RECIPIENTS {
        int id PK
        int messageId FK
        int recipientId FK
        boolean isRead
        datetime readAt
        datetime createdAt
        datetime updatedAt
    }

    CHANGE_LOGS {
        int id PK
        int userId FK
        string action
        string entity
        string entityId
        json details
        datetime createdAt
        datetime updatedAt
    }

    NOTIFICATIONS {
        int id PK
        string toRole
        int toUserId FK
        string message
        json data
        boolean isRead
        datetime createdAt
        datetime updatedAt
    }
\`\`\`

---

## 2.3 Detailed Field-by-Field Schema Catalog (All 17 Models)

### 2.3.1 User Model (\`users\`)
- **Source File**: \`backend/models/user.model.js\`
- **Database Table**: \`users\`
- **Description**: Stores primary credentials, authentication metadata, and role assignments for all institutional actors.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Unique internal numeric user identifier.
  2. \`username\` (VARCHAR(255), Unique, Nullable): Unique user handle. For students, this matches their Roll Number; for faculty/coordinators, it is their system identifier or institutional email prefix.
  3. \`email\` (VARCHAR(255), Unique, NOT NULL): Institutional email address. Validated against standard email format regex. Used as the primary login credential for administrators, chairpersons, coordinators, and faculty.
  4. \`password\` (VARCHAR(255), NOT NULL): Cryptographically hashed password generated via \`bcryptjs\` with a minimum cost factor of 10. Raw plain-text passwords are never persisted.
  5. \`role\` (ENUM('admin', 'coordinator', 'chairperson', 'faculty', 'student'), NOT NULL, Default: 'student'): Governs the authorization level and permission boundaries of the authenticated session.
  6. \`resetOtp\` (VARCHAR(255), Nullable): 6-digit numeric one-time passcode generated during forgotten password recovery procedures.
  7. \`otpExpires\` (DATETIME, Nullable): UTC expiration timestamp for \`resetOtp\` (typically 10 minutes from issuance).
  8. \`createdAt\` (DATETIME, NOT NULL): Automatic timestamp of account creation.
  9. \`updatedAt\` (DATETIME, NOT NULL): Automatic timestamp of last record alteration.

### 2.3.2 Student Model (\`students\`)
- **Source File**: \`backend/models/student.model.js\`
- **Database Table**: \`students\`
- **Description**: Central student record holding personal demographics, academic enrollment details, semester progression, CGPA performance, hostel boarding status, photo storage, and professional career telemetry.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Unique internal student database identifier.
  2. \`userId\` (INTEGER, Foreign Key -> \`users.id\`, Nullable): Relational link to the student's User authentication account. Allows login to the Student Portal.
  3. \`rollNo\` (VARCHAR(255), Unique, NOT NULL): Institutional academic Roll Number (e.g., \`255ucs258\`). Stored in lowercase normalized format with all whitespace removed. Serves as the primary public identifier.
  4. \`enrollmentNo\` (VARCHAR(255), Unique, NOT NULL): University registration/enrollment number (e.g., \`2500100481\`). Stored normalized in lowercase.
  5. \`fullName\` (VARCHAR(255), NOT NULL): Student's official legal name as registered with the university.
  6. \`school\` (VARCHAR(255), NOT NULL): Academic school code (e.g., \`soict\` for School of Information and Communication Technology).
  7. \`department\` (VARCHAR(255), NOT NULL): Academic department code (e.g., \`cse\` for Computer Science & Engineering).
  8. \`program\` (VARCHAR(255), NOT NULL): Academic degree program (e.g., \`B.Tech\`, \`M.Tech\`, \`B.Tech + M.Tech\`, \`BCA\`, \`MCA\`).
  9. \`batch\` (VARCHAR(255), NOT NULL): Enrolled academic year span (e.g., \`2025-29\`, \`2024-28\`, \`2025-27\`).
  10. \`specialization\` (VARCHAR(255), NOT NULL): Specific academic concentration or branch (e.g., \`Artificial Intelligence\`, \`Data Science\`, \`Cyber Security\`, \`Core\`).
  11. \`fatherName\` (VARCHAR(255), NOT NULL): Father's official name.
  12. \`motherName\` (VARCHAR(255), Nullable): Mother's official name.
  13. \`gender\` (VARCHAR(255), NOT NULL): Student gender (\`Male\`, \`Female\`, \`Other\`).
  14. \`dob\` (DATE, Nullable): Date of birth formatted as YYYY-MM-DD.
  15. \`category\` (VARCHAR(255), NOT NULL): Social/admission reservation category (\`General\`, \`OBC\`, \`SC\`, \`ST\`, \`EWS\`).
  16. \`nationalId\` (VARCHAR(255), Nullable): Government national identification number (e.g., Aadhaar number or Passport number).
  17. \`mobile\` (VARCHAR(255), NOT NULL): Primary student mobile contact number, stripped of spaces and country code prefixes.
  18. \`email\` (VARCHAR(255), NOT NULL): Official email address. Validated with \`isEmail: true\`.
  19. \`address\` (TEXT, Nullable): Permanent residential postal address.
  20. \`hosteller\` (VARCHAR(255), NOT NULL): Campus accommodation status (\`Hosteller\` or \`Day Scholar\`).
  21. \`enrollmentStatus\` (VARCHAR(255), Nullable, Default: 'Regular'): Institutional enrollment standing (\`Regular\`, \`Provisional\`, \`Suspended\`, \`Alumni\`).
  22. \`admissionType\` (VARCHAR(255), NOT NULL): Admission channel (\`Entrance Examination\`, \`Direct Admission\`, \`Lateral Entry\`, \`Management Quota\`).
  23. \`twelfthCompartment\` (VARCHAR(255), NOT NULL): Indicates whether the student cleared 12th standard via a compartment examination (\`Yes\` or \`No\`).
  24. \`admissionYear\` (VARCHAR(255), Nullable): The calendar year of matriculation (e.g., \`2025\`).
  25. \`semesters\` (JSON, NOT NULL, Default: \`[]\`): Array of semester registration objects. Schema per element: \`{ semester: number, registered: "Registered" | "Not Registered" }\`. The length of this array is validated against institutional program duration rules (8 semesters for B.Tech, 4 for M.Tech, 10 for Integrated).
  26. \`yearCGPA\` (JSON, NOT NULL, Default: \`[]\`): Array of cumulative grade point average objects for each academic year. Schema per element: \`{ year: number, cgpa: number | null }\`.
  27. \`internshipStatus\` (VARCHAR(255), NOT NULL, Default: 'Inactive'): Current practical training state (\`Inactive\`, \`Searching\`, \`Ongoing\`, \`Completed\`, \`Not Applied\`).
  28. \`internshipCompany\` (VARCHAR(255), Nullable): Name of the corporate organization or institution hosting the student's internship (e.g., \`Google India\`, \`Amazon\`, \`TCS\`).
  29. \`internshipDOJ\` (VARCHAR(50), Nullable): Date of Joining (DOJ) for internship commencement (stored as YYYY-MM-DD string).
  30. \`internshipDOE\` (VARCHAR(50), Nullable): Date of Ending (DOE) for internship completion.
  31. \`internshipType\` (VARCHAR(50), Nullable): Compensation structure (\`Paid\` or \`Unpaid\`).
  32. \`placementStatus\` (VARCHAR(255), NOT NULL, Default: 'Not Placed'): Campus recruitment outcome (\`Placed\`, \`Not Placed\`, \`Higher Studies\`, \`Opted Out\`).
  33. \`placementCompany\` (VARCHAR(255), Nullable): Name of the employing corporation that extended a full-time placement offer.
  34. \`placementDOJ\` (VARCHAR(50), Nullable): Scheduled corporate joining date (DOJ).
  35. \`placementDOE\` (VARCHAR(50), Nullable): Contract duration or bond expiration date (DOE).
  36. \`placementType\` (VARCHAR(50), Nullable): Employment compensation classification (\`Paid\` or \`Unpaid\`).
  37. \`photo\` (LONGTEXT, Nullable): Base64 Data URI or secure HTTP URL storing the student's passport-size photograph.
  38. \`status\` (ENUM('active', 'inactive'), NOT NULL, Default: 'active'): Lifecycle status of the student record. Inactive records represent de-registered or withdrawn students.
  39. \`createdBy\` (INTEGER, Foreign Key -> \`users.id\`, NOT NULL): ID of the administrator or coordinator who initialized the record.
  40. \`updatedBy\` (INTEGER, Foreign Key -> \`users.id\`, Nullable): ID of the user who executed the most recent write operation.
  41. \`createdAt\` (DATETIME, NOT NULL): System record creation timestamp.
  42. \`updatedAt\` (DATETIME, NOT NULL): Last record update timestamp.

### 2.3.3 Coordinator Model (\`coordinators\`)
- **Source File**: \`backend/models/coordinator.model.js\`
- **Database Table**: \`coordinators\`
- **Description**: Represents an academic faculty member assigned to coordinate a designated batch and class.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary numeric coordinator identifier.
  2. \`userId\` (INTEGER, Foreign Key -> \`users.id\`, Nullable): Linked authentication account holding \`coordinator\` role credentials.
  3. \`name\` (VARCHAR(255), NOT NULL): Full legal name of the coordinator.
  4. \`email\` (VARCHAR(255), Unique, NOT NULL): Institutional email address.
  5. \`phone\` (VARCHAR(255), NOT NULL): Mobile contact phone number.
  6. \`school\` (VARCHAR(255), NOT NULL): Assigned school (e.g., \`soict\`).
  7. \`department\` (VARCHAR(255), NOT NULL): Assigned department (e.g., \`cse\`).
  8. \`program\` (VARCHAR(255), NOT NULL): Academic degree program (e.g., \`B.Tech\`).
  9. \`batch\` (VARCHAR(255), NOT NULL): Academic cohort batch (e.g., \`2025-29\`).
  10. \`specialization\` (VARCHAR(255), Nullable): Specific branch concentration if assigned to a single section.
  11. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.4 Chairperson Model (\`chairpersons\`)
- **Source File**: \`backend/models/chairperson.model.js\`
- **Database Table**: \`chairpersons\`
- **Description**: Executive dean profile holding administrative oversight over an entire school.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary chairperson identifier.
  2. \`userId\` (INTEGER, Foreign Key -> \`users.id\`, Nullable): Linked authentication account holding \`chairperson\` role credentials.
  3. \`name\` (VARCHAR(255), NOT NULL): Legal name of the chairperson.
  4. \`email\` (VARCHAR(255), Unique, NOT NULL): Institutional email address.
  5. \`phone\` (VARCHAR(255), NOT NULL): Contact phone number.
  6. \`school\` (VARCHAR(255), NOT NULL): School governed (e.g., \`soict\`, \`som\`, \`sovsas\`).
  7. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.5 ChairpersonClass Model (\`chairperson_classes\`)
- **Source File**: \`backend/models/chairpersonClass.model.js\`
- **Database Table**: \`chairperson_classes\`
- **Description**: Relational junction mapping chairpersons to specific delegated classes when school-wide oversight is partitioned.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Junction primary key.
  2. \`chairpersonId\` (INTEGER, Foreign Key -> \`chairpersons.id\`, NOT NULL): Reference to parent chairperson.
  3. \`school\`, \`department\`, \`program\`, \`batch\`, \`specialization\` (VARCHAR(255), NOT NULL): Five-tuple composite class key.
  4. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.6 Faculty Model (\`faculty\`)
- **Source File**: \`backend/models/faculty.model.js\`
- **Database Table**: \`faculty\`
- **Description**: Master registry of university instructors eligible for teaching assignments and attendance marking.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Internal faculty identifier.
  2. \`userId\` (INTEGER, Foreign Key -> \`users.id\`, Nullable): Linked authentication account holding \`faculty\` role credentials.
  3. \`name\` (VARCHAR(255), NOT NULL): Full faculty member name with academic titles (e.g., \`Dr. Ashish Kumar\`).
  4. \`email\` (VARCHAR(255), Unique, NOT NULL): Faculty institutional email.
  5. \`phone\` (VARCHAR(255), NOT NULL): Contact phone number.
  6. \`department\` (VARCHAR(255), NOT NULL): Primary parent academic department.
  7. \`designation\` (VARCHAR(255), Nullable): Academic rank (\`Assistant Professor\`, \`Associate Professor\`, \`Professor\`, \`Visiting Faculty\`).
  8. \`qualifications\` (VARCHAR(255), Nullable): Academic credentials (e.g., \`Ph.D. in Computer Science, M.Tech\`).
  9. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.7 FacultyAssignment Model (\`faculty_assignments\`)
- **Source File**: \`backend/models/facultyAssignment.model.js\`
- **Database Table**: \`faculty_assignments\`
- **Description**: Binds an instructor to teach a specific subject in a specific class during a given academic semester.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Assignment identifier.
  2. \`facultyId\` (INTEGER, Foreign Key -> \`faculty.id\`, NOT NULL): Reference to instructor.
  3. \`subjectId\` (INTEGER, Foreign Key -> \`subjects.id\`, NOT NULL): Reference to taught subject.
  4. \`school\`, \`department\`, \`program\`, \`batch\`, \`specialization\` (VARCHAR(255), NOT NULL): Target class key.
  5. \`academicYear\` (VARCHAR(50), NOT NULL): Current academic calendar year (e.g., \`2025-2026\`).
  6. \`semester\` (INTEGER, NOT NULL): Academic semester index (1 through 10).
  7. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.8 Subject Model (\`subjects\`)
- **Source File**: \`backend/models/subject.model.js\`
- **Database Table**: \`subjects\`
- **Description**: Institutional course catalog defining curricula subjects, credit weights, and course codes.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary subject identifier.
  2. \`code\` (VARCHAR(50), Unique, NOT NULL): Course identification code (e.g., \`CS101\`, \`CS302\`).
  3. \`name\` (VARCHAR(255), NOT NULL): Full subject descriptive title (e.g., \`Data Structures & Algorithms\`).
  4. \`department\` (VARCHAR(255), NOT NULL): Department managing the course syllabus.
  5. \`semester\` (INTEGER, NOT NULL): Target semester level.
  6. \`credits\` (INTEGER, NOT NULL, Default: 4): Academic credit value.
  7. \`type\` (VARCHAR(50), NOT NULL, Default: 'Theory'): Instructional classification (\`Theory\`, \`Practical / Lab\`, \`Seminar\`).
  8. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.9 AttendanceSession Model (\`attendance_sessions\`)
- **Source File**: \`backend/models/attendanceSession.model.js\`
- **Database Table**: \`attendance_sessions\`
- **Description**: Represents a scheduled classroom lecture or lab period where attendance was captured.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Unique session identifier.
  2. \`teacherId\` (INTEGER, Foreign Key -> \`users.id\` / \`faculty.id\`, NOT NULL): Instructor who conducted and marked the session.
  3. \`subjectId\` (INTEGER, Foreign Key -> \`subjects.id\`, NOT NULL): Course subject taught.
  4. \`classKey\` (VARCHAR(255), NOT NULL): Composite class key (\`school|department|program|batch|specialization\`).
  5. \`date\` (DATEONLY, NOT NULL): Calendar date of lecture (YYYY-MM-DD).
  6. \`slot\` (VARCHAR(50), NOT NULL): Time slot identifier (e.g., \`09:00 - 10:00 AM\`, \`Slot 1\`).
  7. \`room\` (VARCHAR(50), Nullable): Lecture hall or laboratory code (e.g., \`L-101\`, \`Lab 3\`).
  8. \`isLocked\` (BOOLEAN, NOT NULL, Default: false): When true, the session is cryptographically locked; faculty cannot modify records without administrative override.
  9. \`lockedAt\` (DATETIME, Nullable): Timestamp when the session was finalized and submitted.
  10. \`lockedBy\` (INTEGER, Foreign Key -> \`users.id\`, Nullable): User who performed the lock operation.
  11. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.10 AttendanceRecord Model (\`attendance_records\`)
- **Source File**: \`backend/models/attendanceRecord.model.js\`
- **Database Table**: \`attendance_records\`
- **Description**: Individual student attendance status for a specific \`attendance_session\`.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary record identifier.
  2. \`sessionId\` (INTEGER, Foreign Key -> \`attendance_sessions.id\`, NOT NULL, CASCADE ON DELETE): Parent session.
  3. \`studentId\` (INTEGER, Foreign Key -> \`students.id\`, NOT NULL): Referenced student record.
  4. \`rollNo\` (VARCHAR(255), NOT NULL): Denormalized student roll number for high-performance reporting.
  5. \`status\` (ENUM('Present', 'Absent', 'Excused'), NOT NULL, Default: 'Present'): Captured attendance state.
  6. \`remarks\` (TEXT, Nullable): Optional instructor notes (e.g., \`Medical Leave Approved\`, \`Late Arrival\`).
  7. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.11 Timetable Model (\`timetables\`)
- **Source File**: \`backend/models/timetable.model.js\`
- **Database Table**: \`timetables\`
- **Description**: Root weekly schedule configuration for a class cohort.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Timetable identifier.
  2. \`school\`, \`department\`, \`program\`, \`batch\`, \`specialization\` (VARCHAR(255), NOT NULL): Composite class key.
  3. \`academicYear\` (VARCHAR(50), NOT NULL): Calendar academic span (e.g., \`2025-26\`).
  4. \`semester\` (INTEGER, NOT NULL): Semester index.
  5. \`isActive\` (BOOLEAN, NOT NULL, Default: true): Indicates if this schedule is currently operational.
  6. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.12 TimetableSection Model (\`timetable_sections\`)
- **Source File**: \`backend/models/timetableSection.model.js\`
- **Database Table**: \`timetable_sections\`
- **Description**: Scheduled lecture slot within a timetable.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Slot identifier.
  2. \`timetableId\` (INTEGER, Foreign Key -> \`timetables.id\`, NOT NULL, CASCADE ON DELETE): Parent timetable.
  3. \`dayOfWeek\` (ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), NOT NULL): Day of schedule.
  4. \`startTime\` (TIME, NOT NULL): Slot commencement time.
  5. \`endTime\` (TIME, NOT NULL): Slot conclusion time.
  6. \`subjectId\` (INTEGER, Foreign Key -> \`subjects.id\`, NOT NULL): Scheduled subject.
  7. \`facultyId\` (INTEGER, Foreign Key -> \`faculty.id\`, Nullable): Assigned instructor.
  8. \`room\` (VARCHAR(50), NOT NULL): Classroom or lab location.
  9. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.13 Specialization Model (\`specializations\`)
- **Source File**: \`backend/models/specialization.model.js\`
- **Database Table**: \`specializations\`
- **Description**: Master catalog of academic branch specializations offered within departments.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary identifier.
  2. \`school\` (VARCHAR(255), NOT NULL): Parent school code.
  3. \`department\` (VARCHAR(255), NOT NULL): Parent department code.
  4. \`program\` (VARCHAR(255), NOT NULL): Degree program title.
  5. \`batch\` (VARCHAR(255), NOT NULL): Target batch year.
  6. \`name\` (VARCHAR(255), NOT NULL): Branch title (e.g., \`Artificial Intelligence\`, \`Cyber Security\`).
  7. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.14 Message Model (\`messages\`)
- **Source File**: \`backend/models/message.model.js\`
- **Database Table**: \`messages\`
- **Description**: Institutional broadcast or direct message header and body.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Message primary key.
  2. \`senderId\` (INTEGER, Foreign Key -> \`users.id\`, NOT NULL): Originating user account.
  3. \`title\` (VARCHAR(255), NOT NULL): Subject line or headline.
  4. \`content\` (TEXT, NOT NULL): Full body text of the announcement or direct message.
  5. \`targetType\` (ENUM('class', 'individual', 'universal', 'admin', 'coordinator'), NOT NULL): Broadcast scoping rule.
  6. \`targetClass\` (VARCHAR(255), Nullable): Specific class key recipient when \`targetType === 'class'\`.
  7. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Timestamp of message dispatch.

### 2.3.15 MessageRecipient Model (\`message_recipients\`)
- **Source File**: \`backend/models/messageRecipient.model.js\`
- **Database Table**: \`message_recipients\`
- **Description**: Delivery junction mapping messages to specific recipient users with read status telemetry.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Delivery identifier.
  2. \`messageId\` (INTEGER, Foreign Key -> \`messages.id\`, NOT NULL, CASCADE ON DELETE): Parent message.
  3. \`recipientId\` (INTEGER, Foreign Key -> \`users.id\`, NOT NULL): Recipient user account.
  4. \`isRead\` (BOOLEAN, NOT NULL, Default: false): Indicates whether the recipient has opened the message.
  5. \`readAt\` (DATETIME, Nullable): Timestamp when the message was marked as read.
  6. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Standard delivery audit timestamps.

### 2.3.16 ChangeLog Model (\`change_logs\`)
- **Source File**: \`backend/models/changeLog.model.js\`
- **Database Table**: \`change_logs\`
- **Description**: Immutable append-only audit ledger recording all administrative and coordinator data modifications.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary audit log identifier.
  2. \`userId\` (INTEGER, Foreign Key -> \`users.id\`, NOT NULL): Actor who initiated the change.
  3. \`action\` (VARCHAR(50), NOT NULL): Operation type (\`create\`, \`update\`, \`delete\`, \`bulk_update\`, \`upload_photos\`).
  4. \`entity\` (VARCHAR(50), NOT NULL): Target domain entity (\`student\`, \`attendance\`, \`coordinator\`).
  5. \`entityId\` (VARCHAR(255), NOT NULL): Business key of affected record (e.g., student Roll Number \`255ucs258\`).
  6. \`details\` (JSON, NOT NULL): Structured JSON snapshot capturing:
     - \`before\`: Full entity state prior to alteration.
     - \`after\`: Full entity state resulting from alteration.
     - \`ipAddress\`: Client IP address.
     - \`userAgent\`: Client user-agent string.
  7. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Tamper-proof timestamp of audit creation.

### 2.3.17 Notification Model (\`notifications\`)
- **Source File**: \`backend/models/notification.model.js\`
- **Database Table**: \`notifications\`
- **Description**: Real-time alerts and high-priority institutional notices dispatched to specific roles or users.
- **Fields Definition**:
  1. \`id\` (INTEGER, Primary Key, Auto Increment, NOT NULL): Notification identifier.
  2. \`toRole\` (VARCHAR(50), Nullable): Target role broadcast filter (\`admin\`, \`coordinator\`, \`faculty\`, \`student\`).
  3. \`toUserId\` (INTEGER, Foreign Key -> \`users.id\`, Nullable): Targeted individual recipient ID.
  4. \`message\` (TEXT, NOT NULL): Alert message body text.
  5. \`data\` (JSON, Nullable): Auxiliary payload (entity links, action routes, sender identifiers).
  6. \`isRead\` (BOOLEAN, NOT NULL, Default: false): Read acknowledgment flag.
  7. \`createdAt\` & \`updatedAt\` (DATETIME, NOT NULL): Notification delivery timestamp.

---

## 2.4 Model Associations, Cascade Rules & Lifecycle Hooks

The centralized model registry in \`backend/models/index.js\` explicitly establishes entity relationships, foreign keys, and referential actions:

1. **User to Profile Associations (1:1 / 1:N)**:
   - \`User.hasOne(Student, { foreignKey: 'userId', as: 'student', constraints: false });\`
   - \`Student.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });\`
   - \`User.hasOne(Coordinator, { foreignKey: 'userId', as: 'coordinator', constraints: false });\`
   - \`Coordinator.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });\`
   - \`User.hasOne(Chairperson, { foreignKey: 'userId', as: 'chairperson', constraints: false });\`
   - \`Chairperson.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });\`
   - \`User.hasOne(Faculty, { foreignKey: 'userId', as: 'faculty', constraints: false });\`
   - \`Faculty.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });\`

2. **Faculty Assignment Associations (N:M via Junction)**:
   - \`Faculty.hasMany(FacultyAssignment, { foreignKey: 'facultyId', as: 'assignments', onDelete: 'CASCADE' });\`
   - \`FacultyAssignment.belongsTo(Faculty, { foreignKey: 'facultyId', as: 'faculty' });\`
   - \`Subject.hasMany(FacultyAssignment, { foreignKey: 'subjectId', as: 'assignments', onDelete: 'CASCADE' });\`
   - \`FacultyAssignment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });\`

3. **Attendance Session & Record Associations (1:N with Cascade)**:
   - \`AttendanceSession.hasMany(AttendanceRecord, { foreignKey: 'sessionId', as: 'records', onDelete: 'CASCADE' });\`
   - \`AttendanceRecord.belongsTo(AttendanceSession, { foreignKey: 'sessionId', as: 'session' });\`
   - \`Student.hasMany(AttendanceRecord, { foreignKey: 'studentId', as: 'attendanceRecords', constraints: false });\`
   - \`AttendanceRecord.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });\`
   - \`AttendanceSession.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });\`
   - \`AttendanceSession.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });\`

4. **Messaging & Recipient Associations (1:N with Cascade)**:
   - \`Message.hasMany(MessageRecipient, { foreignKey: 'messageId', as: 'recipients', onDelete: 'CASCADE' });\`
   - \`MessageRecipient.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });\`
   - \`User.hasMany(MessageRecipient, { foreignKey: 'recipientId', as: 'receivedMessages', constraints: false });\`
   - \`MessageRecipient.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });\`
   - \`Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });\`

5. **Timetable Associations (1:N with Cascade)**:
   - \`Timetable.hasMany(TimetableSection, { foreignKey: 'timetableId', as: 'sections', onDelete: 'CASCADE' });\`
   - \`TimetableSection.belongsTo(Timetable, { foreignKey: 'timetableId', as: 'timetable' });\`
   - \`TimetableSection.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });\`
   - \`TimetableSection.belongsTo(Faculty, { foreignKey: 'facultyId', as: 'faculty' });\`
`;
}
