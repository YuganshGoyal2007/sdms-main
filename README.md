# Gautam Buddha University - Student Data Management System (GBU-SDMS)

An enterprise-grade, full-stack Student Data Management and Institutional Clearance Platform engineered for Gautam Buddha University (GBU). 

The platform integrates multi-tier Role-Based Access Control (RBAC), an undiscoverable departmental clearance state machine (Directed Acyclic Graph), a live reverse-engineered university timetable scraping and dynamic faculty reassignment engine, and tamper-proof financial hold enforcement.

---

## 1. System Architecture & Core Capabilities

### A. Undiscoverable Departmental Gateways & Strict RBAC Isolation
- **Public Ingress Sanitization**: The public student login page (`/login`) contains **zero** links, buttons, or hints for clearance desks or officer portals. Students cannot enumerate or discover administrative clearance endpoints.
- **Dedicated Unlisted Gateways**: Each auxiliary clearance department has an independent, unlisted authentication gateway mounted at `/clearance/auth/:deskSlug`:
  - Central Bodhisattva Library (`/clearance/auth/library`)
  - Hostel Administration & Mess Office (`/clearance/auth/hostel`)
  - University Sports Council (`/clearance/auth/sports`)
  - School Dean Clearance (`/clearance/auth/dean`)
  - ICT Infrastructure Office (`/clearance/auth/ict`)
- **Strict Cross-Desk Containment**: Officers are cryptographically and logically bound to their single institutional `officeCode`. Any attempt to access or mutate records on an unauthorized desk returns HTTP 403 (`FORBIDDEN_DESK`).
- **Central HOD Administrative Boundary**: The Central HOD Admin account (`hod.cs@gbu.ac.in`) is restricted strictly to academic administration (`/admin/*`). Central HOD is barred from auxiliary clearance desks with HTTP 403 `FORBIDDEN_DESK`, preventing administrative privilege escalation.

### B. 5-Level Directed Acyclic Graph (DAG) Clearance Pipeline
- **Topological State Machine**: The student exit clearance workflow is structured as a 10-node, 5-level Directed Acyclic Graph:
  - **Levels 1–3 (Sequential Academic Spine)**: School Administrative Office -> Head of Department -> School Dean.
  - **Level 4 (Parallel Departmental Auxiliary Bus)**: 6 concurrent clearance nodes (Central Library, Hostel Office, Department Laboratories, Sports Council, Training & Placement CRC, ICT Office).
  - **Level 5 (Terminal Financial Seal)**: Central Accounts & Finance Branch.
- **Automated Gate Unlocking**: Active level gates unlock parallel lanes dynamically upon completion of prerequisite levels.
- **Financial Hold Precedence**: Real-time fee ledger integration halts Level 5 clearance if non-zero fee dues or active holds exist.

### C. Live Timetable Scraping & Dynamic Faculty Reassignment Engine
- **Reverse-Engineered Integration**: Direct connection to university timetable sources:
  - Samay JSON API: `https://samay.mygbu.in/api.php` (4,154 live course allocations)
  - MyGBU Faculty Load Report: `https://mygbu.in/schd/load.php?school=SOICT&dept=CSE+++++++`
  - MyGBU Master Schedule Grid: `https://mygbu.in/schd/index.php?name=SOICT&dept=CSE`
- **Dynamic Teacher Reassignment**: When timetable changes occur:
  - The outgoing teacher's `FacultyAssignment` is deactivated atomically, revoking student roster access and attendance permissions.
  - The incoming teacher is provisioned with student rosters and class management rights immediately.
  - If a teacher is reassigned to a new class, they receive that class's student data.
  - Every transition is immutably audited in `ChangeLog` (`action: FACULTY_REASSIGNMENT`).
- **Dry-Run Simulation**: Full simulation capability in the Admin UI (`/admin/timetable`) parsing course allocations and mapping class coordinates without modifying database state.

### D. High-Resolution Student Portrait Display
- Official student portraits stored as Base64 JPEG data URIs (`students.photo`) render seamlessly in:
  - Student Profile View (94x94 rounded portrait card)
  - Client Header Avatar Pill (with student full name and notification badge)
  - Mobile & Desktop Navigation Drawer
  - Automatic fallback to initials avatar if no photo is available.

### E. 100% Zero-Emoji Enterprise UI Compliance
- Zero unicode pictographic emojis across all public and authenticated user interfaces.
- Standardized on enterprise Lucide React SVG icons for professional institutional compliance.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Router v6, Lucide React, Axios |
| **Backend** | Node.js (v24+), Express.js, Sequelize ORM, MySQL 8.0, JSON Web Tokens (JWT), Bcryptjs, Multer |
| **Telemetry & Ingestion** | Undici Native Fetch, AbortController timeout pooling, Pino structured logging |
| **Testing & Verification** | Puppeteer Core, Chrome DevTools Protocol (CDP), Custom Deep Invariant Audit Suite |

---

## 3. Directory Layout

