import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    UsersRound,
    UserCog,
    GraduationCap,
    Mail,
    Phone,
    Download,
    Search,
} from "lucide-react";
import { toast } from "sonner";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import {
    getChairpersonClasses,
    sendMessage,
    exportStudentsToExcel,
} from "../../lib/user.api";
import type {
    ChairpersonClassInfo,
    ClassCoordinator,
} from "../../types/types";

type AdminState = { id?: number; name?: string | null; role?: string };

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white border border-[#d9d9d9] rounded-lg shadow-sm p-5 ${className}`}>{children}</div>
);

const MessageCoordinatorInline: React.FC<{ coordinator: ClassCoordinator }> = ({ coordinator }) => {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            await sendMessage("coordinator", `[To ${coordinator.name}] ${text.trim()}`);
            toast.success(`Message sent to ${coordinator.name}`);
            setText("");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    };
    return (
        <div className="flex items-center gap-2 mt-2">
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`Message ${coordinator.name.split(" ")[0]}…`}
                className="input-text flex-1"
            />
            <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="px-3 py-1.5 text-sm bg-black text-white rounded disabled:opacity-50"
            >
                {sending ? "Sending…" : "Send"}
            </button>
        </div>
    );
};

const ClassRow: React.FC<{
    cls: ChairpersonClassInfo;
    onOpen: () => void;
    onExport: () => void;
}> = ({ cls, onOpen, onExport }) => {
    const titleLine = `${cls.program} ${cls.batch} — ${cls.specialization}`;
    const subLine = `${cls.school?.toUpperCase()} / ${cls.department?.toUpperCase()}`;

    return (
        <Card>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-indigo-50/80 border border-[#a5b4fc]/70 flex items-center justify-center text-[#4338ca]">
                        <GraduationCap size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{titleLine}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{subLine}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <UsersRound size={14} />
                                {cls.studentCount} student{cls.studentCount === 1 ? "" : "s"}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                <UserCog size={14} />
                                {cls.coordinators.length} coordinator{cls.coordinators.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        <div className="mt-3 space-y-2">
                            {cls.coordinators.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No coordinator assigned yet.</p>
                            ) : (
                                cls.coordinators.map((c) => (
                                    <div key={c.id} className="text-sm">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-700">
                                            <span className="font-medium text-gray-900">{c.name}</span>
                                            <span className="text-gray-400">·</span>
                                            <span className="inline-flex items-center gap-1 text-gray-600">
                                                <Mail size={12} /> {c.email}
                                            </span>
                                            {c.phone && (
                                                <>
                                                    <span className="text-gray-400">·</span>
                                                    <span className="inline-flex items-center gap-1 text-gray-600">
                                                        <Phone size={12} /> {c.phone}
                                                    </span>
                                                </>
                                            )}
                                            {!c.hasAccount && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
                                                    NOT REGISTERED
                                                </span>
                                            )}
                                        </div>
                                        {c.hasAccount && <MessageCoordinatorInline coordinator={c} />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 lg:items-end shrink-0">
                    <button
                        onClick={onOpen}
                        className="px-4 py-2 text-sm bg-blue-600 text-white border border-blue-800 rounded hover:bg-blue-700"
                    >
                        View Students
                    </button>
                    <button
                        onClick={onExport}
                        className="px-4 py-2 text-sm bg-gray-200 border border-[#d9d9d9] rounded hover:bg-gray-300 inline-flex items-center gap-1.5"
                    >
                        <Download size={14} /> Export Excel
                    </button>
                </div>
            </div>
        </Card>
    );
};

const ChairpersonMyClasses = () => {
    const navigate = useNavigate();
    const admin = useSelector((state: { admin: AdminState }) => state.admin);
    const [classes, setClasses] = useState<ChairpersonClassInfo[]>([]);
    const [chairperson, setChairperson] = useState<{ id: number; name: string; email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await getChairpersonClasses();
                setClasses(Array.isArray(res?.classes) ? res.classes : []);
                setChairperson(res?.chairperson ?? null);
            } catch (e) {
                toast.error("Failed to load classes");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const totals = useMemo(() => {
        const studentCount = classes.reduce((acc, c) => acc + (c.studentCount ?? 0), 0);
        const coordIds = new Set<number>();
        classes.forEach((c) => (c.coordinators ?? []).forEach((cd) => coordIds.add(cd.id)));
        return { studentCount, coordinatorCount: coordIds.size, classCount: classes.length };
    }, [classes]);

    const filtered = useMemo(() => {
        if (!search.trim()) return classes;
        const q = search.trim().toLowerCase();
        return classes.filter((c) =>
            [c.school, c.department, c.program, c.batch, c.specialization, ...(c.coordinators?.map((cd) => cd.name) ?? [])]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [classes, search]);

    const handleOpen = (cls: ChairpersonClassInfo) => {
        navigate(
            `/chairperson/records/${cls.school}/${cls.department}/${cls.program}/${cls.batch}/${encodeURIComponent(cls.specialization)}`
        );
    };

    const handleExport = async (cls: ChairpersonClassInfo) => {
        const t = toast.loading(`Exporting ${cls.specialization}…`);
        try {
            const blob = await exportStudentsToExcel({
                school: cls.school,
                department: cls.department,
                program: cls.program,
                batch: cls.batch,
                specialization: cls.specialization,
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chairperson-${cls.program.replace(/\s+/g, "_")}-${cls.batch}-${cls.specialization.replace(/\s+/g, "_")}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("Excel downloaded", { id: t });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Export failed", { id: t });
        }
    };

    return (
        <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
            <AdminSideNav activeTab={"classes"} />
            <div className="flex flex-col flex-1">
                <div className="sm:h-[10vh] shrink-0">
                    <Header />
                </div>

                <main className="flex-1 overflow-y-auto min-h-[88vh] sm:min-h-[83vh] bg-[#f3f3f3] px-5 sm:px-0">
                    <div className="min-h-full w-full bg-[#f3f3f3] px-4 sm:px-6 lg:px-10 py-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">My Classes</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {chairperson ? `Assigned to ${chairperson.name}` : "Classes assigned to you"}
                                </p>
                            </div>
                            <div className="text-sm text-gray-600">
                                {admin?.role === "chairperson" ? "Chairperson" : ""}
                            </div>
                        </div>

                        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card>
                                <p className="text-sm text-gray-500">Classes</p>
                                <p className="text-3xl font-semibold text-gray-900 mt-2">{loading ? "…" : totals.classCount}</p>
                            </Card>
                            <Card>
                                <p className="text-sm text-gray-500">Total Students</p>
                                <p className="text-3xl font-semibold text-gray-900 mt-2">{loading ? "…" : totals.studentCount}</p>
                            </Card>
                            <Card>
                                <p className="text-sm text-gray-500">Coordinators</p>
                                <p className="text-3xl font-semibold text-gray-900 mt-2">{loading ? "…" : totals.coordinatorCount}</p>
                            </Card>
                        </section>

                        <section>
                            <div className="flex items-center gap-2 bg-white border border-[#d9d9d9] rounded h-12 px-3 sm:px-5">
                                <Search size={16} className="text-gray-500" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by class, program, batch, or coordinator name…"
                                    className="flex-1 bg-transparent outline-none text-sm"
                                />
                            </div>
                        </section>

                        <section className="space-y-3">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-32 bg-white border border-[#d9d9d9] rounded-lg animate-pulse" />
                                ))
                            ) : filtered.length === 0 ? (
                                <Card>
                                    <p className="text-sm text-gray-600 text-center py-4">
                                        {search ? "No classes match your search." : "No classes have been assigned to you yet."}
                                    </p>
                                </Card>
                            ) : (
                                filtered.map((cls) => (
                                    <ClassRow
                                        key={cls.id}
                                        cls={cls}
                                        onOpen={() => handleOpen(cls)}
                                        onExport={() => handleExport(cls)}
                                    />
                                ))
                            )}
                        </section>
                    </div>
                </main>

                <div className="h-14 shrink-0">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default ChairpersonMyClasses;
