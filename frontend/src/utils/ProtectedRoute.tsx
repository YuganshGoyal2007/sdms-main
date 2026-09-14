import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { useDispatch } from "react-redux";
import { setAdmin } from "../context/features/adminSlice";

const OFFICE_CODE_TO_SLUG: Record<string, string> = {
    LIB: "library",
    HST: "hostel",
    SPT: "sports",
    DEAN: "dean",
    ICT: "ict",
    ACC: "accounts",
};

const ProtectedRoute = () => {
    const [role, setRole] = useState<string | null>(null);
    const [officeCode, setOfficeCode] = useState<string | null>(null);
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
                const fetchedOfficeCode = data.officeCode || data.user?.officeCode || localStorage.getItem("officeCode");
                setOfficeCode(fetchedOfficeCode);

                if (data.user && isMounted) {
                    dispatch(setAdmin({ ...data.user, role: fetchedRole, officeCode: fetchedOfficeCode }));
                } else if (fetchedRole) {
                    const ep = fetchedRole === "faculty" ? "/faculty/me" : `/${fetchedRole}/get-admin-details`;
                    const res = await api.get(ep).catch(() => null);
                    if (res?.data?.user && isMounted) {
                        dispatch(setAdmin({ ...res.data.user, role: fetchedRole, officeCode: fetchedOfficeCode }));
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
    if (role === "officer") {
        const allowedPrefixes = ["/no-dues/portal", "/portal", "/officer/my-leaves"];
        const isLeavesAllowed = location.pathname.startsWith("/admin/leaves") || location.pathname.startsWith("/officer/my-leaves");
        const isFeesAllowed = officeCode === "ACC" && location.pathname.startsWith("/admin/fees");
        const isAllowed = allowedPrefixes.some((p) => location.pathname.startsWith(p)) || isLeavesAllowed || isFeesAllowed;
        if (!isAllowed) {
            const targetDesk = (officeCode && OFFICE_CODE_TO_SLUG[officeCode]) || "library";
            return <Navigate to={`/no-dues/portal/${targetDesk}`} replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
