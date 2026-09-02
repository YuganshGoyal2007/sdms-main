import { useEffect, useState } from 'react';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import Header from '../../components/Admin/Header';
import Footer from '../../components/Admin/Footer';
import { school, cse, soict } from '../../constants';
import { addChairperson, getChairpersons, searchBatches, searchSpecializations, deleteChairperson } from '../../lib/user.api';
import { Trash2, UserRound } from 'lucide-react';

type AssignedClass = { school: string; department: string; program: string; batch: string; specialization: string };
const emptyClass = (): AssignedClass => ({ school: '', department: '', program: '', batch: '', specialization: '' });
const departmentMap: Record<string, { code: string; name: string }[]> = { soict };
const programMap: Record<string, { code: string; name: string }[]> = { cse };

const Chairpersons = () => {
  const [form, setForm] = useState({ chairpersonId: '', name: '', email: '', phone: '', classes: [emptyClass()] });
  const [chairpersons, setChairpersons] = useState<any[]>([]);
  const [batches, setBatches] = useState<Record<number, string[]>>({});
  const [specializations, setSpecializations] = useState<Record<number, string[]>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => setChairpersons((await getChairpersons()).chairpersons || []);
  useEffect(() => { load().catch(console.error); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this chairperson? This will also delete their access record.")) return;
    try {
      await deleteChairperson(id);
      await load();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Could not delete chairperson.');
    }
  };

  const updateClass = (index: number, field: keyof AssignedClass, value: string) => {
    setForm((old) => ({
      ...old,
      classes: old.classes.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (field === 'school') return { ...item, school: value, department: '', program: '', batch: '', specialization: '' };
        if (field === 'department') return { ...item, department: value, program: '', batch: '', specialization: '' };
        if (field === 'program') return { ...item, program: value, batch: '', specialization: '' };
        if (field === 'batch') return { ...item, batch: value, specialization: '' };
        return { ...item, [field]: value };
      })
    }));
  };

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      const nextBatches: Record<number, string[]> = {};
      const nextSpecializations: Record<number, string[]> = {};
      await Promise.all(form.classes.map(async (item, index) => {
        if (!item.school || !item.department || !item.program) return;
        try {
          nextBatches[index] = (await searchBatches({ school: item.school, department: item.department, program: item.program })).batches || [];
          if (item.batch) {
            nextSpecializations[index] = (await searchSpecializations({ school: item.school, department: item.department, program: item.program, batch: item.batch })).names || [];
          }
        } catch (error) {
          console.error('Could not load class options.', error);
        }
      }));
      if (active) {
        setBatches(nextBatches);
        setSpecializations(nextSpecializations);
      }
    };
    loadOptions();
    return () => { active = false; };
  }, [form.classes]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      await addChairperson(form);
      setForm({ chairpersonId: '', name: '', email: '', phone: '', classes: [emptyClass()] });
      await load();
      alert('Chairperson added successfully. They can register with their email.');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Could not add chairperson.');
    } finally { setSaving(false); }
  };

  return <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
    <AdminSideNav activeTab="chairpersons" />
    <div className="flex flex-col flex-1"><Header />
      <main className="flex-1 overflow-y-auto bg-[#f3f3f3] px-6 py-6">
        <h1 className="text-2xl font-semibold mb-1">Chairpersons</h1>
        <p className="text-sm text-gray-600 mb-5">Create chairperson accounts and assign every class they can view.</p>
        <form onSubmit={submit} className="bg-white border rounded-xl p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {(['chairpersonId', 'name', 'email', 'phone'] as const).map((field) => <input key={field} required type={field === 'email' ? 'email' : 'text'} placeholder={field === 'chairpersonId' ? 'Chairperson ID' : field[0].toUpperCase() + field.slice(1)} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="input-text" />)}
          </div>
          <div><p className="font-medium mb-2">Allowed classes</p>
            {form.classes.map((item, index) => <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
              <select required value={item.school} onChange={(e) => updateClass(index, 'school', e.target.value)} className="input-text"><option value="">Select school</option>{school.map((item) => <option key={item.code} value={item.code}>{item.code.toUpperCase()}</option>)}</select>
              <select required disabled={!item.school} value={item.department} onChange={(e) => updateClass(index, 'department', e.target.value)} className="input-text disabled:opacity-60"><option value="">Select department</option>{(departmentMap[item.school] || []).map((department) => <option key={department.code} value={department.code}>{department.code.toUpperCase()}</option>)}</select>
              <select required disabled={!item.department} value={item.program} onChange={(e) => updateClass(index, 'program', e.target.value)} className="input-text disabled:opacity-60"><option value="">Select program</option>{(programMap[item.department] || []).map((program) => <option key={program.code} value={program.name}>{program.name}</option>)}</select>
              <select required disabled={!item.program} value={item.batch} onChange={(e) => updateClass(index, 'batch', e.target.value)} className="input-text disabled:opacity-60"><option value="">Select batch</option>{(batches[index] || []).map((batch) => <option key={batch} value={batch}>{batch}</option>)}</select>
              <select required disabled={!item.batch} value={item.specialization} onChange={(e) => updateClass(index, 'specialization', e.target.value)} className="input-text disabled:opacity-60"><option value="">Select specialization</option>{(specializations[index] || []).map((specialization) => <option key={specialization} value={specialization}>{specialization}</option>)}</select>
              <button type="button" disabled={form.classes.length === 1} onClick={() => setForm({ ...form, classes: form.classes.filter((_, itemIndex) => itemIndex !== index) })} className="border rounded text-red-700 disabled:text-gray-400">Remove</button>
            </div>)}
            <button type="button" onClick={() => setForm({ ...form, classes: [...form.classes, emptyClass()] })} className="text-sm border rounded px-3 py-1">Add class</button>
          </div>
          <button disabled={saving} className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-60">{saving ? 'Saving...' : 'Create chairperson'}</button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chairpersons.map((item) => (
            <div key={item.id} className="bg-white border border-[#a5b4fc]/30 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-tight">{item.name}</h3>
                      <span className="text-xs text-gray-500 font-mono">ID: {item.chairpersonId}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                    title="Delete Chairperson"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-gray-600 mb-4 border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Email:</span>
                    <span className="text-gray-900 font-mono">{item.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Phone:</span>
                    <span className="text-gray-900">{item.phone}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <span className="text-xs font-semibold text-gray-700 block mb-2">Allowed Classes:</span>
                  {item.classes && item.classes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {item.classes.map((classItem: AssignedClass, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 rounded border border-gray-200">
                          {classItem.school.toUpperCase()} / {classItem.department.toUpperCase()} / {classItem.program} ({classItem.batch})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No assigned classes</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!chairpersons.length && (
            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-gray-300 rounded-2xl bg-white">
              <UserRound className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm font-medium">No chairpersons added yet.</p>
            </div>
          )}
        </div>
      </main><Footer />
    </div>
  </div>;
};
export default Chairpersons;
