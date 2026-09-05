import api from "./api";
import type {
  StudentAttendanceSummaryResponse,
  FacultyAssignment,
  TeacherRole,
  AttendanceSession,
} from "../types/types";

// ============== Student self-service ==============

export const getStudentAttendanceSummary = async (
  rollNo: string
): Promise<StudentAttendanceSummaryResponse> => {
  const r = await api.get(`/attendance/student/${encodeURIComponent(rollNo)}/summary`);
  return r.data;
};

// ============== Admin: faculty assignments ==============

export interface CreateAssignmentPayload {
  facultyId?: number;
  userId?: number;
  teacherRole: TeacherRole;
  subjectId?: number;
  subjectName?: string;
  subjectCode?: string;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  semester: number;
  academicYear: string;
  isActive?: boolean;
}

export interface EligibleTeacher {
  id: number;
  name: string;
  email: string;
  role: 'faculty' | 'coordinator' | 'chairperson';
  school?: string;
  department?: string;
  facultyProfile?: {
    facultyId?: string;
    phone?: string;
  };
}

export const getEligibleTeachers = async (): Promise<{
  success: boolean;
  count: number;
  teachers: EligibleTeacher[];
}> => {
  const r = await api.get("/admin/eligible-teachers");
  return r.data;
};

export const createFacultyAssignment = async (
  payload: CreateAssignmentPayload
): Promise<{ success: boolean; assignment: FacultyAssignment }> => {
  const r = await api.post("/admin/faculty-assignments", payload);
  return r.data;
};

export const listFacultyAssignments = async (filters?: {
  facultyId?: number;
  subjectId?: number;
  isActive?: boolean;
}): Promise<{ success: boolean; count: number; assignments: FacultyAssignment[] }> => {
  const r = await api.get("/admin/faculty-assignments", { params: filters });
  return r.data;
};

export const deleteFacultyAssignment = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  const r = await api.delete(`/admin/faculty-assignments/${id}`);
  return r.data;
};

// ============== Admin: sessions ==============

export const listSessions = async (filters?: {
  status?: 'draft' | 'submitted' | 'locked';
  subjectId?: number;
  date?: string;
  facultyId?: number;
}): Promise<{ success: boolean; count: number; sessions: AttendanceSession[] }> => {
  const r = await api.get("/admin/attendance/sessions", { params: filters });
  return r.data;
};

export const unlockSession = async (
  id: number,
  reason: string
): Promise<{ success: boolean; session: AttendanceSession }> => {
  const r = await api.post(`/admin/attendance/sessions/${id}/unlock`, { reason });
  return r.data;
};
