import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  Unlock,
  Loader2,
  Inbox,
  Filter,
  ClipboardCheck,
  Edit3,
  Search,
  X,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  User as UserIcon,
} from 'lucide-react';
import type { RootState } from '../../context/app/store';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import { listSessions, unlockSession } from '../../lib/attendance.api';
import { getSessionRecords, upsertRecords } from '../../lib/teaching.api';
import RosterTable from '../../components/Attendance/RosterTable';
import type {
  AttendanceSession,
  SessionStatus,
  AttendanceStatus,
  RosterStudent,
  UpsertRecord,
} from '../../types/types';

const statusBadge = (s: SessionStatus) => {
  if (s === 'draft') return { label: 'Draft', className: 'bg-amber-100 text-amber-800' };
  if (s === 'submitted') return { label: 'Submitted', className: 'bg-blue-100 text-blue-800' };
  return { label: 'Locked', className: 'bg-emerald-100 text-emerald-800' };
};

const AdminAttendanceSessions = () => {
  const user = useSelector((s: RootState) => s.admin);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unlocking, setUnlocking] = useState<number | null>(null);
  const [reasonInputs, setReasonInputs] = useState<Record<number, string>>({});

  // Modal edit states
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus | undefined>>({});
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [savingRecords, setSavingRecords] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');

  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: SessionStatus } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await listSessions(params);
      if (res.success) setSessions(res.sessions);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load sessions.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const handleUnlock = async (id: number) => {
    const reason = (reasonInputs[id] || '').trim();
    if (reason.length < 3) {
      toast.error('Enter a reason of at least 3 characters.');
      return;
    }
    setUnlocking(id);
    try {
      const res = await unlockSession(id, reason);
      if (res.success) {
        toast.success('Session unlocked. Audit log written.');
        setReasonInputs((prev) => ({ ...prev, [id]: '' }));
        load();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Unlock failed.';
      toast.error(msg);
    } finally {
      setUnlocking(null);
    }
  };

  // Open modal to view & edit attendance records
  const openEditModal = async (session: AttendanceSession) => {
    setActiveSession(session);
    setModalLoading(true);
    setRosterSearch('');
    try {
      const res = await getSessionRecords(session.id);
      if (res.success) {
        setRoster(res.roster || []);
        const initStatuses: Record<number, AttendanceStatus | undefined> = {};
        const initRemarks: Record<number, string> = {};
        (res.roster || []).forEach((r) => {
          if (r.attendance?.status) {
            initStatuses[r.studentId] = r.attendance.status;
          }
          if (r.attendance?.remarks) {
            initRemarks[r.studentId] = r.attendance.remarks;
          }
        });
        setStatuses(initStatuses);
        setRemarks(initRemarks);
      } else {
        toast.error('Could not load session roster.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch attendance records.');
    } finally {
      setModalLoading(false);
    }
  };

  const closeEditModal = () => {
    setActiveSession(null);
    setRoster([]);
    setStatuses({});
    setRemarks({});
    setRosterSearch('');
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleRemarkChange = (studentId: number, remark: string) => {
    setRemarks((prev) => ({ ...prev, [studentId]: remark }));
  };

  const markAll = (status: AttendanceStatus) => {
    setStatuses((prev) => {
      const next = { ...prev };
      roster.forEach((s) => {
        next[s.studentId] = status;
      });
      return next;
    });
  };

  const clearAll = () => {
    setStatuses({});
    setRemarks({});
  };

  const handleSaveAttendance = async () => {
    if (!activeSession) return;
    setSavingRecords(true);
    try {
      const payload: UpsertRecord[] = [];
      roster.forEach((st) => {
        const stStatus = statuses[st.studentId];
        if (stStatus) {
          payload.push({
            studentId: st.studentId,
            status: stStatus,
            remarks: remarks[st.studentId]?.trim() || undefined,
          });
        }
      });

      const res = await upsertRecords(activeSession.id, payload);
      if (res.success) {
        toast.success(`Saved attendance for ${res.count} student(s).`);
        closeEditModal();
        load();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSavingRecords(false);
    }
  };

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => {
      return (
        s.subjectName?.toLowerCase().includes(q) ||
        s.subjectCode?.toLowerCase().includes(q) ||
        s.facultyName?.toLowerCase().includes(q) ||
        s.school?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q) ||
        s.program?.toLowerCase().includes(q) ||
        s.batch?.toLowerCase().includes(q) ||
        s.topic?.toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    });
  }, [sessions, searchQuery]);

  // Filtered roster for modal
  const filteredRoster = useMemo(() => {
    if (!rosterSearch.trim()) return roster;
    const q = rosterSearch.toLowerCase();
    return roster.filter(
      (r) =>
        r.fullName?.toLowerCase().includes(q) ||
        String(r.rollNo)?.toLowerCase().includes(q) ||
        String(r.enrollmentNo)?.toLowerCase().includes(q)
    );
  }, [roster, rosterSearch]);

  // Modal stats
  const modalStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let excused = 0;
    let unmarked = 0;
    roster.forEach((r) => {
      const st = statuses[r.studentId];
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'excused') excused++;
      else unmarked++;
    });
    return { present, absent, excused, unmarked, total: roster.length };
  }, [roster, statuses]);

  if (!isAdmin) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8f9fa] text-gray-600">
        Only admins can manage attendance sessions.
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab="admin-attendance" />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <div className="shrink-0 bg-white border-b border-[#d9d9d9] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="text-[#7b3b5a]" size={22} />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Attendance Sessions & Records
              </h1>
              <p className="text-xs text-gray-500">
                View sessions, inspect and edit student attendance records, or unlock locked sessions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, faculty, class..."
                className="text-xs pl-8 pr-3 py-1.5 border border-[#d9d9d9] rounded-md w-48 sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#7b3b5a]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SessionStatus | 'all')}
                className="text-xs px-2 py-1.5 border border-[#d9d9d9] rounded-md focus:outline-none focus:ring-1 focus:ring-[#7b3b5a]"
              >
                <option value="all">All Status</option>
                <option value="locked">Locked</option>
                <option value="submitted">Submitted</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0 p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-[#7b3b5a]" size={28} />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Inbox className="text-gray-400 mb-3" size={40} />
              <h2 className="text-base font-semibold text-gray-800">No sessions found</h2>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery
                  ? 'No sessions match your search query.'
                  : statusFilter === 'locked'
                  ? 'There are no locked sessions.'
                  : 'No attendance sessions recorded yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-6xl mx-auto">
              {filteredSessions.map((s) => {
                const b = statusBadge(s.status);
                const isLocked = s.status === 'locked';
                return (
                  <div
                    key={s.id}
                    className="bg-white border border-[#d9d9d9] rounded-xl p-4 sm:p-5 shadow-sm hover:shadow transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
                      {/* Left info */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full ${b.className} font-medium`}>
                            {b.label}
                          </span>
                          <span className="text-xs font-mono font-medium text-gray-600">
                            Session #{s.id}
                          </span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs font-semibold text-gray-700">{s.date}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-600 capitalize bg-gray-100 px-2 py-0.5 rounded">
                            {s.sessionType}
                          </span>
                          {s.recordCount !== undefined && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                              {s.recordCount} records marked
                            </span>
                          )}
                        </div>

                        {/* Subject info */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                            <BookOpen size={16} className="text-[#7b3b5a]" />
                            <span>{s.subjectName || 'Subject #' + s.subjectId}</span>
                            {s.subjectCode && (
                              <span className="text-xs font-mono font-normal text-gray-500">
                                ({s.subjectCode})
                              </span>
                            )}
                          </div>
                          {s.facultyName && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                              <UserIcon size={12} className="text-gray-400" />
                              <span>Faculty: {s.facultyName}</span>
                            </div>
                          )}
                        </div>

                        {/* Class metadata */}
                        <div className="text-xs text-gray-600">
                          <span className="font-medium text-gray-800">Class: </span>
                          {s.school} · {s.department} · {s.program} · {s.batch} · {s.specialization}
                          {s.subjectSemester ? ` · Sem ${s.subjectSemester}` : ''}
                        </div>

                        {s.topic && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium text-gray-700">Topic:</span> {s.topic}
                          </div>
                        )}

                        {s.unlockReason && (
                          <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
                            Previously unlocked: "{s.unlockReason}" on {s.unlockedAt}
                          </div>
                        )}
                      </div>

                      {/* Right actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                        <button
                          onClick={() => openEditModal(s)}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#7b3b5a] text-white hover:bg-[#652f49] transition-colors cursor-pointer"
                        >
                          <Edit3 size={14} />
                          View & Edit Records
                        </button>

                        {isLocked && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={reasonInputs[s.id] || ''}
                              onChange={(e) =>
                                setReasonInputs((p) => ({ ...p, [s.id]: e.target.value }))
                              }
                              maxLength={500}
                              placeholder="Reason to unlock…"
                              className="text-xs px-2.5 py-2 border border-[#d9d9d9] rounded-lg w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <button
                              onClick={() => handleUnlock(s.id)}
                              disabled={unlocking === s.id}
                              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                            >
                              {unlocking === s.id ? (
                                <Loader2 className="animate-spin" size={13} />
                              ) : (
                                <Unlock size={13} />
                              )}
                              Unlock
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* View & Edit Attendance Records Modal */}
      {activeSession && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#fafafa]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      statusBadge(activeSession.status).className
                    }`}
                  >
                    {statusBadge(activeSession.status).label}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                    Attendance Sheet · Session #{activeSession.id}
                  </h2>
                  <span className="text-xs text-gray-500">({activeSession.date})</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 truncate">
                  <span className="font-semibold text-gray-800">
                    {activeSession.subjectName || 'Subject #' + activeSession.subjectId}
                  </span>
                  {activeSession.facultyName ? ` · Faculty: ${activeSession.facultyName}` : ''}
                  {` · ${activeSession.school} · ${activeSession.department} · ${activeSession.program} · ${activeSession.batch} (${activeSession.specialization})`}
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors ml-2 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="animate-spin text-[#7b3b5a] mb-2" size={32} />
                  <p className="text-xs text-gray-500">Loading student roster and attendance...</p>
                </div>
              ) : (
                <>
                  {/* Summary & Quick Action Bar */}
                  <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Live Stats */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs">
                      <span className="font-semibold text-gray-700">
                        Total: <span className="text-gray-900 font-bold">{modalStats.total}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium border border-emerald-200">
                        <CheckCircle2 size={13} /> Present: {modalStats.present}
                      </span>
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded font-medium border border-red-200">
                        <XCircle size={13} /> Absent: {modalStats.absent}
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded font-medium border border-amber-200">
                        <AlertCircle size={13} /> Excused: {modalStats.excused}
                      </span>
                      {modalStats.unmarked > 0 && (
                        <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">
                          Unmarked: {modalStats.unmarked}
                        </span>
                      )}
                    </div>

                    {/* Batch Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => markAll('present')}
                        className="text-xs px-2.5 py-1.5 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        All Present
                      </button>
                      <button
                        type="button"
                        onClick={() => markAll('absent')}
                        className="text-xs px-2.5 py-1.5 rounded bg-red-600 text-white font-medium hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        All Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => markAll('excused')}
                        className="text-xs px-2.5 py-1.5 rounded bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors cursor-pointer"
                      >
                        All Excused
                      </button>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs px-2.5 py-1.5 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Search inside roster */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        placeholder="Search student by name or roll no..."
                        className="text-xs pl-8 pr-3 py-1.5 border border-[#d9d9d9] rounded-md w-full focus:outline-none focus:ring-1 focus:ring-[#7b3b5a]"
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      Showing {filteredRoster.length} of {roster.length} students
                    </span>
                  </div>

                  {/* Roster Table */}
                  <RosterTable
                    roster={filteredRoster}
                    statuses={statuses}
                    remarks={remarks}
                    onStatusChange={handleStatusChange}
                    onRemarkChange={handleRemarkChange}
                    disabled={savingRecords}
                  />
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {activeSession.status === 'locked' ? (
                  <span className="text-amber-700 font-medium">
                    Session is locked. Admin override enabled: changes will be saved directly.
                  </span>
                ) : (
                  'Mark or edit attendance records and click save to apply.'
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingRecords}
                  className="text-xs px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={savingRecords || modalLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-[#7b3b5a] text-white hover:bg-[#652f49] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {savingRecords ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
                  Save Attendance Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceSessions;

