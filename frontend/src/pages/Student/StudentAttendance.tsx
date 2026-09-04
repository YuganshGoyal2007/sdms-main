import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getMyAttendanceSummary, getMySubjectAttendance } from "../../lib/attendance.api";
import StatCards from "../../components/Attendance/StatCards";
import SubjectBarChart from "../../components/Attendance/SubjectBarChart";
import type { StudentAttendanceSummary } from "../../types/types";

const statusChip = (s: string) =>
  s === "present" ? "bg-green-100 text-green-800"
  : s === "absent" ? "bg-red-100 text-red-800"
  : "bg-indigo-100 text-indigo-800";

const StudentAttendance = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drill, setDrill] = useState<Awaited<ReturnType<typeof getMySubjectAttendance>> | null>(null);

  useEffect(() => {
    let alive = true;
    getMyAttendanceSummary()
      .then((d) => { if (alive) setSummary(d); })
      .catch((e: any) => { if (alive) setError(e?.response?.data?.message ?? e?.message ?? "Failed to load attendance"); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!subjectId || !summary) return;
    let alive = true;
    getMySubjectAttendance(summary.student.rollNo, Number(subjectId))
      .then((d) => { if (alive) setDrill(d); })
      .catch((e: any) => { if (alive) setError(e?.response?.data?.message ?? e?.message ?? "Failed to load subject attendance"); });
    return () => { alive = false; };
  }, [subjectId, summary]);

  if (error) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-4">
        <div className="h-20 bg-white border border-[#d9d9d9] rounded-lg animate-pulse" />
        <div className="h-64 bg-white border border-[#d9d9d9] rounded-lg animate-pulse" />
      </div>
    );
  }

  const drillSubject = subjectId ? summary.subjects.find((s) => s.subjectId === Number(subjectId)) : null;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {drillSubject && (
        <button onClick={() => navigate("/student/attendance")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-4 cursor-pointer">
          <ArrowLeft size={15} /> All subjects
        </button>
      )}

      <h1 className="text-xl sm:text-2xl font-bold mb-1">
        {drillSubject ? drillSubject.subjectName ?? `Subject #${drillSubject.subjectId}` : "My Attendance"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">{summary.student.fullName} · {summary.student.rollNo}</p>

      {drillSubject ? (
        drill ? (
          <>
            <StatCards
              percentage={drill.summary.percentage}
              present={drill.summary.present}
              absent={drill.summary.absent}
              subjects={drill.summary.marked}
            />
            <div className="bg-white border border-[#d9d9d9] rounded-lg shadow-sm mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#d9d9d9] bg-[#f8f9fa] text-left text-xs text-gray-500">
                    <th className="p-3">Date</th>
                    <th className="p-3">Session Type</th>
                    <th className="p-3">Topic</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drill.history.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500 text-sm">No sessions held for this subject yet.</td></tr>
                  )}
                  {drill.history.map((h) => (
                    <tr key={h.sessionId} className="border-b border-[#ececec] last:border-0">
                      <td className="p-3 whitespace-nowrap">{h.date}</td>
                      <td className="p-3 capitalize">{h.sessionType}</td>
                      <td className="p-3">{h.topic ?? "—"}</td>
                      <td className="p-3">
                        {h.status
                          ? <span className={`text-[11px] px-2 py-1 rounded-full capitalize ${statusChip(h.status)}`}>{h.status}</span>
                          : <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-500">unmarked</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="bg-white border border-[#d9d9d9] rounded-lg p-10 animate-pulse h-40" />
        )
      ) : (
        <>
          <StatCards
            percentage={summary.overall.percentage}
            present={summary.overall.present}
            absent={summary.overall.absent}
            subjects={summary.subjects.length}
          />

          <div className="mt-4">
            <SubjectBarChart subjects={summary.subjects} />
          </div>

          <div className="bg-white border border-[#d9d9d9] rounded-lg shadow-sm mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d9d9d9] bg-[#f8f9fa] text-left text-xs text-gray-500">
                  <th className="p-3">Subject</th>
                  <th className="p-3">%</th>
                  <th className="p-3">P / A / E</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {summary.subjects.map((s) => (
                  <tr key={s.subjectId} className="border-b border-[#ececec] last:border-0 hover:bg-[#f8f9fa]">
                    <td className="p-3">{s.subjectName ?? `#${s.subjectId}`} <span className="text-xs text-gray-400">{s.subjectCode}</span></td>
                    <td className={`p-3 font-semibold ${(s.percentage ?? 0) >= 75 ? "text-green-700" : (s.percentage ?? 0) >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {s.percentage === null ? "—" : `${s.percentage}%`}
                    </td>
                    <td className="p-3 text-xs">{s.present} / {s.absent} / {s.excused}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => navigate(`/student/attendance/${s.subjectId}`)} className="text-xs underline text-gray-500 hover:text-black cursor-pointer">View sessions</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-[#d9d9d9] rounded-lg shadow-sm mt-4 overflow-x-auto">
            <h2 className="text-sm font-semibold p-3 border-b border-[#ececec]">Recent Sessions</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d9d9d9] bg-[#f8f9fa] text-left text-xs text-gray-500">
                  <th className="p-3">Date</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Topic</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500 text-sm">No attendance recorded yet.</td></tr>
                )}
                {summary.recent.map((r) => (
                  <tr key={r.sessionId} className="border-b border-[#ececec] last:border-0">
                    <td className="p-3 whitespace-nowrap">{r.date}</td>
                    <td className="p-3">{r.subjectName ?? r.subjectCode}</td>
                    <td className="p-3">{r.topic ?? "—"}</td>
                    <td className="p-3"><span className={`text-[11px] px-2 py-1 rounded-full capitalize ${statusChip(r.status)}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAttendance;
