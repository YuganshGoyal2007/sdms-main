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

export interface StudentProps {
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
    placementStatus: string;
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
    fourthYearCGPA: string;
    placementStatus: string;
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

// ===================== Attendance module =====================

export type AttendanceSessionType = 'lecture' | 'lab' | 'tutorial';
export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type SessionStatus = 'draft' | 'submitted' | 'locked';

export interface TeachingClass {
  id: number;
  subjectId: number;
  subjectName: string | null;
  subjectCode: string | null;
  subjectType: string | null;
  teacherRole: string;
  semester: string;
  academicYear: string;
  classKey: string;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  totalStudents: number;
  todaySessions: { id: number; status: SessionStatus; sessionType: AttendanceSessionType }[];
}

export interface AttendanceSession {
  id: number;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  classKey: string;
  semester: string;
  academicYear: string;
  subjectId: number;
  facultyId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  sessionType: AttendanceSessionType;
  topic: string | null;
  status: SessionStatus;
  createdBy: number;
  submittedAt: string | null;
  lockedAt: string | null;
  lockedBy: number | null;
  unlockedAt: string | null;
  unlockReason: string | null;
  createdAt: string;
}

export interface AttendanceRosterStudent {
  id: number;
  rollNo: string;
  fullName: string;
  photo: string | null;
}

export interface AttendanceRecordInput {
  studentId: number;
  status: AttendanceStatus;
  remarks?: string | null;
}

export interface SubjectAttendanceSummary {
  subjectId: number;
  subjectName: string | null;
  subjectCode: string | null;
  present: number;
  absent: number;
  excused: number;
  total: number;
  percentage: number | null;
}

export interface StudentAttendanceSummary {
  student: { rollNo: string; fullName: string };
  overall: { total: number; present: number; absent: number; excused: number; percentage: number | null };
  subjects: SubjectAttendanceSummary[];
  recent: {
    sessionId: number;
    date: string;
    sessionType: AttendanceSessionType;
    topic: string | null;
    subjectId: number;
    subjectName: string | null;
    subjectCode: string | null;
    status: AttendanceStatus;
  }[];
}
