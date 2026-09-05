import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  FileCheck,
  Building,
  Building2,
  ShieldCheck,
  Send,
  RefreshCw,
  Landmark,
  Receipt,
  FileText,
  Lock,
  Check,
  XCircle,
  Library,
  Home,
  Trophy,
  FlaskConical,
  Briefcase,
  ChevronDown,
  History,
  Sparkles,
  Hash,
  GraduationCap,
  School,
  Layers,
} from 'lucide-react';
import { getMyFees, payFee, type FeeRecordItem, type FeeSummary } from '../../lib/fees.api';
import {
  getMyNoDues,
  applyNoDues,
  resubmitNoDues,
  type NoDuesApplicationItem,
  type NoDuesStageItem,
} from '../../lib/noDues.api';

const STATUS_CONFIG: Record<string, {
  icon: any;
  label: string;
  bg: string;
  iconBg: string;
  border: string;
  text: string;
  ring: string;
}> = {
  locked: {
    icon: Lock,
    label: "Locked",
    bg: "bg-slate-50/90",
    iconBg: "bg-slate-100",
    border: "border-slate-200",
    text: "text-slate-400",
    ring: "",
  },
  pending: {
    icon: Clock,
    label: "In Progress",
    bg: "bg-blue-50/90",
    iconBg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-600",
    ring: "ring-4 ring-blue-500/20",
  },
  approved: {
    icon: Check,
    label: "Cleared",
    bg: "bg-emerald-50/90",
    iconBg: "bg-emerald-100",
    border: "border-emerald-400",
    text: "text-emerald-600",
    ring: "ring-4 ring-emerald-500/20",
  },
  rejected: {
    icon: XCircle,
    label: "Action Req.",
    bg: "bg-rose-50/90",
    iconBg: "bg-rose-100",
    border: "border-rose-400",
    text: "text-rose-600",
    ring: "ring-4 ring-rose-500/20",
  },
};

const getStageIcon = (code: string = '', name: string = '') => {
  const n = (code + ' ' + name).toLowerCase();
  if (n.includes('lib')) return Library;
  if (n.includes('hostel') || n.includes('hst')) return Home;
  if (n.includes('sport') || n.includes('spt')) return Trophy;
  if (n.includes('lab')) return FlaskConical;
  if (n.includes('crc') || n.includes('relation') || n.includes('placement')) return Briefcase;
  if (n.includes('acc') || n.includes('finance') || n.includes('account')) return ShieldCheck;
  if (n.includes('dean')) return Landmark;
  if (n.includes('hod')) return Building2;
  return Building;
};