```
sdms-main/
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js          # Unified student/officer login & OTP handlers
│   │   ├── noDues.controller.js        # 10-node DAG clearance state machine & desk RBAC
│   │   ├── timetable.controller.js     # Timetable mapping and scrape telemetry
│   │   ├── student.controller.js       # Student profile & roster management
│   │   └── excel.controller.js         # Excel batch upload & photo processing
│   ├── middlewares/
│   │   ├── auth.middleware.js          # JWT verification & forged token rejection
│   │   ├── role.middleware.js          # Role-based route authorization
│   │   └── rateLimit.middleware.js     # IP rate limiters
│   ├── models/
│   │   ├── user.model.js               # Core user credentials and role definitions
│   │   ├── student.model.js            # Student profile and base64 photo storage
│   │   ├── noDuesApplication.model.js  # Clearance application workflow headers
│   │   ├── noDuesStage.model.js        # Individual clearance desk stages & dues
│   │   ├── facultyAssignment.model.js  # Dynamic teacher-to-class roster mappings
│   │   └── changeLog.model.js          # Immutable institutional audit trail
│   ├── routes/
│   │   ├── auth.route.js               # Authentication endpoints
│   │   ├── noDues.route.js             # Clearance endpoints & officer desk actions
│   │   ├── timetable.route.js          # Scraper telemetry & sync engine
│   │   └── student.route.js            # Student management & photo endpoints
│   ├── services/
│   │   ├── timetableSync.service.js    # Live scraper & faculty reassignment engine
│   │   └── token.service.js            # JWT minting & verification
│   └── scripts/
│       ├── security_pipeline_deep_audit.mjs   # 37-assertion automated test suite
│       └── test_complete_audit_suite.mjs      # Headless Puppeteer E2E browser runner
└── frontend/
    └── src/
        ├── components/
        │   ├── Admin/                  # Admin side navigation and monitoring widgets
        │   └── Client/                 # ProfileView, ClientHeader, and StudentFeesView
        ├── pages/
        │   ├── Landing/
        │   │   ├── Login.tsx           # Sanitized student login (0 officer links)
        │   │   └── DeskLogin.tsx       # Dedicated unlisted clearance desk login
        │   ├── Admin/
        │   │   └── TimetableAdmin.tsx  # Timetable scraper monitor & dry-run dashboard
        │   └── NoDues/
        │       ├── OfficeClearancePortal.tsx # Officer review queue & bulk approval desk
        │       └── NoDuesPortalsHub.tsx      # Multi-desk selector (admin only)
        └── utils/
            └── ProtectedRoute.tsx      # Client-side route interception & role containment
```

---

## 4. Institutional Endpoints & Credentials

### Public & Unlisted Gateways
| Ingress Path | Authorized Audience | Scope |
|---|---|---|
| `http://localhost:5173/login` | Students, Faculty, Admins | Primary university authentication (0 officer links) |
| `http://localhost:5173/clearance/auth/library` | Central Library Officer | Overdue book fines, accession return clearance |
| `http://localhost:5173/clearance/auth/hostel` | Hostel Warden / Office | Room damage penalty, mess fee clearance |
| `http://localhost:5173/clearance/auth/sports` | Sports Council Officer | Sports kit, gym equipment return clearance |
| `http://localhost:5173/clearance/auth/dean` | School Dean Officer | Academic project, thesis, conference clearance |
| `http://localhost:5173/clearance/auth/ict` | ICT Support Officer | Email, VPN, university server account closure |

### Seeded Credentials Directory
| Role | Username / Identifier | Password | Institutional Office Code |
|---|---|---|---|
| **Central HOD Admin** | `hod.cs@gbu.ac.in` | `TestPass@123` | *None (Academic Admin)* |
| **Library Officer** | `library@gbu.ac.in` | `TestPass@123` | `LIB` |
| **Hostel Officer** | `hostel@gbu.ac.in` | `TestPass@123` | `HST` |
| **Sports Officer** | `sports@gbu.ac.in` | `TestPass@123` | `SPT` |
| **Dean Officer** | `dean.soict@gbu.ac.in` | `TestPass@123` | `DEAN` |
| **ICT Officer** | `ict@gbu.ac.in` | `TestPass@123` | `ICT` |
| **Student** | `235uai047` | `TestPass@123` | *N/A (Roll Number)* |

---

## 5. Automated Verification & Security Audit Matrix

The automated deep audit suite (`backend/scripts/security_pipeline_deep_audit.mjs`) validates **37 out of 37 assertions (100% PASS)**:

