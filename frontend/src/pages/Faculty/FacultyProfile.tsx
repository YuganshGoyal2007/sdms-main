import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Calendar,
  BookOpen,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import type { RootState } from '../../context/app/store';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import api from '../../lib/api';

interface FacultyProfileData {
  id: number;
  name: string;
  facultyId: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  createdAt?: string;
}

interface AssignedClass {
  id: number;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  subjectCredits: number;
  subjectType: string;
  teacherRole: string;
  school: string;
  department: string;
  program: string;
  batch: string;
  specialization: string;
  semester: number;
  academicYear: string;
}

const FacultyProfile = () => {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.admin);
  const [profile, setProfile] = useState<FacultyProfileData | null>(null);
  const [assignments, setAssignments] = useState<AssignedClass[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/faculty/me');
      if (res?.data?.success) {
        setProfile(res.data.user);
        setAssignments(res.data.assignments || []);
      } else {
        toast.error('Failed to load profile.');
      }
    } catch {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const initial = (
    profile?.name?.charAt(0) ||
    user?.name?.charAt(0) ||
    user?.username?.charAt(0) ||
    'F'
  ).toUpperCase();

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab="profile" />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-[#d9d9d9] px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7b3b5a] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {initial}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Faculty Profile</h1>
              <p className="text-xs text-gray-500">Personal details & teaching portfolio</p>
            </div>
          </div>
          <button
            onClick={fetchProfile}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#d9d9d9] hover:bg-[#f3f3f3] disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0 p-4 sm:p-6 space-y-6">
          {/* Top Banner Card */}
          <div className="bg-white border border-[#d9d9d9] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7b3b5a] to-[#4a1c33] text-white flex items-center justify-center text-3xl font-bold shadow-md">
                {initial}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile?.name || user?.name || user?.username || 'Faculty Member'}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7b3b5a] border border-purple-200">
                    <ShieldCheck size={12} />
                    Faculty
                  </span>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-2 font-mono">
                  ID: {profile?.facultyId || `FAC-${profile?.id || '—'}`}
                </p>
                <p className="text-xs text-gray-500">
                  Department of {profile?.department || 'Academic Affairs'}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/faculty/mark-attendance')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7b3b5a] hover:bg-[#5e2a44] text-white text-sm font-medium rounded-xl transition shadow-xs cursor-pointer"
            >
              <BookOpen size={16} />
              Start Class Attendance
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="bg-white border border-[#d9d9d9] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <UserIcon size={18} className="text-[#7b3b5a]" />
                <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-2">
                    <UserIcon size={14} /> Full Name
                  </span>
                  <span className="font-semibold text-gray-800">
                    {profile?.name || user?.name || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Mail size={14} /> Email Address
                  </span>
                  <span className="font-medium text-gray-800 font-mono text-xs">
                    {profile?.email || user?.email || user?.username || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Phone size={14} /> Phone Number
                  </span>
                  <span className="font-semibold text-gray-800">
                    {profile?.phone || 'Not provided'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Building size={14} /> Department
                  </span>
                  <span className="font-semibold text-gray-800">
                    {profile?.department || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Calendar size={14} /> Member Since
                  </span>
                  <span className="font-medium text-gray-700">{joinedDate}</span>
                </div>
              </div>
            </div>

            {/* Teaching Summary */}
            <div className="bg-white border border-[#d9d9d9] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Layers size={18} className="text-[#7b3b5a]" />
                <h3 className="text-base font-semibold text-gray-900">Teaching Summary</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-extrabold text-[#7b3b5a]">
                    {assignments.length}
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-1">Total Classes Assigned</div>
                </div>

                <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-extrabold text-blue-700">
                    {new Set(assignments.map((a) => a.subjectId)).size}
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-1">Distinct Subjects</div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold mb-1">Attendance Policy Notice</p>
                Faculty members are required to submit daily attendance records within 24 hours of session completion. All locked records are permanently archived for semester audit.
              </div>
            </div>
          </div>

          {/* Assigned Subjects & Classes Table */}
          <div className="bg-white border border-[#d9d9d9] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#7b3b5a]" />
                <h3 className="text-base font-semibold text-gray-900">Assigned Classes & Subjects</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                {assignments.length} {assignments.length === 1 ? 'class' : 'classes'}
              </span>
            </div>

            {assignments.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No teaching assignments currently registered for this faculty member.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#f8f9fa] text-gray-600 font-semibold border-b border-gray-200 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Semester</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assignments.map((cls) => (
                      <tr key={cls.id} className="hover:bg-gray-50 transition">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          {cls.subjectName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-500">
                          {cls.subjectCode}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">
                          <div>
                            <span className="font-medium">{cls.program} {cls.batch}</span>
                            <div className="text-[11px] text-gray-500">{cls.specialization}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">
                          Sem {cls.semester} ({cls.academicYear})
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200">
                            {cls.subjectType} ({cls.subjectCredits} cr)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 capitalize text-gray-700">
                          {cls.teacherRole}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => navigate('/faculty/mark-attendance')}
                            className="text-xs font-semibold text-[#7b3b5a] hover:underline"
                          >
                            Mark Attendance →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FacultyProfile;
