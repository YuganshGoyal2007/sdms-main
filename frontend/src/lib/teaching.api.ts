import api from "./api";
import type {
  TeachingClass,
  TeachingClassesResponse,
  TodaySessionResponse,
  SessionRecordsResponse,
  AttendanceSession,
  SessionType,
  UpsertRecord,
} from "../types/types";

const classKey = (c: { school: string; department: string; program: string; batch: string; specialization: string }) =>
  [c.school, c.department, c.program, c.batch, c.specialization]
    .map((v) => encodeURIComponent(v))
    .join("|");

export const getMyClasses = async (): Promise<TeachingClassesResponse> => {
  const r = await api.get("/teaching/my-classes");
  return r.data;
};

export const getTodaySession = async (
  cls: { school: string; department: string; program: string; batch: string; specialization: string },
  subjectId: number
): Promise<TodaySessionResponse> => {
  const r = await api.get(`/teaching/my-classes/${classKey(cls)}/${subjectId}/today`);
  return r.data;
};

export const getClassRoster = async (
  cls: { school: string; department: string; program: string; batch: string; specialization: string; semester: number },
  subjectId: number
): Promise<SessionRecordsResponse> => {
  const r = await api.get("/teaching/roster", {
    params: {
      subjectId,
      school: cls.school,
      department: cls.department,
      program: cls.program,
      batch: cls.batch,
      specialization: cls.specialization,
      semester: cls.semester,
    },
  });
  return r.data;
};

export interface CreateSessionPayload {
  subjectId: number;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  semester: number;
  date: string;
  sessionType?: SessionType;
  topic?: string;
  startTime?: string;
  endTime?: string;
}

export const createSession = async (payload: CreateSessionPayload): Promise<{ success: boolean; session: AttendanceSession }> => {
  const r = await api.post("/teaching/sessions", payload);
  return r.data;
};

export const updateSession = async (
  id: number,
  patch: { topic?: string; startTime?: string; endTime?: string; sessionType?: SessionType }
): Promise<{ success: boolean; session: AttendanceSession }> => {
  const r = await api.patch(`/teaching/sessions/${id}`, patch);
  return r.data;
};

export const submitSession = async (id: number): Promise<{ success: boolean; session: AttendanceSession }> => {
  const r = await api.post(`/teaching/sessions/${id}/submit`);
  return r.data;
};

export const getSessionRecords = async (id: number): Promise<SessionRecordsResponse> => {
  const r = await api.get(`/teaching/sessions/${id}/records`);
  return r.data;
};

export const upsertRecords = async (
  id: number,
  records: UpsertRecord[]
): Promise<{ success: boolean; count: number }> => {
  const r = await api.put(`/teaching/sessions/${id}/records`, { records });
  return r.data;
};

export type { TeachingClass };