const formatDateIST = (dateString?: string | null) => {
  if (!dateString) return null;
  try {
    let normalized = String(dateString).replace(' ', 'T');
    if (!normalized.endsWith('Z') && !normalized.includes('+')) {
      normalized += 'Z';
    }
    const date = new Date(normalized);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (e) {
    return String(dateString);
  }
};

const WorkflowNode: React.FC<{
  stage: NoDuesStageItem;
  isSmall?: boolean;
  position?: 'left' | 'right';
  activeTooltipId: number | null;
  setActiveTooltipId: (id: number | null) => void;
}> = ({ stage, isSmall = false, position = 'right', activeTooltipId, setActiveTooltipId }) => {
  const statusKey = stage.computedStatus || (stage.status === 'approved' ? 'approved' : stage.status === 'rejected' ? 'rejected' : stage.isLocked ? 'locked' : 'pending');
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.locked;
  const Icon = getStageIcon(stage.stageCode, stage.stageName);

  const isTooltipOpen = activeTooltipId === stage.id;
  const displayComment = stage.comments || (
    statusKey === 'approved'
      ? 'All departmental dues verified cleared (₹0 outstanding liability).'
      : statusKey === 'locked'
      ? 'Prerequisite verification level must be cleared first.'
      : 'Verification in progress. Awaiting department sign-off and remarks.'
  );

  const tooltipPositionClass = position === 'right' ? 'left-[110%]' : 'right-[110%]';

  return (
    <div
      className="relative flex flex-col items-center group cursor-pointer"
      style={{ zIndex: isTooltipOpen ? 100 : 10 }}
      onMouseEnter={() => setActiveTooltipId(stage.id)}
      onMouseLeave={() => setActiveTooltipId(null)}
      onClick={() => setActiveTooltipId(isTooltipOpen ? null : stage.id)}
    >
      {/* Tooltip Popup */}
      {isTooltipOpen && (
        <div
          className={`absolute top-0 w-64 md:w-72 p-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl z-[150] pointer-events-none transition-all duration-200 ${tooltipPositionClass}`}
        >
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Office Remarks</span>
              <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${config.iconBg} ${config.text}`}>
                {config.label}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-200 font-medium">
              {displayComment}
            </p>
            {stage.verifiedByName && (
              <div className="text-[10px] text-slate-400 border-t border-white/5 pt-1.5 flex items-center justify-between">
                <span>Verified: <span className="text-white font-semibold">{stage.verifiedByName}</span></span>
                {stage.verifiedAt && <span>{formatDateIST(stage.verifiedAt)}</span>}
              </div>
            )}
            {Number(stage.duesAmount) > 0 && (
              <p className="text-[11px] font-bold text-rose-400">
                Outstanding Dues: ₹{Number(stage.duesAmount).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Node Tile */}
      <div
        className={`
          ${isSmall ? 'w-14 h-14' : 'w-[4.5rem] h-[4.5rem] md:w-[5rem] md:h-[5rem]'}
          rounded-2xl border-[3px] flex items-center justify-center shadow-sm relative
          ${config.bg} ${config.border} ${config.ring} transition-all duration-300
          hover:scale-105 hover:shadow-xl
          ${statusKey === 'pending' ? 'animate-pulse shadow-blue-500/20' : ''}
        `}
      >
        <div className="w-full h-full rounded-[0.85rem] flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <Icon size={isSmall ? 22 : 28} className={config.text} strokeWidth={2.5} />
        </div>

        {statusKey === 'approved' && (
          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
            <Check size={12} strokeWidth={4} />
          </div>
        )}
        {statusKey === 'rejected' && (
          <div className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
            <XCircle size={12} strokeWidth={4} />
          </div>
        )}
        {statusKey === 'locked' && (
          <div className="absolute -top-2 -right-2 bg-slate-400 text-white rounded-full p-1 border-2 border-white shadow-sm">
            <Lock size={10} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Node Labels */}
      <div className="mt-2.5 text-center w-24 md:w-32">
        <p className="text-[10px] md:text-xs font-black text-slate-800 leading-tight tracking-tight">
          {stage.stageName}
        </p>
        <p className={`text-[9px] md:text-[10px] font-bold mt-0.5 tracking-wide ${config.text}`}>
          {config.label}
        </p>
      </div>
    </div>
  );
};

const InfoCard: React.FC<{
  icon: any;
  label: string;
  value?: string | number | null;
  iconBg?: string;
  iconColor?: string;
}> = ({ icon: Icon, label, value, iconBg = 'bg-slate-50', iconColor = 'text-slate-500' }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 transition-all hover:shadow-md">
    <div className={`w-9 h-9 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center shadow-sm border border-slate-100`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">{label}</p>
      <p className="text-xs md:text-sm font-black text-slate-800 uppercase truncate">{value || '—'}</p>
    </div>
  </div>
);

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
  const [workflow, setWorkflow] = useState<{
    top: NoDuesStageItem[];
    parallel: NoDuesStageItem[];
    bottom: NoDuesStageItem[];
  }>({ top: [], parallel: [], bottom: [] });
  const [progress, setProgress] = useState(0);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null);

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
        if (res.workflow) {
          setWorkflow(res.workflow);
        } else {
          const raw = (res.stages || []).slice().sort((a, b) => a.sequenceOrder - b.sequenceOrder);
          setWorkflow({
            top: raw.filter((s) => s.sequenceOrder < 4),
            parallel: raw.filter((s) => s.sequenceOrder === 4),
            bottom: raw.filter((s) => s.sequenceOrder > 4),
          });
        }
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
          {/* Overview Hero Section with Circular SVG Gauge */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            {/* Circular Progress Gauge */}
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="36" className="stroke-slate-100 fill-none stroke-[8]" />
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  className={`fill-none stroke-[8] transition-all duration-1000 ease-out ${
                    progress === 100 ? 'stroke-emerald-500' : 'stroke-red-700'
                  }`}
                  strokeLinecap="round"
                  strokeDasharray={226}
                  strokeDashoffset={226 - (226 * progress) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-800 tracking-tight">{progress}%</span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {progress === 100 ? 'CLEARED' : 'PROGRESS'}
                </span>
              </div>
            </div>

            {/* Application Details & Status */}
            <div className="flex-1 space-y-2 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Institutional Clearance DAG</span>
                {application?.isCompleted ? (
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 tracking-wide">
                    CERTIFIED & CLEARED
                  </span>
                ) : application?.status === 'rejected' ? (
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 tracking-wide">
                    ACTION REQUIRED / DUES FOUND
                  </span>
                ) : hasApp ? (
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 tracking-wide">
                    ACTIVE VERIFICATION PIPELINE
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 tracking-wide">
                    NOT YET INITIATED
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {hasApp ? `Clearance Token: ${application?.displayId || application?.id}` : 'Institutional No-Dues Clearance'}
              </h2>

              <p className="text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {hasApp
                  ? 'Your clearance is governed by an institutional 3-Tier Directed Acyclic Graph (DAG). Approvals sequentially unlock the Academic Spine (Levels 1-3), enable the Parallel Auxiliary Bus (Level 4), and settle at the Terminal Accounts Gate (Level 5).'
                  : 'Start your official digital No Dues verification. Once all departments certify zero outstanding liabilities, your tamper-evident university certificate will be issued.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
              {!hasApp && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-red-700 hover:bg-red-800 text-white transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Apply for Clearance
                </button>
              )}

              {hasApp && application?.status === 'rejected' && (
                <button
                  onClick={() => setShowResubmitModal(true)}
                  className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Resubmit with Proof
                </button>
              )}

              {application?.isCompleted && (
                <button
                  onClick={() => setShowCertModal(true)}
                  className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" /> View Official Certificate
                </button>
              )}

              <button
                onClick={loadNoDues}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                title="Refresh Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${noDuesLoading ? 'animate-spin' : ''}`} /> Refresh Pipeline
              </button>
            </div>
          </div>

          {/* 4 Metric Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard
              icon={Hash}
              label="Enrollment No"
              value={studentInfo?.enrollmentNo || studentInfo?.enrollmentNumber || '2500100481'}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <InfoCard
              icon={GraduationCap}
              label="Roll Number"
              value={studentInfo?.rollNo || studentInfo?.rollNumber || '255UCS258'}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
            <InfoCard
              icon={School}
              label="Academic School"
              value={studentInfo?.school || studentInfo?.department || 'SOICT'}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <InfoCard
              icon={Layers}
              label="Current Active Gate"
              value={
                application?.isCompleted
                  ? 'Fully Certified'
                  : application?.currentStageOrder === 1
                  ? 'Level 1: School Office'
                  : application?.currentStageOrder === 2
                  ? 'Level 2: HOD Clearance'
                  : application?.currentStageOrder === 3
                  ? 'Level 3: School Dean'
                  : application?.currentStageOrder === 4
                  ? 'Level 4: Parallel Depts'
                  : application?.currentStageOrder === 5
                  ? 'Level 5: Terminal Accounts'
                  : 'Pending Application'
              }
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
          </div>

          {/* 3-Tier DAG Interactive Canvas */}
          {hasApp && (
            <div className="bg-slate-50/70 border border-slate-200/90 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
              {/* Canvas Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200/80 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">
                      Institutional Verification DAG Canvas
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Interactive 3-Tier pipeline: Sequential Academic Spine → Parallel Departmental Bus → Terminal Accounts Gate
                  </p>
                </div>

                {/* Status Counter Badges */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-xs">
                    Total Nodes: {stages.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Approved: {stages.filter((s) => s.status === 'approved').length}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Active: {stages.filter((s) => s.status === 'pending' && !s.isLocked).length}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 border border-slate-300">
                    Gated: {stages.filter((s) => s.isLocked).length}
                  </span>
                  {stages.some((s) => s.status === 'rejected') && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      Dues: {stages.filter((s) => s.status === 'rejected').length}
                    </span>
                  )}
                </div>
              </div>

              {/* DAG Flow Graph */}
              <div className="pt-10 flex flex-col items-center">
                {/* ---------------- TIER 1: SEQUENTIAL ACADEMIC SPINE ---------------- */}
                <div className="flex flex-col items-center gap-0 w-full max-w-xl">
                  {workflow.top.map((stage, idx) => {
                    const isPassed = stage.status === 'approved';
                    const isCurrentActive = stage.status === 'pending' && !stage.isLocked;
                    return (
                      <React.Fragment key={stage.id}>
                        <WorkflowNode
                          stage={stage}
                          position={idx % 2 === 0 ? 'right' : 'left'}
                          activeTooltipId={activeTooltipId}
                          setActiveTooltipId={setActiveTooltipId}
                        />
                        {/* Downward connector between sequential nodes */}
                        <div className="flex flex-col items-center my-1.5 h-10 relative">
                          <div
                            className={`w-0.5 h-full transition-colors duration-500 ${
                              isPassed ? 'bg-emerald-500' : isCurrentActive ? 'bg-blue-400' : 'bg-slate-300'
                            }`}
                          />
                          <ChevronDown
                            size={14}
                            className={`absolute -bottom-1 ${
                              isPassed ? 'text-emerald-500' : isCurrentActive ? 'text-blue-400' : 'text-slate-300'
                            }`}
                          />
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* ---------------- BRIDGE: SPINE TO PARALLEL BUS ---------------- */}
                <div className="w-full max-w-4xl relative mt-1 mb-8">
                  {/* Top distribution bus line */}
                  <div className="hidden md:block absolute top-0 left-[6%] right-[6%] h-0.5 bg-slate-300 transition-colors" />

                  {/* ---------------- TIER 2: PARALLEL AUXILIARY BUS ---------------- */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-3 pt-6">
                    {workflow.parallel.map((stage, pIdx) => {
                      const isApproved = stage.status === 'approved';
                      const isPending = stage.status === 'pending' && !stage.isLocked;
                      return (
                        <div key={stage.id} className="relative flex flex-col items-center">
                          {/* Stem from top bus into node */}
                          <div
                            className={`hidden md:block absolute -top-6 w-0.5 h-6 transition-colors duration-500 ${
                              isApproved ? 'bg-emerald-500' : isPending ? 'bg-blue-400' : 'bg-slate-300'
                            }`}
                          />
                          <WorkflowNode
                            stage={stage}
                            isSmall
                            position={pIdx < 2 ? 'right' : 'left'}
                            activeTooltipId={activeTooltipId}
                            setActiveTooltipId={setActiveTooltipId}
                          />
                          {/* Stem from node down to bottom collector */}
                          <div
                            className={`hidden md:block absolute -bottom-6 w-0.5 h-6 transition-colors duration-500 ${
                              isApproved ? 'bg-emerald-500' : isPending ? 'bg-blue-400' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom collector bus line */}
                  <div className="hidden md:block absolute -bottom-6 left-[6%] right-[6%] h-0.5 bg-slate-300" />
                </div>

                {/* Stem from collector down into Tier 3 */}
                <div className="flex flex-col items-center my-4 h-12 relative">
                  <div
                    className={`w-0.5 h-full ${
                      workflow.parallel.length > 0 && workflow.parallel.every((s) => s.status === 'approved')
                        ? 'bg-emerald-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <ChevronDown
                    size={16}
                    className={`absolute -bottom-1 ${
                      workflow.parallel.length > 0 && workflow.parallel.every((s) => s.status === 'approved')
                        ? 'text-emerald-500'
                        : 'text-slate-300'
                    }`}
                  />
                </div>

                {/* ---------------- TIER 3: TERMINAL SETTLEMENT GATE ---------------- */}
                <div className="flex flex-col items-center w-full max-w-sm">
                  {workflow.bottom.map((stage) => (
                    <WorkflowNode
                      key={stage.id}
                      stage={stage}
                      position="right"
                      activeTooltipId={activeTooltipId}
                      setActiveTooltipId={setActiveTooltipId}
                    />
                  ))}
                </div>
              </div>

              {/* Real-time IST Engine Status Ribbon */}
              <div className="mt-12 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles size={13} className="text-red-700" />
                  <span>Strict DAG Execution • Automated Level Advancement on All-Branch Clearance</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-slate-400">
                  <History size={12} />
                  <span>IST Engine Synchronized</span>
                </div>
              </div>
            </div>
          )}

          {/* Department Details Table */}
          {hasApp && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Clearance Stages & Department Sign-offs</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Live status and official audit trail from each verification authority</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Department / Authority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Dues Amount</th>
                      <th className="py-3 px-4">Official Remarks</th>
                      <th className="py-3 px-4">Verified By</th>
                      <th className="py-3 px-4">Timestamp (IST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stages.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">Level {st.sequenceOrder}</td>
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
                          {st.status === 'pending' && !st.isLocked && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Active Review
                            </span>
                          )}
                          {st.status === 'pending' && st.isLocked && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Gated / Locked
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
                          {formatDateIST(st.verifiedAt) || '—'}
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
