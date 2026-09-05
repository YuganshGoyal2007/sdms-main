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
        let isMounted = true;
        const checkAuthAndUser = async () => {
            try {
                const { data } = await api.get("/admin/me");
                if (!isMounted) return;
                const fetchedRole = data.role || data.user?.role;
                setRole(fetchedRole);

                if (data.user && isMounted) {
                    dispatch(setAdmin({ ...data.user, role: fetchedRole }));
                } else if (fetchedRole) {
                    const ep = fetchedRole === "faculty" ? "/faculty/me" : `/${fetchedRole}/get-admin-details`;
                    const res = await api.get(ep).catch(() => null);
                    if (res?.data?.user && isMounted) {
                        dispatch(setAdmin({ ...res.data.user, role: fetchedRole }));
                    }
                }
            } catch {
                if (isMounted) setRole(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        checkAuthAndUser();
        return () => {
            isMounted = false;
        };
    }, [dispatch]);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#7b3b5a]" />
            </div>
        );
    }

    if (!role) return <Navigate to="/login" replace />;

    if (role === "student" && location.pathname.startsWith("/admin")) {
        return <Navigate to="/student" replace />;
    }
    if (role === "chairperson" && (location.pathname.startsWith("/admin") || location.pathname.startsWith("/coordinator"))) {
        return <Navigate to="/chairperson/dashboard" replace />;
    }
    if (role === "coordinator" && location.pathname.startsWith("/admin") && !location.pathname.startsWith("/admin/me")) {
        return <Navigate to="/coordinator/dashboard" replace />;
    }
    if (role === "admin" && location.pathname.startsWith("/coordinator")) {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (role === "faculty" && (location.pathname.startsWith("/admin") || location.pathname.startsWith("/coordinator") || location.pathname.startsWith("/chairperson"))) {
        return <Navigate to="/faculty/dashboard" replace />;
    }
    if ((role === "admin" || role === "coordinator" || role === "faculty" || role === "chairperson") && location.pathname === "/student") {
        return <Navigate to={`/${role}/dashboard`} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