```
========================================================================
   GBU-SDMS DEEP SECURITY AUDIT & PIPELINE INVARIANT VERIFICATION       
========================================================================

--- 1. Authentication & Token Integrity Audit ---
[PASS] Unauthenticated request to clearance overview rejected (Status: 401)
[PASS] Unauthenticated request to admin timetable rejected (Status: 401)
[PASS] Unauthenticated request to student no-dues rejected (Status: 401)
[PASS] Forged JWT signature rejected with 401
[PASS] JWT "none" algorithm bypass attempt rejected with 401
[PASS] Library Officer authentication successful 
[PASS] Hostel Officer authentication successful 
[PASS] HOD Admin authentication successful 
[PASS] Student authentication successful 

--- 2. Authorization & Departmental RBAC Isolation ---
[PASS] Library Officer allowed access to matching Library desk (LIB) 
[PASS] Library Officer blocked from Hostel desk with 403 FORBIDDEN_DESK 
[PASS] Library Officer blocked from Sports desk with 403 FORBIDDEN_DESK 
[PASS] Library Officer blocked from Dean desk with 403 FORBIDDEN_DESK 
[PASS] Library Officer blocked from ICT desk with 403 FORBIDDEN_DESK 
[PASS] Hostel Officer blocked from Library desk with 403 FORBIDDEN_DESK 
[PASS] Library Officer prohibited from executing approvals on Hostel desk (403) 
[PASS] Library Officer prohibited from bulk approving on Hostel desk (403) 

--- 3. Privilege Escalation Probing ---
[PASS] Student vertical escalation to clearance overview blocked (403) 
[PASS] Student vertical escalation to admin timetable mappings blocked (403) 
[PASS] Officer vertical escalation to admin timetable mappings blocked (403) 
[PASS] Central HOD Admin strictly blocked from Library Clearance Desk (403 FORBIDDEN_DESK) 
[PASS] Central HOD Admin strictly blocked from Hostel Clearance Desk (403 FORBIDDEN_DESK) 
[PASS] Central HOD Admin retains legitimate access to Academic Admin endpoints (200 OK) 

--- 4. No-Dues DAG State Machine Pipeline Integrity ---
[PASS] Clearance DAG contains Central Library node 
[PASS] Clearance DAG contains Hostel Office node 
[PASS] Clearance DAG contains Sports Council node 
[PASS] Clearance DAG contains School Dean node 
[PASS] Clearance DAG contains ICT Office node 
[PASS] DAG stages respect non-decreasing sequence order (level progression) 
[PASS] Active DAG level gates correctly unlock pending stages 

--- 5. Fees & Data Integrity Invariants ---
[PASS] Departmental ledger dues totals are strictly non-negative 
[PASS] Overview returns exclusively valid institutional office codes 

--- 6. Timetable Scraping & Faculty Reassignment Engine ---
[PASS] Live scrape status endpoint responds with 200 OK 
[PASS] Samay Live API (samay.mygbu.in) is online and responding (Latency: 950ms, Records: 4154) 
[PASS] Faculty Sync Dry Run simulation succeeds (200 OK) 
[PASS] Dry Run returns structured summary and allocation count (Allocations: 330) 
[PASS] Faculty transition audit log endpoint responds with 200 OK 

========================================================================
  SECURITY & PIPELINE AUDIT COMPLETE: 37/37 PASSED, 0 FAILED (100%)
========================================================================
```

---

## 6. Setup & Installation Guide

### Prerequisites
- Node.js (v20.x or v24.x recommended)
- MySQL 8.0 running on `localhost:3306`
- npm or yarn

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/YuganshGoyal2007/sdms-main.git
cd sdms-main

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Create `backend/.env`:
```env
PORT=5000
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gbu_sdms
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
ALLOW_SYNC=false
```

### 3. Database Migration & Officer Seeding
```bash
cd backend
node scripts/migrate_officer_rbac.mjs
node scripts/seed_nodues_offices.mjs
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend Server (Port 5000)
cd backend
node index.js

# Terminal 2: Frontend Server (Port 5173)
cd frontend
npm run dev
```

### 5. Execute Security & Verification Audit Suite
```bash
cd backend
node scripts/security_pipeline_deep_audit.mjs
```

---

## 7. Aristotle First Principles Strategic Summary

The platform was deconstructed and reconstructed across 5 Aristotelian phases:

1. **Assumption Autopsy**: Discarded legacy axioms of the "omnipotent admin superuser" and "sequential paper slip clearance". An Academic HOD has zero authority over library balances, and departmental clearance checks are computationally parallel, not sequential.
2. **Irreducible Truths**: Identity and authority are strictly bounded by organizational jurisdiction. Clearance is a directed acyclic graph. Timetable scheduling is an authoritative access control driver.
3. **Reconstruction From Zero**: Built capability-bounded departmental enclaves, an event-driven timetable synchronization engine, and an automated topological waterfall DAG.
4. **The Aristotelian Move**: **Transformed the live timetable stream from a passive view into the university's authoritative access oracle.** Faculty schedule shifts dynamically and atomically revoke outgoing teacher access and provision incoming teacher rosters, eliminating attendance fraud and administrative delay.

---

## 8. License & Institutional Credits

Developed for **Gautam Buddha University**.  
Built and maintained by Nishant Chauhan, Ashish Kumar & Yugansh Goyal.  
All Rights Reserved © 2026 Gautam Buddha University.
