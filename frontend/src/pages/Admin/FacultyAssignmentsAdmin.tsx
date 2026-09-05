import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Plus, Trash2, Search, UserCheck, BookOpen, Loader2, RefreshCw, X, Save, Sparkles } from 'lucide-react';
import type { RootState } from '../../context/app/store';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import {
  listFacultyAssignments,
  createFacultyAssignment,
  deleteFacultyAssignment,
  getEligibleTeachers,
  type EligibleTeacher,
  type CreateAssignmentPayload,
} from '../../lib/attendance.api';
import { viewSpecializations } from '../../lib/user.api';
import type { FacultyAssignment, TeacherRole, SpecializationProps } from '../../types/types';
import { safeErrorMessage } from '../../utils/safeError';

const roleBadge = (role: TeacherRole) => {
  if (role === 'chairperson') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (role === 'coordinator') return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
};

const SCHOOL_OPTIONS = [
  { code: 'soict', name: 'School of Information & Comm. Tech (SOICT)' },
  { code: 'soe', name: 'School of Engineering (SOE)' },
  { code: 'sobt', name: 'School of Biotechnology (SOBT)' },
  { code: 'som', name: 'School of Management (SOM)' },
  { code: 'sohss', name: 'School of Humanities & Social Sciences (SOHSS)' },
  { code: 'soljg', name: 'School of Law, Justice & Governance (SOLJG)' },
  { code: 'sovsas', name: 'School of Vocational Studies & Applied Sciences (SOVSAS)' },
];

const DEPARTMENT_MAP: Record<string, { code: string; name: string }[]> = {
  soict: [
    { code: 'cse', name: 'Computer Science and Engineering (CSE)' },
    { code: 'it', name: 'Information Technology (IT)' },
    { code: 'ece', name: 'Electrical Engineering (ECE)' },
  ],
  soe: [
    { code: 'ce', name: 'Civil Engineering' },
    { code: 'me', name: 'Mechanical Engineering' },
    { code: 'ee', name: 'Electrical Engineering' },
    { code: 'ar', name: 'Architecture & Planning' },
  ],
  sobt: [{ code: 'bt', name: 'Biotechnology' }],
  som: [{ code: 'mb', name: 'Business Management' }],
  sohss: [
    { code: 'en', name: 'English and Modern Languages' },
    { code: 'mc', name: 'Mass Communication' },
    { code: 'sw', name: 'Social Work' },
  ],
  soljg: [{ code: 'lb', name: 'Law, Justice & Governance' }],
  sovsas: [
    { code: 'ma', name: 'Applied Mathematics' },
    { code: 'ph', name: 'Applied Physics' },
    { code: 'ch', name: 'Applied Chemistry' },
    { code: 'es', name: 'Environmental Sciences' },
  ],
};

const PROGRAM_OPTIONS = [
  'B.Tech',
  'M.Tech',
  'BCA',
  'MCA',
  'B.Tech + M.Tech',
  'Ph.D.',
  'B.Arch',
  'MBA',
  'B.Sc',
  'M.Sc',
];

const DEFAULT_BATCHES = ['2021-25', '2022-26', '2023-27', '2024-28', '2025-29', '2026-30'];

const DEFAULT_SPECIALIZATIONS = [
  'Cyber Security',
  'Artificial Intelligence',
  'Data Science',
  'Cloud Computing',
  'IoT and Robotics',
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication',
  'Civil Engineering',
  'Mechanical Engineering',
  'General',
];

const ACADEMIC_YEARS = ['2023-24', '2024-25', '2025-26', '2026-27', '2027-28', '2028-29'];

const DEFAULT_FORM = {
  facultyId: '',
  teacherRole: 'faculty' as TeacherRole,
  subjectId: '',
  subjectName: '',
  subjectCode: '',
  school: 'soict',
  department: 'cse',
  program: 'B.Tech',
  batch: '2025-29',
  specialization: 'Cyber Security',
  semester: '3',
  academicYear: '2026-27',
};

