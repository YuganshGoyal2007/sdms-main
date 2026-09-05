import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { ClipboardList, ChevronLeft, Loader2, Calendar, BookOpen, History, Tag } from 'lucide-react';
import type { RootState } from '../../context/app/store';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import StatCards from '../../components/Attendance/StatCards';
import SubjectBarChart from '../../components/Attendance/SubjectBarChart';
import { getStudentAttendanceSummary } from '../../lib/attendance.api';
import type {
  StudentAttendanceSummaryResponse,
  StudentRecentSession,
  SubjectAttendanceSummary,
  AttendanceStatus,
} from '../../types/types';

const statusBadge = (status: AttendanceStatus | 'unmarked') => {
  if (status === 'present') return { label: 'Present', className: 'bg-emerald-100 text-emerald-800' };
  if (status === 'absent') return { label: 'Absent', className: 'bg-red-100 text-red-800' };
  if (status === 'excused') return { label: 'Excused', className: 'bg-amber-100 text-amber-800' };
  return { label: 'Unmarked', className: 'bg-gray-100 text-gray-700' };
};

const StudentAttendance = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId?: string }>();
  const user = useSelector((s: RootState) => s.admin);
  const student = useSelector((s: RootState) => s.user?.student);

  const [data, setData] = useState<StudentAttendanceSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // The rollNo to use — prefer student state / auth, fall back to 'me'
  const targetRollNo = subjectId ? 'me' : (student?.rollNo || student?.enrollmentNo || user?.username || (user?.email ? user.email.split('@')[0] : 'me'));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rollNo = targetRollNo || 'me';
      const res = await getStudentAttendanceSummary(rollNo);
      if (res.success) setData(res);
      else toast.error(res?.message || 'Failed to load attendance.');
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || error?.message || 'Failed to load attendance.';
      if (status === 403) toast.error('You can only view your own attendance.');
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [targetRollNo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const subjectDrilldown = subjectId && data
    ? data.subjects.find((s) => String(s.subjectId) === String(subjectId))
    : null;

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab="attendance" />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 bg-white border-b border-[#d9d9d9] px-4 sm:px-6 py-4 flex items-center gap-3">
          {subjectId && (
            <button onClick={() => navigate('/student/attendance')} className="p-2 rounded-lg hover:bg-[#f3f3f3]" aria-label="Back">
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="text-[#7b3b5a]" size={20} />
              {subjectId ? 'Subject Attendance' : 'My Attendance'}
            </h1>
            {data?.student && (
              <p className="text-xs text-gray-500 truncate">
                {data.student.fullName} · {data.student.rollNo} · {data.student.school} · {data.student.department} · {data.student.program} · {data.student.batch} · {data.student.specialization}
              </p>
            )}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0 p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-[#7b3b5a]" size={32} />
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-gray-500">No data available.</div>
          ) : subjectDrilldown ? (
            <SubjectDrilldown data={data} subject={subjectDrilldown} recent={data.recentSessions} />
          ) : (
            <>
              <StatCards
                items={[
                  {
                    label: 'Overall Attendance',
                    value: `${data.overall.percentage}%`,
                    icon: 'trending',
                    color: data.overall.percentage >= 75 ? 'bg-emerald-600' : data.overall.percentage >= 60 ? 'bg-amber-500' : 'bg-red-600',
                  },
                  { label: 'Present Days', value: data.overall.present, icon: 'check', color: 'bg-emerald-600' },
                  { label: 'Absent Days', value: data.overall.absent, icon: 'x', color: 'bg-red-600' },
                  { label: 'Subjects Tracked', value: data.subjects.length, icon: 'book', color: 'bg-indigo-600' },
                ]}
              />

              <div className="bg-white border border-[#d9d9d9] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-[#7b3b5a]" />
                  <h2 className="text-sm font-semibold text-gray-900">Subject-wise Attendance</h2>
                </div>
                <SubjectBarChart data={data.subjects} />
              </div>

              <div className="bg-white border border-[#d9d9d9] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <History size={16} className="text-[#7b3b5a]" />
                  <h2 className="text-sm font-semibold text-gray-900">Recent Sessions</h2>
                </div>
                <RecentSessionsTable sessions={data.recentSessions} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const RecentSessionsTable = ({ sessions }: { sessions: StudentRecentSession[] }) => {
  if (!sessions.length) {
    return <div className="text-sm text-gray-500 py-4 text-center">No recent sessions.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-gray-600">
          <tr className="border-b border-[#f0f0f0]">
            <th className="text-left py-2 pr-3">Date</th>
            <th className="text-left py-2 pr-3">Subject</th>
            <th className="text-left py-2 pr-3">Topic</th>
            <th className="text-left py-2 pr-3">Type</th>
            <th className="text-left py-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => {
            const b = statusBadge(s.status);
            return (
              <tr key={s.sessionId} className="border-b border-[#f8f8f8]">
                <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">{s.date}</td>
                <td className="py-2 pr-3">
                  <div className="font-medium">{s.subjectName || '—'}</div>
                  <div className="text-xs text-gray-500 font-mono">{s.subjectCode || ''}</div>
                </td>
                <td className="py-2 pr-3 text-gray-700 max-w-xs truncate">{s.topic || '—'}</td>
                <td className="py-2 pr-3 capitalize text-gray-700">{s.sessionType}</td>
                <td className="py-2 pr-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${b.className}`}>
                    {b.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const SubjectDrilldown = ({
  data,
  subject,
  recent,
}: {
  data: StudentAttendanceSummaryResponse;
  subject: SubjectAttendanceSummary;
  recent: StudentRecentSession[];
}) => {
  const subjectSessions = recent.filter((r) => String(r.subjectId ?? '') === String(subject.subjectId));
  const filtered = subjectSessions.length > 0
    ? subjectSessions
    : recent.filter((r) => r.subjectName === subject.subjectName || r.subjectCode === subject.subjectCode);
  return (
    <>
      <div className="bg-white border border-[#d9d9d9] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-900">{subject.subjectName}</h2>
        <p className="text-sm text-gray-500 font-mono">{subject.subjectCode} · Sem {subject.semester ?? '—'} · {subject.type || 'theory'}</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-center">
          <Counter label="Percentage" value={`${subject.percentage}%`} color={subject.percentage >= 75 ? 'emerald' : subject.percentage >= 60 ? 'amber' : 'red'} />
          <Counter label="Present" value={subject.present} color="emerald" />
          <Counter label="Absent" value={subject.absent} color="red" />
          <Counter label="Excused" value={subject.excused} color="amber" />
          <Counter label="Total" value={subject.total} color="slate" />
        </div>
      </div>
      <div className="bg-white border border-[#d9d9d9] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-[#7b3b5a]" />
          <h2 className="text-sm font-semibold text-gray-900">Session History</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">No sessions yet for this subject.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-gray-600">
                <tr className="border-b border-[#f0f0f0]">
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-left py-2 pr-3">Type</th>
                  <th className="text-left py-2 pr-3">Topic</th>
                  <th className="text-left py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const b = statusBadge(s.status);
                  return (
                    <tr key={s.sessionId} className="border-b border-[#f8f8f8]">
                      <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">{s.date}</td>
                      <td className="py-2 pr-3 capitalize text-gray-700">{s.sessionType}</td>
                      <td className="py-2 pr-3 text-gray-700 max-w-xs truncate">{s.topic || '—'}</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${b.className}`}>
                          {b.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Tag size={12} /> Total of {data.subjects.length} subjects tracked.
      </div>
    </>
  );
};

const Counter = ({ label, value, color }: { label: string; value: string | number; color: string }) => {
  const palette: Record<string, string> = {
    emerald: 'border-emerald-200 text-emerald-700',
    red: 'border-red-200 text-red-700',
    amber: 'border-amber-200 text-amber-700',
    slate: 'border-slate-300 text-slate-800 bg-slate-50',
  };
  return (
    <div className={`border rounded-md py-2 ${palette[color] || palette.slate}`}>
      <div className="text-[10px] uppercase tracking-wider">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
};

export default StudentAttendance;
