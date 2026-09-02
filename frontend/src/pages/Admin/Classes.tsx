import { useEffect, useState } from 'react';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import Header from '../../components/Admin/Header';
import Footer from '../../components/Admin/Footer';
import { getChairpersonClasses, getFilteredStudents, sendMessage } from '../../lib/user.api';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../context/app/store';

const Classes = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [message, setMessage] = useState<Record<number, string>>({});
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.admin);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        if (user.role === 'chairperson' || user.role === 'admin') {
          const data = await getChairpersonClasses();
          setClasses(data.classes || []);
          return;
        }
        const data = await getFilteredStudents(undefined, undefined, undefined, undefined, undefined);
        setStudents(data.students || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [user.role]);

  const messageCoordinator = async (receiverId: number, classId: number) => {
    const content = message[classId]?.trim();
    if (!content) return;
    try {
      await sendMessage(receiverId, content);
      setMessage((old) => ({ ...old, [classId]: '' }));
      alert('Message sent.');
    } catch (error: any) { alert(error.response?.data?.message || 'Message could not be sent.'); }
  };

  return (
    <div className="w-full h-full flex overflow-hidden">
      <AdminSideNav activeTab={'classes'} />
      <div className="flex flex-col sm:w-[80vw] w-[85vw] transition-all batch-300">
        <Header />
        <main className="p-6 bg-[#f3f3f3] min-h-[80vh]">
          <h1 className="text-2xl font-semibold mb-4">My Classes</h1>
          {loading ? (
            <p>Loading students...</p>
          ) : user.role === 'chairperson' || user.role === 'admin' ? (
            classes.length === 0 ? <p>No allowed classes assigned.</p> : <div className="grid gap-4 md:grid-cols-2">
              {classes.map((item) => <section key={item.id} className="bg-white border rounded-xl p-5">
                <h2 className="font-semibold text-lg">{item.program} {item.batch} — {item.specialization}</h2>
                <p className="text-sm text-gray-600 mb-4">{item.school} / {item.department}</p>
                <p className="text-sm font-medium mb-2">Assigned coordinators</p>
                {item.coordinators?.length ? item.coordinators.map((coordinator: any) => <div key={coordinator.id} className="border-t py-3">
                  <p className="font-medium">{coordinator.name}</p><p className="text-sm text-gray-500">{coordinator.email} · {coordinator.phone}</p>
                  {coordinator.userId ? <div className="flex gap-2 mt-2"><input value={message[item.id] || ''} onChange={(e) => setMessage((old) => ({ ...old, [item.id]: e.target.value }))} placeholder="Message coordinator" className="input-text flex-1" /><button onClick={() => messageCoordinator(coordinator.userId, item.id)} className="px-3 border rounded">Send</button></div> : <p className="text-xs text-amber-700 mt-2">Coordinator has not registered yet.</p>}
                </div>) : <p className="text-sm text-gray-500">No coordinator assigned.</p>}
              </section>)}
            </div>
          ) : students.length === 0 ? (
            <p>No students found for your assigned class.</p>
          ) : (
            <div className="bg-white border rounded p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Photo</th>
                    <th className="p-2">Roll No</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Program</th>
                    <th className="p-2">Batch</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.rollNo} className="border-t">
                      <td className="p-2">
                        {s.photo ? (
                          <img src={s.photo} alt={s.fullName} className="w-9 h-9 rounded-full object-cover border border-gray-300" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 font-bold border border-gray-300 flex items-center justify-center text-sm">
                            {s.fullName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="p-2">{s.rollNo}</td>
                      <td className="p-2">{s.fullName}</td>
                      <td className="p-2">{s.program}</td>
                      <td className="p-2">{s.batch}</td>
                      <td className="p-2">
                        <button onClick={() => navigate(`/admin/records/${encodeURIComponent(s.rollNo)}`)} className="px-3 py-1 border rounded text-sm">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Classes;
