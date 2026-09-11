import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Check,
  X,
  Search,
  ExternalLink,
  Table2,
  BookOpen,
} from 'lucide-react';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import {
  getPendingLeaves,
  updateLeaveStatus,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getTeacherTimetableForLeave,
  type LeaveApplicationItem,
  type LeaveTypeItem,
  type TeacherTimetableResponse,
} from '../../lib/leave.api';

import { useAuth } from '../../context/useAuth';
import FacultyLeaves from '../Faculty/FacultyLeaves';

export const LeaveAdmin: React.FC = () => {
  const auth = useAuth();
  const userRole = auth.role || 'admin';
  const isAdmin = userRole === 'admin';

  // Read officeCode if officer logged in
  let tokenOfficeCode: string | null = null;
  if (auth.token) {
    try {
      const parts = auth.token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        tokenOfficeCode = payload.officeCode || null;
      }
    } catch {}
  }
  const officeCode = tokenOfficeCode || (typeof window !== 'undefined' ? localStorage.getItem('officeCode') : null);
  const isDean = userRole === 'officer' && (officeCode?.toUpperCase() === 'DEAN');
  const isHOD = userRole === 'coordinator' || userRole === 'chairperson';

  const [activeTab, setActiveTab] = useState<'pending' | 'types' | 'my-leaves'>('pending');

  // Pending Leaves State & Filters
  const [leaves, setLeaves] = useState<LeaveApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'pending' | 'history' | 'all'>('pending');
  const [roleFilter, setRoleFilter] = useState<'all' | 'faculty' | 'coordinator' | 'chairperson'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reviewing
  const [reviewingLeave, setReviewingLeave] = useState<LeaveApplicationItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewRoleTier, setReviewRoleTier] = useState<'hod' | 'dean'>('hod');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Teacher Timetable Inspection Modal State
  const [inspectingTimetableLeave, setInspectingTimetableLeave] = useState<LeaveApplicationItem | null>(null);
  const [teacherTimetableData, setTeacherTimetableData] = useState<TeacherTimetableResponse | null>(null);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  // Leave Types State
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<LeaveTypeItem | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typeDescription, setTypeDescription] = useState('');
  const [typeMaxDays, setTypeMaxDays] = useState('10');
  const [typeReqAttach, setTypeReqAttach] = useState(false);
  const [typeSubmitting, setTypeSubmitting] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await getPendingLeaves({ filter: filterMode, role: roleFilter });
      if (res.success) {
        setLeaves(res.leaves || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch pending leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await getLeaveTypes();
      if (res.success) {
        setLeaveTypes(res.leaveTypes || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch leave types:', err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [filterMode, roleFilter]);

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenTimetableModal = async (leave: LeaveApplicationItem) => {
    setInspectingTimetableLeave(leave);
    setLoadingTimetable(true);
    try {
      const data = await getTeacherTimetableForLeave(leave.id);
      setTeacherTimetableData(data);
    } catch (err: any) {
      console.error('Failed to fetch teacher timetable:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load teacher class timetable.',
      });
    } finally {
      setLoadingTimetable(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingLeave) return;
    setReviewSubmitting(true);
    try {
      const res = await updateLeaveStatus(reviewingLeave.id, {
        status: reviewAction,
        comments: reviewComments.trim() || undefined,
        asRole: isAdmin ? reviewRoleTier : undefined,
      });
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Leave request #${reviewingLeave.id} for ${reviewingLeave.applicantName} marked as ${reviewAction}!`,
        });
        setReviewingLeave(null);
        setReviewComments('');
        await fetchLeaves();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update leave status.',
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTypeSubmitting(true);
    try {
      if (editingType) {
        await updateLeaveType(editingType.id, {
          name: typeName.trim(),
          description: typeDescription.trim(),
          maxDays: Number(typeMaxDays),
          requiresAttachment: typeReqAttach,
        });
        setStatusMessage({ type: 'success', text: `Leave Type [${typeName}] updated successfully!` });
      } else {
        await createLeaveType({
          name: typeName.trim(),
          code: typeCode.trim().toUpperCase(),
          description: typeDescription.trim(),
          maxDays: Number(typeMaxDays),
          requiresAttachment: typeReqAttach,
        });
        setStatusMessage({ type: 'success', text: `New Leave Type [${typeName}] created successfully!` });
      }
      setShowTypeModal(false);
      setEditingType(null);
      setTypeName('');
      setTypeCode('');
      setTypeDescription('');
      setTypeMaxDays('10');
      setTypeReqAttach(false);
      await fetchTypes();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save leave type.' });
    } finally {
      setTypeSubmitting(false);
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this leave type?')) return;
    try {
      await deleteLeaveType(id);
      setStatusMessage({ type: 'success', text: 'Leave type deactivated.' });
      await fetchTypes();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to deactivate leave type.' });
    }
  };

  // Client-side search filtering
  const displayedLeaves = leaves.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.applicantName?.toLowerCase().includes(q) ||
      l.department?.toLowerCase().includes(q) ||
      l.leaveType?.name?.toLowerCase().includes(q) ||
      l.reason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <AdminSideNav activeTab="leaves" />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Governance & HR</span>
                <span className="text-xs text-slate-500 font-medium">Faculty & Staff Affairs</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-red-700" /> Leave Management & Approvals
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Two-tier institutional verification (Department Review → Institutional Approval) and leave policy quotas.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-200/70 p-1.5 rounded-xl self-start md:self-auto">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'pending' ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" /> Approval Requests ({leaves.length})
              </button>
              <button
                onClick={() => setActiveTab('my-leaves')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'my-leaves' ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" /> Apply & My Leaves
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('types')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'types' ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Leave Categories & Quotas
                </button>
              )}
            </div>
          </div>

          {/* Alert */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="text-xs md:text-sm font-semibold">{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-xs font-bold hover:underline opacity-80 hover:opacity-100 px-2 py-1 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: APPROVALS & LEAVE QUEUE */}
          {activeTab === 'pending' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
              {/* Filter controls toolbar */}
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Leave Requests & Queue</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Filter and review requests across departments and applicant roles</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search applicant or dept..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none w-48"
                    />
                  </div>

                  {/* Status mode dropdown */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setFilterMode('pending')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        filterMode === 'pending' ? 'bg-white text-red-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setFilterMode('history')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        filterMode === 'history' ? 'bg-white text-red-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      History
                    </button>
                    <button
                      onClick={() => setFilterMode('all')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        filterMode === 'all' ? 'bg-white text-red-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      All
                    </button>
                  </div>

                  {/* Role filter dropdown */}
                  <select
                    value={roleFilter}
                    onChange={(e: any) => setRoleFilter(e.target.value)}
                    className="p-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:ring-2 focus:ring-red-700 cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="faculty">Faculty</option>
                    <option value="coordinator">Coordinators</option>
                    <option value="chairperson">Chairpersons</option>
                  </select>

                  <button
                    onClick={fetchLeaves}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Role & Dept</th>
                      <th className="py-3 px-4">Leave Category</th>
                      <th className="py-3 px-4">Dates & Duration</th>
                      <th className="py-3 px-4">Reason & Attachment</th>
                      <th className="py-3 px-4">Approval Stage</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedLeaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{l.applicantName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">ID #{l.id}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="capitalize font-semibold text-slate-800">{l.applicantRole}</span>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {l.department || 'University Staff'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          <div>{l.leaveType?.name || 'Institutional Leave'}</div>
                          {l.leaveType?.code && (
                            <span className="text-[10px] font-mono text-slate-400">[{l.leaveType.code}]</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="font-medium">
                            {new Date(l.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} –{' '}
                            {new Date(l.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[11px] font-bold text-red-700">{l.totalDays} Day(s)</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          <p className="font-semibold text-slate-800">{l.reason}</p>
                          {l.remarks && (
                            <div className="mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                              <span className="font-bold text-slate-700">Applicant Remarks:</span> {l.remarks}
                            </div>
                          )}
                          {l.attachmentUrl && (
                            <a
                              href={l.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                            >
                              <ExternalLink className="w-3 h-3" /> View Doc
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {l.status === 'approved' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                                Approved (Final)
                              </span>
                            )}
                            {l.status === 'rejected' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-block">
                                Rejected
                              </span>
                            )}
                            {l.status === 'pending' && l.hodStatus === 'pending' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-block">
                                Awaiting HOD Review
                              </span>
                            )}
                            {l.status === 'pending' && l.hodStatus === 'approved' && l.deanStatus === 'pending' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 inline-block">
                                HOD Endorsed → Awaiting Dean
                              </span>
                            )}
                            {l.status === 'pending' && l.hodStatus === 'pending' && l.deanStatus === 'approved' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 inline-block">
                                Dean Endorsed → Awaiting HOD
                              </span>
                            )}

                            {/* Dual status details */}
                            {['faculty', 'coordinator', 'chairperson'].includes(l.applicantRole) && (
                              <div className="text-[10px] space-y-0.5 text-slate-500 pt-0.5">
                                <div>
                                  <span className="font-semibold">HOD:</span>{' '}
                                  <span className={l.hodStatus === 'approved' ? 'text-emerald-700 font-bold' : l.hodStatus === 'rejected' ? 'text-rose-700 font-bold' : 'text-amber-600'}>
                                    {l.hodStatus}
                                  </span>
                                  {l.hodComments && <span className="italic ml-1 text-slate-400">({l.hodComments})</span>}
                                </div>
                                <div>
                                  <span className="font-semibold">Dean:</span>{' '}
                                  <span className={l.deanStatus === 'approved' ? 'text-emerald-700 font-bold' : l.deanStatus === 'rejected' ? 'text-rose-700 font-bold' : 'text-amber-600'}>
                                    {l.deanStatus}
                                  </span>
                                  {l.deanComments && <span className="italic ml-1 text-slate-400">({l.deanComments})</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            {/* View Timetable Button for Teaching Staff */}
                            {['faculty', 'coordinator', 'chairperson'].includes(l.applicantRole) && (
                              <button
                                onClick={() => handleOpenTimetableModal(l)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
                                title="Inspect teacher scheduled lectures & classes"
                              >
                                <Table2 className="w-3.5 h-3.5 text-slate-500" /> View Timetable
                              </button>
                            )}

                            {(() => {
                              if (l.status !== 'pending') {
                                return <span className="text-xs text-slate-400 italic">Resolved</span>;
                              }
                              // HOD / Dept tier reviewer check
                              if (isHOD && l.hodStatus !== 'pending') {
                                return <span className="text-xs text-slate-400 italic">HOD Reviewed</span>;
                              }
                              // Dean tier reviewer check
                              if (isDean && l.deanStatus !== 'pending') {
                                return <span className="text-xs text-slate-400 italic">Dean Reviewed</span>;
                              }
                              return (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setReviewingLeave(l);
                                      setReviewAction('approved');
                                      setReviewRoleTier(isAdmin ? (l.hodStatus === 'approved' ? 'dean' : 'hod') : isDean ? 'dean' : 'hod');
                                      setReviewComments('Approved upon schedule verification.');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 shadow-sm cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReviewingLeave(l);
                                      setReviewAction('rejected');
                                      setReviewRoleTier(isAdmin ? (l.hodStatus === 'approved' ? 'dean' : 'hod') : isDean ? 'dean' : 'hod');
                                      setReviewComments('');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white inline-flex items-center gap-1 shadow-sm cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {displayedLeaves.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                          No leave applications match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LEAVE CATEGORIES */}
          {activeTab === 'types' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setEditingType(null);
                    setTypeName('');
                    setTypeCode('');
                    setTypeDescription('');
                    setTypeMaxDays('10');
                    setTypeReqAttach(false);
                    setShowTypeModal(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Leave Category
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leaveTypes.map((t) => (
                  <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-red-50 text-red-800 border border-red-100">
                        {t.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingType(t);
                            setTypeName(t.name);
                            setTypeCode(t.code);
                            setTypeDescription(t.description || '');
                            setTypeMaxDays(String(t.maxDays));
                            setTypeReqAttach(t.requiresAttachment);
                            setShowTypeModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Deactivate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description || 'Standard institutional leave category'}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Annual Entitlement:</span>
                      <span className="font-bold text-slate-900">{t.maxDays} Days</span>
                    </div>

                    {t.requiresAttachment && (
                      <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                        Document attachment mandatory
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: APPLY & MY LEAVES (For Coordinator, Chairperson, Admin, Faculty) */}
          {activeTab === 'my-leaves' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <FacultyLeaves isEmbedded={true} />
            </div>
          )}
        </div>
      </main>

      {/* REVIEW ACTION MODAL */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800">
                {reviewAction === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button
                onClick={() => setReviewingLeave(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <p><strong>Applicant:</strong> {reviewingLeave.applicantName} ({reviewingLeave.applicantRole})</p>
                <p><strong>Category:</strong> {reviewingLeave.leaveType?.name}</p>
                <p><strong>Duration:</strong> {reviewingLeave.totalDays} Day(s) ({reviewingLeave.fromDate} to {reviewingLeave.toDate})</p>
                <p><strong>Reason:</strong> {reviewingLeave.reason}</p>
                {reviewingLeave.remarks && (
                  <p className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900">
                    <strong>Applicant Remarks:</strong> {reviewingLeave.remarks}
                  </p>
                )}
                {reviewingLeave.attachmentUrl && (
                  <p>
                    <strong>Attachment:</strong>{' '}
                    <a
                      href={reviewingLeave.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline font-semibold"
                    >
                      Open Link
                    </a>
                  </p>
                )}
              </div>

              {/* Admin Tier Selector */}
              {isAdmin && (
                <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-1.5">
                  <label className="text-xs font-bold text-red-900">Acting As Approval Tier:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewRoleTier('hod')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        reviewRoleTier === 'hod' ? 'bg-red-700 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      HOD / Dept Level
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewRoleTier('dean')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        reviewRoleTier === 'dean' ? 'bg-purple-700 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Dean / School Level
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Dual Policy: Faculty/Coordinator/Chairperson leaves require endorsement from BOTH tiers.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700">
                  {reviewAction === 'approved' ? 'Approval Remarks & Conditions' : 'Rejection Reason / Remarks'}{' '}
                  {reviewAction === 'rejected' && <span className="text-red-600">*</span>}
                  {reviewAction === 'approved' && <span className="text-slate-400 font-normal">(Optional)</span>}
                </label>
                <textarea
                  required={reviewAction === 'rejected'}
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder={reviewAction === 'approved' ? 'Approved upon department timetable verification.' : 'State specific reason for rejection...'}
                  className="w-full mt-1.5 p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingLeave(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                    reviewAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {reviewSubmitting ? 'Submitting...' : reviewAction === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER TIMETABLE INSPECTION MODAL */}
      {inspectingTimetableLeave && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-red-700" /> Teacher Schedule & Class Timetable
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect lecture clashes during leave period: {inspectingTimetableLeave.fromDate} to {inspectingTimetableLeave.toDate} ({inspectingTimetableLeave.totalDays} days)
                </p>
              </div>
              <button
                onClick={() => {
                  setInspectingTimetableLeave(null);
                  setTeacherTimetableData(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingTimetable ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-red-700 opacity-80" />
                <p className="text-xs font-semibold">Loading teacher assignments & timetable mappings...</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[68vh] overflow-y-auto pr-1">
                {/* Teacher Profile Summary Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Teacher Name</span>
                    <span className="font-bold text-slate-900 text-sm">{teacherTimetableData?.teacher.name || inspectingTimetableLeave.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Designation / Role</span>
                    <span className="font-bold text-slate-800 capitalize">{teacherTimetableData?.teacher.role || inspectingTimetableLeave.applicantRole}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Department</span>
                    <span className="font-bold text-slate-800">{teacherTimetableData?.teacher.department || inspectingTimetableLeave.department || 'CSE'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Official Contact / ID</span>
                    <span className="font-mono text-slate-700 font-semibold">{teacherTimetableData?.teacher.email || 'N/A'}</span>
                  </div>
                </div>

                {/* Leave Remarks Banner */}
                {inspectingTimetableLeave.remarks && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-700" /> Applicant Notes / Lecture Handover Remarks:
                    </span>
                    <p className="text-slate-700 italic">{inspectingTimetableLeave.remarks}</p>
                  </div>
                )}

                {/* Assigned Classes Timetable Blocks */}
                {teacherTimetableData?.assignedClasses && teacherTimetableData.assignedClasses.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Assigned Teaching Batches ({teacherTimetableData.assignedClasses.length})
                    </h4>

                    {teacherTimetableData.assignedClasses.map((cls, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                        <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {cls.program} — {cls.specialization} ({cls.batch})
                            </span>
                            <span className="ml-2 text-[11px] font-mono text-slate-500">Sem {cls.semester || 'N/A'}</span>
                          </div>
                          {cls.subject && (
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-200 self-start sm:self-auto">
                              {cls.subject.code} — {cls.subject.name} ({cls.subject.type})
                            </span>
                          )}
                        </div>

                        {/* Timetable Weekly Grid */}
                        <div className="p-3 overflow-x-auto">
                          {cls.entries && Object.keys(cls.entries).length > 0 ? (
                            <table className="w-full text-center text-xs border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                  <th className="py-2 px-2 border-r border-slate-200 text-left w-16">Day</th>
                                  {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((slot) => (
                                    <th key={slot} className="py-2 px-2 border-r border-slate-200 last:border-r-0">
                                      {slot}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => {
                                  const daySlots = cls.entries[day] || {};
                                  return (
                                    <tr key={day} className="hover:bg-slate-50/50">
                                      <td className="py-2 px-2 border-r border-slate-200 font-bold text-slate-700 text-left bg-slate-50/50">
                                        {day}
                                      </td>
                                      {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((slot) => {
                                        const lectures = daySlots[slot] || [];
                                        const hasClass = lectures.length > 0;
                                        return (
                                          <td
                                            key={slot}
                                            className={`py-2 px-1 border-r border-slate-100 last:border-r-0 text-[11px] ${
                                              hasClass ? 'bg-red-50/70 font-semibold text-red-900' : 'text-slate-300'
                                            }`}
                                          >
                                            {hasClass ? (
                                              <div>
                                                {lectures.map((lec, lIdx) => (
                                                  <div key={lIdx} className="leading-tight">
                                                    <span className="font-bold">{lec.code}</span>
                                                    {lec.room && <span className="block text-[10px] text-slate-500 font-normal">[{lec.room}]</span>}
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              '—'
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : (
                            <div className="py-4 text-center text-xs text-slate-400 italic">
                              No active timetable entries scheduled in system for this class batch.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    <Table2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No active class teaching assignments found for this teacher in the system.
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Inspecting for leave approval compliance & class arrangement
              </span>
              <button
                type="button"
                onClick={() => {
                  setInspectingTimetableLeave(null);
                  setTeacherTimetableData(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-sm"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE TYPE CREATE/EDIT MODAL */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800">
                {editingType ? 'Edit Leave Category' : 'Add New Leave Category'}
              </h3>
              <button
                onClick={() => setShowTypeModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTypeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Category Name <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Sabbatical Leave"
                  className="w-full mt-1.5 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Unique Code (Uppercase) <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  required
                  disabled={!!editingType}
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SL"
                  className="w-full mt-1.5 p-2.5 border border-slate-300 rounded-xl text-xs font-mono uppercase text-slate-800 focus:ring-2 focus:ring-red-700 outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Annual Quota (Max Days) <span className="text-red-600">*</span></label>
                <input
                  type="number"
                  required
                  min="1"
                  value={typeMaxDays}
                  onChange={(e) => setTypeMaxDays(e.target.value)}
                  className="w-full mt-1.5 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={typeDescription}
                  onChange={(e) => setTypeDescription(e.target.value)}
                  placeholder="Purpose and conditions for this leave..."
                  className="w-full mt-1.5 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req-attach"
                  checked={typeReqAttach}
                  onChange={(e) => setTypeReqAttach(e.target.checked)}
                  className="w-4 h-4 text-red-700 rounded border-slate-300 focus:ring-red-700 cursor-pointer"
                />
                <label htmlFor="req-attach" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Requires Supporting Document Attachment
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={typeSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition-all shadow-md cursor-pointer"
                >
                  {typeSubmitting ? 'Saving...' : editingType ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveAdmin;
