import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Search, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import { getChairpersonScopedLogs } from "../../lib/user.api";
import { downloadExcel } from "../../utils/excel";
import type { ChairpersonLogEntry } from "../../types/types";

type AdminState = { id?: number; name?: string | null; role?: string };
type Scope = "self" | "coordinators" | "universal";

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white border border-[#d9d9d9] rounded-lg shadow-sm ${className}`}>{children}</div>
);

const actionBadge = (action: string) => {
    const a = (action || "").toLowerCase();
    if (a.includes("delete")) return "bg-red-50 text-red-700 border-red-200";
    if (a.includes("create") || a.includes("add")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (a.includes("update_photo") || a.includes("photo")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (a.includes("upload")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (a.includes("update") || a.includes("bulk_update")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
};

const roleBadge = (role?: string) => {
    switch (role) {
        case "admin": return "bg-rose-50 text-rose-700 border-rose-200";
        case "coordinator": return "bg-sky-50 text-sky-700 border-sky-200";
        case "chairperson": return "bg-violet-50 text-violet-700 border-violet-200";
        default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
};

const formatWhen = (s: string) => {
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
};

const SCOPES: { id: Scope; label: string; description: string }[] = [
    { id: "self", label: "My Activity", description: "Changes you have made" },
    { id: "coordinators", label: "Coordinators", description: "Changes by your assigned coordinators" },
    { id: "universal", label: "Universal", description: "Self + coordinators + admins in your classes" },
];

const ChairpersonRecords = () => {
    const admin = useSelector((state: { admin: AdminState }) => state.admin);
    const [scope, setScope] = useState<Scope>("self");
    const [logs, setLogs] = useState<ChairpersonLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = async (s: Scope) => {
        setLoading(true);
        try {
            const res = await getChairpersonScopedLogs(s);
            setLogs(Array.isArray(res?.logs) ? res.logs : []);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(scope);
    }, [scope]);

    const filtered = useMemo(() => {
        if (!search.trim()) return logs;
        const q = search.trim().toLowerCase();
        return logs.filter((l) =>
            [l.action, l.entity, l.entityId, l.actorName, l.actorRole]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [logs, search]);

    const exportLogsExcel = async () => {
        if (!filtered.length) {
            toast.error("No logs to export");
            return;
        }
        const t = toast.loading("Preparing Excel export…");
        try {
            const headers = ["Sr No", "When", "Actor", "Role", "Action", "Entity", "Entity ID"];
            const rows = filtered.map((l, idx) => [
                idx + 1,
                formatWhen(l.createdAt),
                l.actorName ?? `User #${l.userId}`,
                l.actorRole ?? "—",
                l.action ?? "—",
                l.entity ?? "—",
                l.entityId ?? "—",
            ]);
            const today = new Date().toISOString().slice(0, 10);
            const scopeLabel = SCOPES.find((s) => s.id === scope)?.label ?? scope;
            await downloadExcel(
                `chairperson-${scopeLabel.toLowerCase().replace(/\s+/g, "-")}-logs-${today}.xlsx`,
                [{ name: "Activity Log", rows: [headers, ...rows] }]
            );
            toast.success("Excel downloaded", { id: t });
        } catch (e: any) {
            toast.error(e?.message || "Failed to export", { id: t });
        }
    };

    const grouped = useMemo(() => {
        const counts: Record<string, number> = { self: 0, coordinators: 0, universal: 0 };
        logs.forEach((l) => {
            if (l.userId === admin?.id) counts.self += 1;
            if (l.actorRole === "coordinator") counts.coordinators += 1;
        });
        counts.universal = logs.length;
        return counts;
    }, [logs, admin]);

    return (
        <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
            <AdminSideNav activeTab={"records"} />
            <div className="flex flex-col flex-1">
                <div className="sm:h-[10vh] shrink-0">
                    <Header />
                </div>

                <main className="flex-1 overflow-y-auto min-h-[88vh] sm:min-h-[83vh] bg-[#f3f3f3] px-5 sm:px-0">
                    <div className="min-h-full w-full bg-[#f3f3f3] px-4 sm:px-6 lg:px-10 py-6 space-y-4">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">Records & Audit Log</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Browse change history for your classes. Filter by self, your coordinators, or everyone.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={exportLogsExcel}
                                    disabled={!filtered.length}
                                    className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-[#d9d9d9] rounded bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-700 disabled:opacity-50"
                                    title="Download current logs as Excel"
                                >
                                    <Download size={14} /> Export Excel
                                </button>
                                <button
                                    onClick={() => load(scope)}
                                    className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-[#d9d9d9] rounded bg-white hover:bg-gray-50"
                                    title="Refresh"
                                >
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {SCOPES.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setScope(s.id)}
                                    className={`text-left rounded-lg border p-4 transition ${scope === s.id
                                        ? "bg-black text-white border-black"
                                        : "bg-white border-[#d9d9d9] hover:border-gray-400"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">{s.label}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${scope === s.id ? "bg-white/20" : "bg-gray-100 text-gray-700"}`}>
                                            {grouped[s.id]}
                                        </span>
                                    </div>
                                    <p className={`text-xs mt-1 ${scope === s.id ? "text-white/80" : "text-gray-500"}`}>{s.description}</p>
                                </button>
                            ))}
                        </div>

                        <Card className="p-4 space-y-3">
                            <div className="flex items-center gap-2 border border-[#d9d9d9] rounded h-11 px-3 bg-white">
                                <Search size={14} className="text-gray-500" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Filter by action, entity, entity id, or actor…"
                                    className="flex-1 bg-transparent outline-none text-sm"
                                />
                            </div>

                            <div className="overflow-x-auto rounded border border-[#d9d9d9]">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#f8f9fa] text-gray-700 font-semibold border-b border-[#d9d9d9]">
                                        <tr>
                                            <th className="text-left p-3">When</th>
                                            <th className="text-left p-3">Actor</th>
                                            <th className="text-left p-3">Action</th>
                                            <th className="text-left p-3">Entity</th>
                                            <th className="text-left p-3">Entity ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            Array.from({ length: 6 }).map((_, i) => (
                                                <tr key={i} className="border-b border-gray-100">
                                                    <td className="p-3"><div className="h-3 w-32 bg-gray-100 animate-pulse rounded" /></td>
                                                    <td className="p-3"><div className="h-3 w-24 bg-gray-100 animate-pulse rounded" /></td>
                                                    <td className="p-3"><div className="h-3 w-16 bg-gray-100 animate-pulse rounded" /></td>
                                                    <td className="p-3"><div className="h-3 w-20 bg-gray-100 animate-pulse rounded" /></td>
                                                    <td className="p-3"><div className="h-3 w-28 bg-gray-100 animate-pulse rounded" /></td>
                                                </tr>
                                            ))
                                        ) : filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-6 text-center text-sm text-gray-500">
                                                    {search ? "No records match your filter." : "No activity in this scope yet."}
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((l) => (
                                                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                                                    <td className="p-3 text-gray-700 whitespace-nowrap">{formatWhen(l.createdAt)}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900">{l.actorName ?? `User #${l.userId}`}</span>
                                                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${roleBadge(l.actorRole)}`}>
                                                                {l.actorRole?.toUpperCase() ?? "—"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${actionBadge(l.action)}`}>
                                                            {(l.action || "").toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-gray-700">{l.entity || "—"}</td>
                                                    <td className="p-3 text-gray-700 break-all">{l.entityId || "—"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <p className="text-xs text-gray-500">
                                Showing the latest {filtered.length} entr{filtered.length === 1 ? "y" : "ies"} for the <strong>{SCOPES.find((s) => s.id === scope)?.label}</strong> scope.
                            </p>
                        </Card>
                    </div>
                </main>

                <div className="h-14 shrink-0">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default ChairpersonRecords;
