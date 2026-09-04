import type { ApiResponse, StudentProps } from "../types/types";
import api from "./api";

export const countSpecialization = async () => {
    const response = await api.get(
        "/admin/count-specialization",
    )
    return response.data;
}

export const viewSpecializations = async () => {
    const response = await api.get(
        '/admin/view-specializations',
    )
    return response.data;
}

export const addSpecialization = async (params: any) => {
    const response = await api.post(
        "/admin/add-specialization",
        params
    );
    return response.data;
};

export const searchBatches = async (params: any) => {
    const response = await api.get(
        '/admin/search-batches',
        { params }
    );
    return response.data;
}

export const searchSpecializations = async (params: any) => {
    const response = await api.get(
        '/admin/search-specialization-names',
        { params }
    )
    return response.data;
}

export const getStudentsCount = async () => {
    const response = await api.get(
        '/admin/count-students'
    )
    return response.data;
};

export const getStudentProfile = async (rollNo: string | undefined) => {
    const encodedRollNo = encodeURIComponent(rollNo || "");
    const response = await api.get(
        `/admin/get-student-profile/${encodedRollNo}`
    );
    return response.data;
};

export const getStudentDetails = async () => {
    const response = await api.get(
        `/admin/get-student-details`
    );
    return response.data;
}

export const searchStudents = async (query: string) => {
    const response = await api.get(
        '/admin/search-students',
        { params: { q: query } }
    )
    return response.data;
}

export const addStudent = async (studentData: StudentProps): Promise<StudentProps | undefined> => {
    const response = await api.post<ApiResponse<StudentProps>>(
        '/admin/add-student',
        studentData
    );
    return response.data.data;
};

export const updateStudent = async (id: string, studentData: Partial<StudentProps>): Promise<StudentProps | undefined> => {
    const encodedId = encodeURIComponent(id || "");
    const response = await api.put<ApiResponse<StudentProps>>(
        `/admin/update-student/${encodedId}`,
        studentData
    );
    return response.data.data;
};

export const getFilteredStudents = async (school: string | undefined, department: string | undefined, program: string | undefined, batch: string | undefined, specialization: string | undefined) => {
    const response = await api.post(
        '/admin/filter-students',
        { school, department, program, batch, specialization }
    )
    return response.data;
}

export const deleteStudent = async (rollNo: string | undefined) => {
    const encodedRollNo = encodeURIComponent(rollNo || "");
    const response = await api.delete(
        `/admin/delete-student/${encodedRollNo}`,
    )
    return response.data;
}

export const uploadStudents = async (formData: FormData) => {
    const response = await api.post(
        "/admin/upload-students-with-reformat",
        formData
    );
    return response.data;
}

export const uploadStudentPhotos = async (formData: FormData) => {
    const response = await api.post(
        "/admin/upload-photos",
        formData
    );
    return response.data;
}

export const updateStudentPhoto = async (rollNo: string, photo: string) => {
    const encodedRollNo = encodeURIComponent(rollNo || "");
    const response = await api.put(
        `/admin/update-student-photo/${encodedRollNo}`,
        { photo }
    );
    return response.data;
}

export const addCoordinator = async (payload: any) => {
    const response = await api.post(
        "/admin/add-coordinator",
        payload
    )
    return response.data;
}

export const deleteCoordinator = async (id: string | number) => {
    const response = await api.delete(
        `/admin/delete-coordinator/${encodeURIComponent(String(id))}`
    );
    return response.data;
};

export const getAdmins = async () => {
    const response = await api.get(
        "/admin/get-admins"
    )
    return response.data;
}

export const getCoordinatorDetails = async () => {
    const response = await api.get(
        '/admin/get-admin-details'
    );
    return response.data;
}

export const getChangeLogs = async () => {
    const response = await api.get('/admin/changes');
    return response.data;
}

export const getNotifications = async () => {
    const response = await api.get('/admin/notifications');
    return response.data;
}

export const addChairperson = async (payload: any) => (await api.post('/chairperson', payload)).data;
export const getChairpersons = async () => (await api.get('/chairperson')).data;
export const deleteChairperson = async (id: number) => (await api.delete(`/chairperson/${id}`)).data;
export const getChairpersonClasses = async () => (await api.get('/chairperson/classes')).data;
export const getCoordinatorClasses = async () => (await api.get('/admin/classes')).data;
export const getChairpersonLogs = async () => (await api.get('/chairperson/logs')).data;
export const getChairpersonScopedLogs = async (scope: 'self' | 'coordinators' | 'universal' = 'self') =>
    (await api.get('/chairperson/scoped-logs', { params: { scope } })).data;
export const getMessages = async () => (await api.get('/chairperson/messages')).data;
export const sendMessage = async (receiverRole: 'admin' | 'coordinator', content: string) =>
    (await api.post('/chairperson/messages', { receiverRole, content })).data;

/* ───────── Unified cross-role messaging system ───────── */

export type RecipientType = 'users' | 'role' | 'class' | 'class-students';

export interface RecipientUser {
    id: number;
    name?: string | null;
    username?: string;
    email?: string;
    role?: string;
    userId?: number;
    rollNo?: string;
    fullName?: string;
    classKey?: string;
}

export interface RecipientClass {
    classKey: string;
    label: string;
    school: string;
    department: string;
    program: string;
    batch: string;
    specialization: string;
}

