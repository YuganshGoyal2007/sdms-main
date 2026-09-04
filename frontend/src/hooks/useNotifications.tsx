import { useEffect, useState, useCallback } from "react";
import { getUnreadCount, hasTimetableChangesSince } from "../../lib/user.api.ts";

/**
 * useNotifications - poll unread count + timetable changes
 *
 * Polls every 30s (configurable) and:
 *  - tracks `unread` (messages inbox unread count)
 *  - tracks `timetableChanged` (whether mygbu.in timetable updated since lastSeen)
 *
 * Returns the current state plus a `markSeen()` callback.
 */
export const useNotifications = (pollMs = 30_000) => {
    const [unread, setUnread] = useState<number>(0);
    const [timetableChanged, setTimetableChanged] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        try {
            const r = await getUnreadCount();
            if (r && typeof r.count === "number") {
                setUnread(r.count);
            }
            const lastSeen = localStorage.getItem("ttLastSeenAt") || "2000-01-01T00:00:00.000Z";
            const tc = await hasTimetableChangesSince(lastSeen);
            if (tc && tc.changed) setTimetableChanged(true);
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
