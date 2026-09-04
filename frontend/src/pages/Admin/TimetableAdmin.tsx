import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, ExternalLink, RefreshCw, Save, X, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { safeErrorMessage } from "../../utils/safeError";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import {
    listTimetableSections,
    createTimetableSection,
    deleteTimetableSection,
    refreshAllTimetables,
    type TimetableSection,
} from "../../lib/user.api";

const DEFAULT_FORM = {
    school: "soict",
    department: "cse",
    program: "B.Tech",
    batch: "",
    specialization: "",
    mygbuSchool: "SOICT",
    mygbuDepartment: "CSE",
    mygbuSectionId: "",
    label: "",
    academicYear: "2026-27",
    semester: "Odd",
};

const TimetableAdmin = () => {
    const [sections, setSections] = useState<TimetableSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...DEFAULT_FORM });
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const r = await listTimetableSections();
            setSections(r.sections || []);
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Failed to load sections"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.batch.trim() || !form.specialization.trim() || !form.mygbuSectionId.trim()) {
            toast.error("Batch, specialization, and mygbuSectionId are required");
            return;
        }
        setSaving(true);
        try {
            const res = await createTimetableSection(form);
            toast.success(`Section mapping created: ${res.section.label || res.section.specialization}`);
            setShowForm(false);
            setForm({ ...DEFAULT_FORM });
            await load();
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Failed to create section"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number, label: string) => {
        if (!window.confirm(`Delete mapping for "${label}"?`)) return;
        try {
            await deleteTimetableSection(id);
            toast.success("Mapping deleted");
            await load();
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Delete failed"));
        }
    };

    const handleRefreshAll = async () => {
        setRefreshing(true);
        const t = toast.loading("Refreshing all timetables from mygbu.in…");
        try {
            const r = await refreshAllTimetables();
            const { total, success, changed } = r.summary;
            toast.success(`Refreshed ${success}/${total} sections, ${changed} updated`, { id: t });
            await load();
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Refresh failed"), { id: t });
        } finally {
            setRefreshing(false);
        }
    };

    const handleDownloadTemplate = () => {
        const csv = `school,department,program,batch,specialization,mygbuSchool,mygbuDepartment,mygbuSectionId,label,academicYear,semester
soict,cse,B.Tech,2025-29,Core Sec- D,SOICT,CSE,2536,BCS-II D,2026-27,Odd
soict,cse,B.Tech,2025-29,Data Science,SOICT,CSE,1401,CSE-DS-II,2026-27,Odd
soict,cse,B.Tech,2025-29,Cyber Security,SOICT,CSE,1400,CSE-CS-II,2026-27,Odd
soict,cse,B.Tech,2023-27,Core Sec- A,SOICT,CSE,1298,BCS-II A,2026-27,Odd
soict,cse,B.Tech,2023-27,Core Sec- B,SOICT,CSE,1299,BCS-II B,2026-27,Odd
soict,cse,B.Tech,2023-27,Core Sec- C,SOICT,CSE,1309,BCS-II C,2026-27,Odd
soict,cse,B.Tech,2023-27,Core Sec- D,SOICT,CSE,2536,BCS-II D,2026-27,Odd
soict,cse,B.Tech,2024-28,Data Science,SOICT,CSE,1377,MT-DS-II,2026-27,Odd
soict,cse,B.Tech,2024-28,Cyber Security,SOICT,CSE,1400,CSE-CS-II,2026-27,Odd
soict,cse,B.Tech,2026-30,Core Sec- A,SOICT,CSE,1311,CS-I-A,2026-27,Odd
soict,cse,B.Tech,2026-30,Core Sec- B,SOICT,CSE,21,CS-II-A,2026-27,Odd
soict,cse,B.Tech,2026-30,Core Sec- D,SOICT,CSE,2433,CS-IV-A,2026-27,Odd
soict,cse,B.Tech,2026-30,Data Science,SOICT,CSE,1339,CSE-DS-I,2026-27,Odd
soict,cse,B.Tech,2026-30,Cyber Security,SOICT,CSE,1337,CSE-CS-I,2026-27,Odd
soict,cse,B.Tech,2026-30,AI,SOICT,CSE,1249,BAI-I-A,2026-27,Odd`;
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "timetable-section-mappings-template.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Template downloaded — edit and re-import via Import CSV");
    };

    const csvInputRef = useRef<HTMLInputElement | null>(null);

    const handleCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
        if (!lines.length) { toast.error("Empty CSV"); return; }
        const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const required = ["school", "department", "program", "batch", "specialization", "mygbuschool", "mygbusectionid"];
        for (const r of required) {
            if (!header.includes(r)) { toast.error(`Missing CSV column: ${r}`); return; }
        }
        const sections: any[] = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.trim());
            const row: any = {};
            header.forEach((h, idx) => (row[h] = cols[idx] || ""));
            sections.push({
                school: row.school,
                department: row.department,
                program: row.program,
                batch: row.batch,
                specialization: row.specialization,
                mygbuSchool: row.mygbuschool || "SOICT",
                mygbuDepartment: row.mygbudepartment || "CSE",
                mygbuSectionId: row.mygbusectionid,
                label: row.label,
                academicYear: row.academicyear || "2026-27",
                semester: row.semester || "Odd",
            });
        }
        try {
            const r = await fetch("/timetable/sections/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
                body: JSON.stringify({ sections }),
            }).then((x) => x.json());
            if (r.success) {
                toast.success(`Imported ${r.created} new mappings, ${r.skipped} skipped`);
                await load();
            } else {
                toast.error(safeErrorMessage(r, "Import failed"));
            }
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Import request failed"));
        }
    };

    const [missing, setMissing] = useState<any[] | null>(null);
    const discover = async () => {
        try {
            const r = await fetch("/timetable/discover", {
                headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
            }).then((x) => x.json());
            if (r.success) {
                setMissing(r.missing || []);
                if (!r.missing?.length) toast.message("All student classes have mappings 🎉");
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="h-screen w-full flex bg-[#f8f9fa] overflow-hidden">
            <aside className="shrink-0 h-screen sticky top-0 z-20">
                <AdminSideNav activeTab={"classes"} />
            </aside>
            <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
                <div className="shrink-0 z-10">
                    <Header />
                </div>
                <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0">
                    <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">Timetable Mappings</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Map SDMS classes to their mygbu.in section IDs so students see their live timetable.
                                </p>
                                <a
                                    href="https://mygbu.in/schd/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-[#7b3b5a] inline-flex items-center gap-1 mt-1 hover:underline"
                                >
                                    Browse mygbu.in sections <ExternalLink size={10} />
                                </a>
                                {sections.length > 0 && (
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                                        <span className="text-gray-500">By batch:</span>
                                        {Object.entries(
                                            sections.reduce((acc: Record<string, number>, s: any) => {
                                                acc[s.batch] = (acc[s.batch] || 0) + 1;
                                                return acc;
                                            }, {})
                                        )
                                            .sort((a, b) => b[0].localeCompare(a[0]))
                                            .map(([b, n]) => (
                                                <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                                    <span className="font-mono">{b}</span>
                                                    <span className="text-gray-400">·</span>
                                                    <span className="font-semibold">{n}</span>
                                                </span>
                                            ))}
                                        <span className="ml-1 text-gray-500">({sections.length} total)</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={handleRefreshAll}
                                    disabled={refreshing}
                                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[#d9d9d9] rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                                    {refreshing ? "Refreshing…" : "Refresh All from mygbu.in"}
                                </button>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[#d9d9d9] rounded bg-white hover:bg-gray-50"
                                    title="Download a CSV template with known section IDs"
                                >
                                    <Upload size={14} /> Download CSV Template
                                </button>
                                <button
                                    onClick={discover}
                                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-amber-200 text-amber-800 rounded bg-amber-50 hover:bg-amber-100"
                                >
                                    <AlertCircle size={14} /> Find Missing
                                </button>
                                <button
                                    onClick={() => setShowForm((v) => !v)}
                                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-[#7b3b5a] text-white rounded hover:bg-[#6a334e]"
                                >
                                    {showForm ? <X size={14} /> : <Plus size={14} />}
                                    {showForm ? "Cancel" : "Add Mapping"}
                                </button>
                            </div>
                        </div>

                        <input type="file" ref={csvInputRef} accept=".csv" onChange={handleCsvFile} className="hidden" />
                        {missing && missing.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-amber-900 mb-2 inline-flex items-center gap-1">
                                    <AlertCircle size={14} /> {missing.length} student class{missing.length !== 1 ? "es" : ""} need{missing.length === 1 ? "s" : ""} a timetable mapping
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {missing.map((m: any) => (
                                        <div key={`${m.school}-${m.department}-${m.program}-${m.batch}-${m.specialization}`} className="bg-white rounded p-2 text-xs border border-amber-200">
                                            <p className="font-mono text-amber-900">{m.program} {m.batch}</p>
                                            <p className="text-amber-700">{m.specialization} ({m.studentCount} student{m.studentCount !== 1 ? "s" : ""})</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showForm && (
                            <div className="bg-white border border-[#d9d9d9] rounded-lg p-5">
                                <h2 className="text-base font-semibold text-gray-900 mb-3">New Section Mapping</h2>
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">School *</label>
                                        <input
                                            value={form.school}
                                            onChange={(e) => setForm({ ...form, school: e.target.value })}
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Department *</label>
                                        <input
                                            value={form.department}
                                            onChange={(e) => setForm({ ...form, department: e.target.value })}
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Program *</label>
                                        <input
                                            value={form.program}
                                            onChange={(e) => setForm({ ...form, program: e.target.value })}
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Batch *</label>
                                        <input
                                            value={form.batch}
                                            onChange={(e) => setForm({ ...form, batch: e.target.value })}
                                            placeholder="e.g. 2025-29"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Specialization *</label>
                                        <input
                                            value={form.specialization}
                                            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                                            placeholder="e.g. Core Sec- D"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">mygbu.in School</label>
                                        <input
                                            value={form.mygbuSchool}
                                            onChange={(e) => setForm({ ...form, mygbuSchool: e.target.value })}
                                            placeholder="e.g. SOICT"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">mygbu.in Department</label>
                                        <input
                                            value={form.mygbuDepartment}
                                            onChange={(e) => setForm({ ...form, mygbuDepartment: e.target.value })}
                                            placeholder="e.g. CSE"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">mygbu.in Section ID *</label>
                                        <input
                                            value={form.mygbuSectionId}
                                            onChange={(e) => setForm({ ...form, mygbuSectionId: e.target.value })}
                                            placeholder="e.g. 2536"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Label</label>
                                        <input
                                            value={form.label}
                                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                                            placeholder="e.g. BCS-II D"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Academic Year</label>
                                        <input
                                            value={form.academicYear}
                                            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                                            placeholder="e.g. 2026-27"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Semester</label>
                                        <select
                                            value={form.semester}
                                            onChange={(e) => setForm({ ...form, semester: e.target.value })}
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2 py-1.5 mt-0.5"
                                        >
                                            <option value="Odd">Odd</option>
                                            <option value="Even">Even</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => { setShowForm(false); setForm({ ...DEFAULT_FORM }); }}
                                            className="text-sm px-3 py-1.5 text-gray-600 hover:text-black"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-[#7b3b5a] text-white rounded hover:bg-[#6a334e] disabled:opacity-50"
                                        >
                                            <Save size={14} />
                                            {saving ? "Saving…" : "Create Mapping"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="bg-white border border-[#d9d9d9] rounded-lg overflow-hidden">
                            {loading ? (
                                <div className="p-6 text-center text-sm text-gray-500">Loading sections…</div>
                            ) : sections.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-sm text-gray-500">No timetable mappings yet.</p>
                                    <p className="text-xs text-gray-400 mt-1">Add one to start pulling live timetables from mygbu.in.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[#f8f9fa] border-b border-[#d9d9d9]">
                                            <tr>
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">Class</th>
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">mygbu.in Section</th>
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">Label</th>
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">Academic Year</th>
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">Status</th>
                                                <th className="text-right p-3 text-xs font-semibold text-gray-700 w-24">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sections.map((s) => (
                                                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="p-3 text-gray-900">
                                                        <div className="font-medium">{s.program} {s.batch}</div>
                                                        <div className="text-xs text-gray-500">{s.school.toUpperCase()} / {s.department.toUpperCase()} / {s.specialization}</div>
                                                    </td>
                                                    <td className="p-3 text-gray-900 font-mono text-xs">
                                                        ?name={s.mygbuSchool}&dept={s.mygbuDepartment}&section={s.mygbuSectionId}
                                                    </td>
                                                    <td className="p-3 text-gray-900">{s.label || "—"}</td>
                                                    <td className="p-3 text-gray-700 text-xs">
                                                        {s.academicYear || "—"} {s.semester ? `(${s.semester})` : ""}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 text-[10px] rounded-full border ${s.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                                            {s.active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            onClick={() => handleDelete(s.id, s.label || s.specialization)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded"
                                                            title="Delete mapping"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                <div className="shrink-0 z-10 border-t border-[#d9d9d9] bg-[#f8f9fa]">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default TimetableAdmin;
