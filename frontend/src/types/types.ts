import type { ReactNode } from "react";

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

export interface Semester {
  semester: number;          
  registered: "Pending" | "Completed" | "Yes" | "No";  
  sgpa?: string | number | null;
}

export interface YearCGPA {
  year: number;           
  cgpa?: number | null;  
}

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
    enrollmentStatus: string,
    admissionType: string;
    twelfthCompartment: string;
    admissionYear: string;
    semesters: Semester[];
    yearCGPA: YearCGPA[];
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
    photo?: string; 
    status?: string;
}

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

export interface UniqueForm {
    uniqueId: string;
}

export interface CategoryFormProps {
    school: string;
    department: string;
    program: string;
    batch: string;
    specialization: string;
}

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
    internshipStatus: string;
    internshipCompany?: string;
    internshipDOJ?: string;
    internshipDOE?: string;
    internshipType?: string;
    fourthYearCGPA: string;
    placementStatus: string;
    placementCompany?: string;
    placementDOJ?: string;
    placementDOE?: string;
    placementType?: string;
    photo: string;
}

export interface QuickActionCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

export interface StatCardProps {
    value: number,
    label: string,
    loading?: boolean
}

export interface TeamCardProps {
  name: string;
  role: string;
  image: string;
  bgColor: string;
  portfolio: string,
  linkedIn: string,
  github: string,
  x: string,
  mail: string
}

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

export interface ChairpersonLogScope {
  scope: 'self' | 'coordinators' | 'universal';
  count: number;
  logs: ChairpersonLogEntry[];
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

export interface MessageNotification {
  id: number;
  toRole: string;
  message: string;
  read: number | boolean;
  createdAt: string;
}

// ============== Attendance Portal ==============

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

export interface TodaySessionResponse {
    success: boolean;
    date: string;
    subject: SubjectInfo | null;
    class: {
        school: string;
        department: string;
        program: string;
        batch: string;
        specialization: string;
    };
    session: AttendanceSession | null;
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

export interface StudentAttendanceSummary {
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
    student: StudentAttendanceSummary;
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
