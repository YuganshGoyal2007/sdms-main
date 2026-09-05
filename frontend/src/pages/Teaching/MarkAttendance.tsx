import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { ArrowLeft, Save, Lock, Check, X, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import type { RootState } from '../../context/app/store';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import RosterTable from '../../components/Attendance/RosterTable';
import {
  getTodaySession,
  getClassRoster,
  createSession,
  updateSession,
  submitSession,
  getSessionRecords,
  upsertRecords,
} from '../../lib/teaching.api';
import type {
  AttendanceStatus,
  AttendanceSession,
  RosterStudent,
  SessionStatus,
  SessionType,
  SubjectInfo,
  UpsertRecord,
} from '../../types/types';

const todayISODate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const basePathForRole = (role?: string) => {
  if (role === 'chairperson') return '/chairperson';
  if (role === 'coordinator') return '/coordinator';
  if (role === 'faculty') return '/faculty';
  return '/faculty';
};

const MarkAttendance = () => {
  const navigate = useNavigate();
  const { classKey, subjectId } = useParams<{ classKey: string; subjectId: string }>();
  const user = useSelector((s: RootState) => s.admin);

  const rawKey = classKey || '';
  const delimiter = rawKey.includes('%7C') ? '%7C' : rawKey.includes('~') ? '~' : '|';
  const parts = rawKey.split(delimiter).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  const [school, department, program, batch, specialization] = parts;
  const subjId = Number(subjectId);

  const [date, setDate] = useState<string>(todayISODate());
  const [sessionType, setSessionType] = useState<SessionType>('lecture');
  const [topic, setTopic] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [subject, setSubject] = useState<SubjectInfo | null>(null);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus | undefined>>({});
  const [remarks, setRemarks] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sessionStatus: SessionStatus | 'not-marked' = session?.status || 'not-marked';
  const isLocked = sessionStatus === 'locked';
  const isReadOnly = isLocked && user?.role !== 'admin';

  const loadToday = useCallback(async () => {
    if (!Number.isInteger(subjId) || parts.length !== 5) {
      toast.error('Invalid class or subject.');
      return;
    }
    setLoading(true);
    try {
      const today = await getTodaySession({ school, department, program, batch, specialization }, subjId);
      if (today.success) {
        setSubject(today.subject);
        if (today.session) {
          setSession(today.session);
          setDate(today.session.date);
          setSessionType(today.session.sessionType);
          setTopic(today.session.topic || '');
          setStartTime(today.session.startTime || '');
          setEndTime(today.session.endTime || '');
        } else {
          setSession(null);
        }
      }
      // Load records (if session exists) OR roster (if no session yet)
      if (today.session) {
        const rec = await getSessionRecords(today.session.id);
        if (rec.success) {
          setRoster(rec.roster);
          const nextStatuses: Record<number, AttendanceStatus> = {};
          const nextRemarks: Record<number, string> = {};
          for (const r of rec.roster) {
            if (r.attendance) {
              if (r.attendance.status) nextStatuses[r.studentId] = r.attendance.status;
              if (r.attendance.remarks) nextRemarks[r.studentId] = r.attendance.remarks;
            }
          }
          setStatuses(nextStatuses);
          setRemarks(nextRemarks);
        }
      } else {
        // No session yet — fetch roster from the roster endpoint
        try {
          const ros = await getClassRoster(
            { school, department, program, batch, specialization, semester: today.subject?.semester ?? 0 },
            subjId
          );
          if (ros.success) {
            setRoster(ros.roster);
            if (!subject && ros.subject) setSubject(ros.subject);
          }
        } catch {
          // ignore — user can still save draft to create session
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || error?.message || 'Failed to load session.';
      if (status === 403) {
        toast.error('You are not assigned to this class.');
        navigate(-1);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [subjId, classKey, school, department, program, batch, specialization, navigate, parts.length]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const counts = useMemo(() => {
    let present = 0, absent = 0, excused = 0, unmarked = 0;
    for (const s of roster) {
      const st = statuses[s.studentId];
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'excused') excused++;
      else unmarked++;
    }
    return { present, absent, excused, unmarked, total: roster.length };
  }, [roster, statuses]);

  const setAll = (status: AttendanceStatus | null) => {
    if (isReadOnly) return;
    setStatuses((prev) => {
      const next: Record<number, AttendanceStatus | undefined> = { ...prev };
      for (const s of roster) {
        if (status === null) delete next[s.studentId];
        else next[s.studentId] = status;
      }
      return next;
    });
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    if (isReadOnly) return;
    setStatuses((prev) => ({ ...prev, [studentId]: prev[studentId] === status ? undefined : status }));
  };
  const handleRemarkChange = (studentId: number, remark: string) => {
    if (isReadOnly) return;
    setRemarks((prev) => ({ ...prev, [studentId]: remark }));
  };

  const ensureSession = async (): Promise<AttendanceSession | null> => {
    if (session) return session;
    try {
      const res = await createSession({
        subjectId: subjId,
        school, department, program, batch, specialization,
        semester: subject?.semester ?? 0,
        date,
        sessionType,
        topic,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      });
      if (res.success) {
        setSession(res.session);
        toast.success('Attendance session created.');
        return res.session;
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error?.response?.status === 409) {
        const today = await getTodaySession({ school, department, program, batch, specialization }, subjId);
        if (today.success && today.session) {
          setSession(today.session);
          return today.session;
        }
      }
      const msg = error?.response?.data?.message || 'Failed to create session.';
      toast.error(msg);
    }
    return null;
  };

  const buildPayload = (): UpsertRecord[] => {
    return roster
      .map((r) => {
        const st = statuses[r.studentId];
        if (!st) return null;
        return {
          studentId: r.studentId,
          status: st,
          ...(remarks[r.studentId] ? { remarks: remarks[r.studentId] } : {}),
        };
      })
      .filter((x): x is UpsertRecord => x !== null);
  };

  const handleSaveDraft = async () => {
    if (isReadOnly) return;
    setSaving(true);
    try {
      const sess = await ensureSession();
      if (!sess) {
        setSaving(false);
        return;
      }
      if (topic || sessionType !== sess.sessionType || startTime || endTime) {
        await updateSession(sess.id, { topic, sessionType, startTime: startTime || undefined, endTime: endTime || undefined });
      }
      const records = buildPayload();
      if (records.length > 0) {
        await upsertRecords(sess.id, records);
      }
      toast.success('Draft saved.');
      // refresh roster from server
      const rec = await getSessionRecords(sess.id);
      if (rec.success) setRoster(rec.roster);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || 'Failed to save draft.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (isReadOnly) return;
    const records = buildPayload();
    if (records.length === 0) {
      toast.error('Mark at least one student before submitting.');
      return;
    }
    if (records.length < roster.length) {
      const ok = window.confirm(
        `${roster.length - records.length} student(s) are unmarked. Submit anyway? They will be treated as unmarked.`
      );
      if (!ok) return;
    }
    const ok = window.confirm(
      'Once submitted, this attendance cannot be edited by teaching staff. Continue?'
    );
    if (!ok) return;

    setSubmitting(true);
    try {
      const sess = await ensureSession();
      if (!sess) {
        setSubmitting(false);
        return;
      }
      // Persist latest metadata + records first
      await updateSession(sess.id, { topic, sessionType, startTime: startTime || undefined, endTime: endTime || undefined });
      await upsertRecords(sess.id, records);
      const res = await submitSession(sess.id);
      if (res.success) {
        setSession(res.session);
        const rec = await getSessionRecords(sess.id);
        if (rec.success) setRoster(rec.roster);
        toast.success('Attendance submitted and locked.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || 'Failed to submit.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const basePath = basePathForRole(user?.role);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="animate-spin text-[#7b3b5a]" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab="attendance" />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 bg-white border-b border-[#d9d9d9] px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(`${basePath}/dashboard`)}
            className="p-2 rounded-lg hover:bg-[#f3f3f3]"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {subject?.name || `Subject #${subjId}`}{' '}
              <span className="text-gray-500 text-sm font-mono">({subject?.code || '—'})</span>
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {school} · {department} · {program} · {batch} · {specialization} · Sem {subject?.semester ?? '—'}
            </p>
          </div>
          <button
            onClick={loadToday}
            disabled={loading || saving || submitting}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#d9d9d9] hover:bg-[#f3f3f3] disabled:opacity-50"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0 p-4 sm:p-6 space-y-4">
          {/* Top control bar */}
          <div className="bg-white border border-[#d9d9d9] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-gray-500 tracking-wider mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isReadOnly}
                className="w-full text-sm px-2 py-1.5 border border-[#d9d9d9] rounded-md disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-gray-500 tracking-wider mb-1">Session Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                disabled={isReadOnly}
                className="w-full text-sm px-2 py-1.5 border border-[#d9d9d9] rounded-md disabled:bg-gray-50"
              >
                <option value="lecture">Lecture</option>
                <option value="lab">Lab</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-gray-500 tracking-wider mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isReadOnly}
                className="w-full text-sm px-2 py-1.5 border border-[#d9d9d9] rounded-md disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-gray-500 tracking-wider mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isReadOnly}
                className="w-full text-sm px-2 py-1.5 border border-[#d9d9d9] rounded-md disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-gray-500 tracking-wider mb-1">Status</label>
              <div className="text-sm px-2 py-1.5 border border-[#d9d9d9] rounded-md bg-[#f8f9fa] flex items-center gap-2">
                {sessionStatus === 'draft' && <span className="text-amber-700">Draft</span>}
                {sessionStatus === 'submitted' && <span className="text-blue-700">Submitted</span>}
                {sessionStatus === 'locked' && (
                  <>
                    <Lock size={12} className="text-emerald-700" />
                    <span className="text-emerald-700">Locked</span>
                  </>
                )}
                {sessionStatus === 'not-marked' && <span className="text-gray-500">Not Marked</span>}
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-5">
              <label className="block text-[10px] uppercase text-gray-500 tracking-wider mb-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isReadOnly}
                maxLength={255}
                placeholder="What was covered in this session?"
                className="w-full text-sm px-2 py-1.5 border border-[#d9d9d9] rounded-md disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Locked warning */}
          {isLocked && user?.role !== 'admin' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-sm text-emerald-900">
              <Lock size={16} className="mt-0.5" />
              <div>
                This session is locked. To make changes, ask an admin to unlock it.
              </div>
            </div>
          )}
          {isLocked && user?.role === 'admin' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-sm text-blue-900">
              <AlertCircle size={16} className="mt-0.5" />
              <div>
                You are viewing a locked session as an admin. Use the admin unlock endpoint to edit.
              </div>
            </div>
          )}

          {/* Bulk actions + counters */}
          <div className="bg-white border border-[#d9d9d9] rounded-xl p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAll('present')}
                disabled={isReadOnly}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                <Check size={12} />
                Mark All Present
              </button>
              <button
                onClick={() => setAll('absent')}
                disabled={isReadOnly}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <X size={12} />
                Mark All Absent
              </button>
              <button
                onClick={() => setAll(null)}
                disabled={isReadOnly}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <Counter label="Present" value={counts.present} color="emerald" />
              <Counter label="Absent" value={counts.absent} color="red" />
              <Counter label="Excused" value={counts.excused} color="amber" />
              <Counter label="Unmarked" value={counts.unmarked} color="gray" />
              <Counter label="Total" value={counts.total} color="slate" />
            </div>
          </div>

          {/* Roster */}
          <RosterTable
            roster={roster}
            statuses={statuses}
            remarks={remarks}
            onStatusChange={handleStatusChange}
            onRemarkChange={handleRemarkChange}
            disabled={isReadOnly}
          />

          {/* Action bar */}
          <div className="bg-white border border-[#d9d9d9] rounded-xl p-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
            <button
              onClick={() => navigate(`${basePath}/dashboard`)}
              className="text-sm px-4 py-2 rounded-lg border border-[#d9d9d9] hover:bg-[#f3f3f3]"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving || submitting || isReadOnly}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-white text-gray-800 border border-[#d9d9d9] hover:bg-[#f3f3f3] disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || submitting || isReadOnly}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#7b3b5a] text-white hover:bg-[#5e2a44] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" size={14} /> : <Lock size={14} />}
              Submit &amp; Lock
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

const Counter = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const palette: Record<string, string> = {
    emerald: 'border-emerald-200 text-emerald-700',
    red: 'border-red-200 text-red-700',
    amber: 'border-amber-200 text-amber-700',
    gray: 'border-gray-200 text-gray-700',
    slate: 'border-slate-300 text-slate-800 bg-slate-50',
  };
  return (
    <div className={`border rounded-md py-1.5 ${palette[color] || palette.gray}`}>
      <div className="text-[10px] uppercase tracking-wider">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
};

export default MarkAttendance;
