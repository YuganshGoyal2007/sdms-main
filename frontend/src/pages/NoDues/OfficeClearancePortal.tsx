import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BookOpen,
  Home,
  Trophy,
  GraduationCap,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Check,
  X,
  Building,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../context/app/store";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import {
  getOfficePortalData,
  actionOfficeClearance,
  bulkApproveOfficeClearance,
  type OfficeConfig,
  type OfficeStats,
  type OfficeQueueItem,
} from "../../lib/noDues.api";

const DESK_TABS = [
  { slug: "library", label: "Library", code: "LIB", icon: BookOpen },
  { slug: "hostel", label: "Hostel", code: "HST", icon: Home },
  { slug: "sports", label: "Sports", code: "SPT", icon: Trophy },
  { slug: "dean", label: "Dean", code: "DEAN", icon: GraduationCap },
  { slug: "ict", label: "ICT Office", code: "ICT", icon: Laptop },
];

const getOfficeIcon = (iconName: string) => {
  switch (iconName) {
    case "BookOpen":
      return BookOpen;
    case "Home":
      return Home;
    case "Trophy":
      return Trophy;
    case "GraduationCap":
      return GraduationCap;
    case "Laptop":
      return Laptop;
    default:
      return Building;
  }
};

const OfficeClearancePortal: React.FC = () => {
  const { officeCode = "library" } = useParams<{ officeCode: string }>();

  const user = useSelector((state: RootState) => state.admin);
  const [office, setOffice] = useState<OfficeConfig | null>(null);
  const [stats, setStats] = useState<OfficeStats | null>(null);
  const [queue, setQueue] = useState<OfficeQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  // Filter & Search states
  const [statusTab, setStatusTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Batch Selection
  const [selectedStageIds, setSelectedStageIds] = useState<number[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Single Action Modal
  const [modalStage, setModalStage] = useState<OfficeQueueItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [modalComments, setModalComments] = useState("");
  const [modalDues, setModalDues] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      setForbiddenError(null);
      setSelectedStageIds([]);
      const res = await getOfficePortalData(officeCode);
      if (res.success) {
        setOffice(res.office);
        setStats(res.stats);
        setQueue(res.queue || []);
      }
    } catch (err: any) {
      console.error("Failed to load desk data:", err);
      if (err.response?.status === 403) {
        setForbiddenError(
          err.response?.data?.message ||
            "Access Denied: You do not have authorization to view or action this departmental clearance desk."
        );
      } else {
        setFeedback({
          type: "error",
          text: err.response?.data?.message || "Failed to load departmental desk data.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [officeCode]);

  const handleOpenActionModal = (item: OfficeQueueItem, defaultAction: "approve" | "reject") => {
    setModalStage(item);
    setActionType(defaultAction);
    setModalDues(String(item.duesAmount || 0));
    setModalComments(
      defaultAction === "approve"
        ? office?.quickRemarks?.[0] || "Verified zero liability. Clearance granted."
        : "Dues or unreturned assets recorded."
    );
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalStage) return;

    setSubmitting(true);
    try {
      const res = await actionOfficeClearance(officeCode, modalStage.id, {
        action: actionType,
        comments: modalComments,
        duesAmount: actionType === "reject" ? Number(modalDues) : 0,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          text: `Clearance successfully ${actionType === "approve" ? "Approved" : "Rejected"} for student ${
            modalStage.application?.student?.rollNo || modalStage.application?.rollNo || ""
          }.`,
        });
        setModalStage(null);
        await fetchPortalData();
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Action failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedStageIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to bulk approve ${selectedStageIds.length} students?`)) {
      return;
    }

    setBulkSubmitting(true);
    try {
      const res = await bulkApproveOfficeClearance(officeCode, selectedStageIds);
      if (res.success) {
        setFeedback({
          type: "success",
          text: res.message || `Successfully bulk approved ${res.approvedCount} students.`,
        });
        setSelectedStageIds([]);
        await fetchPortalData();
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Bulk clearance failed.",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const filteredQueue = queue.filter((item) => {
    const roll = (item.application?.student?.rollNo || item.application?.rollNo || "").toLowerCase();
    const name = (item.application?.student?.fullName || "").toLowerCase();
    const enroll = (item.application?.student?.enrollmentNo || "").toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = !q || roll.includes(q) || name.includes(q) || enroll.includes(q);

    if (!matchesSearch) return false;

    if (statusTab === "pending") return item.status === "pending";
    if (statusTab === "approved") return item.status === "approved";
    if (statusTab === "rejected") return item.status === "rejected";
    return true;
  });

  const allFilteredPendingIds = filteredQueue
    .filter((it) => it.status === "pending" && it.isReady)
    .map((it) => it.id);

  const toggleSelectAll = () => {
    if (selectedStageIds.length === allFilteredPendingIds.length) {
      setSelectedStageIds([]);
    } else {
      setSelectedStageIds(allFilteredPendingIds);
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedStageIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isOfficer = user?.role === "officer";
  const myOfficerCode = String(user?.officeCode || "").toUpperCase();
  const officerSlugMap: Record<string, string> = {
    LIB: "library",
    HST: "hostel",
    SPT: "sports",
    DEAN: "dean",
    ICT: "ict",
  };
  const myAuthorizedSlug = officerSlugMap[myOfficerCode] || "library";

  const Icon = getOfficeIcon(office?.icon || "");

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab={"nodues"} />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 z-10">
          <Header />
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0">
          <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {/* Top Navigation & Office Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-3 px-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <Link to="/no-dues/portals" className="hover:text-[#7b3b5a] transition">
                  Clearance Desks
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-bold">{office?.name || officeCode}</span>
                {isOfficer && (
                  <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-[#7b3b5a]/10 text-[#7b3b5a] border border-[#7b3b5a]/20">
                    Officer Session ({myOfficerCode})
                  </span>
                )}
              </div>

              {/* Desk switcher tabs (hidden for officer sessions to maintain isolation) */}
              {!isOfficer && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {DESK_TABS.map((tab) => {
                    const isActive = tab.slug === officeCode;
                    const TabIcon = tab.icon;
                    return (
                      <Link
                        key={tab.slug}
                        to={`/no-dues/portal/${tab.slug}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                          isActive
                            ? "bg-[#7b3b5a] text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <TabIcon size={13} />
                        <span>{tab.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notification Banner */}
            {feedback && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium ${
                  feedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{feedback.text}</span>
                </div>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Forbidden Error Barrier or Active Desk */}
            {forbiddenError ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-6 my-8">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                  <ShieldAlert size={32} />
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                    Restricted Departmental Desk
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Access Denied: Department Authorization Required
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 max-w-lg mx-auto">
                    {forbiddenError}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 max-w-md mx-auto text-left space-y-1">
                  <p className="font-bold text-gray-700">Security Access Policy:</p>
                  <p>&bull; Department clearance desks require designated departmental officer credentials.</p>
                  <p>&bull; Cross-department desk access is strictly restricted by university policy.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    to={`/no-dues/portal/${myAuthorizedSlug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7b3b5a] text-white text-xs font-semibold hover:bg-[#682e4a] transition shadow-sm"
                  >
                    <ShieldCheck size={14} />
                    <span>Return to My Clearance Desk</span>
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    <span>Sign In to Another Account</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Office Header Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#7b3b5a]/10 text-[#7b3b5a] flex items-center justify-center shrink-0">
                        <Icon size={28} />
                      </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {office?.code} DESK
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Operational
                      </span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                      {office?.name || "Clearance Desk"}
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 max-w-2xl">
                      {office?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={fetchPortalData}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    <span>Sync Queue</span>
                  </button>
                </div>
              </div>

              {/* Departmental Checklist Guidelines */}
              {office?.checklists && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                    Clearance Verification Guidelines
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {office.checklists.map((chk, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200/60"
                      >
                        <Check size={14} className="text-[#7b3b5a] shrink-0 mt-0.5" />
                        <span>{chk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Pending Desk Review</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {loading ? "--" : stats?.pending ?? 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <Clock size={12} />
                  <span>{stats?.ready ?? 0} ready for immediate sign-off</span>
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Cleared Applications</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {loading ? "--" : stats?.approved ?? 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Zero liability verified</span>
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">With Outstanding Dues</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">
                  {loading ? "--" : stats?.rejected ?? 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>Action required / holds</span>
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Total Dues Levied</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  INR {(stats?.totalDues ?? 0).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>Departmental ledger</span>
                </p>
              </div>
            </div>

            {/* Main Content: Clearance Queue */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Toolbar & Filter Tabs */}
              <div className="p-4 md:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => setStatusTab("pending")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                      statusTab === "pending"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Pending Queue ({stats?.pending ?? 0})
                  </button>
                  <button
                    onClick={() => setStatusTab("approved")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                      statusTab === "approved"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Cleared ({stats?.approved ?? 0})
                  </button>
                  <button
                    onClick={() => setStatusTab("rejected")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                      statusTab === "rejected"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    With Dues ({stats?.rejected ?? 0})
                  </button>
                  <button
                    onClick={() => setStatusTab("all")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                      statusTab === "all"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All ({stats?.total ?? 0})
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 md:w-64">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter roll no or name..."
                      className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7b3b5a]/20 focus:border-[#7b3b5a] transition"
                    />
                  </div>

                  {statusTab === "pending" && selectedStageIds.length > 0 && (
                    <button
                      onClick={handleBulkApprove}
                      disabled={bulkSubmitting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <Check size={14} />
                      <span>Approve ({selectedStageIds.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Student Queue Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      {statusTab === "pending" && (
                        <th className="py-3 px-4 w-10">
                          <input
                            type="checkbox"
                            checked={
                              allFilteredPendingIds.length > 0 &&
                              selectedStageIds.length === allFilteredPendingIds.length
                            }
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-[#7b3b5a] focus:ring-[#7b3b5a] cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Program & Batch</th>
                      <th className="py-3 px-4">App ID</th>
                      <th className="py-3 px-4">Gate Status</th>
                      <th className="py-3 px-4">Dues (INR)</th>
                      <th className="py-3 px-4">Department Comments</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400">
                          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#7b3b5a]" />
                          <span>Loading clearance records...</span>
                        </td>
                      </tr>
                    ) : filteredQueue.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400">
                          <CheckCircle2 size={24} className="mx-auto mb-2 text-gray-300" />
                          <p className="font-semibold text-gray-600">No applications match the current criteria.</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {statusTab === "pending"
                              ? "All pending clearance requests for this department are up to date."
                              : "No records found in this category."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredQueue.map((item) => {
                        const student = item.application?.student;
                        const isSelected = selectedStageIds.includes(item.id);

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-gray-50/80 transition ${
                              isSelected ? "bg-[#7b3b5a]/5" : ""
                            }`}
                          >
                            {statusTab === "pending" && (
                              <td className="py-3 px-4">
                                <input
                                  type="checkbox"
                                  disabled={!item.isReady}
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(item.id)}
                                  className="rounded border-gray-300 text-[#7b3b5a] focus:ring-[#7b3b5a] cursor-pointer disabled:opacity-30"
                                />
                              </td>
                            )}

                            {/* Student Profile Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {student?.photo ? (
                                  <img
                                    src={student.photo}
                                    alt={student.fullName}
                                    className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center border border-gray-200 shrink-0">
                                    {(student?.fullName || student?.rollNo || item.application?.rollNo || "?")[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-gray-900 text-xs">
                                    {student?.fullName || "Student"}
                                  </p>
                                  <p className="text-[11px] font-mono text-gray-500">
                                    {student?.rollNo || item.application?.rollNo || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Program & Batch */}
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-800">
                                {student?.program || "B.Tech"} - {student?.specialization || "General"}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {student?.batch || "2023-27"} ({student?.school || "SOICT"})
                              </p>
                            </td>

                            {/* Display ID */}
                            <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                              {item.application?.displayId}
                            </td>

                            {/* Gate Status Badge */}
                            <td className="py-3 px-4">
                              {item.status === "approved" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={12} />
                                  <span>Cleared</span>
                                </span>
                              ) : item.status === "rejected" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertCircle size={12} />
                                  <span>Dues / Action</span>
                                </span>
                              ) : item.isReady ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock size={12} />
                                  <span>Ready for Review</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                                  <span>Locked (Prereq)</span>
                                </span>
                              )}
                            </td>

                            {/* Dues */}
                            <td className="py-3 px-4 font-mono font-semibold">
                              {item.duesAmount > 0 ? (
                                <span className="text-rose-600">
                                  INR {item.duesAmount.toLocaleString("en-IN")}
                                </span>
                              ) : (
                                <span className="text-gray-400">0.00</span>
                              )}
                            </td>

                            {/* Comments */}
                            <td className="py-3 px-4 max-w-xs text-gray-600 truncate">
                              {item.comments || (
                                <span className="text-gray-400 italic">No notes recorded</span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenActionModal(item, "approve")}
                                  disabled={item.status === "approved" || !item.isReady}
                                  className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-30"
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={() => handleOpenActionModal(item, "reject")}
                                  disabled={!item.isReady}
                                  className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition cursor-pointer disabled:opacity-30"
                                >
                                  Hold / Dues
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </>
            )}
          </div>
        </main>

        <div className="shrink-0 z-10 border-t border-[#d9d9d9] bg-[#f8f9fa]">
          <Footer />
        </div>
      </div>

      {/* Action Clearance Modal */}
      {modalStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                  {office?.name} Clearance Sign-Off
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  {modalStage.application?.student?.fullName || "Student Clearance"} (
                  {modalStage.application?.student?.rollNo || modalStage.application?.rollNo})
                </h3>
              </div>
              <button
                onClick={() => setModalStage(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              {/* Action type switcher */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">
                  Clearance Verdict
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType("approve");
                      setModalDues("0");
                      if (office?.quickRemarks?.[0]) setModalComments(office.quickRemarks[0]);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      actionType === "approve"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Approve Clearance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType("reject");
                      if (office?.quickRemarks?.[2]) setModalComments(office.quickRemarks[2]);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      actionType === "reject"
                        ? "bg-rose-50 border-rose-300 text-rose-800 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <AlertCircle size={16} className="text-rose-600" />
                    <span>Hold / Impose Dues</span>
                  </button>
                </div>
              </div>

              {/* Dues penalty amount (if rejecting) */}
              {actionType === "reject" && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Outstanding Dues Amount (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={modalDues}
                    onChange={(e) => setModalDues(e.target.value)}
                    placeholder="Enter outstanding penalty/fee"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7b3b5a]/20 focus:border-[#7b3b5a]"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Student must clear this penalty before this gate can be approved.
                  </p>
                </div>
              )}

              {/* Quick remarks suggestions */}
              {office?.quickRemarks && office.quickRemarks.length > 0 && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Standard Remarks Template
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {office.quickRemarks.map((remark, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setModalComments(remark)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-[11px] transition text-left cursor-pointer"
                      >
                        {remark}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments textarea */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Department Remarks & Notes
                </label>
                <textarea
                  rows={3}
                  value={modalComments}
                  onChange={(e) => setModalComments(e.target.value)}
                  placeholder="Provide explicit notes on verification or items checked..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7b3b5a]/20 focus:border-[#7b3b5a]"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalStage(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 rounded-lg text-white font-semibold transition cursor-pointer shadow-sm disabled:opacity-50 ${
                    actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submitting ? "Processing..." : `Confirm ${actionType === "approve" ? "Approval" : "Rejection"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeClearancePortal;

