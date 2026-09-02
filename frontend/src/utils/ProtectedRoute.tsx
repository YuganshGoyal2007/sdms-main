import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { useDispatch } from "react-redux";
import { setAdmin } from "../context/features/adminSlice";

const ProtectedRoute = () => {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const dispatch = useDispatch();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await api.get("/admin/me");
                setRole(data.role);
            } catch (err) {
                setRole(null);
            } finally {
                setLoading(false);
            }
        };
        const checkUser = async () => {
            try {
                const response = await api.get(`/admin/get-admin-details`);
                if (response) {
                    dispatch(setAdmin(response.data.user));
                }
            } catch (error: any) {
                console.log(error)
            }
        }
        checkAuth();
        checkUser();
    }, []);

    if (loading) return null;

    if (!role) return <Navigate to="/login" replace />;

    if (role === "student" && location.pathname.startsWith("/admin")) {
        return <Navigate to="/student" replace />;
    }
    if ((role === "admin" || role === "coordinator" || role === "chairperson") && location.pathname.startsWith("/student")) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
