import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, ExternalLink, RefreshCw, Save, X, Upload, Download, AlertCircle, Search, Calendar, Eye } from "lucide-react";
import { toast } from "sonner";
import { safeErrorMessage } from "../../utils/safeError";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import { ClassTimetableModal } from "../../components/Admin/ClassTimetableModal";
import {
    listTimetableSections,
    createTimetableSection,
    deleteTimetableSection,
    refreshAllTimetables,
    discoverMissingTimetable,
    bulkCreateTimetableSections,
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
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...DEFAULT_FORM });
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [discovering, setDiscovering] = useState(false);
    const [missing, setMissing] = useState<any[] | null>(null);
    const [selectedClassForTimetable, setSelectedClassForTimetable] = useState<any | null>(null);

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
        const t = toast.loading("Refreshing all timetables from mygbu.in...");
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
        // Generate full template containing all existing mappings and sample headers
        let csvContent = "school,department,program,batch,specialization,mygbuSchool,mygbuDepartment,mygbuSectionId,label,academicYear,semester\n";
        
        if (sections.length > 0) {
            const rows = sections.map((s) => [
                s.school,
                s.department,
                s.program,
                s.batch,
                s.specialization,
                s.mygbuSchool || "SOICT",
                s.mygbuDepartment || "CSE",
                s.mygbuSectionId,
                s.label || "",
                s.academicYear || "2026-27",
                s.semester || "Odd"
            ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(","));
            csvContent += rows.join("\n");
        } else {
            csvContent += `soict,cse,B.Tech,2025-29,Core Sec- D,SOICT,CSE,2536,BCS-II D,2026-27,Odd
soict,cse,B.Tech,2025-29,Data Science,SOICT,CSE,1401,CSE-DS-II,2026-27,Odd
soict,cse,B.Tech,2025-29,Cyber Security,SOICT,CSE,1400,CSE-CS-II,2026-27,Odd
soict,cse,B.Tech,2023-27,Core Sec- A,SOICT,CSE,1298,BCS-II A,2026-27,Odd
soict,cse,B.Tech,2023-27,Core Sec- B,SOICT,CSE,1299,BCS-II B,2026-27,Odd
soict,cse,B.Tech,2024-28,Data Science,SOICT,CSE,1377,MT-DS-II,2026-27,Odd
soict,cse,B.Tech,2026-30,AI,SOICT,CSE,1249,BAI-I-A,2026-27,Odd`;
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sdms-timetable-mappings-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Full CSV template downloaded — edit and re-upload via Import CSV");
    };

    const csvInputRef = useRef<HTMLInputElement | null>(null);

    const handleCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
        if (!lines.length) { toast.error("Empty CSV file"); return; }
        const header = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        const required = ["school", "department", "program", "batch", "specialization", "mygbuschool", "mygbusectionid"];
        for (const r of required) {
            if (!header.includes(r)) { toast.error(`Missing CSV column: ${r}`); return; }
        }
        const sectionsToImport: any[] = [];
        for (let i = 1; i < lines.length; i++) {
            // Regex for CSV split handling quotes
            const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
            const cleanCols = cols.map(c => c.trim().replace(/^["']|["']$/g, ''));
            const row: any = {};
            header.forEach((h, idx) => (row[h] = cleanCols[idx] || ""));
            if (row.batch && row.specialization && row.mygbusectionid) {
                sectionsToImport.push({
                    school: row.school || "soict",
                    department: row.department || "cse",
                    program: row.program || "B.Tech",
                    batch: row.batch,
                    specialization: row.specialization,
                    mygbuSchool: row.mygbuschool || "SOICT",
                    mygbuDepartment: row.mygbudepartment || "CSE",
                    mygbuSectionId: row.mygbusectionid,
                    label: row.label || null,
                    academicYear: row.academicyear || "2026-27",
                    semester: row.semester || "Odd",
                });
            }
        }

        if (!sectionsToImport.length) {
            toast.error("No valid section mapping rows found in CSV");
            return;
        }

        const t = toast.loading(`Importing ${sectionsToImport.length} mappings...`);
        try {
            const r = await bulkCreateTimetableSections(sectionsToImport);
            if (r.success) {
                toast.success(`Imported ${r.created} new mappings, ${r.skipped} skipped`, { id: t });
                await load();
            } else {
                toast.error(safeErrorMessage(r, "Import failed"), { id: t });
            }
        } catch (err: any) {
            toast.error(safeErrorMessage(err, "Import request failed"), { id: t });
        } finally {
            if (csvInputRef.current) csvInputRef.current.value = "";
        }
    };

    const discover = async () => {
        setDiscovering(true);
        try {
            const r = await discoverMissingTimetable();
            if (r.success) {
                setMissing(r.missing || []);
                if (!r.missing?.length) {
                    toast.success("All student classes already have timetable mappings!");
                } else {
                    toast.info(`Found ${r.missing.length} classes without timetable mappings`);
                }
            } else {
                toast.error(safeErrorMessage(r, "Discovery failed"));
            }
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Discovery request failed"));
        } finally {
            setDiscovering(false);
        }
    };

    const handleSelectMissing = (m: any) => {
        setForm({
            school: m.school || "soict",
            department: m.department || "cse",
            program: m.program || "B.Tech",
            batch: m.batch || "",
            specialization: m.specialization || "",
            mygbuSchool: "SOICT",
            mygbuDepartment: "CSE",
            mygbuSectionId: m.suggested || "",
            label: `${m.program} ${m.batch} ${m.specialization}`,
            academicYear: "2026-27",
            semester: "Odd",
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="h-screen w-full flex bg-[#f8f9fa] overflow-hidden">
            <aside className="shrink-0 h-screen sticky top-0 z-20">
                <AdminSideNav activeTab={"timetable"} />
            </aside>
            <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
                <div className="shrink-0 z-10">
                    <Header />
                </div>
                <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0">
                    <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                                    <Calendar className="text-[#7b3b5a]" size={24} />
                                    Timetable Mappings
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Map SDMS classes to their mygbu.in section IDs so students and teachers see live timetables.
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
                                        <span className="text-gray-500 font-medium">By batch:</span>
                                        {Object.entries(
                                            sections.reduce((acc: Record<string, number>, s: any) => {
                                                acc[s.batch] = (acc[s.batch] || 0) + 1;
                                                return acc;
                                            }, {})
                                        )
                                            .sort((a, b) => b[0].localeCompare(a[0]))
                                            .map(([b, n]) => (
                                                <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200 shadow-2xs">
                                                    <span className="font-mono">{b}</span>
                                                    <span className="text-gray-400">·</span>
                                                    <span className="font-semibold">{n}</span>
                                                </span>
                                            ))}
                                        <span className="ml-1 text-gray-500 font-medium">({sections.length} total)</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={handleRefreshAll}
                                    disabled={refreshing}
                                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[#d9d9d9] rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                                    title="Refresh all class timetables from mygbu.in"
                                >
                                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                                    {refreshing ? "Refreshing..." : "Refresh All from mygbu.in"}
                                </button>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[#d9d9d9] rounded bg-white hover:bg-gray-50 cursor-pointer"
                                    title="Download full CSV template containing all current classes"
                                >
                                    <Download size={14} /> Download CSV Template
                                </button>
                                <button
                                    onClick={() => csvInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[#d9d9d9] rounded bg-white hover:bg-gray-50 cursor-pointer"
                                    title="Import mappings from a CSV file"
                                >
                                    <Upload size={14} /> Import CSV
                                </button>
                                <button
                                    onClick={discover}
                                    disabled={discovering}
                                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-amber-200 text-amber-800 rounded bg-amber-50 hover:bg-amber-100 cursor-pointer disabled:opacity-50"
                                    title="Scan students database to find classes without timetable mappings"
                                >
                                    <AlertCircle size={14} className={discovering ? "animate-spin" : ""} />
                                    {discovering ? "Scanning..." : "Find Missing"}
                                </button>
                                <button
                                    onClick={() => setShowForm((v) => !v)}
                                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-[#7b3b5a] text-white rounded hover:bg-[#6a334e] cursor-pointer"
                                >
                                    {showForm ? <X size={14} /> : <Plus size={14} />}
                                    {showForm ? "Cancel" : "Add Mapping"}
                                </button>
                            </div>
                        </div>

                        {/* Hidden CSV File Input */}
                        <input type="file" ref={csvInputRef} accept=".csv" onChange={handleCsvFile} className="hidden" />

                        {/* Missing Classes Panel */}
                        {missing && missing.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <h3 className="text-sm font-semibold text-amber-900 inline-flex items-center gap-1.5">
                                        <AlertCircle size={16} /> {missing.length} student class{missing.length !== 1 ? "es" : ""} need{missing.length === 1 ? "s" : ""} a timetable mapping
                                    </h3>
                                    <button
                                        onClick={() => setMissing(null)}
                                        className="text-xs text-amber-700 hover:text-amber-900 p-1"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                                <p className="text-xs text-amber-800 mb-3">
                                    Click any class below to automatically fill the mapping form:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {missing.map((m: any) => (
                                        <button
                                            key={`${m.school}-${m.department}-${m.program}-${m.batch}-${m.specialization}`}
                                            onClick={() => handleSelectMissing(m)}
                                            className="bg-white rounded p-2.5 text-left text-xs border border-amber-200 hover:border-[#7b3b5a] hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                                        >
                                            <div>
                                                <p className="font-mono font-semibold text-gray-900">{m.program} {m.batch}</p>
                                                <p className="text-amber-800 mt-0.5">{m.specialization}</p>
                                                <p className="text-[10px] text-gray-500">{m.school?.toUpperCase()} / {m.department?.toUpperCase()}</p>
                                            </div>
                                            <div className="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                                                <span>{m.studentCount} student{m.studentCount !== 1 ? "s" : ""}</span>
                                                <span className="text-[#7b3b5a] font-medium">+ Map this class</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add/Edit Form */}
                        {showForm && (
                            <div className="bg-white border border-[#d9d9d9] rounded-lg p-5 shadow-sm animate-in fade-in duration-200">
                                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Plus size={16} className="text-[#7b3b5a]" />
                                    New Section Mapping
                                </h2>
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">School *</label>
                                        <input
                                            value={form.school}
                                            onChange={(e) => setForm({ ...form, school: e.target.value })}
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2.5 py-1.5 mt-0.5 focus:border-[#7b3b5a] outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Department *</label>
                                        <input
                                            value={form.department}
                                            onChange={(e) => setForm({ ...form, department: e.target.value })}
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2.5 py-1.5 mt-0.5 focus:border-[#7b3b5a] outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Program *</label>
                                        <input
                                            value={form.program}
                                            onChange={(e) => setForm({ ...form, program: e.target.value })}
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2.5 py-1.5 mt-0.5 focus:border-[#7b3b5a] outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Batch * (e.g. 2025-29)</label>
                                        <input
                                            value={form.batch}
                                            onChange={(e) => setForm({ ...form, batch: e.target.value })}
                                            placeholder="2025-29"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2.5 py-1.5 mt-0.5 focus:border-[#7b3b5a] outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Specialization *</label>
                                        <input
                                            value={form.specialization}
                                            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                                            placeholder="Core Sec- A or Data Science"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2.5 py-1.5 mt-0.5 focus:border-[#7b3b5a] outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">mygbu.in Section ID * (e.g. 1298)</label>
                                        <input
                                            value={form.mygbuSectionId}
                                            onChange={(e) => setForm({ ...form, mygbuSectionId: e.target.value })}
                                            placeholder="1298"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2.5 py-1.5 mt-0.5 focus:border-[#7b3b5a] outline-none font-mono"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Label (Optional)</label>
                                        <input
                                            value={form.label}
                                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                                            placeholder="e.g. BCS-II A"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2.5 py-1.5 mt-0.5 focus:border-[#7b3b5a] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Academic Year</label>
                                        <input
                                            value={form.academicYear}
                                            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                                            placeholder="2026-27"
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2.5 py-1.5 mt-0.5 focus:border-[#7b3b5a] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Semester</label>
                                        <select
                                            value={form.semester}
                                            onChange={(e) => setForm({ ...form, semester: e.target.value })}
                                            className="w-full text-sm border border-[#d9d9d9] rounded px-2.5 py-1.5 mt-0.5 focus:border-[#7b3b5a] outline-none bg-white"
                                        >
                                            <option value="Odd">Odd</option>
                                            <option value="Even">Even</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => { setShowForm(false); setForm({ ...DEFAULT_FORM }); }}
                                            className="text-sm px-3.5 py-1.5 text-gray-600 hover:text-black cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="inline-flex items-center gap-1.5 text-sm px-4 py-1.5 bg-[#7b3b5a] text-white rounded hover:bg-[#6a334e] disabled:opacity-50 cursor-pointer font-medium"
                                        >
                                            <Save size={14} />
                                            {saving ? "Saving..." : "Create Mapping"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Mappings Table */}
                        <div className="bg-white border border-[#d9d9d9] rounded-lg overflow-hidden shadow-2xs">
                            {loading ? (
                                <div className="p-8 text-center text-sm text-gray-500">
                                    <RefreshCw size={20} className="animate-spin text-[#7b3b5a] mx-auto mb-2" />
                                    Loading timetable sections...
                                </div>
                            ) : sections.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Calendar size={32} className="text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">No timetable mappings yet.</p>
                                    <p className="text-xs text-gray-400 mt-1">Add a mapping or click "Find Missing" to start pulling live timetables from mygbu.in.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                                        <Search size={15} className="text-gray-400" />
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Filter by batch, specialization, section ID, or label..."
                                            className="flex-1 bg-transparent outline-none text-xs text-gray-800"
                                        />
                                        {search && (
                                            <button
                                                onClick={() => setSearch("")}
                                                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-[#f8f9fa] border-b border-[#d9d9d9]">
                                                <tr>
                                                    <th className="text-left p-3 text-xs font-semibold text-gray-700">Class</th>
                                                    <th className="text-left p-3 text-xs font-semibold text-gray-700">mygbu.in Section</th>
                                                    <th className="text-left p-3 text-xs font-semibold text-gray-700">Label</th>
                                                    <th className="text-left p-3 text-xs font-semibold text-gray-700">Academic Year</th>
                                                    <th className="text-left p-3 text-xs font-semibold text-gray-700">Status</th>
                                                    <th className="text-right p-3 text-xs font-semibold text-gray-700 w-32">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sections
                                                    .filter((s) => {
                                                        if (!search.trim()) return true;
                                                        const q = search.toLowerCase();
                                                        return [s.batch, s.specialization, s.mygbuSectionId, s.label, s.school, s.department, s.program]
                                                            .filter(Boolean)
                                                            .some((v: any) => String(v).toLowerCase().includes(q));
                                                    })
                                                    .map((s) => (
                                                        <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/80 transition">
                                                            <td className="p-3 text-gray-900">
                                                                <button
                                                                    onClick={() => setSelectedClassForTimetable(s)}
                                                                    className="text-left font-medium text-[#7b3b5a] hover:underline cursor-pointer flex items-center gap-1.5"
                                                                    title="Click to view full timetable"
                                                                >
                                                                    <Calendar size={13} className="shrink-0" />
                                                                    <span>{s.program} {s.batch}</span>
                                                                </button>
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    {s.school.toUpperCase()} / {s.department.toUpperCase()} / {s.specialization}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-gray-900 font-mono text-xs">
                                                                <a
                                                                    href={`https://mygbu.in/schd/?name=${s.mygbuSchool}&dept=${s.mygbuDepartment}&section=${s.mygbuSectionId}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                                                >
                                                                    section={s.mygbuSectionId} <ExternalLink size={10} />
                                                                </a>
                                                            </td>
                                                            <td className="p-3 text-gray-900 font-medium">
                                                                {s.label || "—"}
                                                            </td>
                                                            <td className="p-3 text-gray-700 text-xs">
                                                                {s.academicYear || "—"} {s.semester ? `(${s.semester})` : ""}
                                                            </td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-0.5 text-[10px] rounded-full border font-medium ${s.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                                                    {s.active ? "Active" : "Inactive"}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <div className="inline-flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => setSelectedClassForTimetable(s)}
                                                                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1.5 rounded cursor-pointer transition"
                                                                        title="View timetable schedule"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(s.id, s.label || s.specialization)}
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded cursor-pointer transition"
                                                                        title="Delete mapping"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                <div className="shrink-0 z-10 border-t border-[#d9d9d9] bg-[#f8f9fa]">
                    <Footer />
                </div>
            </div>

            {/* Timetable Modal for Viewing Specific Class */}
            <ClassTimetableModal
                isOpen={Boolean(selectedClassForTimetable)}
                onClose={() => setSelectedClassForTimetable(null)}
                classInfo={selectedClassForTimetable}
            />
        </div>
    );
};

export default TimetableAdmin;
