import api from "./api";

export const validateUsername = async (enrollmentNo: string) => {
    const response = await api.post(
        '/auth/validate-username',
        {username: enrollmentNo}
    );
    return response.data;
};

export const sendOtp = async (email: string | undefined) => {
    const response = await api.post(
        '/auth/send-otp',
        { email: email }
    );
    return response.data;
};

export const verifyOtp = async (email: string | undefined, otp: string) => {
    const response = await api.post(
        '/auth/verify-otp',
        { email, otp }
    );
    return response.data;
};

export const userRegister = async (enrollmentNo: string, password: string) => {
    const response = await api.post(
        '/auth/user-register',
        { username: enrollmentNo, password: password }
    );
    return response.data;
};

export const userLogin = async (username: string, password: string) => {
    const response = await api.post(
        '/auth/user-login',
        { username, password }
    );
    return response.data;
};