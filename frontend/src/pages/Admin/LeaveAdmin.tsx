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
} from 'lucide-react';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import {
  getPendingLeaves,
  updateLeaveStatus,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  type LeaveApplicationItem,
  type LeaveTypeItem,
} from '../../lib/leave.api';

export const LeaveAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'types'>('pending');

  // Pending Leaves State
  const [leaves, setLeaves] = useState<LeaveApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingLeave, setReviewingLeave] = useState<LeaveApplicationItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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
      const res = await getPendingLeaves();
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
    fetchTypes();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingLeave) return;
    setReviewSubmitting(true);
    try {
      const res = await updateLeaveStatus(reviewingLeave.id, {
        status: reviewAction,
        comments: reviewComments,
      });
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Leave application #${reviewingLeave.id} for ${reviewingLeave.applicantName} marked ${reviewAction}!`,
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
          name: typeName,
          description: typeDescription,
          maxDays: Number(typeMaxDays),
          requiresAttachment: typeReqAttach,
        });
        setStatusMessage({ type: 'success', text: `Leave Type [${typeName}] updated successfully!` });
      } else {
        await createLeaveType({
          name: typeName,
          code: typeCode,
          description: typeDescription,
          maxDays: Number(typeMaxDays),
          requiresAttachment: typeReqAttach,
        });
        setStatusMessage({ type: 'success', text: `New Leave Type [${typeName}] added successfully!` });
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
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete.' });
    }
  };

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
              <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-red-700" /> Leave Management & Approvals
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Two-tier verification (HOD review → Dean approval) and leave quotas configuration.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-200/70 p-1.5 rounded-xl self-start md:self-auto">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'pending' ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" /> Pending Approvals ({leaves.length})
              </button>
              <button
                onClick={() => setActiveTab('types')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'types' ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-4 h-4" /> Leave Types & Quotas
              </button>
            </div>
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

          {/* TAB 1: PENDING LEAVES */}
          {activeTab === 'pending' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Pending Leave Requests</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Requests submitted by faculty and academic coordinators</p>
                </div>
                <button
                  onClick={fetchLeaves}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Role & Dept</th>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Dates & Duration</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{l.applicantName}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="capitalize">{l.applicantRole}</span>
                          <div className="text-[11px] text-slate-400">{l.department || 'University Staff'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{l.leaveType?.name || 'General Leave'}</td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <div>{new Date(l.fromDate).toLocaleDateString('en-IN')} – {new Date(l.toDate).toLocaleDateString('en-IN')}</div>
                          <div className="text-[11px] font-bold text-red-700">{l.totalDays} Day(s)</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{l.reason}</td>
                        <td className="py-3.5 px-4">
                          {l.hodStatus === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              Awaiting HOD
                            </span>
                          )}
                          {l.hodStatus === 'approved' && l.deanStatus === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                              Awaiting Dean
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setReviewingLeave(l);
                                setReviewAction('approved');
                                setReviewComments('Approved.');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setReviewingLeave(l);
                                setReviewAction('rejected');
                                setReviewComments('');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white inline-flex items-center gap-1 shadow-sm"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {leaves.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                          All leave applications reviewed. Zero pending tasks.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LEAVE TYPES */}
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Leave Type
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leaveTypes.map((t) => (
                  <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-red-50 text-red-800">
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
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Deactivate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description || 'Standard institutional leave'}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Annual Quota:</span>
                      <span className="font-bold text-slate-900">{t.maxDays} Days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* REVIEW ACTION MODAL */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {reviewAction === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button onClick={() => setReviewingLeave(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><strong>Applicant:</strong> {reviewingLeave.applicantName} ({reviewingLeave.applicantRole})</p>
                <p><strong>Type:</strong> {reviewingLeave.leaveType?.name}</p>
                <p><strong>Duration:</strong> {reviewingLeave.totalDays} Day(s) ({reviewingLeave.fromDate} to {reviewingLeave.toDate})</p>
                <p><strong>Reason:</strong> {reviewingLeave.reason}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Review Remarks / Conditions</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder={reviewAction === 'approved' ? 'Approved without reservations.' : 'Reason for rejection...'}
                  className="w-full mt-1 p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewingLeave(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
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

      {/* LEAVE TYPE CREATE/EDIT MODAL */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingType ? 'Edit Leave Type' : 'Add New Leave Type'}
              </h3>
              <button onClick={() => setShowTypeModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleTypeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Leave Type Name</label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Sabbatical Leave"
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Unique Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingType}
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SL"
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs font-mono uppercase text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Annual Quota (Max Days)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={typeMaxDays}
                  onChange={(e) => setTypeMaxDays(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Description</label>
                <textarea
                  rows={2}
                  value={typeDescription}
                  onChange={(e) => setTypeDescription(e.target.value)}
                  placeholder="Purpose and conditions for this leave..."
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req-attach"
                  checked={typeReqAttach}
                  onChange={(e) => setTypeReqAttach(e.target.checked)}
                  className="w-4 h-4 text-red-700 rounded border-slate-300 focus:ring-red-700"
                />
                <label htmlFor="req-attach" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Requires Supporting Document Attachment
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={typeSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition-all shadow-md"
                >
                  {typeSubmitting ? 'Saving...' : editingType ? 'Update Type' : 'Create Leave Type'}
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
