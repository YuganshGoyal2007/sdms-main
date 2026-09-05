export function getSection9() {
  return `
---

# SECTION 9: TypeScript Type System, Schemas & Validation Contracts

## 9.1 TypeScript Architectural Philosophy & Strict Compilation Model

GBU-SDSM enforces strict static typing across the entire frontend application tier to prevent runtime null-pointer dereferences, invalid state transitions, and unauthorized payload mutations.

\`\`\`json
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
\`\`\`

---

## 9.2 Complete TypeScript Interface Catalog (\`src/types/types.ts\`)

Below is the complete, canonical type declaration catalog governing GBU-SDSM domain entities, API payloads, state contracts, and component interfaces.

### 9.2.1 Generic API Response & Academic Organization Contracts
\`\`\`typescript
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
\`\`\`

### 9.2.2 Academic Progression & Semester Records
\`\`\`typescript
export interface Semester {
  semester: number;          
  registered: "Pending" | "Completed" | "Yes" | "No";  
  sgpa?: string | number | null;
}

export interface YearCGPA {
  year: number;           
  cgpa?: number | null;  
}
\`\`\`

### 9.2.3 Faculty Assignment Contract
\`\`\`typescript
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
\`\`\`

### 9.2.4 Master Student Entity Interface (\`StudentProps\`)
This interface defines the complete data contract for a student in GBU-SDSM, incorporating demographic, academic, familial, contact, and the newly added career/internship attributes:
\`\`\`typescript
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
\`\`\`

### 9.2.5 Identity & User Profile Interfaces
\`\`\`typescript
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
\`\`\`

### 9.2.6 Detailed Student Dossier Interface (\`StudentDetail\`)
\`\`\`typescript
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
\`\`\`

### 9.2.7 Chairperson & Coordinator Class Management Contracts
\`\`\`typescript
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
\`\`\`

### 9.2.8 Attendance System Type System
\`\`\`typescript
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
\`\`\`

---

## 9.3 Institutional Master Constants Hierarchy (\`src/constants/index.ts\`)

GBU-SDSM models the complete academic tree of Gautam Buddha University, encompassing all schools, constituent departments, and degrees.

\`\`\`mermaid
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
\`\`\`

### 9.3.1 Active Schools & Departments
- **School of Information and Communication Technology (SOICT)**:
  - Department of Computer Science and Engineering (\`cse\`)
  - Department of Information Technology (\`it\`)
  - Department of Electronics and Communication Engineering (\`ece\`)
- **School of Engineering (SOE)**:
  - Civil Engineering (\`ce\`)
  - Mechanical Engineering (\`me\`)
  - Electrical Engineering (\`ee\`)
  - Architecture and Regional Planning (\`ar\`)
- **School of Management (SOM)**:
  - Department of Business Management (\`mb\`)
- **School of Biotechnology (SOBT)**:
  - Department of Biotechnology (\`bt\`)
- **School of Humanities and Social Sciences (SOHSS)**:
  - English & Modern European Languages (\`en\`)
  - Mass Communication & Media Studies (\`mc\`)
  - Economics, Planning & Development (\`ep\`)
  - Psychology & Mental Health (\`pm\`)
- **School of Law, Justice & Governance (SOLJG)**:
  - Department of Law, Justice & Governance (\`lb\`)
- **School of Vocational Studies and Applied Sciences (SOVSAS)**:
  - Applied Mathematics (\`ma\`), Applied Chemistry (\`ch\`), Applied Physics (\`ph\`), Environmental Sciences (\`es\`), Food Processing (\`ft\`).

---

## 9.4 Validation Contracts & Data Integrity Rules

| Data Attribute | Type Contract | Format Pattern / Regular Expression | Validation Business Rules |
| :--- | :--- | :--- | :--- |
| \`enrollmentNo\` | String | \`^[0-9]{10}$\` | Exactly 10 digits; unique across university; primary student identifier. |
| \`rollNo\` | String | \`^[0-9A-Z]{2,15}$\` | Class roll number within section. |
| \`email\` | String | \`^[a-zA-Z0-9._%+-]+@gbu\\.ac\\.in$\` | Valid email structure; university domain preferred for official accounts. |
| \`mobile\` | String | \`^[6-9][0-9]{9}$\` | 10-digit Indian standard mobile format starting with 6, 7, 8, or 9. |
| \`dob\` | String (ISO) | \`^\\d{4}-\\d{2}-\\d{2}$\` | Valid date; student age must be $\\ge 16$ years at admission. |
| \`cgpa\` | Number | $0.00 \\le \\text{CGPA} \\le 10.00$ | Decimal number formatted to 2 decimal places. |
| \`internshipDOJ\` & \`DOE\` | String (ISO) | \`^\\d{4}-\\d{2}-\\d{2}$\` | Chronological invariant: $\\text{internshipDOJ} \\le \\text{internshipDOE}$. |
| \`placementDOJ\` | String (ISO) | \`^\\d{4}-\\d{2}-\\d{2}$\` | Date of joining company upon graduation. |
| \`category\` | Enum | \`GEN\` \\| \`OBC\` \\| \`SC\` \\| \`ST\` \\| \`EWS\` | Government of India recognized reservation categories. |
| \`gender\` | Enum | \`Male\` \\| \`Female\` \\| \`Other\` | Demographic gender classification. |
`;
}
