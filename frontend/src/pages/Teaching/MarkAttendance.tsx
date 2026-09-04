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
      </div>
    );
  }

  return (
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
    </div>
  );
};

export default MarkAttendance;
