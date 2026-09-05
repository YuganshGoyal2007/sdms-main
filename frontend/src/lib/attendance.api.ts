import api from "./api";
import type {
<<<<<<< HEAD
  AttendanceSession,
  AttendanceRecordInput,
  AttendanceRosterStudent,
  StudentAttendanceSummary,
  TeachingClass,
  AttendanceSessionType,
} from "../types/types";

const errMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message ?? fallback;
};

// ---- Teaching ----

export const getMyClasses = async (): Promise<{ date: string; classes: TeachingClass[] }> => {
  const res = await api.get("/teaching/my-classes");
  return res.data;
};

export const getClassRoster = async (classKey: string): Promise<AttendanceRosterStudent[]> => {
  const res = await api.get(`/teaching/classes/${encodeURIComponent(classKey)}/students`);
  return res.data.students;
};

export const getTodaySession = async (
  classKey: string,
  subjectId: number,
  date?: string
): Promise<AttendanceSession[]> => {
  const res = await api.get(
    `/teaching/my-classes/${encodeURIComponent(classKey)}/${subjectId}/today`,
    { params: date ? { date } : {} }
  );
  return res.data.sessions;
};

export const createSession = async (payload: {
  classKey: string;
  subjectId: number;
  date: string;
  sessionType: AttendanceSessionType;
  topic?: string;
  startTime?: string;
  endTime?: string;
}): Promise<AttendanceSession> => {
  try {
    const res = await api.post("/teaching/sessions", payload);
    return res.data.session;
  } catch (err) {
    throw new Error(errMessage(err, "Could not create the attendance session"));
  }
};

export const updateSession = async (
  id: number,
  payload: { topic?: string; startTime?: string; endTime?: string; sessionType?: AttendanceSessionType; date?: string }
): Promise<AttendanceSession> => {
  try {
    const res = await api.patch(`/teaching/sessions/${id}`, payload);
    return res.data.session;
  } catch (err) {
    throw new Error(errMessage(err, "Could not update the session"));
  }
};

export const submitSession = async (id: number): Promise<AttendanceSession> => {
  try {
    const res = await api.post(`/teaching/sessions/${id}/submit`);
    return res.data.session;
  } catch (err) {
    throw new Error(errMessage(err, "Could not submit the session"));
  }
};

export const getSessionRecords = async (
  id: number
): Promise<{ session: AttendanceSession; roster: AttendanceRosterStudent[]; records: { studentId: number; status: string; remarks: string | null }[] }> => {
  const res = await api.get(`/teaching/sessions/${id}/records`);
  return res.data;
};

export const upsertAttendanceRecords = async (
  id: number,
  records: AttendanceRecordInput[]
): Promise<void> => {
  try {
    await api.put(`/teaching/sessions/${id}/records`, { records });
  } catch (err) {
    throw new Error(errMessage(err, "Could not save attendance records"));
  }
};

// ---- Admin ----

export const adminListSessions = async (params?: {
  classKey?: string; subjectId?: number; date?: string; status?: string;
}): Promise<AttendanceSession[]> => {
  const res = await api.get("/admin/attendance/sessions", { params });
  return res.data.sessions;
};

export const unlockSession = async (id: number, reason: string): Promise<AttendanceSession> => {
  try {
    const res = await api.post(`/admin/attendance/sessions/${id}/unlock`, { reason });
    return res.data.session;
  } catch (err) {
    throw new Error(errMessage(err, "Could not unlock the session"));
  }
};

export const listSubjects = async (): Promise<{ id: number; name: string; code: string; semester: string }[]> => {
  const res = await api.get("/admin/subjects");
  return res.data.subjects;
};

export const listFacultyAssignments = async (): Promise<
  { id: number; facultyId: number; teacherRole: string; subjectId: number; classKey: string; semester: string; academicYear: string; isActive: boolean; subject?: { name: string; code: string } | null }[]
> => {
  const res = await api.get("/admin/faculty-assignments");
  return res.data.assignments;
};

export const createFacultyAssignment = async (payload: {
  userId: number; teacherRole: string; subjectId: number;
  school: string; department: string; program: string; batch: string; specialization: string;
  semester: string; academicYear: string;
}): Promise<void> => {
  try {
    await api.post("/admin/faculty-assignments", payload);
  } catch (err) {
    throw new Error(errMessage(err, "Could not create the assignment"));
  }
};

// ---- Student ----

export const getMyAttendanceSummary = async (rollNo?: string): Promise<StudentAttendanceSummary> => {
  const res = await api.get(`/attendance/student/${encodeURIComponent(rollNo ?? "me")}/summary`);
  return res.data;
};

export const getMySubjectAttendance = async (
  rollNo: string,
  subjectId: number
): Promise<{
  subject: { id: number; name: string; code: string };
  summary: { totalSessions: number; marked: number; present: number; absent: number; excused: number; percentage: number | null };
  history: { sessionId: number; date: string; sessionType: AttendanceSessionType; topic: string | null; status: string | null }[];
}> => {
  const res = await api.get(`/attendance/student/${encodeURIComponent(rollNo)}/subject/${subjectId}`);
  return res.data;
=======
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
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
};
