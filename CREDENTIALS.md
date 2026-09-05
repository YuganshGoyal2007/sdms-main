# Gautam Buddha University SDMS - Test Credentials & Access Guide

All pre-configured personas, test passwords, 2FA/OTP backdoor, and database configurations for local development and E2E evaluation.

---

## 1. Primary Dedicated Test Personas

- **Standard Password**: `TestPass@123`
- **Universal Dev OTP (Backdoor)**: `270720`
- **Login Portal**: `http://localhost:5173/login`

| Role | User / Officer Name | Username / Identifier | Password | Dev OTP | Dedicated Features & Portals |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | Arun Solanki (HOD) | `hod.cs@gbu.ac.in` | `TestPass@123` | `270720` | `/admin/dashboard`, `/admin/no-dues` (Clearance Queue), `/admin/fees` (Student Fee Ledger & Assessment), `/admin/leaves` (Leave Governance) |
| **Chairperson** | Test Chairperson | `test_chair@gbu.ac.in` | `TestPass@123` | `270720` | `/chairperson/dashboard`, No-Dues clearance approvals, academic endorsements |
| **Coordinator** | Test Coordinator | `test_coord@gbu.ac.in` | `TestPass@123` | `270720` | `/coordinator/dashboard`, Attendance recording, section timetable scheduling |
| **Faculty** | Dr. Test Faculty | `test_faculty@gbu.ac.in` | `TestPass@123` | `270720` | `/faculty/dashboard`, `/faculty/leaves` (Leave Quota balances, apply modal) |
| **Student** | Ishika Pratap Singh | `2500100481` *(or `255ucs258`)* | `TestPass@123` | `270720` | `/student`, Fees Ledger, 3-Tier Interactive Clearance DAG Canvas (`workflow.top`, `workflow.parallel`, `workflow.bottom`), Digital Certificate Modal |

---

## 2. Batch-Specific Student Test Accounts

| Batch / Specialization | Roll Number | Enrollment Number | Username | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Batch 2026 (Cyber Security)** | `2026_CYBER_TEST` | `EN_2026_CYBER` | `student2026` | `password123` |
| **Batch 2025 (AI Sec A)** | `2025_AI_TEST` | `EN_2025_AI` | `student2025` | `password123` |
| **Batch 2024 (Core Sec B)** | `2024_CORE_TEST` | `EN_2024_CORE` | `student2024` | `password123` |
| **Batch 2022 (Core Sec A)** | `2022_CORE_TEST` | `EN_2022_CORE` | `student2022` | `password123` |

---

## 3. Additional Faculty & Academic Officers

| Role | Official Name | Username / Email |
| :--- | :--- | :--- |
| **Chairperson** | Dr. Rakesh Kumar Yadav | `rrakesh.kumar@gbu.ac.in` |
| **Chairperson** | Dr. Gaurav Kumar | `gaurav.kumar@gbu.ac.in` |
| **Chairperson** | Shiraz Khurana | `shiraz.khurana@gbu.ac.in` |
| **Faculty** | Dr. Vikram Singh | `vikram@gbu.ac.in` |
| **Faculty** | Faculty Test | `prof.test@gbu.ac.in` |
| **Faculty** | Prof. Sharma | `prof.sharma@gbu.ac.in` |

---

## 4. Local Database & Server Configurations

### Backend Configuration (`backend/.env`)
- **Dialect**: `mysql`
- **Host**: `localhost:3306`
- **Database Name**: `gbu_sdms`
- **DB User**: `root`
- **DB Password**: `A@eofyug2007`
- **Backend Port**: `5000` (`http://localhost:5000`)
- **JWT Secret**: `CHANGE_ME_dev_only_replace_in_prod_a3f8b1c2d4e5f6a7`
- **Universal Dev OTP**: `270720`

### Frontend Configuration (`frontend/.env`)
- **Frontend Port**: `5173` (`http://localhost:5173`)
- **Backend API URL**: `http://localhost:5000`
