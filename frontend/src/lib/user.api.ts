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
        '/coordinator/get-admin-details'
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
export const getChairpersonLogs = async () => (await api.get('/chairperson/logs')).data;
export const getMessages = async () => (await api.get('/chairperson/messages')).data;
export const sendMessage = async (receiverId: number, content: string) => (await api.post('/chairperson/messages', { receiverId, content })).data;

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
