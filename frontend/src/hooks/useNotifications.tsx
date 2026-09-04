import { useEffect, useState, useCallback, useRef } from "react";
import { getUnreadCount, hasTimetableChangesSince, getMyTimetable } from "../lib/user.api";
import { toast } from "sonner";

/**
 * useNotifications - poll unread count + timetable changes
 *
 * Polls every 30s (configurable) and:
 *  - tracks `unread` (messages inbox unread count)
 *  - tracks `timetableChanged` (whether mygbu.in timetable updated since lastSeen)
 *  - auto-prefetches student timetable on login so it is immediately cached
 *  - sends real-time system and in-app notifications on timetable changes
 *
 * Returns the current state plus a `markSeen()` callback.
 */
export const useNotifications = (pollMs = 30_000) => {
    const [unread, setUnread] = useState<number>(0);
    const [timetableChanged, setTimetableChanged] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const hasPrefetched = useRef(false);

    // Auto-fetch student timetable once on login to cache it immediately
    useEffect(() => {
        if (!hasPrefetched.current) {
            hasPrefetched.current = true;
            getMyTimetable().catch(() => {
                // background prefetch, fail silently
            });
        }
    }, []);

    const fetchAll = useCallback(async () => {
        try {
            const r = await getUnreadCount();
            if (r && typeof r.count === "number") {
                setUnread(r.count);
            }
            const lastSeen = localStorage.getItem("ttLastSeenAt") || "2000-01-01T00:00:00.000Z";
            const tc = await hasTimetableChangesSince(lastSeen);
            if (tc && tc.changed) {
                setTimetableChanged(true);

                // Show in-app and desktop notifications once per change
                const changeKey = `tt_notified_${tc.lastChangedAt || Date.now()}`;
                if (!sessionStorage.getItem(changeKey)) {
                    sessionStorage.setItem(changeKey, "true");

                    // In-app toast
                    toast.info("Class Timetable Updated!", {
                        description: "Your timetable was updated on mygbu.in. Click View to open it.",
                        action: {
                            label: "View",
                            onClick: () => {
                                window.dispatchEvent(new CustomEvent("nav-timetable"));
                            }
                        },
                        duration: 8000,
                    });

                    // Browser native desktop notification
                    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                        try {
                            const n = new Notification("SDMS Timetable Updated", {
                                body: "Your class timetable has been updated on mygbu.in.",
                                icon: "/Images/gbu_logo.png",
                            });
                            n.onclick = () => {
                                window.focus();
                                window.dispatchEvent(new CustomEvent("nav-timetable"));
                            };
                        } catch {
                            // ignore notification construct error
                        }
                    }
                }
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        const id = setInterval(fetchAll, pollMs);
        return () => clearInterval(id);
    }, [fetchAll, pollMs]);

    const markTimetableSeen = useCallback(() => {
        localStorage.setItem("ttLastSeenAt", new Date().toISOString());
        setTimetableChanged(false);
    }, []);

    return { unread, timetableChanged, markTimetableSeen, loading, refresh: fetchAll };
};


