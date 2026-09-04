import React, { useEffect, useState } from "react";
import { RefreshCw, Printer, ExternalLink, AlertCircle, CheckCircle2, Calendar, MapPin, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { safeErrorMessage } from "../../utils/safeError";
import {
    getMyTimetable,
    refreshMyTimetable,
    hasTimetableChangesSince,
    type Timetable as TT,
    type TimetableEntry,
} from "../../lib/user.api";

class TimetableErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error) {
        console.error("TimetableView crash:", error);
    }
    render() {
        if (this.state.error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <AlertCircle className="mx-auto mb-2 text-red-500" size={28} />
                    <h3 className="text-base font-semibold text-red-900 mb-1">Timetable failed to render</h3>
                    <p className="text-xs text-red-700 mb-3">{this.state.error.message}</p>
                    <button
                        onClick={() => this.setState({ error: null })}
                        className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const palette = [
    "bg-[#f3edf1] text-[#7b3b5a] border-[#e5d5df]",
    "bg-blue-50 text-blue-800 border-blue-200",
    "bg-emerald-50 text-emerald-800 border-emerald-200",
    "bg-amber-50 text-amber-800 border-amber-200",
    "bg-rose-50 text-rose-800 border-rose-200",
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

const Entry: React.FC<{ entry: TimetableEntry }> = ({ entry }) => (
    <div className={`text-[10px] sm:text-xs p-1.5 rounded border leading-tight ${colorFor(entry.code)}`}>
        <div className="font-semibold truncate" title={entry.code}>{entry.code}</div>
        {entry.faculty && (
            <div className="text-[10px] opacity-80 inline-flex items-center gap-0.5">
                <UserIcon size={9} /> {entry.faculty}
            </div>
        )}
        {entry.room && (
            <div className="text-[10px] opacity-80 inline-flex items-center gap-0.5">
                <MapPin size={9} /> {entry.room}
                {entry.group ? ` ${entry.group}` : ""}
            </div>
        )}
    </div>
);

export function TimetableView() {
    const [data, setData] = useState<TT | null>(null);
    const [sectionLabel, setSectionLabel] = useState<string | null>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [lastChangedAt, setLastChangedAt] = useState<string | null>(null);
    const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
    const [fetchStatus, setFetchStatus] = useState<string>("loading");
    const [isStale, setIsStale] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showChangedFlash, setShowChangedFlash] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = async (showLoader = true) => {
        if (showLoader) setFetchStatus("loading");
        try {
            const res = await getMyTimetable();
            if (!res || !res.success) {
                setData(null);
                setError((res as any)?.error || "Could not load timetable.");
                setFetchStatus("error");
                return;
            }
            if (!res.timetable) {
                setData(null);
                setError("No timetable data returned.");
                setFetchStatus("error");
                return;
            }
            setData(res.timetable);
            setSectionLabel(res.section?.label ?? null);
            setSourceUrl(res.timetable.sourceUrl ?? null);
            setLastChangedAt(res.timetable.lastChangedAt ?? null);
            setLastFetchedAt(res.timetable.lastFetchedAt ?? null);
            setFetchStatus(res.timetable.fetchStatus ?? "ok");
            setIsStale(Boolean(res.timetable.isStale));
            setError(null);
        } catch (e: any) {
            console.error("Timetable load error:", e);
            setError(e?.response?.data?.error || e?.message || "Failed to load timetable");
            setFetchStatus("error");
            setData(null);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // Poll for changes every 5 minutes
    useEffect(() => {
        let mounted = true;
        const tick = async () => {
            if (!lastChangedAt) return;
            try {
                const r = await hasTimetableChangesSince(lastChangedAt);
                if (mounted && r.changed) {
                    setShowChangedFlash(true);
                    toast.message("Your timetable was updated on mygbu.in", {
                        description: "Click refresh to see the latest version.",
                        duration: 8000,
                    });
                }
            } catch {
                // silent
            }
        };
        const id = setInterval(tick, 5 * 60 * 1000);
        return () => { mounted = false; clearInterval(id); };
    }, [lastChangedAt]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await refreshMyTimetable();
            if (!res.success) {
                toast.error(safeErrorMessage(res, "Refresh failed"));
                return;
            }
            if (res.changed) {
                toast.success("Timetable updated — latest from mygbu.in loaded");
                setShowChangedFlash(true);
                setTimeout(() => setShowChangedFlash(false), 3000);
            } else {
                toast.message("No changes — your timetable is up to date");
            }
            await load(false);
        } catch (e: any) {
            toast.error(safeErrorMessage(e, "Refresh failed"));
        } finally {
            setRefreshing(false);
        }
    };

    const className = `${data?.program || ""} ${data?.batch || ""} — ${data?.specialization || ""}`.replace(/\s+/g, " ").trim();

    return (
        <TimetableErrorBoundary>
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 inline-flex items-center gap-2">
                            <Calendar size={20} className="text-[#7b3b5a]" />
                            Class Timetable
                        </h1>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">
                            {className || "Your class"} {data?.semester ? `• Semester ${data.semester}` : ""} {data?.academicYear ? `(${data.academicYear})` : ""}
                        </p>
                        {sectionLabel && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                Synced from: <span className="font-medium">{sectionLabel}</span>
                            </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            {lastChangedAt && (
                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                    <CheckCircle2 size={12} /> Updated {formatRelative(lastChangedAt)}
                                </span>
                            )}
                            {lastFetchedAt && (
                                <span className="inline-flex items-center gap-1 text-gray-600">
                                    <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Fetched {formatRelative(lastFetchedAt)}
                                </span>
                            )}
                            {isStale && (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                    <AlertCircle size={12} /> Cached (mygbu.in unreachable)
                                </span>
                            )}
                            {showChangedFlash && (
                                <span className="inline-flex items-center gap-1 text-white bg-emerald-600 px-2 py-0.5 rounded animate-pulse">
                                    New update available
                                </span>
                            )}
                        </div>
                        {error && (
                            <p className="text-xs text-amber-700 mt-2 inline-flex items-center gap-1">
                                <AlertCircle size={12} /> {error}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-[#7b3b5a] text-white rounded-lg hover:bg-[#6a334e] transition disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                            {refreshing ? "Refreshing…" : "Refresh from mygbu.in"}
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm text-[#7b3b5a] border border-[#e5d5df] rounded-lg hover:bg-[#faf7f9] transition"
                        >
                            <Printer size={14} /> Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Friendly empty state when there's an error or no section mapping */}
            {fetchStatus === "error" && !data && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-amber-200">
                    <Calendar className="mx-auto mb-3 text-amber-500" size={32} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Timetable not configured for your class</h3>
                    <p className="text-sm text-gray-600 max-w-md mx-auto mb-2">
                        {error || "No mygbu.in section mapping exists for your class yet."}
                    </p>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
                        {data === null && (
                            <>Your class: <span className="font-mono font-semibold">
                                {error?.match(/Your class: (.+)$/)?.[1] || 'unknown'}
                            </span></>
                        )}
                    </p>
                    <a
                        href="https://mygbu.in/schd/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#7b3b5a] hover:underline"
                    >
                        Browse mygbu.in sections to find yours <ExternalLink size={10} />
                    </a>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-3">
                        Ask your admin to add a TimetableSection mapping. They can find your section ID on mygbu.in.
                    </p>
                </div>
            )}

            {/* Timetable Grid */}
            {data && (
            <div className="bg-white rounded-lg shadow-sm p-3 md:p-6 overflow-x-auto">
                {fetchStatus === "loading" && !data ? (
                    <div className="text-center text-sm text-gray-500 py-10">Loading timetable from mygbu.in…</div>
                ) : (
                    <div className="min-w-200">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-300">
                                    <th className="p-2 text-left font-semibold text-gray-700 bg-gray-50 border border-gray-300 sticky left-0 z-10 text-xs md:text-sm">Day</th>
                                    {TIME_SLOTS.map((slot) => (
                                        <th key={slot.id} className="p-2 text-center font-medium text-gray-700 bg-gray-50 border border-gray-300 min-w-25">
                                            <div className="text-xs font-semibold">{slot.id}</div>
                                            <div className="text-[10px] text-gray-600">{slot.time}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS.map((day) => {
                                    const dayObj = (data?.entries as any)?.[day] || {};
                                    return (
                                        <tr key={day} className="border-b border-gray-300">
                                            <td className="p-2 font-semibold text-gray-700 bg-gray-50 border border-gray-300 sticky left-0 z-10 text-xs md:text-sm">
                                                {day}
                                            </td>
                                            {TIME_SLOTS.map((slot) => {
                                                const entries = dayObj[slot.id] as TimetableEntry[] | undefined;
                                                return (
                                                    <td key={slot.id} className="p-1.5 border border-gray-300 align-top min-h-12">
                                                        {entries && entries.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {entries.map((e, i) => <Entry key={i} entry={e} />)}
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            )}

            {/* Subject Details */}
            {data?.subjects && data.subjects.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Subject Details</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-150">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Code</th>
                                    <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Subject Name</th>
                                    <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Credits</th>
                                    <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden sm:table-cell">Faculty ABR</th>
                                    <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Faculty</th>
                                    <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden lg:table-cell">Load (Hrs)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.subjects.map((subject, index) => (
                                    <tr key={subject.code} className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                                        <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900 font-mono">{subject.code}</td>
                                        <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900">{subject.name}</td>
                                        <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900">{subject.credits}</td>
                                        <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900 hidden sm:table-cell">{subject.facultyABR}</td>
                                        <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900">{subject.facultyName}</td>
                                        <td className="py-2 px-2 md:px-4 text-xs md:text-sm text-gray-900 hidden lg:table-cell">{subject.load}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Source attribution */}
            {sourceUrl && (
                <p className="text-[11px] text-gray-500 text-center">
                    Data synced from{" "}
                    <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-[#7b3b5a] inline-flex items-center gap-0.5 hover:underline">
                        mygbu.in <ExternalLink size={10} />
                    </a>
                </p>
            )}
        </div>
        </TimetableErrorBoundary>
    );
}
