import { useState, useEffect, useCallback } from "react";

/**
 * useAuth - unified authentication + authorization hook
 *
 * Reads the JWT from localStorage and the role from Redux.
 * Returns:
 *   - isAuthenticated
 *   - role (admin / coordinator / chairperson / student / null)
 *   - userId (parsed from JWT)
 *   - token (raw JWT)
 *   - login(token, role, userData)  - saves to localStorage + Redux
 *   - logout()                       - clears localStorage + Redux
 *
 * The component re-renders when auth state changes (token, role).
 */

const decodeJwt = (token: string): { id: number; role: string; exp?: number } | null => {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            return null; // expired
        }
        return payload;
    } catch {
        return null;
    }
};

const STORAGE_KEY = "authToken";

export interface AuthState {
    isAuthenticated: boolean;
    role: string | null;
    userId: number | null;
    token: string | null;
}

export const useAuth = () => {
    const [token, setToken] = useState<string | null>(() =>
        typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    );
    const [auth, setAuth] = useState<AuthState>(() => {
        const t = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        if (!t) return { isAuthenticated: false, role: null, userId: null, token: null };
        const decoded = decodeJwt(t);
        if (!decoded) return { isAuthenticated: false, role: null, userId: null, token: null };
        return { isAuthenticated: true, role: decoded.role, userId: decoded.id, token: t };
    });

    // Persist across tabs
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                const newToken = e.newValue;
                if (newToken) {
                    const decoded = decodeJwt(newToken);
                    setAuth({ isAuthenticated: true, role: decoded?.role ?? null, userId: decoded?.id ?? null, token: newToken });
                    setToken(newToken);
                } else {
                    setAuth({ isAuthenticated: false, role: null, userId: null, token: null });
                    setToken(null);
                }
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const login = useCallback((newToken: string, _role: string, _userData?: any) => {
        localStorage.setItem(STORAGE_KEY, newToken);
        const decoded = decodeJwt(newToken);
        setToken(newToken);
        setAuth({
            isAuthenticated: true,
            role: decoded?.role ?? _role,
            userId: decoded?.id ?? null,
            token: newToken,
        });
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setAuth({ isAuthenticated: false, role: null, userId: null, token: null });
    }, []);

    return { ...auth, login, logout, token };
};

/**
 * Hook to gate a route by required role(s).
 * Returns null if OK to proceed, or a redirect path.
 */
export const useRequireRole = (allowed: string[]) => {
    const auth = useAuth();
    if (!auth.isAuthenticated) return "/login";
    if (auth.role && !allowed.includes(auth.role)) return "/forbidden";
    return null;
};