const FacultyAssignmentsAdmin = () => {
  const user = useSelector((s: RootState) => s.admin);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [teachers, setTeachers] = useState<EligibleTeacher[]>([]);
  const [specializationsData, setSpecializationsData] = useState<SpecializationProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isAdmin = user?.role === 'admin';

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFacultyAssignments();
      if (res.success) setAssignments(res.assignments);
    } catch (err: unknown) {
      toast.error(safeErrorMessage(err, 'Failed to load faculty assignments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetadata = useCallback(async () => {
    try {
      const [teachersRes, specsRes] = await Promise.all([
        getEligibleTeachers().catch(() => ({ success: false, count: 0, teachers: [] })),
        viewSpecializations().catch(() => null),
      ]);
      if (teachersRes.success && teachersRes.teachers) {
        setTeachers(teachersRes.teachers);
      }
      if (specsRes && Array.isArray(specsRes)) {
        setSpecializationsData(specsRes);
      }
    } catch {
      // Non-critical fallback
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAssignments();
      loadMetadata();
    }
  }, [isAdmin, loadAssignments, loadMetadata]);

  // Derived batches from system
  const availableBatches = useMemo(() => {
    const list = new Set(DEFAULT_BATCHES);
    specializationsData.forEach((s) => {
      if (s.batch) list.add(s.batch);
    });
    return Array.from(list).sort();
  }, [specializationsData]);

  // Derived specializations from system
  const availableSpecializations = useMemo(() => {
    const list = new Set(DEFAULT_SPECIALIZATIONS);
    specializationsData.forEach((s) => {
      if (s.name) list.add(s.name);
    });
    return Array.from(list).sort();
  }, [specializationsData]);

  const departmentOptions = useMemo(() => {
    return DEPARTMENT_MAP[form.school] || DEPARTMENT_MAP['soict'];
  }, [form.school]);

  const handleTeacherSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const teacher = teachers.find((t) => String(t.id) === val);
    if (teacher) {
      setForm((prev) => ({
        ...prev,
        facultyId: String(teacher.id),
        teacherRole: teacher.role,
        school: teacher.school && DEPARTMENT_MAP[teacher.school] ? teacher.school : prev.school,
        department: teacher.department || prev.department,
      }));
    } else {
      setForm((prev) => ({ ...prev, facultyId: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const facultyIdNum = Number(form.facultyId);
    const subjectIdNum = Number(form.subjectId);
    const semesterNum = Number(form.semester);

    if (!Number.isInteger(facultyIdNum) || facultyIdNum <= 0) {
      toast.error('Please select an eligible teacher from the list.');
      return;
    }

    const hasSubjectId = Number.isInteger(subjectIdNum) && subjectIdNum > 0;
    const hasSubjectText = form.subjectName.trim().length > 0 && form.subjectCode.trim().length > 0;

    if (!hasSubjectId && !hasSubjectText) {
      toast.error('Please type Subject Name and Subject Code, or enter a valid Subject ID.');
      return;
    }

    if (!form.batch.trim() || !form.specialization.trim()) {
      toast.error('Batch and Specialization are required.');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateAssignmentPayload = {
        facultyId: facultyIdNum,
        userId: facultyIdNum,
        teacherRole: form.teacherRole,
        school: form.school.trim(),
        department: form.department.trim(),
        program: form.program.trim(),
        batch: form.batch.trim(),
        specialization: form.specialization.trim(),
        semester: semesterNum,
        academicYear: form.academicYear.trim(),
      };

      if (hasSubjectId) {
        payload.subjectId = subjectIdNum;
      }
      if (form.subjectName.trim()) {
        payload.subjectName = form.subjectName.trim();
      }
      if (form.subjectCode.trim()) {
        payload.subjectCode = form.subjectCode.trim();
      }

      const res = await createFacultyAssignment(payload);
      if (res.success) {
        toast.success('Teaching assignment created successfully.');
        setShowForm(false);
        setForm({ ...DEFAULT_FORM });
        loadAssignments();
      }
    } catch (err: unknown) {
      toast.error(safeErrorMessage(err, 'Failed to create assignment.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this teaching assignment?')) return;
    setDeletingId(id);
    try {
      const res = await deleteFacultyAssignment(id);
      if (res.success) {
        toast.success('Assignment deleted.');
        loadAssignments();
      }
    } catch (err: unknown) {
      toast.error(safeErrorMessage(err, 'Failed to delete assignment.'));
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8f9fa] text-gray-600">
        Only admins can manage faculty assignments.
      </div>
    );
  }

  const filtered = assignments.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [
      a.facultyName,
      a.facultyEmail,
      a.teacherRole,
      a.subjectName,
      a.subjectCode,
      a.school,
      a.department,
      a.program,
      a.batch,
      a.specialization,
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab="faculty-assignments" />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 bg-white border-b border-[#d9d9d9] px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="text-[#7b3b5a]" size={22} />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Faculty Assignments</h1>
              <p className="text-xs text-gray-500">Assign faculty, coordinators, or chairpersons to subjects &amp; classes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadAssignments();
                loadMetadata();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-[#d9d9d9] hover:bg-[#f3f3f3] disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[#7b3b5a] text-white hover:bg-[#602d45]"
            >
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? 'Cancel' : 'Assign Subject'}
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0 p-4 sm:p-6 space-y-4">
          {showForm && (
            <div className="bg-white border border-[#d9d9d9] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen size={18} className="text-[#7b3b5a]" /> Assign Subject to Teacher
                </h2>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles size={13} className="text-[#7b3b5a]" /> Auto creates subject if typed
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Teacher Selection Section */}
                <div className="bg-[#fcfcfd] border border-gray-200 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2.5">
                    1. Teacher Selection
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Select Teacher (Faculty / Coordinator / Chairperson) *
                      </label>
                      <select
                        value={form.facultyId}
                        onChange={handleTeacherSelect}
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                        required
                      >
                        <option value="">-- Choose Teacher --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} [{t.role.toUpperCase()}] — {t.email} (ID: {t.id})
                          </option>
                        ))}
                      </select>
                      {teachers.length === 0 && (
                        <p className="text-[11px] text-amber-600 mt-1">
                          No teachers loaded yet. You can create faculty under "Faculty Members" in the sidebar.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Teacher Role in Assignment *
                      </label>
                      <select
                        value={form.teacherRole}
                        onChange={(e) => setForm({ ...form, teacherRole: e.target.value as TeacherRole })}
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                      >
                        <option value="faculty">Faculty</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="chairperson">Chairperson</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subject Details (Typing Form) */}
                <div className="bg-[#fcfcfd] border border-gray-200 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2.5">
                    2. Subject Details (Typing Form)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Subject Name * (Type)
                      </label>
                      <input
                        type="text"
                        value={form.subjectName}
                        onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                        placeholder="e.g. Operating Systems"
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Subject Code * (Type)
                      </label>
                      <input
                        type="text"
                        value={form.subjectCode}
                        onChange={(e) => setForm({ ...form, subjectCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. CS201"
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Subject ID (Optional if Code typed)
                      </label>
                      <input
                        type="number"
                        value={form.subjectId}
                        onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                        placeholder="e.g. 1"
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Class Identity (Selecting Form) */}
                <div className="bg-[#fcfcfd] border border-gray-200 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2.5">
                    3. Class Identity (Selecting Form)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">School *</label>
                      <select
                        value={form.school}
                        onChange={(e) => setForm({ ...form, school: e.target.value })}
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                        required
                      >
                        {SCHOOL_OPTIONS.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Department *</label>
                      <select
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                        required
                      >
                        {departmentOptions.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Program *</label>
                      <select
                        value={form.program}
                        onChange={(e) => setForm({ ...form, program: e.target.value })}
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                        required
                      >
                        {PROGRAM_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Batch *</label>
                      <select
                        value={form.batch}
                        onChange={(e) => setForm({ ...form, batch: e.target.value })}
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                        required
                      >
                        {availableBatches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Specialization *</label>
                      <select
                        value={form.specialization}
                        onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                        required
                      >
                        {availableSpecializations.map((sp) => (
                          <option key={sp} value={sp}>
                            {sp}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Semester *</label>
                      <select
                        value={form.semester}
                        onChange={(e) => setForm({ ...form, semester: e.target.value })}
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                        required
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                          <option key={sem} value={String(sem)}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year *</label>
                      <select
                        value={form.academicYear}
                        onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                        className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2 bg-white"
                        required
                      >
                        {ACADEMIC_YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-xs px-4 py-2 rounded-lg border border-[#d9d9d9] hover:bg-[#f3f3f3]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-[#7b3b5a] text-white hover:bg-[#602d45] disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    Save Assignment
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-[#d9d9d9] rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-[#d9d9d9] bg-[#f8f9fa] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter assignments by teacher name, role, subject, or class…"
                  className="w-full text-xs bg-transparent outline-none"
                />
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {filtered.length} {filtered.length === 1 ? 'assignment' : 'assignments'}
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin text-[#7b3b5a] mx-auto" size={24} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No teaching assignments found. Click "Assign Subject" above to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#f8f9fa] text-xs uppercase text-gray-600 border-b border-[#d9d9d9]">
                    <tr>
                      <th className="text-left py-3 px-4">Teacher</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Subject</th>
                      <th className="text-left py-3 px-4">Class</th>
                      <th className="text-left py-3 px-4">Semester</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => {
                      const b = roleBadge(a.teacherRole as TeacherRole);
                      return (
                        <tr key={a.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fa]">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{a.facultyName || `User #${a.facultyId}`}</div>
                            <div className="text-xs text-gray-500 font-mono">{a.facultyEmail || `ID: ${a.facultyId}`}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${b}`}>
                              {a.teacherRole}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{a.subjectName || `Subject #${a.subjectId}`}</div>
                            <div className="text-xs text-gray-500 font-mono">{a.subjectCode || '—'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs text-gray-900 font-medium">
                              {a.program} · {a.batch}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {a.school} / {a.department} / {a.specialization}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-700">
                            Sem {a.semester} ({a.academicYear})
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${a.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                              {a.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDelete(a.id)}
                              disabled={deletingId === a.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                              title="Delete assignment"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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

export default FacultyAssignmentsAdmin;
