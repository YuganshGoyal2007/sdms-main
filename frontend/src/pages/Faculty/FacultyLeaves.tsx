import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  RefreshCw,
  ArrowLeft,
  Paperclip,
  XCircle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getMyLeaves,
  getMyLeaveBalances,
  applyLeave,
  type LeaveApplicationItem,
  type LeaveBalanceItem,
} from '../../lib/leave.api';

interface FacultyLeavesProps {
  isEmbedded?: boolean;
}

export const FacultyLeaves: React.FC<FacultyLeavesProps> = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<LeaveApplicationItem[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state for history table
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      setLoading(true);
      const [leavesRes, balRes] = await Promise.all([getMyLeaves(), getMyLeaveBalances()]);
      if (leavesRes.success) setLeaves(leavesRes.leaves || []);
      if (balRes.success) setBalances(balRes.balances || []);
    } catch (err: any) {
      console.error('Failed to load faculty leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateDays = () => {
    if (!fromDate || !toDate) return 0;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || to < from) return 0;
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const selectedTypeObj = balances.find((b) => b.id === Number(selectedTypeId));
  const daysCount = calculateDays();
  const exceedsBalance = selectedTypeObj ? daysCount > selectedTypeObj.remainingDays : false;

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId) {
      setStatusMessage({ type: 'error', text: 'Please select a leave category.' });
      return;
    }
    if (!fromDate || !toDate) {
      setStatusMessage({ type: 'error', text: 'Please provide both From and To dates.' });
      return;
    }
    if (toDate < fromDate) {
      setStatusMessage({ type: 'error', text: 'End date cannot be earlier than start date.' });
      return;
    }
    if (daysCount <= 0) {
      setStatusMessage({ type: 'error', text: 'Leave duration must be at least 1 day.' });
      return;
    }
    if (selectedTypeObj && daysCount > selectedTypeObj.remainingDays) {
      setStatusMessage({
        type: 'error',
        text: `Requested ${daysCount} day(s), but only ${selectedTypeObj.remainingDays} day(s) remain for ${selectedTypeObj.name}.`,
      });
      return;
    }
    if (selectedTypeObj?.requiresAttachment && !attachmentUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: `${selectedTypeObj.name} requires a supporting document URL / proof link.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await applyLeave({
        leaveTypeId: Number(selectedTypeId),
        fromDate,
        toDate,
        reason: reason.trim(),
        remarks: remarks.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Leave application submitted successfully for institutional review!' });
        setShowApplyModal(false);
        setSelectedTypeId('');
        setFromDate('');
        setToDate('');
        setReason('');
        setRemarks('');
        setAttachmentUrl('');
        await loadData();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit leave request.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter leaves
  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter === 'all') return true;
    return l.status === statusFilter;
  });

  return (
    <div className={isEmbedded ? "space-y-6 font-sans" : "min-h-screen bg-slate-50 p-4 md:p-8 font-sans"}>
      <div className={isEmbedded ? "w-full space-y-6" : "max-w-6xl mx-auto space-y-6"}>
        {/* Top bar */}
        <div className="flex items-center justify-between">
          {!isEmbedded ? (
            <button
              onClick={() => navigate(-1)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Leave Portal</span>
              <span className="text-xs text-slate-500 font-medium">Faculty &amp; Staff Leave Portal</span>
            </div>
          )}
          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 shadow-xs transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Alert */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
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
              className="text-xs font-bold hover:underline opacity-80 hover:opacity-100 px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Header */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Leave Portal</span>
              <span className="text-xs text-slate-500 font-medium">Academic Year 2025-2026</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-red-700" /> My Leaves & Quotas
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Check annual entitlements, submit leave applications, and track multi-tier institutional approval progress.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedTypeId('');
              setFromDate('');
              setToDate('');
              setReason('');
              setRemarks('');
              setAttachmentUrl('');
              setShowApplyModal(true);
            }}
            className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-red-700 hover:bg-red-800 text-white transition-all shadow-md flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Apply for Leave
          </button>
        </div>

        {/* Leave Quota Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Leave Balance Breakdown</h3>
            <span className="text-[11px] text-slate-400 font-medium">{balances.length} Categories Available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {balances.map((b) => (
              <div
                key={b.id}
                className={`bg-white p-5 rounded-2xl border transition-all duration-200 shadow-sm space-y-3 ${
                  b.remainingDays > 0 ? 'border-slate-200 hover:border-red-300' : 'border-slate-200 opacity-70 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-100">
                    {b.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Annual: {b.maxDays}d</span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                  {b.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{b.description}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className={`text-2xl font-black ${b.remainingDays > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {b.remainingDays}
                    </span>
                    <span className="text-xs text-slate-400 ml-1 font-medium">days left</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{b.usedDays} used</span>
                </div>

                {b.requiresAttachment && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-100">
                    <Paperclip className="w-3 h-3 shrink-0" /> Supporting doc required
                  </div>
                )}
              </div>
            ))}
            {balances.length === 0 && !loading && (
              <div className="col-span-full py-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No leave categories configured by administration.
              </div>
            )}
          </div>
        </div>

        {/* Past Leaves Table with Status Filters */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">My Leave Applications History</h3>
              <p className="text-xs text-slate-400 mt-0.5">Status of your pending, approved, and finalized leave requests</p>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filterVal) => (
                <button
                  key={filterVal}
                  onClick={() => setStatusFilter(filterVal)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    statusFilter === filterVal ? 'bg-white text-red-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {filterVal}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5">Leave Category</th>
                  <th className="py-3.5 px-5">Duration & Dates</th>
                  <th className="py-3.5 px-5">Days</th>
                  <th className="py-3.5 px-5">Reason</th>
                  <th className="py-3.5 px-5">HOD / Coord Review</th>
                  <th className="py-3.5 px-5">Dean / Admin Final</th>
                  <th className="py-3.5 px-5">Overall Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      <div>{l.leaveType?.name || 'Institutional Leave'}</div>
                      {l.leaveType?.code && (
                        <span className="text-[10px] font-mono text-slate-400">[{l.leaveType.code}]</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">
                      <div className="font-medium">
                        {new Date(l.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} –{' '}
                        {new Date(l.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Submitted {new Date(l.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-red-700">{l.totalDays} Day(s)</td>
                    <td className="py-3.5 px-5 text-slate-600 max-w-xs">
                      <p className="font-medium text-slate-800">{l.reason}</p>
                      {l.remarks && (
                        <div className="mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                          <span className="font-bold text-slate-700">My Remarks:</span> {l.remarks}
                        </div>
                      )}
                      {l.attachmentUrl && (
                        <a
                          href={l.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" /> View Attachment
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {l.hodStatus === 'approved' && (
                        <div>
                          <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Endorsed
                          </span>
                          {l.hodComments && <p className="text-[10px] text-slate-400 italic truncate">{l.hodComments}</p>}
                        </div>
                      )}
                      {l.hodStatus === 'rejected' && (
                        <div>
                          <span className="text-xs font-bold text-rose-700 inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Declined
                          </span>
                          {l.hodComments && <p className="text-[10px] text-rose-500 italic truncate">{l.hodComments}</p>}
                        </div>
                      )}
                      {l.hodStatus === 'pending' && (
                        <span className="text-xs font-medium text-amber-700 inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3" /> Under Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {l.deanStatus === 'approved' && (
                        <div>
                          <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                          {l.deanComments && <p className="text-[10px] text-slate-400 italic truncate">{l.deanComments}</p>}
                        </div>
                      )}
                      {l.deanStatus === 'rejected' && (
                        <div>
                          <span className="text-xs font-bold text-rose-700 inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                          {l.deanComments && <p className="text-[10px] text-rose-500 italic truncate">{l.deanComments}</p>}
                        </div>
                      )}
                      {l.deanStatus === 'pending' && (
                        <span className="text-xs font-medium text-slate-500 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Awaiting Stage 2
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {l.status === 'approved' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Granted
                        </span>
                      )}
                      {l.status === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Rejected
                        </span>
                      )}
                      {l.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLeaves.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Info className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      {statusFilter === 'all'
                        ? 'No leave applications submitted yet.'
                        : `No ${statusFilter} leave applications found.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* APPLY LEAVE MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-700" /> Apply for Leave
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Submit request with automated entitlement verification</p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              {/* Leave Type Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Leave Category <span className="text-red-600">*</span></span>
                  {selectedTypeObj && (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Available: {selectedTypeObj.remainingDays} of {selectedTypeObj.maxDays} days
                    </span>
                  )}
                </label>
                <select
                  required
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full mt-1.5 p-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-red-700 focus:border-red-700 outline-none bg-white"
                >
                  <option value="">-- Choose Leave Category --</option>
                  {balances.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.remainingDays <= 0}>
                      {b.name} — {b.remainingDays} days available {b.remainingDays <= 0 ? '(Exhausted)' : ''}
                    </option>
                  ))}
                </select>
                {selectedTypeObj?.description && (
                  <p className="text-[11px] text-slate-400 mt-1 italic">{selectedTypeObj.description}</p>
                )}
              </div>

              {/* Date Pickers with common sense bounds */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    From Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      if (toDate && e.target.value > toDate) {
                        setToDate(e.target.value);
                      }
                    }}
                    className="w-full mt-1.5 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 focus:border-red-700 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    To Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={fromDate || todayStr}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full mt-1.5 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 focus:border-red-700 outline-none"
                  />
                </div>
              </div>

              {/* Real-time Calculation Badge */}
              {daysCount > 0 && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    exceedsBalance
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-red-50 border-red-100 text-red-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Requested Duration:
                  </span>
                  <span>
                    {daysCount} Day(s)
                    {exceedsBalance && selectedTypeObj && (
                      <span className="text-rose-600 ml-1.5 font-normal">
                        (Exceeds {selectedTypeObj.remainingDays} days available)
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-slate-700">
                  Reason for Leave <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the explicit purpose of your leave (e.g. medical emergency, academic conference, personal affairs)..."
                  className="w-full mt-1.5 p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 focus:border-red-700 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Applicant Remark Box Section */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Applicant Remarks / Handover Notes</span>
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add specific remarks, lecture replacement/handover details, or contact notes for HOD and Dean..."
                  className="w-full mt-1.5 p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 focus:border-red-700 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Supporting Document Attachment */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>
                    Supporting Document / Certificate Link{' '}
                    {selectedTypeObj?.requiresAttachment ? (
                      <span className="text-red-600 font-bold">(Required for this leave type)</span>
                    ) : (
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    )}
                  </span>
                </label>
                <input
                  type="url"
                  required={selectedTypeObj?.requiresAttachment}
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://... (medical certificate, travel ticket, or conference invitation URL)"
                  className="w-full mt-1.5 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 focus:border-red-700 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || daysCount <= 0 || exceedsBalance}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyLeaves;
