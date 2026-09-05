export function getSection1() {
  return `# GAUTAM BUDDHA UNIVERSITY - STUDENT DATA MANAGEMENT SYSTEM (GBU-SDSM)
## COMPLETE SYSTEM ARCHITECTURE, CODEBASE SPECIFICATION & TECHNICAL ENCYCLOPEDIA
### Comprehensive Reference Manual for AI Autonomous Agents & Senior Engineering Teams

---

# TABLE OF CONTENTS
1. [SECTION 1: Executive System Overview & Architectural Paradigm](#section-1-executive-system-overview--architectural-paradigm)
   - 1.1 Executive System Summary & Mission
   - 1.2 Multi-Role Enterprise Architecture Overview
   - 1.3 Technology Stack Catalog & Dependency Matrix
   - 1.4 High-Level Architecture & Communication Topology
   - 1.5 Master Directory Hierarchy & File Map
2. [SECTION 2: Relational Database Architecture & Complete Data Dictionary](#section-2-relational-database-architecture--complete-data-dictionary)
   - 2.1 Database Engine, Dialect & Connection Pooling
   - 2.2 Entity Relationship Diagram (ERD) & Foreign Key Constraints
   - 2.3 Detailed Field-by-Field Schema Catalog (All 17 Models)
     - 2.3.1 User Model (\`users\`)
     - 2.3.2 Student Model (\`students\`)
     - 2.3.3 Coordinator Model (\`coordinators\`)
     - 2.3.4 Chairperson Model (\`chairpersons\`)
     - 2.3.5 ChairpersonClass Model (\`chairperson_classes\`)
     - 2.3.6 Faculty Model (\`faculty\`)
     - 2.3.7 FacultyAssignment Model (\`faculty_assignments\`)
     - 2.3.8 Subject Model (\`subjects\`)
     - 2.3.9 AttendanceSession Model (\`attendance_sessions\`)
     - 2.3.10 AttendanceRecord Model (\`attendance_records\`)
     - 2.3.11 Timetable Model (\`timetables\`)
     - 2.3.12 TimetableSection Model (\`timetable_sections\`)
     - 2.3.13 Specialization Model (\`specializations\`)
     - 2.3.14 Message Model (\`messages\`)
     - 2.3.15 MessageRecipient Model (\`message_recipients\`)
     - 2.3.16 ChangeLog Model (\`change_logs\`)
     - 2.3.17 Notification Model (\`notifications\`)
   - 2.4 Model Associations, Cascade Rules & Lifecycle Hooks
3. [SECTION 3: Authentication, Authorization, Cryptography & Security Infrastructure](#section-3-authentication-authorization-cryptography--security-infrastructure)
   - 3.1 Dual-Token JWT Cryptographic Authentication Engine
   - 3.2 Password Hashing, Salting & OTP Generation
   - 3.3 Role-Based Access Control (RBAC) Permission Matrix
   - 3.4 Middleware Interception Pipeline
   - 3.5 Security Hardening, Content Security Policy & CORS Engine
4. [SECTION 4: Exhaustive Backend API Specification & Controller Internals](#section-4-exhaustive-backend-api-specification--controller-internals)
   - 4.1 Authentication API Router (\`/auth\`)
   - 4.2 Student Data Management API Router (\`/admin\`)
   - 4.3 Coordinator Management & Dashboard API Router (\`/coordinator\`, \`/admin\`)
   - 4.4 Chairperson Oversight API Router (\`/chairperson\`)
   - 4.5 Faculty & Teaching Attendance API Router (\`/faculty\`, \`/teaching\`)
   - 4.6 University Attendance Telemetry API Router (\`/attendance\`)
   - 4.7 Internal Messaging & Broadcast API Router (\`/messages\`)
   - 4.8 Specialization & Department Hierarchy API Router (\`/admin\`)
   - 4.9 Timetable Administration API Router (\`/timetable\`)
5. [SECTION 5: Frontend Single-Page Application (SPA) Architecture](#section-5-frontend-single-page-application-spa-architecture)
   - 5.1 React 18, Vite & TypeScript Ecosystem Integration
   - 5.2 Application Bootstrap Lifecycle (\`index.html\`, \`main.tsx\`, \`App.tsx\`)
   - 5.3 Client-Side Routing Tree & Route Guard Protection
   - 5.4 Redux Toolkit Global State Store Architecture
   - 5.5 Axios Network Client Interceptors & Token Synchronization
6. [SECTION 6: Frontend Pages Encyclopedia & View Logic](#section-6-frontend-pages-encyclopedia--view-logic)
   - 6.1 Administrator Views (\`src/pages/Admin/\`)
   - 6.2 Coordinator Views (\`src/pages/Coordinator/\`)
   - 6.3 Chairperson Views (\`src/pages/Chairperson/\`)
   - 6.4 Faculty Views (\`src/pages/Faculty/\`, \`src/pages/Teaching/\`)
   - 6.5 Student Portal Views (\`src/pages/Client/\`, \`src/pages/Student/\`)
   - 6.6 Public & Authentication Views (\`src/pages/Landing/\`)
7. [SECTION 7: Frontend Reusable Component Deep Dive](#section-7-frontend-reusable-component-deep-dive)
   - 7.1 Administrative Navigation & Header Framework
   - 7.2 Student Data Editing & Detailed Profiles
   - 7.3 Attendance Roster Tables, Session Cards & Visual Analytics
   - 7.4 Multi-Class Real-Time Messaging Center
   - 7.5 Home & Landing Component Framework
   - 7.6 Error Boundary & PWA Support Infrastructure
8. [SECTION 8: End-to-End Business Workflows & Execution Algorithms](#section-8-end-to-end-business-workflows--execution-algorithms)
   - 8.1 Student Enrollment & Registration Workflow
   - 8.2 Excel File Ingestion, Parsing & AI-Assisted Reformatting
   - 8.3 Class Bulk Details Modification Engine
   - 8.4 Teaching Roster Retrieval, Attendance Marking & Session Locking
   - 8.5 Student Attendance Aggregation & Debarment Prediction Algorithm
   - 8.6 Faculty Class-Subject Assignment & Allocation Verification
   - 8.7 Targeted Multi-Class In-App Broadcast Messaging
   - 8.8 Coordinator Class Boundary Isolation Algorithm
   - 8.9 ChangeLog Audit Trail & Notification Engine
9. [SECTION 9: TypeScript Type System, Interfaces & Domain Constants](#section-9-typescript-type-system-interfaces--domain-constants)
   - 9.1 Complete TypeScript Interfaces (\`types.ts\`)
   - 9.2 Domain Constants, Enums & Academic Rules (\`constants/index.ts\`)
   - 9.3 Regular Expressions & Data Normalization Utilities
10. [SECTION 10: DevOps, Deployment, MySQL Performance Tuning & System Evolution](#section-10-devops-deployment-mysql-performance-tuning--system-evolution)
    - 10.1 Environment Variables & Configuration Blueprint
    - 10.2 MySQL Session Optimization & InnoDB Buffer Pool Configuration
    - 10.3 Process Management, Signal Handling & Graceful Termination
    - 10.4 Vite Build Optimizations, Code Splitting & Chunking
    - 10.5 Historical Bug Fixes & Architectural Evolution
    - 10.6 AI Agent Reference Manual & Developer Maintenance Guide

---

# SECTION 1: EXECUTIVE SYSTEM OVERVIEW & ARCHITECTURAL PARADIGM

## 1.1 Executive System Summary & Mission
The Gautam Buddha University Student Data Management System (GBU-SDSM) is a comprehensive, institutional-grade academic data platform engineered specifically to unify, digitize, and automate the academic administration lifecycle across undergraduate, postgraduate, and doctoral degree programs. Higher educational institutions operate under multi-tiered organizational hierarchies—comprising university administrators, school deans (chairpersons), departmental program coordinators, teaching faculty members, and student bodies. Prior to GBU-SDSM, universities typically struggled with fragmented administrative silos: spreadsheets maintained by individual instructors, attendance tracked on physical paper registers with high risk of proxy entries, disparate records between student affairs and finance, lack of audit trails for student detail alterations, and cumbersome manual processes for assigning faculty to class cohorts.

GBU-SDSM establishes a centralized, real-time single source of truth across the university. The system provides:
1. **Unified Identity & Role-Based Access Control**: Centralized authentication for five distinct roles: \`admin\`, \`coordinator\`, \`chairperson\`, \`faculty\`, and \`student\`.
2. **Comprehensive Student Record Management**: Tracking of personal details, demographic categorization, parent/guardian contacts, hostel boarding status, admission types, 12th-grade academic prerequisites, semester registrations across multi-year curricula, year-wise CGPA records, photo management, and professional career telemetry (internships and corporate campus placements).
3. **Automated Batch Roster Ingestion & Reformatting**: Robust ingestion of Microsoft Excel (\`.xlsx\`, \`.xls\`) spreadsheets with an intelligent algorithmic reformatting engine capable of recognizing arbitrary header aliases, resolving messy student data into uniform database records, and bulk-processing thousands of students in seconds.
4. **Fine-Grained Class & Coordinator Scoping**: Automated class discovery and scoping based on a five-tuple composite class key: \`School\` > \`Department\` > \`Program\` > \`Batch\` > \`Specialization\`. Coordinators are restricted by strict authorization boundaries to only access students and classes assigned directly to them.
5. **Real-Time Faculty Attendance Marking & Tamper-Proof Locking**: Interactive digital rosters for faculty to mark attendance on daily schedules. Submitted attendance sessions are cryptographically locked against subsequent unauthorized alteration, with audit logs capturing every administrative modification.
6. **Student Portal & Attendance Telemetry**: Instantaneous visibility for students into their course enrollments, subject-wise attendance statistics (total lectures, lectures present, lectures absent, excused leaves, and attendance percentage), daily attendance history, academic timetables, and notifications.
7. **Institutional In-App Messaging**: Targeted messaging infrastructure enabling university administrators, chairpersons, coordinators, and faculty to broadcast messages to entire classes, individual students, or specific administrative groups with unread message badges and audit trails.

## 1.2 Multi-Role Enterprise Architecture Overview
The architecture is structured around five principal organizational actors:

### 1. University Administrator (\`admin\`)
- Possesses global superuser privileges across all schools, departments, and programs.
- Can create, update, deactivate, and delete student records across any academic unit.
- Manages institutional coordinators, assigning them specific programs, batches, and classes.
- Designates school chairpersons and oversees global institutional telemetry.
- Uploads bulk student rosters via raw or reformatted Excel workbooks.
- Manages university faculty members, creates faculty credentials, and assigns faculty to teach specific subjects within specific classes.
- Configures academic timetables, subject master catalogs, and specializations.
- Holds administrative power to audit, inspect, and amend locked attendance records across the entire institution.

### 2. Academic Coordinator (\`coordinator\`)
- Operates under strict departmental and class assignment boundaries.
- Oversees specific classes (e.g., SOICT > CSE > B.Tech > 2025-29 > Artificial Intelligence).
- Registers individual students into assigned classes or ingests departmental Excel rosters.
- Performs bulk operations (e.g., updating hosteller status, semester registrations, internship company, DOJ, DOE, and placement status) for cohorts within their assigned classes.
- Communicates directly with students in their assigned classes via the messaging system.
- Can be assigned teaching duties, enabling dual functionality as a teaching instructor who marks attendance for their assigned subjects.
- Monitored by administrative change logs: every modification made by a coordinator generates an immutable log entry and alert for university administrators.

### 3. School Chairperson (\`chairperson\`)
- Executive dean level overseeing all departments, programs, batches, and coordinators within an entire school (e.g., School of Information and Communication Technology - SOICT).
- Monitors class progress, student enrollment figures, and coordinator assignments across the school.
- Accesses audit logs and change histories for all coordinators within their jurisdiction.
- Broadcasts notices and messages to students, coordinators, or faculty across the school.
- Reviews attendance performance across courses and subjects to ensure regulatory compliance.

### 4. Teaching Faculty (\`faculty\`)
- Dedicated instructor role focused on classroom execution, lecture schedules, and attendance.
- Accesses a personalized Teaching Dashboard showing all assigned classes and subjects for the current semester.
- Conducts attendance sessions with an interactive digital roster featuring student photos, roll numbers, names, and fast one-click toggles (Present / Absent / Excused).
- Submits attendance sessions which automatically lock to prevent proxy modifications.
- Communicates with students enrolled in their classes through targeted messaging.
- Maintains their personal faculty profile, academic credentials, and contact information.

### 5. Enrolled Student (\`student\`)
- End-user academic constituent accessing their personalized Student Dashboard.
- Reviews comprehensive personal, academic, admission, and contact information on file.
- Inspects real-time attendance analytics: overall university attendance percentage, subject-by-subject attendance breakdowns with color-coded warning thresholds (green for >=75%, amber for 65-74%, red for <65%), and recent session logs.
- Views class weekly timetables, lecture rooms, and subject schedules.
- Receives broadcast notices and direct communications from teachers, coordinators, chairpersons, and university administrators.

## 1.3 Technology Stack Catalog & Dependency Matrix

The application leverages battle-tested modern web engineering tools:

| Tier | Technology | Version | Purpose & Strategic Rationale |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Node.js | v18+ / v20+ / v24+ | Event-driven, non-blocking I/O runtime optimal for concurrent API requests. |
| **Web Framework** | Express.js | 4.19.2 | Minimalist HTTP web framework providing robust middleware chaining and routing. |
| **Database Engine** | MySQL | 8.0+ | ACID-compliant relational persistence engine with robust transactional capabilities. |
| **ORM Framework** | Sequelize | 6.37.3 | Promise-based Node.js ORM providing schema modeling, migrations, and query generation. |
| **Authentication** | jsonwebtoken | 9.0.2 | Cryptographic signing and verification of stateless access and refresh tokens. |
| **Password Hashing**| bcryptjs | 2.4.3 | Adaptive, work-factor salted hashing protecting user passwords in the database. |
| **Spreadsheet Parsing**| xlsx (SheetJS) | 0.18.5 | High-speed binary parsing and synthesis of Microsoft Excel workbooks. |
| **File Multipart** | multer | 1.4.5-lts.1 | In-memory stream parser handling Excel file uploads and photo uploads. |
| **Logging** | Custom Structured Logger | Internal | Thread-safe, high-speed asynchronous logging with ISO formatting and file retention. |
| **Process Control** | Process Event Handlers | Native | Graceful teardown listeners for SIGINT, SIGTERM, and unhandled promise rejections. |
| **Frontend Framework**| React | 18.3.1 | Declarative component-driven UI library with Concurrent Mode and React Hooks. |
| **Frontend Language** | TypeScript | 5.4.5 | Static type safety preventing runtime null pointer and schema mismatch bugs. |
| **Bundler & Tooling** | Vite | 7.3.6 | Blazing fast development server with ESBuild and optimized Rollup production bundler. |
| **Client Routing** | React Router DOM | 6.23.1 | Declarative client-side routing with nested layouts and protected route wrappers. |
| **State Management**| Redux Toolkit | 2.2.5 | Predictable, centralized application state container with Immer-powered immutable updates. |
| **React Redux Bindings**| react-redux | 9.1.2 | Official React bindings for Redux store subscriptions and dispatch hooks. |
| **HTTP Client** | Axios | 1.6.8 | Promise-based HTTP client with automatic request/response interceptors. |
| **Styling Framework**| Tailwind CSS | 3.4.3 | Utility-first CSS framework providing rapid, responsive, design-system-aligned UI. |
| **Vector Icons** | Lucide React | 0.378.0 | Consistent, modern vector iconography covering all domain entities and actions. |
| **Notifications** | Sonner | 1.4.41 | High-performance, stacked toast notification system with interactive loading states. |
| **Animations** | Framer Motion | 11.1.9 | Hardware-accelerated UI animations for modals, transitions, and collapsible panels. |
| **Data Visualization**| Recharts | 2.12.7 | Declarative SVG-based charting library for attendance statistics and performance gauges. |

## 1.4 High-Level Architecture & Communication Topology

The following diagram illustrates the complete architectural topology of the GBU-SDSM ecosystem, showing network pathways, security checkpoints, controller delegation, and database persistence:

\`\`\`mermaid
flowchart TB
    subgraph ClientBrowser [Client Browser Tier - React 18 SPA]
        ReactUI[React Virtual DOM & Tailwind UI]
        Router[React Router DOM v6 - Protected Routes]
        ReduxStore[Redux Toolkit Store: adminSlice, userSlice]
        AxiosClient[Axios Client with Bearer Token Interceptor]
    end

    subgraph SecurityPerimeter [Security Perimeter & HTTP Gateway]
        CORS[CORS Whitelist Validator]
        SecHeaders[Security Headers - CSP, XSS, FrameGuard]
        ReqLogger[Request Logger & Timing Profiler]
        RateLimiter[IP Rate Limiter]
    end

    subgraph MiddlewareTier [Express Middleware Pipeline]
        AuthMiddleware[auth.middleware: JWT Verification & User Hydration]
        RoleMiddleware[role.middleware: RBAC Permission Guard]
        MulterMiddleware[multer: Memory Buffer & MIME Type Validator]
    end

    subgraph ControllerTier [Backend Controller Orchestrators]
        AuthCtrl[auth.controller.js]
        StudentCtrl[student.controller.js]
        CoordCtrl[coordinator.controller.js]
        ChairCtrl[chairperson.controller.js]
        FacultyCtrl[faculty.controller.js]
        TeachingCtrl[teaching.controller.js]
        AttendCtrl[attendance.controller.js]
        MsgCtrl[messages.controller.js]
        ExcelCtrl[excel.controller.js]
        TimetableCtrl[timetable.controller.js]
    end

    subgraph ServiceTier [Pure Functional Domain Services]
        TokenSvc[token.service.js: Access & Refresh Tokens]
        HashSvc[hashing.service.js: Salted Bcrypt]
        UploadSvc[upload.service.js: Excel Student Ingestion]
        ReformatSvc[excelReformat.service.js: Header Mapping]
        PhotoSvc[photoUpload.service.js: Photo Data Resolution]
    end

    subgraph PersistenceTier [Relational Database Tier - MySQL 8.x]
        SequelizeORM[Sequelize ORM Engine]
        TableUsers[(users)]
        TableStudents[(students)]
        TableCoord[(coordinators)]
        TableChair[(chairpersons)]
        TableFaculty[(faculty)]
        TableFacAssign[(faculty_assignments)]
        TableSubjects[(subjects)]
        TableSessions[(attendance_sessions)]
        TableRecords[(attendance_records)]
        TableTimetables[(timetables)]
        TableMessages[(messages & message_recipients)]
        TableLogs[(change_logs & notifications)]
    end

    ClientBrowser -->|HTTPS REST JSON Requests| SecurityPerimeter
    SecurityPerimeter --> MiddlewareTier
    MiddlewareTier --> ControllerTier
    ControllerTier --> ServiceTier
    ControllerTier --> SequelizeORM
    ServiceTier --> SequelizeORM
    SequelizeORM --> PersistenceTier
\`\`\`

## 1.5 Master Directory Hierarchy & File Map

The complete codebase file tree comprises 272 total files, with the primary application logic encapsulated within the \`backend/\` and \`frontend/\` directories.

### Master File Map
\`\`\`
sdms-main/
├── backend/
│   ├── controllers/
│   │   ├── attendance.controller.js    # Student attendance summaries, admin audits, record edits
│   │   ├── auth.controller.js          # Authentication, JWT lifecycle, password resets, registration
│   │   ├── chairperson.controller.js   # Chairperson oversight, class delegations, change logs
│   │   ├── coordinator.controller.js   # Coordinator assignments, dashboard metrics, student counts
│   │   ├── excel.controller.js         # Excel file ingestion, column reformatting, photo uploads
│   │   ├── faculty.controller.js       # Faculty profile management, assignments, directory
│   │   ├── messages.controller.js      # Multi-class broadcasts, thread histories, unread badges
│   │   ├── specialization.controller.js# Specialization catalog, school/department hierarchy
│   │   ├── student.controller.js       # Student CRUD, bulk updates, filtering, Excel uploads
│   │   ├── teaching.controller.js      # Faculty roster generation, attendance session submission
│   │   └── timetable.controller.js     # Timetable scheduling, room allocations, section schedules
│   ├── lib/
│   │   ├── asyncHandler.js             # Higher-order wrapper catching async errors
│   │   ├── db.js                       # Sequelize MySQL connection pool & buffer tuning
│   │   ├── errorHandler.js             # Centralized HTTP error formatter and logger
│   │   ├── logger.js                   # Asynchronous structured file & console logging
│   │   ├── requestLogger.js            # Express request timing and IP profiler
│   │   ├── security.js                 # Security headers injection (CSP, FrameGuard, HSTS)
│   │   └── shutdown.js                 # Process signal listener for graceful pool shutdown
│   ├── middlewares/
│   │   ├── auth.middleware.js          # JWT extraction, signature verification, user injection
│   │   ├── rateLimit.middleware.js     # In-memory IP request rate limiting
│   │   └── role.middleware.js          # Strict RBAC permission verification
│   ├── models/
│   │   ├── attendanceRecord.model.js   # Granular student session status (Present/Absent/Excused)
│   │   ├── attendanceSession.model.js  # Scheduled attendance event with lock status
│   │   ├── chairperson.model.js        # Chairperson executive profile
│   │   ├── chairpersonClass.model.js   # Mapping table for chairperson-class delegations
│   │   ├── changeLog.model.js          # Immutable audit log with before/after diffs
│   │   ├── coordinator.model.js        # Coordinator profile with program assignments
│   │   ├── faculty.model.js            # Faculty instructor profile
│   │   ├── facultyAssignment.model.js  # Class-Subject-Teacher relational binding
│   │   ├── index.js                    # Model registry & foreign key association definition
│   │   ├── message.model.js            # Message entity with sender and broadcast payload
│   │   ├── messageRecipient.model.js   # Junction mapping message delivery and read receipts
│   │   ├── notification.model.js       # Role-targeted institutional system notifications
│   │   ├── specialization.model.js     # Academic specialization catalog
│   │   ├── student.model.js            # Comprehensive student entity (42 fields)
│   │   ├── subject.model.js            # Curriculum subject master catalog
│   │   ├── timetable.model.js          # Timetable root configuration
│   │   ├── timetableSection.model.js   # Timetable section schedule grid
│   │   └── user.model.js               # Universal authentication credentials & role flags
│   ├── routes/
│   │   ├── attendance.route.js         # Endpoints for attendance rosters and sessions
│   │   ├── auth.route.js               # Endpoints for login, refresh, logout, OTP
│   │   ├── chairperson.route.js        # Endpoints for chairperson oversight and classes
│   │   ├── coordinator.route.js        # Endpoints for coordinator management and classes
│   │   ├── faculty.route.js            # Endpoints for faculty administration and directory
│   │   ├── messages.route.js           # Endpoints for in-app messaging and broadcasts
│   │   ├── specialization.route.js     # Endpoints for academic specializations
│   │   ├── student.route.js            # Endpoints for student CRUD and bulk edits
│   │   └── timetable.route.js          # Endpoints for timetable schedule management
│   ├── services/
│   │   ├── excelReformat.service.js    # Algorithmic header alias matching & workbook reformatting
│   │   ├── hashing.service.js          # Salted bcrypt hashing and verification
│   │   ├── otp.service.js              # Six-digit cryptographic OTP generator
│   │   ├── parsing.service.js          # Type-safe payload sanitization and parsing
│   │   ├── photoUpload.service.js      # Student photo resolution (Base64, URL, filesystem)
│   │   ├── timetable.service.js        # Timetable slot conflict detection engine
│   │   ├── token.service.js            # JWT access and refresh token signing & verification
│   │   ├── upload.service.js           # Excel student batch normalization
│   │   └── whitespace.service.js       # String normalization and whitespace removal
│   ├── index.js                        # Server initialization, DB bootstrap & port listener
│   ├── server.js                       # Express configuration, CORS, middleware assembly
│   └── package.json                    # Backend dependencies and execution scripts
├── frontend/
│   ├── src/
│   │   ├── assets/                     # Static brand assets, logos, and developer portraits
│   │   ├── components/
│   │   │   ├── Admin/                  # Admin headers, sidebars, student forms, student details
│   │   │   ├── Attendance/             # Attendance roster tables, summary cards, SVG charts
│   │   │   ├── Client/                 # Student profile view, attendance view, messages, timetable
│   │   │   ├── Home/                   # Public landing components: Hero, About, Team, Statistics
│   │   │   ├── Messages/               # Full-screen responsive messaging center
│   │   │   ├── Teaching/               # Faculty teaching class cards and status badges
│   │   │   └── AppErrorBoundary.tsx    # Global React component crash boundary
│   │   ├── constants/
│   │   │   └── index.ts                # University schools, departments, initial forms, team data
│   │   ├── context/
│   │   │   ├── app/store.ts            # Redux Toolkit global store configuration
│   │   │   ├── features/adminSlice.ts  # Administrative user profile & authentication slice
│   │   │   ├── features/userSlice.ts   # Student profile state slice
│   │   │   └── useAuth.ts              # Custom React hook for authentication state
│   │   ├── lib/
│   │   │   ├── api.ts                  # Axios instance with global interceptors
│   │   │   ├── attendance.api.ts       # Attendance roster and session API methods
│   │   │   ├── messages.api.ts         # In-app messaging and recipient lookup API methods
│   │   │   ├── teaching.api.ts         # Faculty teaching classes and submission API methods
│   │   │   └── user.api.ts             # Student, coordinator, chairperson CRUD API methods
│   │   ├── pages/
│   │   │   ├── Admin/                  # Admin & coordinator pages (Dashboard, Classes, Records, etc.)
│   │   │   ├── Chairperson/            # Chairperson oversight pages (Classes, Records, Logs, etc.)
│   │   │   ├── Client/                 # Student portal dashboard page
│   │   │   ├── Faculty/                # Faculty profile and messages pages
│   │   │   ├── Landing/                # Public Landing, Login, Signup, Developer showcase
│   │   │   ├── Student/                # Student attendance standalone page
│   │   │   └── Teaching/               # Teaching Dashboard and Mark Attendance pages
│   │   ├── types/
│   │   │   └── types.ts                # Master TypeScript interface and type declarations
│   │   ├── utils/
│   │   │   ├── Dropdown.tsx            # Custom accessible dropdown component
│   │   │   ├── ProtectedRoute.tsx      # Route authentication and role redirection guard
│   │   │   ├── excel.ts                # Client-side Excel export generator
│   │   │   └── NotFound.tsx            # 404 Not Found fallback view
│   │   ├── App.tsx                     # Master React Router DOM hierarchy & route manifest
│   │   ├── index.css                   # Tailwind CSS imports and custom utility styles
│   │   └── main.tsx                    # React DOM entry point wrapped in Redux Provider
│   ├── index.html                      # HTML5 shell
│   ├── package.json                    # Frontend dependencies and build scripts
│   ├── tsconfig.json                   # TypeScript compiler configuration
│   └── vite.config.ts                  # Vite build tool and development server configuration
`;
}
