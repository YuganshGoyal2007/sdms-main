import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
    Inbox,
    Send,
    Search,
    CheckCircle2,
    Circle,
    ChevronDown,
    ChevronRight,
    Users,
    Megaphone,
    Trash2,
    CheckCheck,
    Eraser,
} from "lucide-react";
import { toast } from "sonner";
import { safeErrorMessage } from "../../utils/safeError";
import {
    getInbox,
    getRecipients,
    getSent,
    markMessageRead,
    markAllMessagesRead,
    clearInbox,
    clearSent,
    deleteMessage,
    sendUnifiedMessage,
    type MessageNotification,
    type RecipientsPayload,
    type SendMessagePayload,
} from "../../lib/user.api";

type AdminState = {
    id?: number;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    role?: string;
};

type Mode = "users" | "role" | "class" | "class-students";

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white border border-[#d9d9d9] rounded-lg shadow-sm ${className}`}>{children}</div>
);

const formatWhen = (s: string) => {
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
};

const roleBadge: Record<string, string> = {
    admin: "bg-rose-50 text-rose-700 border-rose-200",
    coordinator: "bg-sky-50 text-sky-700 border-sky-200",
    chairperson: "bg-violet-50 text-violet-700 border-violet-200",
    student: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

interface MessagesCenterProps {
    initialTab?: "inbox" | "compose";
}

const MessagesCenter: React.FC<MessagesCenterProps> = ({ initialTab = "inbox" }) => {
    const admin = useSelector((state: { admin: AdminState }) => state.admin);

    const [tab, setTab] = useState<"inbox" | "compose" | "sent">(initialTab);
    const [inbox, setInbox] = useState<MessageNotification[]>([]);
    const [sent, setSent] = useState<MessageNotification[]>([]);
    const [recipients, setRecipients] = useState<RecipientsPayload | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Compose form state
    const [mode, setMode] = useState<Mode>("users");
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [selectedRole, setSelectedRole] = useState<"admin" | "coordinator" | "chairperson" | "student">("coordinator");
    const [selectedClassKey, setSelectedClassKey] = useState<string>("");
    const [content, setContent] = useState("");

    // Section toggles
    const [sections, setSections] = useState({
        admins: true,
        chairpersons: true,
        coordinators: true,
        students: true,
        classes: true,
    });

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [iRes, sRes, rRes] = await Promise.allSettled([getInbox(), getSent(), getRecipients()]);
            if (iRes.status === "fulfilled") setInbox(iRes.value.messages || []);
            if (sRes.status === "fulfilled") setSent(sRes.value.messages || []);
            if (rRes.status === "fulfilled") setRecipients(rRes.value.recipients || null);
        } catch (e) {
            toast.error("Failed to load messages");
        } finally {
            setLoading(false);
        }
    };

    const filteredInbox = useMemo(() => {
        if (!search.trim()) return inbox;
        const q = search.trim().toLowerCase();
        return inbox.filter((m) =>
            [m.message, m.data?.fromName, m.data?.fromRole, m.toRole, m.classKey]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [inbox, search]);

    const filteredSent = useMemo(() => {
        if (!search.trim()) return sent;
        const q = search.trim().toLowerCase();
        return sent.filter((m) =>
            [m.message, m.toRole, m.data?.classKey]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [sent, search]);

    const toggleUser = (id: number) => {
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSend = async () => {
        if (!content.trim()) {
            toast.error("Message cannot be empty");
            return;
        }
        const payload: SendMessagePayload = {
            recipientType: mode,
            content: content.trim(),
        };
        if (mode === "users") {
            if (!selectedUserIds.length) {
                toast.error("Select at least one person");
                return;
            }
            payload.recipientIds = selectedUserIds;
        } else if (mode === "role") {
            payload.recipientRole = selectedRole;
        } else if (mode === "class" || mode === "class-students") {
            if (!selectedClassKey) {
                toast.error("Pick a class");
                return;
            }
            payload.classKey = selectedClassKey;
        }

        setSending(true);
        try {
            const res = await sendUnifiedMessage(payload);
            toast.success(res?.message || "Message sent");
            setContent("");
            setSelectedUserIds([]);
            setSelectedClassKey("");
            await loadAll();
            setTab("inbox");
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Failed to send message"));
        } finally {
            setSending(false);
        }
    };

    const handleMarkRead = async (id: number) => {
        setInbox((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
        try {
            await markMessageRead(id);
        } catch {
            // best effort
        }
    };

    const handleDelete = async (id: number) => {
        const prev = inbox;
        setInbox((p) => p.filter((m) => m.id !== id));
        try {
            await deleteMessage(id);
            toast.success("Message deleted");
        } catch (e: any) {
            setInbox(prev);
            toast.error(safeErrorMessage(e, "Failed to delete"));
        }
    };

    const handleMarkAllRead = async () => {
        if (inbox.filter((m) => !m.read).length === 0) {
            toast.message("All messages are already read");
            return;
        }
        const t = toast.loading("Marking all as read…");
        try {
            const res = await markAllMessagesRead();
            setInbox((prev) => prev.map((m) => ({ ...m, read: true })));
            toast.success(`Marked ${res?.count ?? 0} message(s) as read`, { id: t });
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Failed to mark all as read"), { id: t });
        }
    };

    const handleClearInbox = async () => {
        const total = inbox.length;
        if (total === 0) {
            toast.message("Inbox is already empty");
            return;
        }
        const toDeleteRead = inbox.filter((m) => m.read).length;
        const choice = window.confirm(
            `Clear your inbox?\n\n` +
            `• "OK" — clear only READ messages (${toDeleteRead} read, keep ${total - toDeleteRead} unread)`
        );
        if (!choice) return;
        const t = toast.loading("Clearing read messages…");
        try {
            const res = await clearInbox(true);
            setInbox((prev) => prev.filter((m) => !m.read));
            toast.success(`Cleared ${res?.count ?? 0} read message(s) from your inbox`, { id: t });
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Failed to clear read messages"), { id: t });
        }
    };

    const handleClearInboxAll = async () => {
        if (!window.confirm(`Clear your ENTIRE inbox including unread messages? (${inbox.length} total)`)) return;
        const t = toast.loading("Clearing entire inbox…");
        try {
            const res = await clearInbox(false);
            setInbox([]);
            toast.success(`Cleared ${res?.count ?? 0} message(s)`, { id: t });
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Failed to clear inbox"), { id: t });
        }
    };

    const handleClearSent = async () => {
        if (sent.length === 0) {
            toast.message("No sent messages to clear");
            return;
        }
        if (!window.confirm(`Clear your sent folder? (${sent.length} messages will be removed)`)) return;
        const t = toast.loading("Clearing sent folder…");
        try {
            const res = await clearSent();
            setSent([]);
            toast.success(`Cleared ${res?.count ?? 0} sent message(s)`, { id: t });
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Failed to clear sent"), { id: t });
        }
    };

    // expose clear-all to window for the confirm-flow workaround
    (window as any).clearInboxAll = handleClearInboxAll;

    const unreadCount = inbox.filter((m) => !m.read).length;

    const RecipientList: React.FC<{
        users: { id: number; name?: string | null; email?: string | null; label?: string }[];
        selectedIds: number[];
        onToggle: (id: number) => void;
    }> = ({ users, selectedIds, onToggle }) => {
        if (!users.length) {
            return <p className="text-xs text-gray-500 italic">No one in this group.</p>;
        }
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {users.map((u) => {
                    const checked = selectedIds.includes(u.id);
                    return (
                        <label
                            key={u.id}
                            className={`flex items-center gap-2 px-3 py-2 border rounded cursor-pointer transition ${
                                checked
                                    ? "bg-indigo-50 border-indigo-300"
                                    : "bg-white border-[#d9d9d9] hover:border-gray-400"
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggle(u.id)}
                                className="w-4 h-4 accent-black"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{u.name || u.email || u.label || "Unknown"}</p>
                                {u.email && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
                            </div>
                        </label>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Send messages to admins, chairpersons, coordinators, and your students. Broadcast to a role or pick specific people.
                </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setTab("inbox")}
                    className={`px-4 py-1.5 text-sm border cursor-pointer inline-flex items-center gap-2 ${
                        tab === "inbox" ? "bg-black text-white border-black" : "bg-white border-gray-300 hover:bg-gray-100"
                    }`}
                >
                    <Inbox size={14} /> Inbox
                    {unreadCount > 0 && (
                        <span className={`text-xs px-1.5 rounded-full ${tab === "inbox" ? "bg-white/20" : "bg-red-500 text-white"}`}>
                            {unreadCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setTab("compose")}
                    className={`px-4 py-1.5 text-sm border cursor-pointer inline-flex items-center gap-2 ${
                        tab === "compose" ? "bg-black text-white border-black" : "bg-white border-gray-300 hover:bg-gray-100"
                    }`}
                >
                    <Send size={14} /> Compose
                </button>
                {admin?.role !== "student" && (
                    <button
                        onClick={() => setTab("sent")}
                        className={`px-4 py-1.5 text-sm border cursor-pointer inline-flex items-center gap-2 ${
                            tab === "sent" ? "bg-black text-white border-black" : "bg-white border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                        <Megaphone size={14} /> Sent
                    </button>
                )}
            </div>

            {(tab === "inbox" || tab === "sent") && (
                <Card className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex items-center gap-2 border border-[#d9d9d9] rounded h-11 px-3 bg-white flex-1">
                            <Search size={14} className="text-gray-500" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search messages…"
                                className="flex-1 bg-transparent outline-none text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {tab === "inbox" && (
                                <>
                                    <button
                                        onClick={handleMarkAllRead}
                                        disabled={unreadCount === 0}
                                        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 border border-[#d9d9d9] rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                                        title="Mark all inbox messages as read"
                                    >
                                        <CheckCheck size={12} /> Mark all read
                                    </button>
                                    <button
                                        onClick={handleClearInbox}
                                        disabled={inbox.length === 0}
                                        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 border border-red-200 text-red-700 rounded bg-white hover:bg-red-50 disabled:opacity-50"
                                        title="Delete all read messages from your inbox"
                                    >
                                        <Eraser size={12} /> Clear read
                                    </button>
                                    <button
                                        onClick={handleClearInboxAll}
                                        disabled={inbox.length === 0}
                                        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 border border-red-300 text-red-800 rounded bg-red-50 hover:bg-red-100 disabled:opacity-50"
                                        title="Delete ALL messages from your inbox including unread"
                                    >
                                        <Trash2 size={12} /> Clear all
                                    </button>
                                </>
                            )}
                            {tab === "sent" && (
                                <button
                                    onClick={handleClearSent}
                                    disabled={sent.length === 0}
                                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 border border-red-200 text-red-700 rounded bg-white hover:bg-red-50 disabled:opacity-50"
                                    title="Delete all sent messages"
                                >
                                    <Trash2 size={12} /> Clear sent
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
                            ))}
                        </div>
                    ) : tab === "inbox" ? (
                        filteredInbox.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-6">No messages in your inbox yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {filteredInbox.map((m) => (
                                    <li
                                        key={m.id}
                                        className={`p-3 sm:p-4 transition ${
                                            m.read ? "bg-white" : "bg-blue-50/40"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <button
                                                onClick={() => !m.read && handleMarkRead(m.id)}
                                                className="mt-0.5 text-gray-500 hover:text-blue-600"
                                                title={m.read ? "Read" : "Mark as read"}
                                            >
                                                {m.read ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-gray-900">
                                                            From {m.data?.fromName || "Unknown"}
                                                        </span>
                                                        {m.data?.fromRole && (
                                                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${roleBadge[m.data.fromRole] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                                                {m.data.fromRole.toUpperCase()}
                                                            </span>
                                                        )}
                                                        {m.toUserId && m.toRole && (
                                                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${roleBadge[m.toRole] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                                                to {m.toRole.toUpperCase()}
                                                            </span>
                                                        )}
                                                        {!m.toUserId && m.toRole && (
                                                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border-amber-200">
                                                                broadcast → {m.toRole.toUpperCase()}
                                                            </span>
                                                        )}
                                                        {m.scope && m.scope !== "direct" && (
                                                            <span className="px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                                {m.scope}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span>{formatWhen(m.createdAt)}</span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap break-words">{m.message}</p>
                                                {m.classKey && (
                                                    <p className="mt-1 text-[11px] text-gray-500">Class: {m.classKey.replaceAll("|", " > ")}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm("Delete this message?")) handleDelete(m.id);
                                                }}
                                                className="mt-0.5 text-gray-400 hover:text-red-600"
                                                title="Delete message"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : (
                        // SENT tab
                        filteredSent.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-6">You haven't sent any messages yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {filteredSent.map((m) => (
                                    <li key={m.id} className="p-3 sm:p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-gray-900">
                                                            To {m.toUserId ? `user #${m.toUserId}` : m.toRole}
                                                        </span>
                                                        {m.scope && m.scope !== "direct" && (
                                                            <span className="px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                                {m.scope}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span>{formatWhen(m.createdAt)}</span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap break-words">{m.message}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm("Delete this sent message?")) {
                                                        setSent((prev) => prev.filter((s) => s.id !== m.id));
                                                        deleteMessage(m.id).catch(() => loadAll());
                                                    }
                                                }}
                                                className="mt-0.5 text-gray-400 hover:text-red-600"
                                                title="Delete sent message"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                    )}
                </Card>
            )}

            {tab === "compose" && (
                <Card className="p-4 sm:p-5 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Send a new message</h2>

                    {!recipients ? (
                        <p className="text-sm text-gray-500">Loading recipients…</p>
                    ) : (
                        <>
                            {/* Mode picker */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(
                                    [
                                        { id: "users", label: "Specific people", icon: <Users size={14} />, enabled: (recipients.admins.length + recipients.chairpersons.length + recipients.coordinators.length + recipients.students.length) > 0 },
                                        { id: "role", label: "Broadcast to a role", icon: <Megaphone size={14} />, enabled: true },
                                        { id: "class", label: "Class coordinators", icon: <Users size={14} />, enabled: recipients.classes.length > 0 },
                                        { id: "class-students", label: "Class students", icon: <Users size={14} />, enabled: recipients.classes.length > 0 && (admin?.role === "coordinator" || admin?.role === "admin") },
                                    ] as { id: Mode; label: string; icon: React.ReactNode; enabled: boolean }[]
                                ).filter((m) => m.enabled).map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={`text-xs px-3 py-2 border rounded inline-flex items-center justify-center gap-1.5 ${
                                            mode === m.id
                                                ? "bg-black text-white border-black"
                                                : "bg-white border-gray-300 hover:bg-gray-100"
                                        }`}
                                    >
                                        {m.icon} {m.label}
                                    </button>
                                ))}
                            </div>

                            {mode === "users" && (
                                <div className="space-y-3">
                                    {(["admins", "chairpersons", "coordinators", "students"] as const).map((group) => {
                                        const list = recipients[group];
                                        if (!list.length) return null;
                                        return (
                                            <div key={group}>
                                                <button
                                                    onClick={() => setSections((s) => ({ ...s, [group]: !s[group] }))}
                                                    className="w-full flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5"
                                                >
                                                    {sections[group] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    {group.charAt(0).toUpperCase() + group.slice(1)} ({list.length})
                                                </button>
                                                {sections[group] && (
                                                    <RecipientList
                                                        users={list.map((u) => ({ id: u.id, name: u.name, email: u.email }))}
                                                        selectedIds={selectedUserIds}
                                                        onToggle={toggleUser}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                    {selectedUserIds.length > 0 && (
                                        <p className="text-xs text-gray-600">
                                            {selectedUserIds.length} selected
                                            <button
                                                onClick={() => setSelectedUserIds([])}
                                                className="ml-2 text-xs text-blue-600 hover:underline"
                                            >
                                                Clear
                                            </button>
                                        </p>
                                    )}
                                </div>
                            )}

                            {mode === "role" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Pick a role to broadcast to</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {(["admin", "coordinator", "chairperson", "student"] as const).map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => setSelectedRole(r)}
                                                className={`text-sm px-3 py-2 border rounded ${
                                                    selectedRole === r
                                                        ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                                                        : "bg-white border-[#d9d9d9] hover:border-gray-400"
                                                }`}
                                            >
                                                All {r}s
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(mode === "class" || mode === "class-students") && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Pick a class</label>
                                    {recipients.classes.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No classes assigned to you yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {recipients.classes.map((c) => (
                                                <button
                                                    key={c.classKey}
                                                    onClick={() => setSelectedClassKey(c.classKey)}
                                                    className={`text-left text-sm px-3 py-2 border rounded ${
                                                        selectedClassKey === c.classKey
                                                            ? "bg-indigo-50 border-indigo-300"
                                                            : "bg-white border-[#d9d9d9] hover:border-gray-400"
                                                    }`}
                                                >
                                                    <p className="font-medium text-gray-900">{c.label}</p>
                                                    <p className="text-xs text-gray-500">{c.school.toUpperCase()} / {c.department.toUpperCase()}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-700">Message</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={5}
                                    placeholder="Type your message…"
                                    className="w-full border border-[#d9d9d9] rounded px-3 py-2 mt-1 text-sm focus:outline-none focus:border-black"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    {admin?.role === "student" ? "Max 500 characters." : "Be concise and clear."}
                                </p>
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !content.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-black text-white rounded disabled:opacity-50"
                                >
                                    <Send size={14} /> {sending ? "Sending…" : "Send"}
                                </button>
                            </div>
                        </>
                    )}
                </Card>
            )}
        </div>
    );
};

export default MessagesCenter;
