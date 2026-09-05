import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  FileCheck,
  Building,
  ShieldCheck,
  Send,
  RefreshCw,
  Landmark,
  Receipt,
  FileText,
} from 'lucide-react';
import { getMyFees, payFee, type FeeRecordItem, type FeeSummary } from '../../lib/fees.api';
import {
  getMyNoDues,
  applyNoDues,
  resubmitNoDues,
  type NoDuesApplicationItem,
  type NoDuesStageItem,
} from '../../lib/noDues.api';

export const StudentFeesAndNoDuesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fees' | 'nodues'>('fees');

  // Fees State
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [feeRecords, setFeeRecords] = useState<FeeRecordItem[]>([]);
  const [payingRecord, setPayingRecord] = useState<FeeRecordItem | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('UPI / QR');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // No Dues State
  const [noDuesLoading, setNoDuesLoading] = useState(true);
  const [hasApp, setHasApp] = useState(false);
  const [application, setApplication] = useState<NoDuesApplicationItem | null>(null);
  const [stages, setStages] = useState<NoDuesStageItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  // Modals & Forms
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyReason, setApplyReason] = useState('Completion of Degree / Semester Clearance');
  const [isHosteller, setIsHosteller] = useState(false);
  const [applySubmitting, setApplySubmitting] = useState(false);

  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitRemarks, setResubmitRemarks] = useState('');
  const [resubmitProofUrl, setResubmitProofUrl] = useState('');
  const [resubmitSubmitting, setResubmitSubmitting] = useState(false);

  const [showCertModal, setShowCertModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadFees = async () => {
    try {
      setFeeLoading(true);
      const res = await getMyFees();
      if (res.success) {
        setFeeSummary(res.summary);
        setFeeRecords(res.feeRecords || []);
        if (res.student) setStudentInfo(res.student);
      }
    } catch (err: any) {
      console.error('Failed to load student fees:', err);
    } finally {
      setFeeLoading(false);
    }
  };

  const loadNoDues = async () => {
    try {
      setNoDuesLoading(true);
      const res = await getMyNoDues();
      if (res.success) {
        setHasApp(res.hasApplication);
        setApplication(res.application);
        setStages(res.stages || []);
        setProgress(res.progressPercentage || 0);
        if (res.student) {
          setStudentInfo(res.student);
          setIsHosteller(Boolean(res.student.hosteller));
        }
      }
    } catch (err: any) {
      console.error('Failed to load no dues status:', err);
    } finally {
      setNoDuesLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
    loadNoDues();
  }, []);

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;
    setPaySubmitting(true);
    try {
      const amt = payAmount ? Number(payAmount) : payingRecord.dueAmount;
      const res = await payFee(payingRecord.id, amt, payMethod);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Payment of ₹${amt} processed successfully! Txn Ref: ${res.receipt?.transactionRef}` });
        setPayingRecord(null);
        setPayAmount('');
        await loadFees();
        await loadNoDues();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Payment simulation failed' });
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplySubmitting(true);
    try {
      const res = await applyNoDues({
        reason: applyReason,
        isHosteller,
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'No Dues application initialized across all 5 verification gates!' });
        setShowApplyModal(false);
        await loadNoDues();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit application' });
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResubmitSubmitting(true);
    try {
      const res = await resubmitNoDues({
        studentRemarks: resubmitRemarks,
        proofDocumentUrl: resubmitProofUrl,
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Clearance application resubmitted! Pending gates have been reset.' });
        setShowResubmitModal(false);
        await loadNoDues();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to resubmit' });
    } finally {
      setResubmitSubmitting(false);
    }
  };

  const handlePrintCertificate = () => {
    const printContent = document.getElementById('printable-certificate');
    if (!printContent) return;
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>GBU No Dues Clearance Certificate - ${studentInfo?.rollNo || ''}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; line-height: 1.5; }
            .cert-box { border: 4px double #832729; padding: 30px; text-align: center; border-radius: 8px; }
            .header { border-bottom: 2px solid #832729; padding-bottom: 15px; margin-bottom: 25px; }
            .univ-name { font-size: 26px; font-weight: bold; color: #832729; text-transform: uppercase; margin: 0; }
            .univ-sub { font-size: 14px; color: #444; margin: 5px 0 0 0; }
            .cert-title { font-size: 22px; font-weight: bold; text-decoration: underline; margin: 25px 0 20px 0; color: #1e293b; }
            .cert-body { font-size: 16px; text-align: justify; margin: 25px 0; }
            .table-stages { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            .table-stages th, .table-stages td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .table-stages th { background-color: #f6eef2; color: #832729; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig-line { border-top: 1px solid #333; width: 200px; padding-top: 5px; font-size: 13px; font-weight: bold; }
            .seal { display: inline-block; padding: 8px 16px; border: 2px dashed #059669; color: #059669; font-weight: bold; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
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

      {/* Header & Tabs */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Student Portal</span>
            <span className="text-xs font-medium text-slate-500">Academic Year 2025-2026</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-red-700" /> Fees & No-Dues Clearance Portal
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Manage your semester fee ledger, view real-time receipts, and track your 5-stage institutional clearance certificate.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'fees' ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Semester Fees Ledger
          </button>
          <button
            onClick={() => setActiveTab('nodues')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'nodues' ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> No-Dues Clearance {application?.isCompleted && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
          </button>
        </div>
      </div>

      {/* TAB 1: FEES LEDGER */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Assessed Fees</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{Number(feeSummary?.totalAmount || 0).toLocaleString('en-IN')}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{feeSummary?.count || 0} Ledger items</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Paid Amount</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹{Number(feeSummary?.totalPaid || 0).toLocaleString('en-IN')}</h3>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified receipts</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Outstanding Balance</p>
                <h3 className={`text-2xl font-bold mt-1 ${Number(feeSummary?.totalDue || 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  ₹{Number(feeSummary?.totalDue || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {Number(feeSummary?.totalDue || 0) > 0 ? 'Action required' : 'Zero dues pending'}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  Number(feeSummary?.totalDue || 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Financial Clearance</p>
                <div className="mt-1">
                  {feeSummary?.status === 'cleared' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% CLEARED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      <Clock className="w-3.5 h-3.5" /> DUES PENDING
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Accounts clearance gate</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Building className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Fee Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Semester Fee Breakdown & Transactions</h2>
                <p className="text-xs text-slate-400 mt-0.5">Detailed breakdown of tuition, examination, hostel, and library fee components</p>
              </div>
              <button
                onClick={loadFees}
                disabled={feeLoading}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                title="Refresh Ledger"
              >
                <RefreshCw className={`w-4 h-4 ${feeLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Fee Category</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Assessed</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Transaction Ref</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span>{item.feeType}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">Sem {item.semester}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-medium">₹{Number(item.paidAmount).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {Number(item.dueAmount) > 0 ? (
                          <span className="text-rose-600 font-bold">₹{Number(item.dueAmount).toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === 'paid' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Paid</span>
                        )}
                        {item.status === 'partial' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Partial</span>
                        )}
                        {item.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                        {item.transactionRef || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {Number(item.dueAmount) > 0 ? (
                          <button
                            onClick={() => {
                              setPayingRecord(item);
                              setPayAmount(String(item.dueAmount));
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition-all shadow-sm"
                          >
                            Pay Online
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              alert(`Receipt: ${item.transactionRef || 'OFFICIAL-CLEAR'}\nType: ${item.feeType}\nAmount: ₹${item.paidAmount}\nStatus: Verified Cleared`);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all inline-flex items-center gap-1 border border-slate-200"
                          >
                            <FileText className="w-3.5 h-3.5" /> Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {feeRecords.length === 0 && !feeLoading && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No fee records found for this student account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NO DUES CLEARANCE PIPELINE */}
      {activeTab === 'nodues' && (
        <div className="space-y-6">
          {/* Status & Action Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Status</span>
                {application?.isCompleted ? (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    CLEARANCE CERTIFIED
                  </span>
                ) : application?.status === 'rejected' ? (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    ACTION REQUIRED / REJECTED
                  </span>
                ) : hasApp ? (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    VERIFICATION IN PROGRESS
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    NOT YET APPLIED
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-800">
                {hasApp ? `Application ID: ${application?.displayId}` : 'Institutional No-Dues Clearance'}
              </h2>

              <p className="text-xs md:text-sm text-slate-500 max-w-xl">
                {hasApp
                  ? 'Your clearance is routed across 5 verification gates: School Administrative Office, HOD, School Dean, Central Library & Hostel, and Accounts.'
                  : 'Start your official digital No Dues verification. Once all departments certify zero outstanding dues, your official certificate will be generated.'}
              </p>
            </div>

            {/* Right Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {!hasApp && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-red-700 hover:bg-red-800 text-white transition-all shadow-md flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Apply for No-Dues Clearance
                </button>
              )}

              {hasApp && application?.status === 'rejected' && (
                <button
                  onClick={() => setShowResubmitModal(true)}
                  className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Resubmit with Proof
                </button>
              )}

              {application?.isCompleted && (
                <button
                  onClick={() => setShowCertModal(true)}
                  className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4" /> View Official Certificate
                </button>
              )}

              <button
                onClick={loadNoDues}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                title="Refresh Status"
              >
                <RefreshCw className={`w-4 h-4 ${noDuesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Progress Bar & Gate Indicators */}
          {hasApp && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs md:text-sm font-bold text-slate-700 mb-2">
                  <span>Overall Institutional Clearance Progress</span>
                  <span className={progress === 100 ? 'text-emerald-600' : 'text-red-700'}>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      progress === 100 ? 'bg-emerald-500' : 'bg-red-700'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 5-Gate Visual Stepper */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                {[
                  { title: '1. School Office', sub: 'Admin Verification', code: 'SCHOOL_OFFICE' },
                  { title: '2. Head of Dept', sub: 'Academic Clearance', code: 'HOD' },
                  { title: '3. School Dean', sub: 'Faculty Endorsement', code: 'DEAN' },
                  { title: '4. Central Depts', sub: 'Library, Hostel, Labs', code: 'LIB' },
                  { title: '5. Accounts', sub: 'Final Financial Sign-off', code: 'ACC' },
                ].map((gate, i) => {
                  const matching = stages.find((s) => s.stageCode.includes(gate.code));
                  const isApproved = matching?.status === 'approved';
                  const isRejected = matching?.status === 'rejected';

                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border transition-all ${
                        isApproved
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : isRejected
                          ? 'border-rose-200 bg-rose-50/50'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">{gate.title}</span>
                        {isApproved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isRejected ? (
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{gate.sub}</p>
                      <div className="mt-2 text-[10px] font-bold uppercase">
                        {isApproved && <span className="text-emerald-700">Cleared</span>}
                        {isRejected && <span className="text-rose-700">Dues Found</span>}
                        {!isApproved && !isRejected && <span className="text-slate-400">Awaiting Turn</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verification Stages Details Table */}
          {hasApp && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">Clearance Stages & Department Sign-offs</h3>
                <p className="text-xs text-slate-400 mt-0.5">Live status from each verification authority</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Stage Order</th>
                      <th className="py-3 px-4">Department / Authority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Dues Amount</th>
                      <th className="py-3 px-4">Remarks / Remarks Reason</th>
                      <th className="py-3 px-4">Verified By</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stages.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">#{st.sequenceOrder}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{st.stageName}</td>
                        <td className="py-3 px-4">
                          {st.status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Cleared
                            </span>
                          )}
                          {st.status === 'rejected' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Dues Found
                            </span>
                          )}
                          {st.status === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {Number(st.duesAmount) > 0 ? (
                            <span className="text-rose-600 font-bold">₹{Number(st.duesAmount).toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">₹0 (Nil)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{st.comments || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{st.verifiedByName || 'Pending Review'}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {st.verifiedAt ? new Date(st.verifiedAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: PAY ONLINE SIMULATION */}
      {payingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-700" /> Pay Outstanding Fee
              </h3>
              <button onClick={() => setPayingRecord(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Fee Category</label>
                <input
                  type="text"
                  disabled
                  value={payingRecord.feeType}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Amount to Pay (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payingRecord.dueAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Total outstanding: ₹{Number(payingRecord.dueAmount).toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Payment Channel</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-red-700 outline-none"
                >
                  <option value="UPI / QR">GBU Campus UPI / QR Code</option>
                  <option value="NetBanking (HDFC/SBI)">NetBanking (SBI / HDFC Portal)</option>
                  <option value="Debit Card">Debit / Credit Card (RuPay/Visa)</option>
                  <option value="Bank Challan">SBI Bank Challan Deposit</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPayingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition-all flex items-center gap-2 shadow-md"
                >
                  {paySubmitting ? 'Processing...' : `Confirm & Pay ₹${payAmount || payingRecord.dueAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPLY FOR NO DUES */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-700" /> Apply for No-Dues Clearance
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-900 leading-relaxed">
                Applying initializes verification gates at your School Office, Head of Department ({studentInfo?.department || 'CSE'}),
                School Dean ({studentInfo?.school || 'SOICT'}), Central Library, Labs, and Accounts.
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Student Roll Number & Name</label>
                <input
                  type="text"
                  disabled
                  value={`${studentInfo?.rollNo || ''} — ${studentInfo?.fullName || ''}`}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Reason for Clearance</label>
                <select
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-red-700 outline-none"
                >
                  <option value="Completion of Degree / Semester Clearance">Completion of Degree / Graduation</option>
                  <option value="Semester Registration Requirement">Semester Registration Requirement</option>
                  <option value="Internship / Training Clearance">Semester Internship / Training Clearance</option>
                  <option value="Hostel Vacating Clearance">Hostel Vacating Clearance</option>
                  <option value="Program Transfer / Migration">Program Transfer / Migration</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hosteller-check"
                  checked={isHosteller}
                  onChange={(e) => setIsHosteller(e.target.checked)}
                  className="w-4 h-4 text-red-700 rounded border-slate-300 focus:ring-red-700"
                />
                <label htmlFor="hosteller-check" className="text-xs font-medium text-slate-700 cursor-pointer">
                  I am a University Hosteller (Requires Hostel Warden & Mess sign-off)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applySubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition-all flex items-center gap-2 shadow-md"
                >
                  {applySubmitting ? 'Initializing...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESUBMIT APPLICATION */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" /> Resubmit Clearance with Proof
              </h3>
              <button onClick={() => setShowResubmitModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleResubmitSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Student Explanation / Reply to Remarks</label>
                <textarea
                  required
                  rows={3}
                  value={resubmitRemarks}
                  onChange={(e) => setResubmitRemarks(e.target.value)}
                  placeholder="e.g. Paid pending library fee via receipt #LIB124. Dues cleared."
                  className="w-full mt-1 p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Proof Document Link / Receipt URL (Optional)</label>
                <input
                  type="url"
                  value={resubmitProofUrl}
                  onChange={(e) => setResubmitProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or receipt link"
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-red-700 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resubmitSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all flex items-center gap-2 shadow-md"
                >
                  {resubmitSubmitting ? 'Submitting...' : 'Resubmit for Clearance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL PRINTABLE CLEARANCE CERTIFICATE */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" /> Official GBU No-Dues Clearance Certificate
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintCertificate}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setShowCertModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2">
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Container */}
            <div id="printable-certificate" className="p-6 border-4 border-double border-red-900 rounded-2xl bg-[#fffdfa] text-slate-900">
              <div className="text-center border-b-2 border-red-900 pb-4 mb-6">
                <h1 className="text-2xl font-serif font-bold text-red-900 tracking-wider">GAUTAM BUDDHA UNIVERSITY</h1>
                <p className="text-xs text-slate-600 uppercase tracking-widest mt-1">Greater Noida, Gautam Buddha Nagar, Uttar Pradesh - 201312</p>
                <div className="mt-3 inline-block px-4 py-1 rounded bg-red-50 border border-red-200 text-red-900 font-serif font-bold text-sm">
                  INSTITUTIONAL NO-DUES CLEARANCE CERTIFICATE
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm font-serif leading-relaxed">
                <div className="flex justify-between text-xs text-slate-500 font-mono pb-2">
                  <span>Cert. No: {application?.certificateNumber || `GBU-ND-${application?.displayId}`}</span>
                  <span>Issued Date: {application?.certificateIssuedAt ? new Date(application.certificateIssuedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</span>
                </div>

                <p className="text-justify indent-6">
                  This is to officially certify that <strong>{studentInfo?.fullName || 'Student'}</strong>, Son/Daughter of{' '}
                  <strong>{studentInfo?.fatherName || 'Guardian'}</strong>, bearing University Roll Number{' '}
                  <strong className="underline">{studentInfo?.rollNo}</strong> and Enrollment Number{' '}
                  <strong>{studentInfo?.enrollmentNo}</strong>, student of <strong>{studentInfo?.program}</strong> (Batch:{' '}
                  <strong>{studentInfo?.batch}</strong>), Department of <strong>{studentInfo?.department}</strong>,{' '}
                  <strong>{studentInfo?.school}</strong>, has successfully fulfilled all obligations.
                </p>

                <p className="text-justify indent-6">
                  It is verified that the candidate has <strong>NIL (ZERO) OUTSTANDING LIABILITIES OR DUES</strong> across all
                  university branches, including the School Administrative Office, Department Laboratories, Central Bodhisattva Library,
                  Hostel Administration, Sports Council, and the Finance & Accounts Branch.
                </p>

                {/* Stage Clearance Matrix */}
                <div className="pt-2">
                  <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-red-50 text-red-900">
                        <th className="border border-slate-300 p-2">Authority / Section</th>
                        <th className="border border-slate-300 p-2">Clearance Status</th>
                        <th className="border border-slate-300 p-2">Dues Amount</th>
                        <th className="border border-slate-300 p-2">Verified By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stages.map((st) => (
                        <tr key={st.id}>
                          <td className="border border-slate-300 p-2 font-medium">{st.stageName}</td>
                          <td className="border border-slate-300 p-2 text-emerald-700 font-bold">CLEARED (Nil)</td>
                          <td className="border border-slate-300 p-2 font-mono">₹0.00</td>
                          <td className="border border-slate-300 p-2 text-slate-600">{st.verifiedByName || 'Authorized Officer'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Seal & Signatures */}
                <div className="pt-10 flex items-center justify-between">
                  <div className="text-center">
                    <div className="inline-block p-2 border-2 border-dashed border-emerald-600 text-emerald-700 text-[10px] font-bold uppercase rounded">
                      DIGITALLY VERIFIED<br />OFFICIAL CLEARANCE SEAL
                    </div>
                  </div>

                  <div className="text-center border-t border-slate-800 pt-2 w-48">
                    <p className="text-xs font-bold text-slate-800">Finance & Accounts Officer</p>
                    <p className="text-[10px] text-slate-500">Gautam Buddha University</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeesAndNoDuesView;
