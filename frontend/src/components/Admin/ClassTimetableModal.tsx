import React, { useEffect, useState } from "react";
import { X, Calendar, RefreshCw, Printer, AlertCircle, CheckCircle2, User as UserIcon, MapPin, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getTimetableForClass, refreshClassTimetable, type TimetableEntry } from "../../lib/user.api";
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
    { id: "III", time: "10:30-11:00" },
    { id: "IV", time: "11:30-12:30" },
    { id: "V", time: "12:30-1:30" },
    { id: "VI", time: "1:30-2:30" },
    { id: "VII", time: "2:30-3:30" },
    { id: "VIII", time: "3:30-4:30" },
    { id: "IX", time: "4:30-5:30" },
    { id: "X", time: "5:30-6:30" },
    { id: "XI", time: "6:30-7:30" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !classInfo) {
            setTimetable(null);
            setError(null);
            return;
        }

        const fetchClassTimetable = async () => {
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
                } else {
                    setError(res.error || "No timetable configured for this class");
                }
            } catch (err: any) {
                setError(err?.response?.data?.error || "Failed to load timetable for this class");
            } finally {
                setLoading(false);
            }
        };

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
                toast.success(res.changed ? "Timetable updated with new schedule from mygbu.in" : "Timetable is up-to-date");
            } else {
                toast.error(res.error || "Refresh failed");
            }
        } catch (err: any) {
            toast.error(safeErrorMessage(err, "Failed to refresh timetable"));
        } finally {
            setRefreshing(false);
        }
    };

    const handlePrint = () => {
        if (!timetable) return;
        const slots = TIME_SLOTS.map((s) => s.id);
        const slotTimes = Object.fromEntries(TIME_SLOTS.map((s) => [s.id, s.time]));
        const days = DAYS.filter((d) => timetable.entries && timetable.entries[d]);

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
                const dayObj = (timetable.entries || {})[d] || {};
                return `<div class="grid"><div class="head">${d}</div>` +
                    slots.map((s) => `<div>${entryPills(dayObj[s])}</div>`).join("") +
                    `</div>`;
            }).join("") +
            `</div>`;

        const subjectsHtml = (!timetable.subjects || timetable.subjects.length === 0) ? "" :
            `<div class="section"><h2>Subject Details</h2>` +
            `<table><thead><tr><th>Code</th><th>Subject Name</th><th>Credits</th><th>Faculty ABR</th><th>Faculty</th><th>Load</th></tr></thead><tbody>` +
            timetable.subjects.map((s: any) =>
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
                    {loading ? (
                        <div className="py-20 text-center">
                            <RefreshCw size={28} className="animate-spin text-[#7b3b5a] mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-700">Loading timetable for this class...</p>
                            <p className="text-xs text-gray-400 mt-1">Retrieving scheduled slots from database / mygbu.in</p>
                        </div>
                    ) : error || !timetable ? (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-8 text-center max-w-lg mx-auto my-8">
                            <AlertCircle size={36} className="text-amber-600 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-gray-900 mb-1">
                                Timetable Not Configured
                            </h3>
                            <p className="text-xs text-gray-600 mb-4">
                                {error || "No mygbu.in section mapping has been configured for this class yet."}
                            </p>
                            {onGoToMappings && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onGoToMappings();
                                    }}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#7b3b5a] rounded-lg hover:bg-[#6a334e] transition cursor-pointer"
                                >
                                    <Calendar size={13} /> Go to Timetable Mappings
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Meta & Status Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 flex-wrap">
                                    {timetable.lastChangedAt && (
                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                            <CheckCircle2 size={13} /> Updated {formatRelative(timetable.lastChangedAt)}
                                        </span>
                                    )}
                                    {timetable.lastFetchedAt && (
                                        <span className="text-gray-500">
                                            Fetched {formatRelative(timetable.lastFetchedAt)}
                                        </span>
                                    )}
                                    {timetable.isStale && (
                                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium border border-amber-200">
                                            Cached (live mygbu.in unreachable)
                                        </span>
                                    )}
                                </div>
                                {timetable.sourceUrl && (
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
                                            const dayObj = (timetable.entries || {})[day] || {};
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
                                                                                <div className="font-bold truncate" title={e.code}>
                                                                                    {e.code}
                                                                                </div>
                                                                                {e.faculty && (
                                                                                    <div className="text-[10px] opacity-85 flex items-center gap-0.5 truncate mt-0.5">
                                                                                        <UserIcon size={9} /> {e.faculty}
                                                                                    </div>
                                                                                )}
                                                                                {e.room && (
                                                                                    <div className="text-[10px] opacity-85 flex items-center gap-0.5 truncate">
                                                                                        <MapPin size={9} /> {e.room} {e.group ? `(${e.group})` : ""}
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
                            {Array.isArray(timetable.subjects) && timetable.subjects.length > 0 && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
                                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700">
                                        Subject & Faculty Reference ({timetable.subjects.length} subjects)
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
                                                {timetable.subjects.map((sub: any, i: number) => (
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
