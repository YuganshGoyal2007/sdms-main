import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Power, Menu, X, Inbox, Calendar, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import universityLogo from "../../assets/images/logo.png";
import { useAuth } from "../../context/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

/**
 * Unified client header with:
 *  - university logo + title
 *  - mobile menu toggle
 *  - bell icon with notifications panel (messages + timetable updates)
 *  - logout button
 *
 * Works for student, coordinator, chairperson (any role on the client side).
 * Admin / coordinator use a different header (AdminSideNav's Header).
 */
export function ClientHeader({
    isSidebarOpen,
    setIsSidebarOpen,
    onMessagesClick,
}: {
    isSidebarOpen?: boolean;
    setIsSidebarOpen?: (open: boolean) => void;
    onMessagesClick?: () => void;
}) {
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const { logout, isAuthenticated } = useAuth();
    const { unread, timetableChanged, markTimetableSeen } = useNotifications(30_000);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Close on outside click
    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
                setIsNotificationOpen(false);
            }
        }
        if (isNotificationOpen) document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [isNotificationOpen]);

    // Close on Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setIsNotificationOpen(false);
        }
        if (isNotificationOpen) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isNotificationOpen]);

    const hasAny = unread > 0 || timetableChanged;

    return (
        <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 h-16 z-50">
            <div className="flex items-center justify-between h-full px-4 md:px-6">
                {/* Left: menu + logo + title */}
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    {setIsSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0"
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>
                    )}

                    <Link to="/" className="shrink-0">
                        <img
                            src={universityLogo}
                            alt="University Logo"
                            className="w-10 h-10 md:w-14 md:h-14 object-contain"
                        />
                    </Link>

                    <div className="min-w-0">
                        <h1 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                            Gautam Buddha University
                        </h1>
                        <p className="text-xs text-gray-500 hidden sm:block truncate">
                            An Ultimate Destination for Higher Learning
                        </p>
                    </div>
                </div>

                {/* Right: bell + logout */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {/* Bell icon with notification panel */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setIsNotificationOpen((v) => !v)}
                            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            aria-label="Notifications"
                            title={hasAny ? `${unread + (timetableChanged ? 1 : 0)} new` : "No new notifications"}
                        >
                            <Bell className="w-5 h-5 text-gray-600" />
                            {unread > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                                    {unread > 99 ? "99+" : unread}
                                </span>
                            )}
                            {timetableChanged && (
                                <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                                    T
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {isNotificationOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
                                >
                                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900 inline-flex items-center gap-2">
                                            <Bell size={16} /> Notifications
                                        </h3>
                                        <button
                                            onClick={() => setIsNotificationOpen(false)}
                                            className="text-gray-400 hover:text-gray-700"
                                            aria-label="Close"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto">
                                        {unread > 0 && (
                                            <button
                                                onClick={() => { onMessagesClick?.(); setIsNotificationOpen(false); }}
                                                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 flex items-start gap-3"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                                                    <Inbox size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {unread} new message{unread !== 1 ? "s" : ""}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Click to open Messages</p>
                                                </div>
                                            </button>
                                        )}

                                        {timetableChanged && (
                                            <button
                                                onClick={() => { markTimetableSeen(); setIsNotificationOpen(false); }}
                                                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 flex items-start gap-3"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                                    <Calendar size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">Timetable updated</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Click to dismiss</p>
                                                </div>
                                            </button>
                                        )}

                                        {unread === 0 && !timetableChanged && (
                                            <div className="p-8 text-center text-gray-400">
                                                <AlertCircle className="mx-auto mb-2" size={28} />
                                                <p className="text-sm">No new notifications</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Logout */}
                    {isAuthenticated && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 sm:px-4 p-2 sm:w-auto sm:h-auto w-7 h-7 sm:py-2 rounded-lg transition-colors cursor-pointer bg-[#faf7f9] text-[#7b3b5a] hover:bg-[#f3edf1] font-medium"
                            title="Logout"
                        >
                            <Power className="sm:hidden block" />
                            <span className="sm:block text-sm hidden">Logout</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
