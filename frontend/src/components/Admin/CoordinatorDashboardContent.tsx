import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
    GraduationCap,
    Users,
    BookOpen,
    UserPlus,
    Upload,
    FileSpreadsheet,
    ImagePlus,
    ChevronRight,
    X,
} from "lucide-react";
import {
    getCoordinatorClasses,
    getCoordinatorDetails,
    exportStudentsToExcel,
    uploadStudentPhotos,
} from "../../lib/user.api";
import type { RootState } from "../../context/app/store";
import { QuickActionCard } from "./DashboardCards";

const themes = [
    { bg: "bg-blue-50/80", icon: "text-[#2563eb]", title: "text-[#1d4ed8]", chip: "bg-blue-100 text-blue-800 border-blue-200" },
    { bg: "bg-emerald-50/80", icon: "text-[#16a34a]", title: "text-[#16a34a]", chip: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { bg: "bg-purple-50/80", icon: "text-[#9333ea]", title: "text-[#9333ea]", chip: "bg-purple-100 text-purple-800 border-purple-200" },
    { bg: "bg-amber-50/80", icon: "text-[#d97706]", title: "text-[#d97706]", chip: "bg-amber-100 text-amber-800 border-amber-200" },
];

const PhotoUploadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!(file instanceof File)) {
            toast.error("Please select an Excel file first");
            return;
        }
        const fd = new FormData();
        fd.append("file", file);
        setUploading(true);
        const t = toast.loading("Uploading student photos…");
        try {
            const data = await uploadStudentPhotos(fd);
            if (data) {
                const errDetails = data.errors?.length
                    ? `\nFirst failure: ${data.errors[0].error}`
                    : "";
                toast.success(
                    `Photo upload complete — ${data.updated} updated, ${data.failed} failed${errDetails}`,
                    { id: t, duration: 6000 }
                );
            }
            setFile(null);
            onClose();
        } catch (err: any) {
            const r = err?.response?.data;
            const msg = r?.message || err.message || "Upload failed";
            const errDetails = r?.errors?.length ? `\nFirst failure: ${r.errors[0].error}` : "";
            toast.error(`${msg}${errDetails}`, { id: t, duration: 8000 });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative z-50 w-full max-w-md rounded bg-white shadow-lg max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                        <ImagePlus size={18} /> Upload Student Photos
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                    Upload an Excel file with <strong>Roll No</strong> and <strong>Photo</strong> columns. Photos can be base64 data URIs,
                    file paths, or HTTP(S) URLs — the backend will resolve them.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const f = e.dataTransfer.files?.[0];
                            if (f) setFile(f);
                        }}
                        className="flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 px-4 py-6 text-center cursor-pointer hover:border-black transition"
                        onClick={() => document.getElementById("coordinator-photo-file")?.click()}
                    >
                        <ImagePlus size={24} className="text-gray-500 mb-1" />
                        <p className="text-sm text-gray-600">Drag & drop the Excel file here</p>
                        <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                        {file && (
                            <p className="mt-2 text-xs text-green-600">Selected: {file.name}</p>
                        )}
                    </div>
                    <input
                        id="coordinator-photo-file"
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setFile(f);
                        }}
                    />
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm text-gray-600 hover:text-black"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
                        >
                            {uploading ? "Uploading…" : "Upload Photos"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CoordinatorDashboardContent: React.FC = () => {
    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.admin);

    const [coordinatorAssignments, setCoordinatorAssignments] = useState<any[]>([]);
    const [coordinatorClasses, setCoordinatorClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [detailsRes, classesRes] = await Promise.allSettled([
                    getCoordinatorDetails(),
                    getCoordinatorClasses(),
                ]);
                if (detailsRes.status === "fulfilled") {
                    const data = detailsRes.value;
                    if (Array.isArray(data?.user)) setCoordinatorAssignments(data.user);
                    else if (Array.isArray(data?.coordinators)) setCoordinatorAssignments(data.coordinators);
                    else if (data?.user) setCoordinatorAssignments([data.user]);
                }
                if (classesRes.status === "fulfilled") {
                    setCoordinatorClasses(Array.isArray(classesRes.value?.classes) ? classesRes.value.classes : []);
                }
            } catch (err) {
                console.error("Failed to load coordinator data", err);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const totals = useMemo(() => {
        const totalStudents = coordinatorClasses.reduce((acc, c) => acc + (c.studentCount ?? 0), 0);
        const coordIds = new Set<number>();
        coordinatorClasses.forEach((c) => (c.coordinators ?? []).forEach((cd: { id: number }) => coordIds.add(cd.id)));
        return {
            totalStudents,
            coordinatorCount: coordIds.size,
            classCount: coordinatorClasses.length,
        };
    }, [coordinatorClasses]);

    const openClass = (c: any) =>
        navigate(`/admin/records/${encodeURIComponent(c.school)}/${encodeURIComponent(c.department)}/${encodeURIComponent(c.program)}/${encodeURIComponent(c.batch)}/${encodeURIComponent(c.specialization)}`);

    const exportClass = async (e: React.MouseEvent, c: any) => {
        e.stopPropagation();
        const t = toast.loading(`Exporting ${c.specialization || c.program}…`);
        try {
            const blob = await exportStudentsToExcel({
                school: c.school,
                department: c.department,
                program: c.program,
                batch: c.batch,
                specialization: c.specialization,
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${(c.program || "program").replace(/\s+/g, "_")}-${c.batch}-${(c.specialization || "class").replace(/\s+/g, "_")}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("Excel downloaded", { id: t });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Export failed", { id: t });
        }
    };

    const exportAll = async () => {
        if (!coordinatorClasses.length) {
            toast.error("No classes to export");
            return;
        }
        const t = toast.loading("Preparing Excel for all your classes…");
        try {
            const blob = await exportStudentsToExcel(undefined);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `coordinator-all-classes-${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("Excel downloaded", { id: t });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Export failed", { id: t });
        }
    };

    const downloadSheet = () => {
        const link = document.createElement("a");
        link.href = "/sample.xlsx";
        link.download = "sdms-student-sheet-format.xlsx";
        link.click();
    };

    return (
        <div className="min-h-full w-full bg-[#f3f3f3] px-4 sm:px-6 lg:px-10 py-6">
            {showPhotoModal && <PhotoUploadModal onClose={() => setShowPhotoModal(false)} />}

            <div className="mb-5">
                <h1 className="text-2xl font-semibold">Coordinator Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Welcome back, {user?.name || user?.username || "Coordinator"}.
                </p>
            </div>

            <div className="max-w-350 mx-auto flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-[70%] space-y-4">
                    {/* My Classes section */}
                    {coordinatorAssignments.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-gray-900">My Classes</h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">
                                        {coordinatorAssignments.length} class{coordinatorAssignments.length === 1 ? "" : "es"} assigned
                                    </span>
                                    <button
                                        onClick={exportAll}
                                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#d9d9d9] rounded bg-white hover:bg-gray-50"
                                    >
                                        <FileSpreadsheet size={12} /> Export all
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {coordinatorAssignments.map((c: any, idx: number) => {
                                    const theme = themes[idx % themes.length];
                                    const specName = c.specialization || c.department || "";
                                    const specText = specName ? `(${specName})` : "";
                                    const batchText = c.batch || "";
                                    const classTitle = `${c.program || ""} ${specText} ${batchText}`.replace(/\s+/g, " ").trim() || "Class";

                                    const classKey = `${c.school || ""}|${c.department || ""}|${c.program || ""}|${c.batch || ""}|${c.specialization || ""}`;
                                    const enriched = coordinatorClasses.find(
                                        (ec) => `${ec.school || ""}|${ec.department || ""}|${ec.program || ""}|${ec.batch || ""}|${ec.specialization || ""}` === classKey
                                    );
                                    const studentCount = enriched?.studentCount ?? "—";

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => openClass(c)}
                                            className="cursor-pointer bg-white border border-[#a5b4fc]/70 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-full ${theme.bg} flex items-center justify-center shrink-0`}>
                                                    <GraduationCap className={`w-6 h-6 ${theme.icon}`} />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-xs font-semibold text-gray-500 tracking-wide">Class Name</span>
                                                    <h3 className={`text-base sm:text-lg font-bold ${theme.title} mt-0.5 truncate`}>
                                                        {classTitle}
                                                    </h3>
                                                    <span className={`mt-1.5 inline-flex items-center gap-1 self-start px-2 py-0.5 text-[11px] font-semibold rounded-full border ${theme.chip}`}>
                                                        <Users size={11} /> {studentCount} student{studentCount === 1 ? "" : "s"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openClass(c); }}
                                                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white border border-blue-800 rounded hover:bg-blue-700"
                                                >
                                                    View Students <ChevronRight size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => exportClass(e, c)}
                                                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-600 text-white border border-emerald-800 rounded hover:bg-emerald-700"
                                                    title="Download all students in this class as Excel"
                                                >
                                                    <FileSpreadsheet size={12} /> Export Excel
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Quick Actions */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <QuickActionCard
                                icon={<BookOpen />}
                                title="My Classes"
                                description="View and manage student lists per class"
                                onClick={() => navigate("/coordinator/classes")}
                            />
                            <QuickActionCard
                                icon={<UserPlus />}
                                title="Add Student"
                                description="Manually register a new student"
                                onClick={() => navigate("/coordinator/register-student")}
                            />
                            <QuickActionCard
                                icon={<Upload />}
                                title="Upload Sheet"
                                description="Bulk upload students via Excel"
                                onClick={() => navigate("/coordinator/register-student")}
                            />
                            <QuickActionCard
                                icon={<ImagePlus />}
                                title="Upload Student Photos"
                                description="Upload photos for your students in bulk"
                                onClick={() => setShowPhotoModal(true)}
                            />
                            <QuickActionCard
                                icon={<Users />}
                                title="Browse Student Records"
                                description="View and search all student records"
                                onClick={() => navigate("/coordinator/records")}
                            />
                            <QuickActionCard
                                icon={<FileSpreadsheet />}
                                title="Messages"
                                description="Send messages to admins and your chairperson"
                                onClick={() => navigate("/coordinator/messages")}
                            />
                        </div>
                    </section>

                    {/* Instructions */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-medium text-gray-800">Instructions</h2>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 mb-5">
                                <li>Download the Excel sheet format below.</li>
                                <li>Fill student details according to the provided columns.</li>
                                <li>All allowed fields are mentioned in the sheet — any other entry will not be supported.</li>
                                <li>Do not change the column headers.</li>
                                <li>Save the file as <code className="bg-gray-100 px-1 rounded text-xs">.xls</code> or <code className="bg-gray-100 px-1 rounded text-xs">.xlsx</code>.</li>
                                <li>Upload the completed sheet using the <strong>Upload Sheet</strong> option.</li>
                                <li>For student photos, use the <strong>Upload Student Photos</strong> option — the Excel should contain a <strong>Roll No</strong> column and a <strong>Photo</strong> column (data URI, file path, or URL).</li>
                            </ol>
                            <button
                                onClick={downloadSheet}
                                className="w-full cursor-pointer bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 transition"
                            >
                                Download Sheet Format
                            </button>
                        </div>
                    </section>
                </div>

                <aside className="w-full lg:w-[30%] space-y-4">
                    <section className="space-y-3">
                        <h2 className="text-lg font-medium text-gray-800">Overview</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                            <div className="bg-white border border-gray-200 rounded-xl px-5 py-5">
                                <p className="text-sm text-gray-500">My Classes</p>
                                <p className="text-3xl font-semibold text-gray-900 mt-2">{loading ? "…" : totals.classCount}</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl px-5 py-5">
                                <p className="text-sm text-gray-500">Total Students</p>
                                <p className="text-3xl font-semibold text-gray-900 mt-2">{loading ? "…" : totals.totalStudents}</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl px-5 py-5">
                                <p className="text-sm text-gray-500">Co-coordinators</p>
                                <p className="text-3xl font-semibold text-gray-900 mt-2">{loading ? "…" : totals.coordinatorCount}</p>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default CoordinatorDashboardContent;
