import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Plus, Trash2, Search, Mail, Phone, Building2, UserCheck, Loader2, RefreshCw, X, Save, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RootState } from '../../context/app/store';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import { addFaculty, getFaculties, deleteFaculty, type FacultyProps } from '../../lib/user.api';
import { safeErrorMessage } from '../../utils/safeError';

const DEFAULT_FORM: FacultyProps = {
  facultyId: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  department: 'Computer Science and Engineering',
};

const FacultyAdmin = () => {
  const user = useSelector((s: RootState) => s.admin);
  const [faculties, setFaculties] = useState<FacultyProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FacultyProps>({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const res = await getFaculties();
      if (res?.success) {
        setFaculties(res.faculties || []);
      }
    } catch (err: unknown) {
      toast.error(safeErrorMessage(err, 'Failed to load faculty members.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and Email are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await addFaculty({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password?.trim() || undefined,
        phone: form.phone?.trim(),
        department: form.department?.trim(),
        facultyId: form.facultyId?.trim(),
      });
      if (res.success) {
        toast.success(res.message || 'Faculty member created successfully.');
        setShowForm(false);
        setForm({ ...DEFAULT_FORM });
        load();
      }
    } catch (err: unknown) {
      toast.error(safeErrorMessage(err, 'Failed to create faculty member.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this faculty member? This will remove their account and teaching assignments.')) return;
    setDeletingId(id);
    try {
      const res = await deleteFaculty(id);
      if (res.success) {
        toast.success('Faculty member deleted.');
        setFaculties((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err: unknown) {
      toast.error(safeErrorMessage(err, 'Failed to delete faculty member.'));
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8f9fa] text-gray-600">
        Only administrators can manage faculty members.
      </div>
    );
  }

  const filtered = faculties.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [
      f.name,
      f.email,
      f.facultyId,
      f.phone,
      f.department,
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab="faculty" />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 bg-white border-b border-[#d9d9d9] px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="text-[#7b3b5a]" size={24} />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Faculty Management</h1>
              <p className="text-xs text-gray-500">Create and manage faculty accounts for teaching &amp; attendance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
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
              {showForm ? 'Cancel' : 'Add Faculty'}
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0 p-4 sm:p-6 space-y-4">
          {showForm && (
            <div className="bg-white border border-[#d9d9d9] rounded-xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UserCheck size={18} className="text-[#7b3b5a]" /> Create New Faculty Account
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Faculty ID / Code</label>
                  <input
                    type="text"
                    value={form.facultyId || ''}
                    onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                    placeholder="e.g. FAC101"
                    className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. rajesh@gbu.ac.in"
                    className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password (default: faculty123)</label>
                  <input
                    type="password"
                    value={form.password || ''}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Leave blank for faculty123"
                    className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department || ''}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Computer Science and Engineering"
                    className="w-full text-sm border border-[#d9d9d9] rounded-md px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
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
                    Create Faculty Account
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
                  placeholder="Search faculty by name, email, department, or ID..."
                  className="w-full text-xs bg-transparent outline-none"
                />
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {filtered.length} {filtered.length === 1 ? 'faculty' : 'faculties'}
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin text-[#7b3b5a] mx-auto" size={24} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No faculty members found. Click "Add Faculty" above to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filtered.map((f) => {
                  const initial = (f.name?.charAt(0) || f.email?.charAt(0) || 'F').toUpperCase();
                  return (
                    <div
                      key={f.id || f.email}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[#7b3b5a]/10 text-[#7b3b5a] flex items-center justify-center font-bold text-lg border border-[#7b3b5a]/20">
                              {initial}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 leading-tight">{f.name}</h3>
                              {f.facultyId && (
                                <span className="inline-block mt-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {f.facultyId}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(f.id)}
                            disabled={deletingId === f.id}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete faculty member"
                          >
                            {deletingId === f.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400 shrink-0" />
                            <span className="truncate">{f.email}</span>
                          </div>
                          {f.phone && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-gray-400 shrink-0" />
                              <span>{f.phone}</span>
                            </div>
                          )}
                          {f.department && (
                            <div className="flex items-center gap-2">
                              <Building2 size={14} className="text-gray-400 shrink-0" />
                              <span className="truncate">{f.department}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                          Active Faculty
                        </span>
                        <Link
                          to="/admin/faculty-assignments"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#7b3b5a] hover:underline"
                        >
                          Assign Class <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FacultyAdmin;
