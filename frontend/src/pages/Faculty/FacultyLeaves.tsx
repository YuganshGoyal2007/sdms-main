import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getMyLeaves,
  getMyLeaveBalances,
  applyLeave,
  type LeaveApplicationItem,
  type LeaveBalanceItem,
} from '../../lib/leave.api';

export const FacultyLeaves: React.FC = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<LeaveApplicationItem[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId) return;
    setSubmitting(true);
    try {
      const res = await applyLeave({
        leaveTypeId: Number(selectedTypeId),
        fromDate,
        toDate,
        reason,
        attachmentUrl: attachmentUrl || undefined,
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Leave application submitted successfully for HOD review!' });
        setShowApplyModal(false);
        setSelectedTypeId('');
        setFromDate('');
        setToDate('');
        setReason('');
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

  const daysCount = calculateDays();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/50 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Alert */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between shadow-sm ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
              <span className="text-sm font-medium">{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-xs font-semibold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Header */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Faculty & Staff Portal</span>
              <span className="text-xs text-slate-500 font-medium">Academic Year 2025-2026</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-red-700" /> My Leaves & Quotas
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Check annual entitlements, submit leave applications, and track 2-tier approval progress.
            </p>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-red-700 hover:bg-red-800 text-white transition-all shadow-md flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Apply for Leave
          </button>
        </div>

        {/* Leave Quota Cards */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Leave Balance Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {balances.map((b) => (
              <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-800">
                    {b.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Annual: {b.maxDays}d</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                <div className="pt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-emerald-600">{b.remainingDays}</span>
                    <span className="text-xs text-slate-400 ml-1">left</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{b.usedDays} used</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Leaves Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">My Leave Applications History</h3>
            <p className="text-xs text-slate-400 mt-0.5">Status of your pending and finalized leave requests</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Leave Category</th>
                  <th className="py-3 px-5">Duration</th>
                  <th className="py-3 px-5">Days</th>
                  <th className="py-3 px-5">Reason</th>
                  <th className="py-3 px-5">HOD Status</th>
                  <th className="py-3 px-5">Dean Status</th>
                  <th className="py-3 px-5">Overall Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">{l.leaveType?.name || 'Leave'}</td>
                    <td className="py-3.5 px-5 text-slate-700">
                      {new Date(l.fromDate).toLocaleDateString('en-IN')} – {new Date(l.toDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-red-700">{l.totalDays} Day(s)</td>
                    <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate">{l.reason}</td>
                    <td className="py-3.5 px-5">
                      {l.hodStatus === 'approved' && (
                        <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      )}
                      {l.hodStatus === 'rejected' && (
                        <span className="text-xs font-bold text-rose-700 inline-flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      )}
                      {l.hodStatus === 'pending' && (
                        <span className="text-xs font-medium text-amber-700 inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Under Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {l.deanStatus === 'approved' && (
                        <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      )}
                      {l.deanStatus === 'rejected' && (
                        <span className="text-xs font-bold text-rose-700 inline-flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      )}
                      {l.deanStatus === 'pending' && (
                        <span className="text-xs font-medium text-slate-500 inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Awaiting Dean
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {l.status === 'approved' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Granted
                        </span>
                      )}
                      {l.status === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          Rejected
                        </span>
                      )}
                      {l.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No leave applications submitted yet.
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-700" /> Apply for Leave
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Leave Category</label>
                <select
                  required
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                >
                  <option value="">Select Leave Category</option>
                  {balances.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.remainingDays <= 0}>
                      {b.name} ({b.remainingDays} days available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">From Date</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">To Date</label>
                  <input
                    type="date"
                    required
                    min={fromDate}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                  />
                </div>
              </div>

              {daysCount > 0 && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between text-xs font-bold text-red-900">
                  <span>Requested Duration:</span>
                  <span>{daysCount} Day(s)</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600">Reason for Leave</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the purpose of your leave..."
                  className="w-full mt-1 p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Attachment / Certificate Link (Optional)</label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://... (medical certificate or conference invitation)"
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || daysCount <= 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition-all shadow-md flex items-center gap-2"
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
