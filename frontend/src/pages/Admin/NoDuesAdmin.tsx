import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Filter,
  Check,
  X,
} from 'lucide-react';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import { getPendingClearances, actionClearanceStage } from '../../lib/noDues.api';

export const NoDuesAdmin: React.FC = () => {
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gateFilter, setGateFilter] = useState('ALL');

  // Action Modal State
  const [selectedStage, setSelectedStage] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const [duesAmount, setDuesAmount] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchClearances = async () => {
    try {
      setLoading(true);
      const res = await getPendingClearances();
      if (res.success) {
        setStages(res.pendingClearances || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch pending clearances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClearances();
  }, []);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage) return;
    setSubmitting(true);
    try {
      const res = await actionClearanceStage(selectedStage.id, {
        action: actionType,
        comments: comments || (actionType === 'approve' ? 'All dues verified and cleared.' : 'Dues outstanding.'),
        duesAmount: actionType === 'reject' ? Number(duesAmount) : 0,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Stage [${selectedStage.stageName}] for student ${selectedStage.application?.rollNo} successfully ${
            actionType === 'approve' ? 'Approved' : 'Rejected'
          }!`,
        });
        setSelectedStage(null);
        setComments('');
        setDuesAmount('0');
        await fetchClearances();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit clearance action.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStages = stages.filter((st) => {
    const student = st.application?.student;
    const matchSearch =
      !searchQuery ||
      (st.application?.rollNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.application?.displayId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchGate =
      gateFilter === 'ALL' ||
      st.stageCode.toUpperCase() === gateFilter.toUpperCase();

    return matchSearch && matchGate;
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <AdminSideNav activeTab="nodues" />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Clearance Authority</span>
                <span className="text-xs text-slate-500 font-medium">Multi-stage Governance</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-red-700" /> No-Dues Approval & Verification Queue
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Review and certify student clearance requests across School Office, HOD, Dean, Central Library, Hostel, and Accounts gates.
              </p>
            </div>

            <button
              onClick={fetchClearances}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-sm transition-all self-start md:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
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

          {/* Quick Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search Roll No, Name, or App ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              {[
                { label: 'All Gates', value: 'ALL' },
                { label: 'School Office', value: 'SCHOOL_OFFICE' },
                { label: 'HOD', value: 'HOD' },
                { label: 'Dean', value: 'DEAN' },
                { label: 'Library', value: 'LIB' },
                { label: 'Hostel', value: 'HST' },
                { label: 'Accounts', value: 'ACC' },
              ].map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGateFilter(g.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    gateFilter === g.value ? 'bg-red-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pending Stages List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Clearance Verification Tasks ({filteredStages.length})</h3>
                <p className="text-xs text-slate-400 mt-0.5">Students awaiting sign-off from your department or gate</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Application ID</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Program & Batch</th>
                    <th className="py-3 px-4">Gate / Authority</th>
                    <th className="py-3 px-4">Reason / Remarks</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStages.map((st) => {
                    const app = st.application;
                    const student = app?.student;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-red-700">{app?.displayId || '—'}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{student?.fullName || app?.rollNo}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{app?.rollNo}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{app?.program || '—'}</div>
                          <div className="text-[11px] text-slate-400">{app?.batch} ({app?.department})</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                            {st.stageName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{app?.remarks || 'Clearance requested'}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {app?.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedStage(st);
                                setActionType('approve');
                                setComments('Verified: Zero outstanding liabilities or dues.');
                                setDuesAmount('0');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all inline-flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve (Nil)
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStage(st);
                                setActionType('reject');
                                setComments('');
                                setDuesAmount('1000');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all inline-flex items-center gap-1 shadow-sm"
                            >
                              <X className="w-3.5 h-3.5" /> Reject (Dues)
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStages.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                        No pending clearance tasks in your review queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ACTION REVIEW MODAL */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {actionType === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                )}
                {actionType === 'approve' ? 'Approve No-Dues Clearance' : 'Report Outstanding Dues'}
              </h3>
              <button onClick={() => setSelectedStage(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><strong>Student:</strong> {selectedStage.application?.student?.fullName} ({selectedStage.application?.rollNo})</p>
                <p><strong>Program:</strong> {selectedStage.application?.program} — {selectedStage.application?.batch}</p>
                <p><strong>Gate Authority:</strong> {selectedStage.stageName}</p>
              </div>

              {actionType === 'reject' && (
                <div>
                  <label className="text-xs font-semibold text-slate-600">Outstanding Due Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={duesAmount}
                    onChange={(e) => setDuesAmount(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="e.g. 1500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">The student will be prompted to clear this amount or provide receipt proof.</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  {actionType === 'approve' ? 'Approval Note / Verification Attestation' : 'Rejection Reason / Dues Details'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    actionType === 'approve'
                      ? 'Verified zero liabilities or missing equipment.'
                      : 'e.g. 2 books overdue from Bodhisattva library: Operating Systems Concepts.'
                  }
                  className="w-full mt-1 p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStage(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-2 ${
                    actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : actionType === 'approve' ? 'Certify Nil Dues' : 'Submit Dues Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoDuesAdmin;
