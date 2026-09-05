<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import type { RootState } from "../../context/app/store";
import {
  getClassRoster, getTodaySession, createSession, updateSession,
  submitSession, getSessionRecords, upsertAttendanceRecords,
} from "../../lib/attendance.api";
import RosterTable, { type RecordMap } from "../../components/Attendance/RosterTable";
import type { AttendanceRosterStudent, AttendanceSession, AttendanceStatus, AttendanceSessionType } from "../../types/types";

const todayStr = () => new Date().toISOString().slice(0, 10);

const MarkAttendance = () => {
  const { classKey = "", subjectId = "" } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.admin);
  const role = user?.role ?? "faculty";
  const basePath = role === "chairperson" ? "/chairperson" : role === "coordinator" ? "/coordinator" : "/faculty";

  const [roster, setRoster] = useState<AttendanceRosterStudent[] | null>(null);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<RecordMap>(new Map());
  const [date, setDate] = useState(todayStr());
  const [sessionType, setSessionType] = useState<AttendanceSessionType>("lecture");
  const [topic, setTopic] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (forDate: string) => {
    setError(null);
    try {
      const [students, sessions] = await Promise.all([
        getClassRoster(decodeURIComponent(classKey)),
        getTodaySession(decodeURIComponent(classKey), Number(subjectId), forDate),
      ]);
      setRoster(students);
      if (sessions.length > 0) {
        const s = sessions[0];
        setSession(s);
        setSessionType(s.sessionType);
        setTopic(s.topic ?? "");
        setStartTime(s.startTime ?? "");
        setEndTime(s.endTime ?? "");
        const detailed = await getSessionRecords(s.id);
        const m: RecordMap = new Map();
        for (const r of detailed.records) {
          m.set(r.studentId, { status: r.status as AttendanceStatus, remarks: r.remarks ?? "" });
        }
        setRecords(m);
      } else {
        setSession(null);
        setRecords(new Map());
        setTopic(""); setStartTime(""); setEndTime("");
      }
    } catch (e) {
      setError((e as Error).message ?? "Failed to load");
    }
  }, [classKey, subjectId]);

  useEffect(() => { load(date); /* eslint-disable-next-line */ }, [load]);

  const locked = session?.status === "locked" || session?.status === "submitted";
  const markedCount = useMemo(
    () => [...records.values()].filter((r) => r.status).length,
    [records]
  );

  const setStatus = (studentId: number, status: AttendanceStatus | null) => {
    setRecords((prev) => {
      const m = new Map(prev);
      const cur = m.get(studentId) ?? { status: null, remarks: "" };
      m.set(studentId, { ...cur, status });
      return m;
    });
  };
  const setBulk = (status: AttendanceStatus | null) => {
    setRecords((prev) => {
      const m = new Map(prev);
      roster?.forEach((s) => {
        const cur = m.get(s.id) ?? { status: null, remarks: "" };
        m.set(s.id, { ...cur, status });
      });
      return m;
    });
  };
  const setRemarks = (studentId: number, remarks: string) => {
    setRecords((prev) => {
      const m = new Map(prev);
      const cur = m.get(studentId) ?? { status: null, remarks: "" };
      m.set(studentId, { ...cur, remarks });
      return m;
    });
  };

  const persist = async (thenLock: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      let s = session;
      if (!s) {
        s = await createSession({
          classKey: decodeURIComponent(classKey),
          subjectId: Number(subjectId),
          date, sessionType, topic: topic || undefined,
          startTime: startTime || undefined, endTime: endTime || undefined,
        });
        setSession(s);
      } else if (s.status === "draft") {
        s = await updateSession(s.id, {
          topic: topic || undefined, sessionType,
          startTime: startTime || undefined, endTime: endTime || undefined,
        });
        setSession(s);
      }

      const payload = [...records.entries()]
        .filter(([, r]) => r.status)
        .map(([studentId, r]) => ({ studentId, status: r.status!, remarks: r.remarks || null }));
      if (payload.length > 0) await upsertAttendanceRecords(s.id, payload);

      if (thenLock) {
        if (markedCount === 0) throw new Error("Mark at least one student before submitting");
        if (roster && markedCount < roster.length) {
          const proceed = window.confirm(
            `${roster.length - markedCount} student(s) are still unmarked and will not be included. ` +
            "Once submitted, this attendance cannot be edited by teaching staff. Continue?"
          );
          if (!proceed) { setBusy(false); return; }
        } else {
          const proceed = window.confirm("Once submitted, this attendance cannot be edited by teaching staff. Continue?");
          if (!proceed) { setBusy(false); return; }
        }
        const lockedSession = await submitSession(s.id);
        setSession(lockedSession);
        toast.success("Attendance submitted and locked");
      } else {
        toast.success("Draft saved");
      }
    } catch (e) {
      toast.error((e as Error).message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
        <button onClick={() => navigate(`${basePath}/mark-attendance`)} className="mt-4 text-sm underline cursor-pointer">Back to classes</button>
=======
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
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate(`${basePath}/mark-attendance`)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-4 cursor-pointer">
        <ArrowLeft size={15} /> Back to classes
      </button>

      <div className="bg-white border border-[#d9d9d9] rounded-lg shadow-sm p-5 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Subject #{subjectId}</h1>
            <p className="text-xs text-gray-500">{decodeURIComponent(classKey).split("::").join(" · ")}</p>
          </div>
          <span className={`text-[11px] px-2 py-1 rounded-full border whitespace-nowrap ${
            !session ? "bg-gray-100 text-gray-600 border-gray-200"
            : session.status === "draft" ? "bg-amber-100 text-amber-800 border-amber-200"
            : "bg-green-100 text-green-800 border-green-200"}`}>
            {!session ? "Not Marked" : session.status === "draft" ? "Draft" : "Locked"}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          <label className="text-xs text-gray-500">Date
            <input type="date" max={todayStr()} value={date} disabled={!!locked}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 text-sm border border-[#d9d9d9] rounded px-2 py-1.5 focus:outline-none focus:border-gray-400" />
          </label>
          <label className="text-xs text-gray-500">Session Type
            <select value={sessionType} disabled={!!locked} onChange={(e) => setSessionType(e.target.value as AttendanceSessionType)}
              className="w-full mt-1 text-sm border border-[#d9d9d9] rounded px-2 py-1.5 focus:outline-none focus:border-gray-400">
              <option value="lecture">Lecture</option>
              <option value="lab">Lab</option>
              <option value="tutorial">Tutorial</option>
            </select>
          </label>
          <label className="text-xs text-gray-500">Topic
            <input value={topic} disabled={!!locked} onChange={(e) => setTopic(e.target.value)} placeholder="Topic covered"
              className="w-full mt-1 text-sm border border-[#d9d9d9] rounded px-2 py-1.5 focus:outline-none focus:border-gray-400" />
          </label>
          <label className="text-xs text-gray-500">Start
            <input type="time" value={startTime} disabled={!!locked} onChange={(e) => setStartTime(e.target.value)}
              className="w-full mt-1 text-sm border border-[#d9d9d9] rounded px-2 py-1.5 focus:outline-none focus:border-gray-400" />
          </label>
          <label className="text-xs text-gray-500">End
            <input type="time" value={endTime} disabled={!!locked} onChange={(e) => setEndTime(e.target.value)}
              className="w-full mt-1 text-sm border border-[#d9d9d9] rounded px-2 py-1.5 focus:outline-none focus:border-gray-400" />
          </label>
        </div>
      </div>

      {roster === null ? (
        <div className="bg-white border border-[#d9d9d9] rounded-lg p-10 animate-pulse h-40" />
      ) : (
        <>
          <RosterTable students={roster} records={records} onSet={setStatus} onBulk={setBulk} onRemarks={setRemarks} disabled={!!locked || busy} />

          {locked ? (
            <p className="mt-4 text-sm text-gray-500">This session is locked. Ask an administrator to unlock it if changes are needed.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-4">
              <button disabled={busy} onClick={() => persist(false)} className="px-4 py-2 text-sm rounded border border-black text-black hover:bg-gray-50 disabled:opacity-40 cursor-pointer">
                {busy ? "Saving…" : "Save Draft"}
              </button>
              <button disabled={busy} onClick={() => persist(true)} className="px-4 py-2 text-sm rounded bg-black text-white hover:bg-gray-800 disabled:opacity-40 cursor-pointer">
                Submit &amp; Lock
              </button>
              <button disabled={busy} onClick={() => navigate(`${basePath}/mark-attendance`)} className="px-4 py-2 text-sm rounded border border-[#d9d9d9] text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer">
                Cancel
              </button>
            </div>
          )}
        </>
      )}
=======
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
>>>>>>> 95d01e0 (feat: complete SDMS audit, timetable mapping & viewer, security and database hardening)
    </div>
  );
};

export default MarkAttendance;
