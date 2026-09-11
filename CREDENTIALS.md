# Gautam Buddha University SDMS - Test Credentials & Portal Guide

All active accounts, passwords, roles, and dedicated portal URLs for testing and production verification.

---

## 1. Master Admin / HOD
> [!IMPORTANT]
> HOD / Admin password is permanently fixed to `admin123`.

| Role | Name | Username / Email | Password | Dev OTP | Portal URL | Scope |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin / HOD** | Dr. Arun Solanki | `hod.cs@gbu.ac.in` | `admin123` | `270720` | [`/login`](http://localhost:5173/login) | Full system control: Student Roster, Timetables, Master Clearance Queue, Fees Ledger, Leave Governance |

---

## 2. All No Dues Portals & Direct Links

### A. Central Hub & Student Tracking
| Portal / View | Direct URL | Who Can Access | Description |
| :--- | :--- | :--- | :--- |
| **All Portals Hub (Overview)** | [`/no-dues/portals`](http://localhost:5173/no-dues/portals) | Admin / Officers | Live overview grid of all departmental clearance desks with pending counts and action links |
| **Admin Master Clearance Queue** | [`/admin/no-dues`](http://localhost:5173/admin/no-dues) | Admin / HOD | Central waterfall clearance overview across all academic and departmental stages |
| **Student Clearance DAG Canvas** | [`/student`](http://localhost:5173/student) | Student | 3-Tier interactive clearance state machine canvas, real-time stage progress, and digital certificate download |
| **Coordinator Clearance Review** | [`/coordinator/no-dues`](http://localhost:5173/coordinator/no-dues) | Coordinator | Level 1 department-level student verification for assigned class batches |
| **Chairperson Clearance Review** | [`/chairperson/no-dues`](http://localhost:5173/chairperson/no-dues) | Chairperson | Level 1 department-level academic verification for assigned classes |

---

### B. Dedicated Departmental Clearance Desks
Each desk has both a direct dedicated clearance dashboard and a dedicated desk login screen:

| Department Desk | Desk Code | Direct Clearance Dashboard Link | Direct Desk Login Link | Default Officer Email | Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Central Bodhisattva Library** | `LIB` | [`/no-dues/portal/library`](http://localhost:5173/no-dues/portal/library) *(or `/portal/LIB`)* | [`/clearance/auth/library`](http://localhost:5173/clearance/auth/library) | `library@gbu.ac.in` | `TestPass@123` |
| **Hostel & Mess Administration** | `HST` | [`/no-dues/portal/hostel`](http://localhost:5173/no-dues/portal/hostel) *(or `/portal/HST`)* | [`/clearance/auth/hostel`](http://localhost:5173/clearance/auth/hostel) | `hostel@gbu.ac.in` | `TestPass@123` |
| **University Sports Council** | `SPT` | [`/no-dues/portal/sports`](http://localhost:5173/no-dues/portal/sports) *(or `/portal/SPT`)* | [`/clearance/auth/sports`](http://localhost:5173/clearance/auth/sports) | `sports@gbu.ac.in` | `TestPass@123` |
| **School Dean Clearance Desk** | `DEAN` | [`/no-dues/portal/dean`](http://localhost:5173/no-dues/portal/dean) *(or `/portal/DEAN`)* | [`/clearance/auth/dean`](http://localhost:5173/clearance/auth/dean) | `dean.soict@gbu.ac.in` | `TestPass@123` |
| **ICT Infrastructure Office** | `ICT` | [`/no-dues/portal/ict`](http://localhost:5173/no-dues/portal/ict) *(or `/portal/ICT`)* | [`/clearance/auth/ict`](http://localhost:5173/clearance/auth/ict) | `ict@gbu.ac.in` | `TestPass@123` |
| **Finance & Accounts Branch** | `ACC` | [`/admin/fees`](http://localhost:5173/admin/fees) *(Level 5 Final)* | [`/login`](http://localhost:5173/login) | `accounts@gbu.ac.in` | `TestPass@123` |

---

## 3. Academic & Faculty Personas
- **Standard Password**: `TestPass@123`
- **Universal Dev OTP**: `270720`
- **Standard Login URL**: [`/login`](http://localhost:5173/login)

| Role | Name | Username / Email | Password | Dedicated Portals & Features |
| :--- | :--- | :--- | :--- | :--- |
| **Chairperson** | Test Chairperson | `test_chair@gbu.ac.in` | `TestPass@123` | [`/chairperson/dashboard`](http://localhost:5173/chairperson/dashboard), edit assigned student personal details, approve class leaves |
| **Coordinator** | Test Coordinator | `test_coord@gbu.ac.in` | `TestPass@123` | [`/coordinator/dashboard`](http://localhost:5173/coordinator/dashboard), mark attendance, class timetable, edit assigned students |
| **Faculty** | Dr. Test Faculty | `test_faculty@gbu.ac.in` | `TestPass@123` | [`/faculty/dashboard`](http://localhost:5173/faculty/dashboard), [`/faculty/leaves`](http://localhost:5173/faculty/leaves) (apply leave, quota balances) |
| **Student** | Ishika Pratap Singh | `2500100481` *(or `255ucs258`)* | `TestPass@123` | [`/student`](http://localhost:5173/student) (Clearance DAG, Fees Ledger, Leave Management tab) |

---

## 4. Summary of Key Route Endpoints

- **Main Login**: [`http://localhost:5173/login`](http://localhost:5173/login)
- **No-Dues Portals Hub**: [`http://localhost:5173/no-dues/portals`](http://localhost:5173/no-dues/portals)
- **Admin Dashboard**: [`http://localhost:5173/admin/dashboard`](http://localhost:5173/admin/dashboard)
- **Admin Fees Ledger**: [`http://localhost:5173/admin/fees`](http://localhost:5173/admin/fees)
- **Admin Leave Governance**: [`http://localhost:5173/admin/leaves`](http://localhost:5173/admin/leaves)
- **Student Dashboard & Leaves**: [`http://localhost:5173/student`](http://localhost:5173/student)
