# GBU Student Data Management System (GBU-SDSM) - Claude Project Guide

Welcome! This archive contains the complete source code, configurations, and exhaustive technical architecture for the **Gautam Buddha University Student Data Management System (GBU-SDSM)**.

---

## 🌟 Primary Documentation Reference

For a complete, minor-to-minor technical breakdown of the entire platform, open:
📁 **`SYSTEM_DOCUMENTATION_COMPLETE_REFERENCE.md`**
* Contains **30,449 words** across 15 exhaustive sections.
* Covers: System Architecture, Complete Relational Data Dictionary (all 17 models), Authentication & RBAC, REST API Specifications, Frontend Routing & State, Component Library, Workflows, Algorithms, QA Playbooks, OWASP Top 10 Audits, and AI Agent Implementation Guides.

---

## 📂 Codebase Directory Layout

```
├── SYSTEM_DOCUMENTATION_COMPLETE_REFERENCE.md  # 30,000+ words master technical documentation
├── AI-HANDOFF.md                                # Context & operational guidelines for AI agents
├── backend/                                     # Node.js, Express, Sequelize, MySQL API server
│   ├── controllers/                             # All route controller logic
│   ├── models/                                  # All 17 Sequelize relational models
│   ├── routes/                                  # Express route handlers
│   ├── middlewares/                             # JWT auth, RBAC, rate limiting, security headers
│   ├── lib/                                     # Database connection, logger, graceful shutdown
│   ├── services/                                # Business services & mailer
│   ├── server.js                                # Express application setup & middleware mounts
│   ├── index.js                                 # Server bootstrapper & listener
│   └── package.json                             # Backend dependencies & npm scripts
├── frontend/                                    # React 18, Vite 5, Tailwind CSS, Redux Toolkit
│   ├── src/
│   │   ├── components/                          # UI components (StudentForm, Detail, BulkEdit, Attendance)
│   │   ├── pages/                               # View pages (admin, coordinator, chairperson, faculty, client)
│   │   ├── store/                               # Redux Toolkit store (adminSlice, userSlice)
│   │   ├── types/                               # TypeScript canonical interfaces & schemas (types.ts)
│   │   ├── constants/                           # University hierarchy constants (Schools, Depts, Programs)
│   │   ├── utils/                               # Axios HTTP client with silent token refresh
│   │   ├── App.tsx                              # Application router tree with route guards
│   │   └── main.tsx                             # React DOM entry point
│   ├── index.html                               # HTML template
│   ├── vite.config.ts                           # Vite configuration
│   └── package.json                             # Frontend dependencies & npm scripts
└── scripts/                                     # Documentation compilation & backup scripts
```

---

## 🚀 Key Features & Historical Context

1. **Multi-Role Portal Hierarchy**:
   * **Admin**: Institutional oversight, master student directory, bulk import/export, user creation.
   * **Chairperson**: Departmental oversight, cross-program statistics, faculty teaching assignments.
   * **Coordinator**: Batch-specific roster management, class attendance, and scoped bulk editing.
   * **Faculty**: Course-specific attendance marking terminal, student rosters, and messaging.
   * **Student**: Personal profile, attendance ledger, weekly timetables, notifications.

2. **Recent Architectural Additions**:
   * **8 Career Timeline Attributes**: Integrated across DB, models, and UI (`internshipCompany`, `internshipDoj`, `internshipDoe`, `internshipIsPaid`, `internshipStipend`, `placementCompany`, `placementDoj`, `placementIsPaid`).
   * **Multi-Select Bulk Edit**: In-place batch modification modal for coordinators, chairpersons, and admins.
   * **Data Isolation**: Strictly enforced tenancy barriers preventing cross-class data mutations.
   * **Zero Disruption Editing**: In-place modal/drawer editing preventing route-redirect interruptions.

3. **Quick Commands**:
   * Backend development: `cd backend && npm run start:dev` (runs on `http://localhost:5000`)
   * Frontend development: `cd frontend && npm run dev` (runs on `http://localhost:5173`)
