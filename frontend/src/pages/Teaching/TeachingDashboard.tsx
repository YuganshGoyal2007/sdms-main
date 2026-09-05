import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ClipboardCheck, RefreshCw, Inbox, BookOpen, Layers, CheckCircle2, Clock, Search } from 'lucide-react';
import type { RootState } from '../../context/app/store';
import { getMyClasses } from '../../lib/teaching.api';
import type { TeachingClass } from '../../types/types';
import TeachingClassCard from '../../components/Teaching/TeachingClassCard';
import AdminSideNav from '../../components/Admin/AdminSideNav';

const TeachingDashboard = () => {
  const user = useSelector((s: RootState) => s.admin);
  const location = useLocation();

  const basePath = useMemo(() => {
    if (location.pathname.startsWith('/chairperson')) return '/chairperson';
    if (location.pathname.startsWith('/coordinator')) return '/coordinator';
    if (location.pathname.startsWith('/faculty')) return '/faculty';
    if (user?.role === 'chairperson') return '/chairperson';
    if (user?.role === 'coordinator') return '/coordinator';
    return '/faculty';
  }, [location.pathname, user?.role]);

  const activeTab = useMemo(() => {
    if (location.pathname.includes('/dashboard')) return 'dashboard';
    if (location.pathname.includes('/classes')) return 'classes';
    return 'attendance';
  }, [location.pathname]);

  const [classes, setClasses] = useState<TeachingClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyClasses();
      if (res?.success) {
        setClasses(res.classes);
        setDate(res.date);
      } else {
        toast.error(res?.message || 'Failed to load your classes.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || error?.message || 'Failed to load your classes.';
      if (status === 403) {
        toast.error('You do not have access to attendance marking.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, location.pathname, location.key]);

  const distinctSubjects = useMemo(() => {
    return new Set(classes.map((c) => c.subjectId)).size;
  }, [classes]);

  const markedCount = useMemo(() => {
    return classes.filter((c) => c.todaySession?.status === 'submitted' || c.todaySession?.status === 'locked').length;
  }, [classes]);

  const pendingCount = useMemo(() => {
    return classes.length - markedCount;
  }, [classes, markedCount]);

  const filteredClasses = useMemo(() => {
    if (!searchTerm.trim()) return classes;
    const q = searchTerm.toLowerCase();
    return classes.filter(
      (c) =>
        c.subjectName?.toLowerCase().includes(q) ||
        c.subjectCode?.toLowerCase().includes(q) ||
        c.specialization?.toLowerCase().includes(q) ||
        c.program?.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q)
    );
  }, [classes, searchTerm]);

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab={activeTab} />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 bg-white border-b border-[#d9d9d9] px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="text-[#7b3b5a]" size={24} />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {activeTab === 'dashboard'
                  ? user?.role === 'coordinator'
                    ? 'Coordinator Teaching Dashboard'
                    : user?.role === 'chairperson'
                    ? 'Chairperson Teaching Dashboard'
                    : 'Faculty Dashboard'
                  : activeTab === 'classes'
                  ? 'My Classes'
                  : 'Mark Attendance'}
              </h1>
              <p className="text-xs text-gray-500">
                {loading
                  ? 'Loading assignments...'
                  : `${date ? `Today · ${date}` : 'Today'} · ${classes.length} ${classes.length === 1 ? 'class' : 'classes'} assigned`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subject or class..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7b3b5a]"
              />
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#d9d9d9] hover:bg-[#f3f3f3] disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0 p-4 sm:p-6 space-y-5">
          {/* Summary Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-[#d9d9d9] rounded-xl p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#7b3b5a] flex items-center justify-center shrink-0">
                <Layers size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{loading ? '—' : classes.length}</div>
                <div className="text-xs text-gray-500 font-medium">Classes Assigned</div>
              </div>
            </div>

            <div className="bg-white border border-[#d9d9d9] rounded-xl p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{loading ? '—' : distinctSubjects}</div>
                <div className="text-xs text-gray-500 font-medium">Subjects Taught</div>
              </div>
            </div>

            <div className="bg-white border border-[#d9d9d9] rounded-xl p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700">{loading ? '—' : markedCount}</div>
                <div className="text-xs text-gray-500 font-medium">Marked Today</div>
              </div>
            </div>

            <div className="bg-white border border-[#d9d9d9] rounded-xl p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700">{loading ? '—' : pendingCount}</div>
                <div className="text-xs text-gray-500 font-medium">Pending Today</div>
              </div>
            </div>
          </div>

          {/* Classes Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-[#d9d9d9] rounded-xl p-5 animate-pulse h-64" />
              ))}
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="bg-white border border-[#d9d9d9] rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <Inbox className="text-gray-400 mb-3" size={48} />
              <h2 className="text-lg font-semibold text-gray-800">
                {searchTerm ? 'No matching classes found' : 'No classes assigned yet'}
              </h2>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                {searchTerm
                  ? 'Try searching with a different subject name, subject code, or program.'
                  : 'An administrator needs to assign you to a subject and class before you can mark attendance.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((c) => (
                <TeachingClassCard key={c.assignmentId} cls={c} basePath={basePath} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeachingDashboard;
