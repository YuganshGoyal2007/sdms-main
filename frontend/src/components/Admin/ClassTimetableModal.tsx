import React, { useEffect, useState } from "react";
import { X, Calendar, RefreshCw, Printer, AlertCircle, CheckCircle2, User as UserIcon, MapPin, ExternalLink, Settings2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getTimetableForClass, refreshClassTimetable, createTimetableSection, previewTimetableSection, type TimetableEntry } from "../../lib/user.api";
import { safeErrorMessage } from "../../utils/safeError";
import { openPrintWindow } from "../../utils/printWindow";

interface ClassTimetableModalProps {
    isOpen: boolean;
    onClose: () => void;
    classInfo: {
        school: string;
        department: string;
        program: string;
        batch: string;
        specialization: string;
        label?: string | null;
        academicYear?: string | null;
        semester?: string | null;
    } | null;
    onGoToMappings?: () => void;
}

const TIME_SLOTS = [
    { id: "I", time: "8:30-9:30" },
    { id: "II", time: "9:30-10:30" },
    { id: "III", time: "10:30-11:30" },
    { id: "IV", time: "11:30-12:30" },
    { id: "V", time: "12:30-1:30" },
    { id: "VI", time: "1:30-2:30" },
    { id: "VII", time: "2:30-3:30" },
    { id: "VIII", time: "3:30-4:30" },
    { id: "IX", time: "4:30-5:30" },
    { id: "X", time: "5:30-6:30" },
    { id: "XI", time: "6:30-7:30" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const palette = [
    "bg-[#f3edf1] text-[#7b3b5a] border-[#e5d5df]",
    "bg-blue-50 text-blue-800 border-blue-200",
    "bg-emerald-50 text-emerald-800 border-emerald-200",
    "bg-amber-50 text-amber-800 border-amber-200",
    "bg-purple-50 text-purple-800 border-purple-200",
    "bg-sky-50 text-sky-800 border-sky-200",
];

const colorFor = (code = "") => palette[Math.abs([...code].reduce((h, c) => h + c.charCodeAt(0), 0)) % palette.length];

const formatRelative = (iso: string | null) => {
    if (!iso) return "never";
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)} hr ago`;
    return `${Math.round(diff / 86400)} days ago`;
};

export const ClassTimetableModal: React.FC<ClassTimetableModalProps> = ({
    isOpen,
    onClose,
    classInfo,
    onGoToMappings,
}) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [timetable, setTimetable] = useState<any>(null);
    const [section, setSection] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Section Configuration Editor State
    const [showConfig, setShowConfig] = useState(false);
    const [customSectionId, setCustomSectionId] = useState("");
    const [customLabel, setCustomLabel] = useState("");
    const [savingMapping, setSavingMapping] = useState(false);
    const [previewData, setPreviewData] = useState<any | null>(null);
    const [testingDryRun, setTestingDryRun] = useState(false);

    // Active data source: previewData takes precedence when in Dry Run Test mode
    const activeSource = previewData || timetable;

    // Defensive parsing for JSON strings or objects
    const safeEntries = React.useMemo(() => {
        if (!activeSource?.entries) return {};
        if (typeof activeSource.entries === "string") {
            try {
                return JSON.parse(activeSource.entries);
            } catch (e) {
                return {};
            }
        }
        return activeSource.entries;
    }, [activeSource?.entries]);

    const safeSubjects = React.useMemo(() => {
        if (!activeSource?.subjects) return [];
        if (typeof activeSource.subjects === "string") {
            try {
                return JSON.parse(activeSource.subjects);
            } catch (e) {
                return [];
            }
        }
        return Array.isArray(activeSource.subjects) ? activeSource.subjects : [];
    }, [activeSource?.subjects]);

    const totalLectures = React.useMemo(() => {
        return Object.values(safeEntries).reduce((acc: number, dayObj: any) => {
            if (!dayObj || typeof dayObj !== "object") return acc;
            return acc + Object.values(dayObj).reduce((s: number, slotArr: any) => s + (Array.isArray(slotArr) ? slotArr.length : 0), 0);
        }, 0);
    }, [safeEntries]);

    const handleDryRunTest = async (sectionIdToTest?: string) => {
        const idToTest = sectionIdToTest || customSectionId;
        if (!idToTest || !idToTest.trim()) {
            toast.error("Please provide a valid mygbu Section ID to test");
            return;
        }
        setTestingDryRun(true);
        const t = toast.loading(`Testing Section ${idToTest.trim()} (Dry Run)...`);
        try {
            const res = await previewTimetableSection({
                mygbuSchool: "SOICT",
                mygbuDepartment: "CSE",
                mygbuSectionId: idToTest.trim(),
            });
            if (res.success) {
                setPreviewData(res);
                toast.success(
                    `Dry run test OK: ${res.totalLectures} lectures parsed for Section ${idToTest.trim()} (Database unmodified)`,
                    { id: t }
                );
            } else {
                toast.error(safeErrorMessage(res, "Dry run test failed"), { id: t });
            }
        } catch (err: any) {
            toast.error(safeErrorMessage(err, "Failed to run dry-run test"), { id: t });
        } finally {
            setTestingDryRun(false);
        }
    };

    const fetchClassTimetable = async () => {
        if (!classInfo) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getTimetableForClass(
                classInfo.school,
                classInfo.department,
                classInfo.program,
                classInfo.batch,
                classInfo.specialization
            );
            if (res.success && res.timetable) {
                setTimetable(res.timetable);
                if (res.section) {
                    setSection(res.section);
                    setCustomSectionId(String(res.section.mygbuSectionId || ""));
                    setCustomLabel(res.section.label || "");
                }
            } else {
                if (res.section) {
                    setSection(res.section);
                    setCustomSectionId(String(res.section.mygbuSectionId || ""));
                    setCustomLabel(res.section.label || "");
                }
                setError(res.error || "No timetable configured for this class");
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to load timetable for this class");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !classInfo) {
            setTimetable(null);
            setSection(null);
            setError(null);
            setShowConfig(false);
            return;
        }

        fetchClassTimetable();
    }, [isOpen, classInfo]);

    if (!isOpen || !classInfo) return null;

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await refreshClassTimetable(
                classInfo.school,
                classInfo.department,
                classInfo.program,
                classInfo.batch,
                classInfo.specialization
            );
            if (res.success && res.timetable) {
                setTimetable(res.timetable);
                const count = res.totalLectures !== undefined ? res.totalLectures : 0;
                if (count > 0) {
                    toast.success(res.changed ? `Timetable updated with ${count} lectures from mygbu.in` : `Schedule confirmed (${count} lectures synced)`);
                } else {
                    toast.info(`Synced from mygbu.in: 0 lectures scheduled for section ${res.section?.mygbuSectionId || ''}`);
                }
                await fetchClassTimetable();
            } else {
                toast.error(res.error || "Refresh failed");
            }
        } catch (err: any) {
            toast.error(safeErrorMessage(err, "Failed to refresh timetable"));
        } finally {
            setRefreshing(false);
        }
    };

    const handleSaveMapping = async (chosenId?: string, chosenLabel?: string) => {
        const idToSave = chosenId || customSectionId;
        const labelToSave = chosenLabel !== undefined ? chosenLabel : customLabel;
        if (!idToSave || !idToSave.trim()) {
            toast.error("Please provide a valid mygbu Section ID");
            return;
        }
        setSavingMapping(true);
        try {
            const payload = {
                school: classInfo.school,
                department: classInfo.department,
                program: classInfo.program,
                batch: classInfo.batch,
                specialization: classInfo.specialization,
                mygbuSchool: "SOICT",
                mygbuDepartment: "CSE",
                mygbuSectionId: idToSave.trim(),
                label: labelToSave.trim() || undefined,
                academicYear: classInfo.academicYear || "2026-27",
                semester: classInfo.semester || "Odd",
            };
            await createTimetableSection(payload);
            toast.success(`Mapping saved for Section ${idToSave.trim()}${labelToSave ? ` (${labelToSave})` : ""}`);
            setShowConfig(false);
            // Immediately refresh timetable so changes reflect in the frontend
            await handleRefresh();
        } catch (err: any) {
            toast.error(safeErrorMessage(err, "Failed to save section mapping"));
        } finally {
            setSavingMapping(false);
        }
    };

    const handlePrint = () => {
        if (!timetable) return;
        const slots = TIME_SLOTS.map((s) => s.id);
        const slotTimes = Object.fromEntries(TIME_SLOTS.map((s) => [s.id, s.time]));
        const days = DAYS.filter((d) => safeEntries && safeEntries[d]);

        const entryPills = (entries: TimetableEntry[] | undefined) => {
            if (!entries || !entries.length) return "";
            return entries.map((e) =>
                `<div class="pill"><strong>${e.code}</strong>${e.faculty ? ` · ${e.faculty}` : ""}${e.room ? ` · ${e.room}` : ""}${e.group ? ` (${e.group})` : ""}</div>`
            ).join("");
        };

        const gridHtml =
            `<div class="section"><h2>Weekly Schedule</h2>` +
            `<div class="grid"><div class="head">Day</div>` +
            slots.map((s) => `<div class="head">${s}<br><span style="font-size:9px;color:#555;">${slotTimes[s]}</span></div>`).join("") +
            `</div>` +
            days.map((d) => {
                const dayObj = (safeEntries || {})[d] || {};
                return `<div class="grid"><div class="head">${d}</div>` +
                    slots.map((s) => `<div>${entryPills(dayObj[s])}</div>`).join("") +
                    `</div>`;
            }).join("") +
            `</div>`;

        const subjectsHtml = (!safeSubjects || safeSubjects.length === 0) ? "" :
            `<div class="section"><h2>Subject Details</h2>` +
            `<table><thead><tr><th>Code</th><th>Subject Name</th><th>Credits</th><th>Faculty ABR</th><th>Faculty</th><th>Load</th></tr></thead><tbody>` +
            safeSubjects.map((s: any) =>
                `<tr><td><strong>${s.code}</strong></td><td>${s.name}</td><td>${s.credits}</td><td>${s.facultyABR}</td><td>${s.facultyName}</td><td>${s.load}</td></tr>`
            ).join("") +
            `</tbody></table></div>`;

        const title = `${classInfo.program} ${classInfo.batch} — ${classInfo.specialization}`;
        openPrintWindow(title, [gridHtml, subjectsHtml]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-[#f8f9fa] border-b border-[#d9d9d9] flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#7b3b5a]/10 text-[#7b3b5a] flex items-center justify-center shrink-0">
                            <Calendar size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-bold text-gray-900 truncate">
                                    {classInfo.program} {classInfo.batch} — {classInfo.specialization}
                                </h2>
                                {classInfo.label && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        {classInfo.label}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                                {classInfo.school.toUpperCase()} / {classInfo.department.toUpperCase()}
                                {timetable?.semester ? ` • Semester ${timetable.semester}` : ""}
                                {timetable?.academicYear ? ` (${timetable.academicYear})` : ""}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded transition ${
                                showConfig ? 'bg-[#7b3b5a] text-white border-[#7b3b5a]' : 'bg-white hover:bg-gray-50 text-gray-700 border-[#d9d9d9]'
                            }`}
                            title="Configure or modify mygbu section mapping"
                        >
                            <Settings2 size={13} />
                            {showConfig ? "Close Mapping" : "Map Section"}
                        </button>
                        {timetable && (
                            <>
                                <button
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#d9d9d9] rounded bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                                    title="Fetch live schedule update from mygbu.in"
                                >
                                    <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                                    {refreshing ? "Refreshing..." : "Refresh"}
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#d9d9d9] rounded bg-white hover:bg-gray-50 text-gray-700"
                                    title="Print Timetable"
                                >
                                    <Printer size={13} />
                                    Print
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    {/* Inline Section Mapping Configuration Panel */}
                    {showConfig && (
                        <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={16} className="text-[#7b3b5a]" />
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Configure Section Mapping for {classInfo.program} {classInfo.batch} ({classInfo.specialization})
                                    </h4>
                                </div>
                                <span className="text-[11px] text-slate-500">
                                    Current Mapped Section: <strong className="text-slate-800">{section?.mygbuSectionId ? `${section.mygbuSectionId} (${section.label || 'Mapped'})` : 'Auto-Discovered'}</strong>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        mygbu Section ID *
                                    </label>
                                    <input
                                        type="text"
                                        value={customSectionId}
                                        onChange={(e) => setCustomSectionId(e.target.value)}
                                        placeholder="e.g. 1279, 1282, 1283"
                                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#7b3b5a]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Section Label (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={customLabel}
                                        onChange={(e) => setCustomLabel(e.target.value)}
                                        placeholder="e.g. BAI-IV, BCS-III-A"
                                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#7b3b5a]"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleDryRunTest()}
                                        disabled={testingDryRun || !customSectionId.trim()}
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition disabled:opacity-50 cursor-pointer"
                                        title="Preview timetable from live university system without modifying database"
                                    >
                                        <RefreshCw size={13} className={testingDryRun ? "animate-spin" : ""} />
                                        {testingDryRun ? "Testing..." : "Dry Run Test"}
                                    </button>
                                    <button
                                        onClick={() => handleSaveMapping()}
                                        disabled={savingMapping || !customSectionId.trim()}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#7b3b5a] rounded-lg hover:bg-[#6a334e] transition disabled:opacity-50 cursor-pointer"
                                    >
                                        <Save size={13} /> {savingMapping ? "Saving..." : "Save & Sync Schedule"}
                                    </button>
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Quick Select University Section Preset:
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {[
                                        { id: '1279', label: 'BAI-IV (AI 4th Yr)' },
                                        { id: '1278', label: 'BAI-III (AI 3rd Yr)' },
                                        { id: '1277', label: 'BAI-II (AI 2nd Yr)' },
                                        { id: '1249', label: 'BAI-I-A (AI 1st Yr)' },
                                        { id: '1283', label: 'BCS-IV-A (CSE 4th Yr)' },
                                        { id: '1406', label: 'BCS-IV-B (CSE 4th Yr)' },
                                        { id: '1282', label: 'BCS-III-A (CSE 3rd Yr)' },
                                        { id: '1327', label: 'BCS-III-B (CSE 3rd Yr)' },
                                        { id: '1298', label: 'BCS-II A (CSE 2nd Yr)' },
                                        { id: '1', label: 'BCS-I-A (CSE 1st Yr)' },
                                        { id: '2486', label: 'CSE-CS-IV (Cyber Sec 4th)' },
                                        { id: '2487', label: 'CSE-DS-IV (Data Sci 4th)' },
                                        { id: '2488', label: 'CSE-ML-IV (ML 4th)' },
                                        { id: '2433', label: 'CS-IV-A (Intg 4th)' },
                                        { id: '19', label: 'CS-III-A (Intg 3rd)' },
                                    ].map((preset) => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => {
                                                setCustomSectionId(preset.id);
                                                setCustomLabel(preset.label.split(' ')[0]);
                                                handleSaveMapping(preset.id, preset.label.split(' ')[0]);
                                            }}
                                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-[#7b3b5a]/10 hover:border-[#7b3b5a]/40 hover:text-[#7b3b5a] transition"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-20 text-center">
                            <RefreshCw size={28} className="animate-spin text-[#7b3b5a] mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-700">Loading timetable for this class...</p>
                            <p className="text-xs text-gray-400 mt-1">Retrieving scheduled slots from database / mygbu.in</p>
                        </div>
                    ) : (!previewData && (error || !timetable)) ? (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-8 text-center max-w-lg mx-auto my-8">
                            <AlertCircle size={36} className="text-amber-600 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-gray-900 mb-1">
                                Timetable Not Configured
                            </h3>
                            <p className="text-xs text-gray-600 mb-4">
                                {error || "No mygbu.in section mapping has been configured for this class yet."}
                            </p>
                            
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setShowConfig(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#7b3b5a] rounded-lg hover:bg-[#6a334e] transition cursor-pointer"
                                >
                                    <Settings2 size={13} /> Configure Section Mapping Now
                                </button>
                                {onGoToMappings && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onGoToMappings();
                                        }}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        <Calendar size={13} /> Go to Timetable Admin
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Dry Run Preview Mode Banner */}
                            {previewData && (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs shadow-2xs">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={16} className="text-purple-600 shrink-0" />
                                        <span>
                                            <strong>🧪 Dry Run Preview Mode:</strong> Section <strong>{previewData.sectionId}</strong> live preview ({totalLectures} lectures). <em>Database is unmodified.</em>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSaveMapping(String(previewData.sectionId), customLabel || undefined)}
                                            disabled={savingMapping}
                                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded text-xs transition flex items-center gap-1 cursor-pointer"
                                        >
                                            <Save size={12} /> Commit Mapping
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewData(null)}
                                            className="px-2.5 py-1 bg-white border border-purple-300 hover:bg-purple-100 text-purple-800 font-medium rounded text-xs transition cursor-pointer"
                                        >
                                            Exit Preview
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Meta & Status Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 flex-wrap">
                                    {(section?.mygbuSectionId || previewData?.sectionId) && (
                                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                                            Section {previewData?.sectionId || section?.mygbuSectionId}{section?.label ? ` · ${section.label}` : ''}
                                        </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded font-semibold border ${totalLectures > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                                        {totalLectures} Lecture{totalLectures === 1 ? '' : 's'}
                                    </span>
                                    {timetable?.lastChangedAt && (
                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                            <CheckCircle2 size={13} /> Updated {formatRelative(timetable.lastChangedAt)}
                                        </span>
                                    )}
                                    {timetable?.lastFetchedAt && (
                                        <span className="text-gray-500">
                                            Fetched {formatRelative(timetable.lastFetchedAt)}
                                        </span>
                                    )}
                                    {timetable?.isStale && (
                                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium border border-amber-200">
                                            Cached (live mygbu.in unreachable)
                                        </span>
                                    )}
                                </div>
                                {timetable?.sourceUrl && (
                                    <a
                                        href={timetable.sourceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[#7b3b5a] hover:underline"
                                    >
                                        View on mygbu.in <ExternalLink size={11} />
                                    </a>
                                )}
                            </div>

                            {/* Empty Schedule Diagnostic Card with One-Click Sibling Presets */}
                            {totalLectures === 0 && (
                                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap shadow-2xs">
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                                                0 Active Lectures Found on University Portal
                                            </h4>
                                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                                No scheduled lectures were found under section {section?.mygbuSectionId ? `"${section.mygbuSectionId}"` : ""} on mygbu.in. If this class attends lectures with a core or sister section (e.g. Core CSE Sec-B or AI Sec-A), click a preset below to link and sync immediately:
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                                                {[
                                                    { id: '2541', label: 'BAI-II-B (AI 2nd Yr B)' },
                                                    { id: '1277', label: 'BAI-II (AI 2nd Yr)' },
                                                    { id: '1299', label: 'BCS-II B (CSE 2nd Yr B)' },
                                                    { id: '1298', label: 'BCS-II A (CSE 2nd Yr A)' },
                                                    { id: '1279', label: 'BAI-IV (AI 4th Yr)' },
                                                    { id: '1282', label: 'BCS-III-A (CSE 3rd Yr A)' },
                                                ].map((sug) => (
                                                    <button
                                                        key={sug.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setCustomSectionId(sug.id);
                                                            setCustomLabel(sug.label.split(' ')[0]);
                                                            handleSaveMapping(sug.id, sug.label.split(' ')[0]);
                                                        }}
                                                        className="px-2.5 py-1 rounded text-xs font-medium bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition cursor-pointer shadow-2xs"
                                                    >
                                                        Map to {sug.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowConfig(!showConfig)}
                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#7b3b5a] rounded-lg hover:bg-[#6a334e] transition shrink-0 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                    >
                                        <Settings2 size={13} />
                                        {showConfig ? "Close Mapping" : "Manual Section Mapping"}
                                    </button>
                                </div>
                            )}

                            {/* Weekly Schedule Grid */}
                            <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-2xs">
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-300">
                                            <th className="p-2 text-left font-bold text-gray-700 border-r border-gray-300 sticky left-0 bg-gray-100 z-10 w-16">
                                                Day
                                            </th>
                                            {TIME_SLOTS.map((slot) => (
                                                <th key={slot.id} className="p-1.5 text-center font-semibold text-gray-700 border-r border-gray-300 last:border-r-0 min-w-24">
                                                    <div>Slot {slot.id}</div>
                                                    <div className="text-[10px] font-normal text-gray-500">{slot.time}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DAYS.map((day) => {
                                            const dayObj = (safeEntries || {})[day] || {};
                                            return (
                                                <tr key={day} className="border-b border-gray-300 last:border-b-0 hover:bg-gray-50/50">
                                                    <td className="p-2 font-bold text-gray-800 border-r border-gray-300 sticky left-0 bg-gray-50 z-10">
                                                        {day}
                                                    </td>
                                                    {TIME_SLOTS.map((slot) => {
                                                        const entries = (dayObj[slot.id] || []) as TimetableEntry[];
                                                        return (
                                                            <td key={slot.id} className="p-1 border-r border-gray-300 last:border-r-0 align-top min-h-12">
                                                                {entries && entries.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {entries.map((e, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className={`p-1.5 rounded border leading-tight ${colorFor(e.code)}`}
                                                                            >
                                                                                <div className="font-bold flex items-center justify-between gap-1">
                                                                                    <span className="truncate" title={e.code}>{e.code}</span>
                                                                                    {e.group && (
                                                                                        <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-bold bg-white/80 border border-current/20">
                                                                                            {e.group}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {e.faculty && (
                                                                                    <div className="text-[10px] opacity-85 flex items-center gap-0.5 truncate mt-0.5">
                                                                                        <UserIcon size={9} /> {e.faculty}
                                                                                    </div>
                                                                                )}
                                                                                {e.room && (
                                                                                    <div className="text-[10px] opacity-85 flex items-center gap-0.5 truncate">
                                                                                        <MapPin size={9} /> {e.room}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-full flex items-center justify-center text-gray-300 text-[10px]">
                                                                        —
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Subject Details Table */}
                            {Array.isArray(safeSubjects) && safeSubjects.length > 0 && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
                                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700">
                                        Subject & Faculty Reference ({safeSubjects.length} subjects)
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                                                <tr>
                                                    <th className="text-left px-3 py-1.5">Code</th>
                                                    <th className="text-left px-3 py-1.5">Subject Name</th>
                                                    <th className="text-center px-3 py-1.5">Credits</th>
                                                    <th className="text-left px-3 py-1.5">Faculty Abbr</th>
                                                    <th className="text-left px-3 py-1.5">Faculty Name</th>
                                                    <th className="text-center px-3 py-1.5">Teaching Load</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {safeSubjects.map((sub: any, i: number) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-3 py-1.5 font-mono font-bold text-gray-900">{sub.code}</td>
                                                        <td className="px-3 py-1.5 text-gray-800">{sub.name}</td>
                                                        <td className="px-3 py-1.5 text-center text-gray-600">{sub.credits}</td>
                                                        <td className="px-3 py-1.5 text-gray-700">{sub.facultyABR || "—"}</td>
                                                        <td className="px-3 py-1.5 text-gray-700">{sub.facultyName || "—"}</td>
                                                        <td className="px-3 py-1.5 text-center text-gray-600">{sub.load || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#d9d9d9] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-white border border-[#d9d9d9] rounded hover:bg-gray-100 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