export interface RecipientsPayload {
    admins: RecipientUser[];
    chairpersons: RecipientUser[];
    coordinators: RecipientUser[];
    students: RecipientUser[];
    classes: RecipientClass[];
}

export interface MessageNotification {
    id: number;
    toUserId: number | null;
    toRole: string;
    message: string;
    read: boolean | number;
    createdAt: string;
    data: {
        fromUserId?: number;
        fromRole?: string;
        fromName?: string;
        classKey?: string;
        scope?: string;
    } | null;
    scope?: string;
    classKey?: string | null;
}

export interface RecipientsResponse {
    success: boolean;
    recipients: RecipientsPayload;
}

export const getRecipients = async (): Promise<RecipientsResponse> =>
    (await api.get('/messages/recipients')).data;

export const getInbox = async (): Promise<{ success: boolean; messages: MessageNotification[] }> =>
    (await api.get('/messages/inbox')).data;

export const getSent = async (): Promise<{ success: boolean; messages: MessageNotification[] }> =>
    (await api.get('/messages/sent')).data;

export const getUnreadCount = async (): Promise<{ success: boolean; count: number }> =>
    (await api.get('/messages/unread-count')).data;

export interface SendMessagePayload {
    recipientType: RecipientType;
    recipientIds?: number[];
    recipientRole?: 'admin' | 'coordinator' | 'chairperson' | 'student';
    classKey?: string;
    content: string;
}

export const sendUnifiedMessage = async (payload: SendMessagePayload) =>
    (await api.post('/messages', payload)).data;

export const markMessageRead = async (id: number) =>
    (await api.patch(`/messages/${id}/read`)).data;

export const markAllMessagesRead = async () =>
    (await api.patch('/messages/mark-all-read')).data;

export const deleteMessage = async (id: number) =>
    (await api.delete(`/messages/${id}`)).data;

export const clearInbox = async (keepUnread: boolean = true) =>
    (await api.delete('/messages/inbox', { data: { keepUnread } })).data;

export const clearSent = async () =>
    (await api.delete('/messages/sent')).data;

/* ──────────────── Timetable (mygbu.in live sync) ──────────────── */

export interface TimetableEntry {
    code: string;
    faculty: string;
    room: string;
    group: string | null;
}

export interface TimetableDay {
    [slot: string]: TimetableEntry[];
}

export interface TimetableSubject {
    code: string;
    name: string;
    credits: string;
    facultyABR: string;
    facultyName: string;
    load: string;
}

export interface Timetable {
    id: number;
    school: string;
    department: string;
    program: string;
    batch: string;
    specialization: string;
    entries: { [day: string]: TimetableDay };
    subjects: TimetableSubject[];
    semester: string | null;
    academicYear: string | null;
    sourceUrl: string | null;
    lastFetchedAt: string | null;
    lastChangedAt: string | null;
    fetchStatus: string;
    isStale: boolean;
}

export interface TimetableResponse {
    success: boolean;
    error?: string;
    timetable?: Timetable;
    section?: {
        label: string | null;
        mygbuSchool: string;
        mygbuDepartment: string;
        mygbuSectionId: string;
    };
}

export const getMyTimetable = async (): Promise<TimetableResponse> =>
    (await api.get('/timetable/me')).data;

export const refreshMyTimetable = async () =>
    (await api.post('/timetable/refresh')).data;

export const hasTimetableChangesSince = async (lastSeenAt: string): Promise<{ changed: boolean; lastChangedAt: string | null }> => {
    const res = await api.get('/timetable/changes-since', { params: { lastSeenAt } });
    return res.data;
};

export const refreshAllTimetables = async () =>
    (await api.post('/timetable/refresh-all')).data;

export interface TimetableSection {
    id: number;
    school: string;
    department: string;
    program: string;
    batch: string;
    specialization: string;
    mygbuSchool: string;
    mygbuDepartment: string;
    mygbuSectionId: string;
    label: string | null;
    academicYear: string | null;
    semester: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export const listTimetableSections = async (): Promise<{ success: boolean; sections: TimetableSection[] }> =>
    (await api.get('/timetable/sections')).data;

export const createTimetableSection = async (payload: Partial<TimetableSection>) =>
    (await api.post('/timetable/sections', payload)).data;

export const deleteTimetableSection = async (id: number) =>
    (await api.delete(`/timetable/sections/${id}`)).data;

export const deleteSpecializationStudents = async (school: string | undefined, department: string | undefined, program: string | undefined, batch: string | undefined, specialization: string | undefined) => {
    const response = await api.delete(
        "/admin/delete-specialization-students",
        {
            data: { school, department, program, batch, specialization }
        }
    );
    return response.data;
};

export const deleteSpecialization = async (school: string | undefined, department: string | undefined, program: string | undefined, batch: string | undefined, name: string | undefined) => {
    console.log(school, department, program, batch, name)
    const response = await api.delete(
        "/admin/delete-specialization",
        {
            data: { school, department, program, batch, name }
        }
    );
    return response.data
}

export const exportStudentsToExcel = async (params?: Record<string, string | undefined>) => {
    const cleaned: Record<string, string> = {};
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).length) cleaned[k] = String(v);
        });
    }
    const response = await api.get('/admin/export-students', { params: cleaned, responseType: 'blob' });
    return response.data as Blob;
};
