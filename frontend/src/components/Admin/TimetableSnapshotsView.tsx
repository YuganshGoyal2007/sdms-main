import React, { useState, useEffect, useMemo } from "react";
import {
  Camera,
  History,
  Eye,
  X,
  RefreshCw,
  Filter,
  BookOpen,
  Calendar,
  Users,
  Printer,
  Search,
  Award,
  FileCode,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";
import { openPrintWindow } from "../../utils/printWindow";

interface SnapshotItem {
  id: number;
  academicYear: string;
  semesterTerm: string;
  snapshotType: string;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  capturedAt: string;
  capturedBy: string;
  remarks: string;
}

const SNAPSHOT_TIME_SLOTS = [
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

const SNAPSHOT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const colorPalette = [
  "bg-[#f3edf1] text-[#7b3b5a] border-[#e5d5df]",
  "bg-blue-50 text-blue-800 border-blue-200",
  "bg-emerald-50 text-emerald-800 border-emerald-200",
  "bg-amber-50 text-amber-800 border-amber-200",
  "bg-purple-50 text-purple-800 border-purple-200",
  "bg-sky-50 text-sky-800 border-sky-200",
];

const getColorFor = (code = "") =>
  colorPalette[Math.abs([...code].reduce((h, c) => h + c.charCodeAt(0), 0)) % colorPalette.length];

export const TimetableSnapshotsView: React.FC = () => {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<"curriculum" | "matrix" | "faculty" | "raw">("curriculum");
  const [curriculumSearch, setCurriculumSearch] = useState("");

  // Capture modal state
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureForm, setCaptureForm] = useState({
    school: "SOICT",
    department: "CSE",
    academicYear: "2025-2026",
    semesterTerm: "odd",
    snapshotType: "manual",
    remarks: "",
  });
  const [capturing, setCapturing] = useState(false);

  // Filters
  const [termFilter, setTermFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (termFilter !== "ALL") params.semesterTerm = termFilter;
      if (typeFilter !== "ALL") params.snapshotType = typeFilter;
      const res = await api.get("/timetable/snapshots", { params });
      if (res.data?.success) {
        setSnapshots(res.data.snapshots || []);
      }
    } catch (err: any) {
      toast.error("Failed to load historical snapshots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [termFilter, typeFilter]);

  const viewDetails = async (id: number) => {
    try {
      const res = await api.get(`/timetable/snapshots/${id}`);
      if (res.data?.success) {
        setSelectedSnapshot(res.data.snapshot);
        setModalTab("curriculum");
        setCurriculumSearch("");
      }
    } catch (err: any) {
      toast.error("Failed to fetch snapshot details");
    }
  };

  const activeEntries = useMemo(() => {
    if (!selectedSnapshot) return {};
    let raw = selectedSnapshot.entries;
    if (raw && typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { raw = null; }
    }
    if (raw && typeof raw === "object") return raw;

    let td = selectedSnapshot.timetableData;
    if (td && typeof td === "string") {
      try { td = JSON.parse(td); } catch { td = null; }
    }
    if (td && typeof td === "object") {
      if (td.entries) {
        let tde = td.entries;
        if (typeof tde === "string") {
          try { tde = JSON.parse(tde); } catch { tde = null; }
        }
        if (tde && typeof tde === "object") return tde;
      }
      return td;
    }
    return {};
  }, [selectedSnapshot]);

  const activeSubjects = useMemo(() => {
    if (!selectedSnapshot) return [];
    if (Array.isArray(selectedSnapshot.subjects) && selectedSnapshot.subjects.length > 0) {
      return selectedSnapshot.subjects;
    }
    if (
      selectedSnapshot.timetableData &&
      Array.isArray(selectedSnapshot.timetableData.subjects) &&
      selectedSnapshot.timetableData.subjects.length > 0
    ) {
      return selectedSnapshot.timetableData.subjects;
    }
    // Fallback: derive unique subjects from entries matrix
    const seen = new Set();
    const list: any[] = [];
    for (const d of Object.keys(activeEntries || {})) {
      for (const sl of Object.keys(activeEntries[d] || {})) {
        const slotArr = Array.isArray(activeEntries[d][sl]) ? activeEntries[d][sl] : [];
        for (const it of slotArr) {
          if (it.code && !seen.has(it.code)) {
            seen.add(it.code);
            const fa = (selectedSnapshot.facultyAssignments || []).find((a: any) => a.subjectCode === it.code);
            list.push({
              code: it.code,
              name: fa?.subjectName || it.code,
              credits: fa?.credits || "—",
              facultyABR: it.faculty || "",
              facultyName: fa?.facultyName || it.faculty || "",
              load: "—",
            });
          }
        }
      }
    }
    return list;
  }, [selectedSnapshot, activeEntries]);

  const filteredSubjects = useMemo(() => {
    if (!curriculumSearch.trim()) return activeSubjects;
    const q = curriculumSearch.toLowerCase();
    return activeSubjects.filter(
      (s: any) =>
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.facultyName && s.facultyName.toLowerCase().includes(q)) ||
        (s.facultyABR && s.facultyABR.toLowerCase().includes(q))
    );
  }, [activeSubjects, curriculumSearch]);

  const snapshotKpis = useMemo(() => {
    const totalSubjects = activeSubjects.length;
    const totalCredits = activeSubjects.reduce(
      (acc: number, s: any) => acc + (parseFloat(s.credits) || 0),
      0
    );
    const facultySet = new Set([
      ...activeSubjects.map((s: any) => s.facultyName || s.facultyABR).filter(Boolean),
      ...(selectedSnapshot?.facultyAssignments || []).map((fa: any) => fa.facultyName).filter(Boolean),
    ]);
    let totalSlots = 0;
    for (const d of Object.keys(activeEntries || {})) {
      for (const sl of Object.keys(activeEntries[d] || {})) {
        const arr = activeEntries[d][sl];
        if (Array.isArray(arr)) totalSlots += arr.length;
      }
    }
    return {
      totalSubjects,
      totalCredits,
      facultyCount: facultySet.size,
      totalSlots,
    };
  }, [activeSubjects, activeEntries, selectedSnapshot]);

  const handlePrintSnapshotKnowledge = () => {
    if (!selectedSnapshot) return;
    const title = `Historical Curriculum & Timetable Ledger: ${selectedSnapshot.program} (${selectedSnapshot.batch}) - ${selectedSnapshot.academicYear} ${selectedSnapshot.semesterTerm}`;

    const subjectsHtml = `
      <div class="section">
        <h2>Curriculum & Course Knowledge Ledger</h2>
        <p class="meta">Program: ${selectedSnapshot.program} (${selectedSnapshot.batch}) &middot; Spec: ${selectedSnapshot.specialization} &middot; Academic Year: ${selectedSnapshot.academicYear} (${selectedSnapshot.semesterTerm}) &middot; Milestone: ${selectedSnapshot.snapshotType} &middot; Captured: ${new Date(selectedSnapshot.capturedAt).toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="width: 110px;">Code</th>
              <th>Course Title / Subject Name</th>
              <th style="width: 60px;">Credits</th>
              <th>Faculty In-Charge</th>
              <th style="width: 60px;">Load</th>
            </tr>
          </thead>
          <tbody>
            ${(activeSubjects || []).map((s: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${s.code || "—"}</strong></td>
                <td>${s.name || "—"}</td>
                <td>${s.credits || "—"}</td>
                <td>${s.facultyName || s.facultyABR || "—"}</td>
                <td>${s.load || "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const slots = SNAPSHOT_TIME_SLOTS.map((s) => s.id);
    const slotTimes = Object.fromEntries(SNAPSHOT_TIME_SLOTS.map((s) => [s.id, s.time]));
    const days = SNAPSHOT_DAYS.filter((d) => activeEntries && activeEntries[d]);

    const entryPills = (entriesList: any[] | undefined) => {
      if (!entriesList || !entriesList.length) return "";
      return entriesList.map((e: any) =>
        `<div class="pill"><strong>${e.code || ""}</strong>${e.faculty ? ` · ${e.faculty}` : ""}${e.room ? ` · ${e.room}` : ""}${e.group ? ` (${e.group})` : ""}</div>`
      ).join("");
    };

    const gridHtml = `
      <div class="section">
        <h2>Archived Weekly Timetable Matrix</h2>
        <div class="grid">
          <div class="head">Day</div>
          ${slots.map((s) => `<div class="head">${s}<br><span style="font-size:9px;color:#555;">${slotTimes[s]}</span></div>`).join("")}
        </div>
        ${days.map((d) => {
          const dayObj = activeEntries[d] || {};
          return `
            <div class="grid">
              <div class="head">${d}</div>
              ${slots.map((s) => `<div>${entryPills(dayObj[s])}</div>`).join("")}
            </div>
          `;
        }).join("")}
      </div>
    `;

    openPrintWindow(title, [subjectsHtml, gridHtml]);
  };

  const handleCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCapturing(true);
    const t = toast.loading("Capturing timetable snapshots…");
    try {
      const res = await api.post("/timetable/snapshots/capture", captureForm);
      if (res.data?.success) {
        toast.success(`Captured ${res.data.count} timetable snapshot(s)!`, { id: t });
        setShowCaptureModal(false);
        fetchSnapshots();
      } else {
        toast.error(res.data?.message || "Capture failed", { id: t });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Capture failed", { id: t });
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#7b3b5a]" /> Timetable Milestone Snapshots
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Historical point-in-time archives captured at semester start (Aug / Jan) and semester end (Nov-Dec / Apr-May).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSnapshots}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition"
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowCaptureModal(true)}
            className="px-4 py-2 bg-[#7b3b5a] hover:bg-[#682f4b] text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Camera size={15} />
            <span>Capture Snapshot Now</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200 text-xs">
        <Filter size={14} className="text-gray-400" />
        <span className="font-semibold text-gray-700">Filter Term:</span>
        {["ALL", "odd", "even"].map((t) => (
          <button
            key={t}
            onClick={() => setTermFilter(t)}
            className={`px-3 py-1 rounded-md uppercase font-medium transition ${
              termFilter === t ? "bg-[#7b3b5a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t}
          </button>
        ))}

        <span className="font-semibold text-gray-700 ml-4">Filter Boundary:</span>
        {[
          { label: "All Types", val: "ALL" },
          { label: "Term Start", val: "term_start" },
          { label: "Term End", val: "term_end" },
          { label: "Manual", val: "manual" },
        ].map((tp) => (
          <button
            key={tp.val}
            onClick={() => setTypeFilter(tp.val)}
            className={`px-3 py-1 rounded-md font-medium transition ${
              typeFilter === tp.val ? "bg-[#7b3b5a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tp.label}
          </button>
        ))}
      </div>

      {/* Snapshots Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs">Loading snapshot archives…</div>
        ) : snapshots.length === 0 ? (
          <div className="p-12 text-center">
            <Camera size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">No Timetable Snapshots Found</p>
            <p className="text-xs text-gray-400 mt-1">
              Automated snapshots trigger at term boundaries, or you can capture one manually right now.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Captured At</th>
                  <th className="py-3 px-4">Academic Year & Term</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Class / Program</th>
                  <th className="py-3 px-4">Captured By</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {snapshots.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {new Date(s.capturedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">{s.academicYear}</span> ({s.semesterTerm})
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.snapshotType === "term_start"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : s.snapshotType === "term_end"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-purple-100 text-purple-800 border border-purple-200"
                        }`}
                      >
                        {s.snapshotType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {s.program} ({s.batch}) {s.specialization && s.specialization !== "None" ? `- ${s.specialization}` : ""}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{s.capturedBy}</td>
                    <td className="py-3 px-4 text-gray-500 truncate max-w-xs">{s.remarks || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => viewDetails(s.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition cursor-pointer"
                      >
                        <Eye size={13} /> View Grid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snapshot Knowledge Inspection Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50/80 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-[#7b3b5a] text-white">
                      Snapshot #{selectedSnapshot.id}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">
                      {selectedSnapshot.program} ({selectedSnapshot.batch}) — {selectedSnapshot.specialization || "Core"}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedSnapshot.snapshotType === "term_start"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : selectedSnapshot.snapshotType === "term_end"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-purple-100 text-purple-800 border border-purple-200"
                      }`}
                    >
                      {selectedSnapshot.snapshotType.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span>
                      {selectedSnapshot.school} / {selectedSnapshot.department}
                    </span>
                    <span>•</span>
                    <span>
                      Academic Year: <strong>{selectedSnapshot.academicYear}</strong> ({selectedSnapshot.semesterTerm} Term)
                    </span>
                    <span>•</span>
                    <span>Captured: {new Date(selectedSnapshot.capturedAt).toLocaleString()} by {selectedSnapshot.capturedBy}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handlePrintSnapshotKnowledge}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                    title="Print curriculum ledger & schedule matrix"
                  >
                    <Printer size={14} /> Print Ledger
                  </button>
                  <button
                    onClick={() => setSelectedSnapshot(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                  <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-[#7b3b5a]" /> Active Subjects
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">{snapshotKpis.totalSubjects}</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                  <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                    <Award size={13} className="text-emerald-600" /> Total Credits
                  </div>
                  <div className="text-lg font-bold text-emerald-700 mt-1">{snapshotKpis.totalCredits || "—"}</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                  <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                    <Users size={13} className="text-blue-600" /> Faculty Engaged
                  </div>
                  <div className="text-lg font-bold text-blue-700 mt-1">{snapshotKpis.facultyCount}</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                  <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                    <Calendar size={13} className="text-purple-600" /> Weekly Class Slots
                  </div>
                  <div className="text-lg font-bold text-purple-700 mt-1">{snapshotKpis.totalSlots}</div>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex items-center gap-2 mt-4 border-b border-gray-200">
                <button
                  onClick={() => setModalTab("curriculum")}
                  className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                    modalTab === "curriculum"
                      ? "border-[#7b3b5a] text-[#7b3b5a]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <BookOpen size={14} /> Curriculum & Subject Ledger
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-700 font-bold">
                    {activeSubjects.length}
                  </span>
                </button>

                <button
                  onClick={() => setModalTab("matrix")}
                  className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                    modalTab === "matrix"
                      ? "border-[#7b3b5a] text-[#7b3b5a]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Calendar size={14} /> Timetable Matrix Grid
                </button>

                <button
                  onClick={() => setModalTab("faculty")}
                  className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                    modalTab === "faculty"
                      ? "border-[#7b3b5a] text-[#7b3b5a]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Users size={14} /> Faculty Allocations
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-700 font-bold">
                    {selectedSnapshot.facultyAssignments?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setModalTab("raw")}
                  className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                    modalTab === "raw"
                      ? "border-[#7b3b5a] text-[#7b3b5a]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <FileCode size={14} /> Raw Archive Payload
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {/* TAB 1: CURRICULUM & SUBJECT LEDGER */}
              {modalTab === "curriculum" && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-gray-600">
                      Historical syllabus roster active in <strong>{selectedSnapshot.academicYear}</strong> ({selectedSnapshot.semesterTerm} semester).
                    </p>
                    <div className="relative w-full sm:w-64">
                      <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={curriculumSearch}
                        onChange={(e) => setCurriculumSearch(e.target.value)}
                        placeholder="Search code, subject, faculty…"
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#7b3b5a]"
                      />
                    </div>
                  </div>

                  {filteredSubjects.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400 border border-gray-200 rounded-xl">
                      No subjects found matching search criteria.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                          <tr>
                            <th className="py-2.5 px-3 w-10">#</th>
                            <th className="py-2.5 px-3 w-28">Course Code</th>
                            <th className="py-2.5 px-3">Subject / Course Title</th>
                            <th className="py-2.5 px-3 w-20 text-center">Credits</th>
                            <th className="py-2.5 px-3">Faculty In-Charge</th>
                            <th className="py-2.5 px-3 w-24">Weekly Load</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredSubjects.map((s: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-3 text-gray-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-semibold">
                                <span className={`inline-block px-2 py-0.5 rounded border text-[11px] ${getColorFor(s.code)}`}>
                                  {s.code}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-gray-900">{s.name || "—"}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                                  {s.credits || "—"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="text-gray-800 font-medium">{s.facultyName || s.facultyABR || "—"}</div>
                                {s.facultyABR && s.facultyName && s.facultyABR !== s.facultyName && (
                                  <div className="text-[10px] text-gray-400">({s.facultyABR})</div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-gray-600">{s.load || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TIMETABLE MATRIX */}
              {modalTab === "matrix" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">
                    Point-in-time weekly class matrix archived during snapshot capture.
                  </p>
                  <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-2xs">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="p-2 text-left font-bold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-100 z-10 w-16">
                            Day
                          </th>
                          {SNAPSHOT_TIME_SLOTS.map((slot) => (
                            <th key={slot.id} className="p-1.5 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 min-w-24">
                              <div>Slot {slot.id}</div>
                              <div className="text-[10px] font-normal text-gray-500">{slot.time}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SNAPSHOT_DAYS.map((day) => {
                          const dayObj = (activeEntries || {})[day] || {};
                          return (
                            <tr key={day} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50">
                              <td className="p-2 font-bold text-gray-800 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                                {day}
                              </td>
                              {SNAPSHOT_TIME_SLOTS.map((slot) => {
                                const entries = (dayObj[slot.id] || []) as any[];
                                return (
                                  <td key={slot.id} className="p-1 border-r border-gray-200 last:border-r-0 align-top min-h-12">
                                    {entries && entries.length > 0 ? (
                                      <div className="space-y-1">
                                        {entries.map((e, idx) => (
                                          <div
                                            key={idx}
                                            className={`p-1.5 rounded border leading-tight ${getColorFor(e.code)}`}
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
                </div>
              )}

              {/* TAB 3: ACTIVE FACULTY ALLOCATIONS */}
              {modalTab === "faculty" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">
                    Faculty members and courses allocated at this milestone.
                  </p>
                  {(!selectedSnapshot.facultyAssignments || selectedSnapshot.facultyAssignments.length === 0) ? (
                    <div className="p-8 text-center text-xs text-gray-400 border border-gray-200 rounded-xl">
                      No distinct faculty allocation records archived in this snapshot.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase">
                          <tr>
                            <th className="py-2.5 px-3">Faculty Name</th>
                            <th className="py-2.5 px-3">Role</th>
                            <th className="py-2.5 px-3">Subject / Course</th>
                            <th className="py-2.5 px-3 text-center">Credits</th>
                            <th className="py-2.5 px-3">Room</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedSnapshot.facultyAssignments.map((fa: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-3 font-semibold text-gray-900">
                                {fa.facultyName || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-gray-600 uppercase text-[10px] font-bold">
                                {fa.teacherRole || "faculty"}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-medium text-gray-900">{fa.subjectCode || "—"}</span>
                                {fa.subjectName && (
                                  <span className="text-gray-500 ml-1.5">({fa.subjectName})</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center text-gray-700">
                                {fa.credits || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-gray-500">
                                {fa.room || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: RAW PAYLOAD */}
              {modalTab === "raw" && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Raw JSON payload as stored in database:
                  </p>
                  <div className="border border-gray-200 rounded-xl overflow-x-auto p-4 bg-slate-900 text-slate-100 text-xs font-mono">
                    <pre className="text-[11px] whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {JSON.stringify(selectedSnapshot, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Capture Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Camera size={18} className="text-[#7b3b5a]" /> Capture Timetable Snapshot
              </h3>
              <button
                onClick={() => setShowCaptureModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCaptureSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">School & Department</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={captureForm.school}
                    onChange={(e) => setCaptureForm({ ...captureForm, school: e.target.value })}
                    className="p-2 border border-gray-300 rounded-lg outline-none"
                    placeholder="School (SOICT)"
                    required
                  />
                  <input
                    type="text"
                    value={captureForm.department}
                    onChange={(e) => setCaptureForm({ ...captureForm, department: e.target.value })}
                    className="p-2 border border-gray-300 rounded-lg outline-none"
                    placeholder="Dept (CSE)"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={captureForm.academicYear}
                    onChange={(e) => setCaptureForm({ ...captureForm, academicYear: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                    placeholder="2025-2026"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Semester Term</label>
                  <select
                    value={captureForm.semesterTerm}
                    onChange={(e) => setCaptureForm({ ...captureForm, semesterTerm: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white"
                  >
                    <option value="odd">Odd Semester</option>
                    <option value="even">Even Semester</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Snapshot Milestone</label>
                <select
                  value={captureForm.snapshotType}
                  onChange={(e) => setCaptureForm({ ...captureForm, snapshotType: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white"
                >
                  <option value="manual">Manual Snapshot</option>
                  <option value="term_start">Term Start (Initial Grid)</option>
                  <option value="term_end">Term End (Final Grid)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={captureForm.remarks}
                  onChange={(e) => setCaptureForm({ ...captureForm, remarks: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                  placeholder="e.g., Pre-elective changes snapshot"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCaptureModal(false)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={capturing}
                  className="px-4 py-2 bg-[#7b3b5a] hover:bg-[#682f4b] text-white font-semibold rounded-lg transition cursor-pointer disabled:opacity-60"
                >
                  {capturing ? "Capturing…" : "Confirm & Save Snapshot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableSnapshotsView;
