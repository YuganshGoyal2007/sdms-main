import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Users,
} from 'lucide-react';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import {
  getAllFeesAdmin,
  assessStudentFee,
  updateFeeRecord,
  type FeeRecordItem,
  type AdminFeesMetrics,
} from '../../lib/fees.api';

export const FeesAdmin: React.FC = () => {
  const [records, setRecords] = useState<(FeeRecordItem & { Student?: any })[]>([]);
  const [metrics, setMetrics] = useState<AdminFeesMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [showAssessModal, setShowAssessModal] = useState(false);
  const [assessRollNo, setAssessRollNo] = useState('');
  const [assessType, setAssessType] = useState('Tuition Fee');
  const [assessAmount, setAssessAmount] = useState('60000');
  const [assessSemester, setAssessSemester] = useState('5');
  const [assessDueDate, setAssessDueDate] = useState('');
  const [assessRemarks, setAssessRemarks] = useState('');
  const [assessSubmitting, setAssessSubmitting] = useState(false);

  // Edit / Record Payment Modal
  const [editingRecord, setEditingRecord] = useState<(FeeRecordItem & { Student?: any }) | null>(null);
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editDueAmount, setEditDueAmount] = useState('');
  const [editStatus, setEditStatus] = useState('paid');
  const [editRemarks, setEditRemarks] = useState('');
  const [editTxn, setEditTxn] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await getAllFeesAdmin({
        page,
        limit,
        query: searchQuery || undefined,
        status: statusFilter,
        semester: semesterFilter,
        feeType: typeFilter,
      });

      if (res.success) {
        setRecords(res.data || []);
        setMetrics(res.metrics);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalRecords(res.pagination.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch admin fee records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, statusFilter, semesterFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleAssessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssessSubmitting(true);
    try {
      const res = await assessStudentFee({
        rollNo: assessRollNo,
        feeType: assessType,
        amount: Number(assessAmount),
        semester: Number(assessSemester),
        dueDate: assessDueDate || undefined,
        remarks: assessRemarks || undefined,
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: `Fee assessed for student ${assessRollNo} successfully!` });
        setShowAssessModal(false);
        setAssessRollNo('');
        setAssessAmount('60000');
        setAssessRemarks('');
        await fetchRecords();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to assess fee' });
    } finally {
      setAssessSubmitting(false);
    }
  };

  const openEditModal = (rec: FeeRecordItem & { Student?: any }) => {
    setEditingRecord(rec);
    setEditPaidAmount(String(rec.paidAmount));
    setEditDueAmount(String(rec.dueAmount));
    setEditStatus(rec.status);
    setEditRemarks(rec.remarks || '');
    setEditTxn(rec.transactionRef || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setEditSubmitting(true);
    try {
      const res = await updateFeeRecord(editingRecord.id, {
        paidAmount: Number(editPaidAmount),
        dueAmount: Number(editDueAmount),
        status: editStatus,
        remarks: editRemarks,
        transactionRef: editTxn,
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: `Fee record #${editingRecord.id} updated successfully!` });
        setEditingRecord(null);
        await fetchRecords();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to update fee record' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    window.open('http://localhost:5000/fees/admin/export', '_blank');
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800">
      <AdminSideNav activeTab="fees" />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Financial Management</span>
              <span className="text-xs text-slate-500 font-medium">Campus Accounts & Billing</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Landmark className="w-6 h-6 text-red-700" /> Student Fees & Financial Ledger
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Institutional fee assessments, payment tracking, and ledger reconciliation across all 1,920 students.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border border-slate-200"
            >
              <Download className="w-4 h-4 text-slate-600" /> Export CSV
            </button>
            <button
              onClick={() => setShowAssessModal(true)}
              className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Assess New Fee
            </button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Assessed</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">₹{metrics.totalAssessed.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-400 mt-1">{totalRecords} fee items billed</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collected</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2">₹{metrics.totalCollected.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                {metrics.totalAssessed > 0 ? Math.round((metrics.totalCollected / metrics.totalAssessed) * 100) : 100}% collection rate
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Outstanding</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-600 mt-2">₹{metrics.totalOutstanding.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-rose-700 mt-1 font-semibold">Pending recovery</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students with Dues</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 mt-2">{metrics.totalStudentsWithDues}</p>
              <p className="text-[11px] text-slate-400 mt-1">out of 1,920 registered students</p>
            </div>
          </div>
        )}

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-xs font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Roll No, Student Name, Enrollment No, or Txn Ref..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:bg-white focus:ring-2 focus:ring-red-700 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSemesterFilter('all');
                setTypeFilter('all');
                setPage(1);
                fetchRecords();
              }}
              className="w-full md:w-auto p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all flex items-center justify-center"
              title="Reset Filters"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </form>

          {/* Filter Dropdowns & Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-400 mr-1">Status:</span>
            {[
              { id: 'all', label: 'All Status' },
              { id: 'paid', label: 'Paid' },
              { id: 'partial', label: 'Partial' },
              { id: 'pending', label: 'Pending Dues' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setStatusFilter(st.id);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === st.id ? 'bg-red-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}

            <span className="font-bold text-slate-400 ml-3 mr-1">Semester:</span>
            <select
              value={semesterFilter}
              onChange={(e) => {
                setSemesterFilter(e.target.value);
                setPage(1);
              }}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>
                  Sem {s}
                </option>
              ))}
            </select>

            <span className="font-bold text-slate-400 ml-3 mr-1">Category:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
            >
              <option value="all">All Fee Categories</option>
              <option value="Tuition Fee">Tuition Fee</option>
              <option value="Hostel & Mess Fee">Hostel & Mess Fee</option>
              <option value="Examination Fee">Examination Fee</option>
              <option value="Library & Security Deposit">Library & Security Deposit</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Student Fee Records</h3>
              <p className="text-xs text-slate-400 mt-0.5">Showing {records.length} records of {totalRecords} total</p>
            </div>
            <span className="text-xs font-bold text-slate-500">Page {page} of {totalPages}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student & Roll No</th>
                  <th className="py-3 px-4">Program & School</th>
                  <th className="py-3 px-4">Sem</th>
                  <th className="py-3 px-4">Fee Category</th>
                  <th className="py-3 px-4">Assessed</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Txn Ref</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{r.Student?.fullName || 'Student'}</p>
                      <p className="font-mono text-xs text-slate-500">{r.rollNo}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <p className="font-semibold">{r.Student?.program || 'B.Tech'}</p>
                      <p className="text-[11px] text-slate-400">{r.Student?.school || 'SOICT'}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">Sem {r.semester}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.feeType}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">₹{Number(r.amount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">₹{Number(r.paidAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">₹{Number(r.dueAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      {r.status === 'paid' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      )}
                      {r.status === 'partial' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Partial
                        </span>
                      )}
                      {r.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{r.transactionRef || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditModal(r)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit / Pay
                      </button>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No fee records found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalRecords)} of {totalRecords}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-bold flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL: ASSESS NEW FEE */}
        {showAssessModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-700" /> Assess New Student Fee
                </h3>
                <button onClick={() => setShowAssessModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                  ✕
                </button>
              </div>

              <form onSubmit={handleAssessSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600">Student Roll No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 255UCS258"
                    value={assessRollNo}
                    onChange={(e) => setAssessRollNo(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Fee Category *</label>
                  <select
                    value={assessType}
                    onChange={(e) => setAssessType(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-700"
                  >
                    <option value="Tuition Fee">Tuition Fee</option>
                    <option value="Hostel & Mess Fee">Hostel & Mess Fee</option>
                    <option value="Examination Fee">Examination Fee</option>
                    <option value="Library & Security Deposit">Library & Security Deposit</option>
                    <option value="Disciplinary / Lab Fine">Disciplinary / Lab Fine</option>
                    <option value="Late Registration Fee">Late Registration Fee</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={assessAmount}
                      onChange={(e) => setAssessAmount(e.target.value)}
                      className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Semester</label>
                    <select
                      value={assessSemester}
                      onChange={(e) => setAssessSemester(e.target.value)}
                      className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-700"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={String(s)}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Due Date</label>
                  <input
                    type="date"
                    value={assessDueDate}
                    onChange={(e) => setAssessDueDate(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Remarks / Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Semester 5 installment"
                    value={assessRemarks}
                    onChange={(e) => setAssessRemarks(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-700"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssessModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assessSubmitting}
                    className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold shadow-md"
                  >
                    {assessSubmitting ? 'Assessing...' : 'Assess Fee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT / RECORD PAYMENT */}
        {editingRecord && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-red-700" /> Edit Fee / Record Payment
                </h3>
                <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-800">{editingRecord.Student?.fullName || 'Student'} ({editingRecord.rollNo})</p>
                <p className="text-slate-500 mt-0.5">{editingRecord.feeType} — Total Assessed: ₹{Number(editingRecord.amount).toLocaleString('en-IN')}</p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600">Paid Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editPaidAmount}
                      onChange={(e) => {
                        const paid = Number(e.target.value);
                        setEditPaidAmount(e.target.value);
                        const due = Math.max(0, Number(editingRecord.amount) - paid);
                        setEditDueAmount(String(due));
                        setEditStatus(due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending');
                      }}
                      className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Remaining Due (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editDueAmount}
                      onChange={(e) => setEditDueAmount(e.target.value)}
                      className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none font-bold text-rose-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none font-bold"
                  >
                    <option value="paid">Paid (Fully Cleared)</option>
                    <option value="partial">Partial Payment</option>
                    <option value="pending">Pending Dues</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Transaction Reference / Receipt</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-OFFLINE-DEPOSIT-101"
                    value={editTxn}
                    onChange={(e) => setEditTxn(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Admin Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Verified against bank challan"
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold shadow-md"
                  >
                    {editSubmitting ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FeesAdmin;
