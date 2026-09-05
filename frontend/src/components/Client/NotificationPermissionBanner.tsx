import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Shows a permission popup asking the student to enable browser notifications
 * for SDMS. Uses the Notification API. If the user already granted/denied,
 * the popup is skipped.
 */
const NotificationPermissionBanner = () => {
    const [show, setShow] = useState(false);
    const [status, setStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");

    useEffect(() => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            setStatus("unsupported");
            return;
        }
        const current = Notification.permission;
        setStatus(current as any);
        if (current === "default") {
            if (sessionStorage.getItem("notificationPromptDismissed")) return;
            const t = setTimeout(() => setShow(true), 1500);
            return () => clearTimeout(t);
        }
    }, []);

    const dismissBanner = () => {
        sessionStorage.setItem("notificationPromptDismissed", "true");
        setShow(false);
    };

    const requestPermission = async () => {
        try {
            const result = await Notification.requestPermission();
            setStatus(result as any);
            if (result === "granted") {
                toast.success("Notifications enabled");
                new Notification("SDMS Notifications enabled", {
                    body: "You'll get notified for new messages, timetable updates, and important notices.",
                    icon: "/Images/gbu_logo.png",
                });
            } else {
                sessionStorage.setItem("notificationPromptDismissed", "true");
            }
        } catch {
            setStatus("denied");
            sessionStorage.setItem("notificationPromptDismissed", "true");
        }
        setShow(false);
    };

    if (!show || status !== "default") return null;

    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <button
                onClick={dismissBanner}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                aria-label="Dismiss"
            >
                <X size={16} />
            </button>
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#7b3b5a] text-white flex items-center justify-center shrink-0">
                    <Bell size={18} />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Enable notifications?</h3>
                    <p className="text-xs text-gray-600 mt-1">
                        Get notified when you receive a new message, when your timetable updates, or for
                        important notices. You can change this anytime in your browser settings.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={requestPermission}
                            className="text-xs px-3 py-1.5 bg-[#7b3b5a] text-white rounded hover:bg-[#6a334e]"
                        >
                            Allow
                        </button>
                        <button
                            onClick={dismissBanner}
                            className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPermissionBanner;
