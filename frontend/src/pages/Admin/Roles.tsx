import { useEffect, useState } from 'react';
import AdminSideNav from '../../components/Admin/AdminSideNav';
import Footer from '../../components/Admin/Footer';
import Header from '../../components/Admin/Header';
import { deleteCoordinator, getAdmins } from '../../lib/user.api';
import type { AdminUserProps } from '../../types/types';
import { Mail, Phone } from 'lucide-react';

const Roles = () => {
  const [users, setUsers] = useState<AdminUserProps[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false)

  const handleDelete = async (id: number) => {
    if (window.confirm(`Are you sure want to delete this coordinator?`)) {
      try {
        setDeleting(true);
        const data = await deleteCoordinator(id);
        if (data) {
          console.log(data)
          setUsers((prev) => prev.filter((user) => user.id !== id));
        }
      } catch (error) {
        console.log(error);
      } finally {
        setDeleting(false);
      }
    }
  };

  useEffect(() => {
    const getAdmin = async () => {
      try {
        setLoading(true);
        const data = await getAdmins();
        const sortedRoles = [...data.admins].sort((a, b) =>
          a.name.localeCompare(b.name, undefined)
        );
        setUsers(sortedRoles);
      } catch (error: unknown) {
        if (error instanceof Error) {
          alert(error.message);
        }
      } finally {
        setLoading(false);
      }
    };
    getAdmin();
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab="roles" />

      <div className="flex flex-col flex-1">
        <div className="sm:h-[10vh] shrink-0">
          <Header />
        </div>

        <main className="flex-1 overflow-y-auto min-h-[88vh] sm:min-h-[83vh] px-10 py-6 bg-[#f3f3f3]">
          <h1 className="text-2xl font-semibold mb-5">Roles</h1>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading
              ? <p>Loading Roles...</p>
              :
              users.length === 0
                ? <p>No roles found!</p>
                : users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-gray-100 to-gray-200 text-xl font-bold text-gray-700 border">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 truncate">{user?.name}</h2>
                        <div className='flex justify-start items-end gap-2 mb-1'>
                          <Mail width={15} height={15} />
                          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className='flex justify-start items-center gap-2'>
                          <Phone width={15} height={15} />
                          <p className="text-sm text-gray-500">{user?.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 mb-4" />

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-gray-600 flex-1">
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Coordinator ID
                        </p>
                        <p className="font-medium text-gray-800">{user?.coordinatorId}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          School
                        </p>
                        <p className="font-medium text-gray-800">{user?.school?.toLocaleUpperCase()}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Department
                        </p>
                        <p className="font-medium text-gray-800">{user?.department?.toLocaleUpperCase()}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Program
                        </p>
                        <p className="font-medium text-gray-800">{user?.program}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Specialization
                        </p>
                        <p className="font-medium text-gray-800 truncate">
                          {user?.specialization}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Batch
                        </p>
                        <p className="font-medium text-gray-800">{user?.batch}</p>
                      </div>
                    </div>

                    {/* Role Badge */}
                    {user.role && (
                      <div className="mt-5 flex justify-between">
                        <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-gray-900 text-white capitalize">
                          {user.role}
                        </span>
                        {user.role !== 'admin' && <button onClick={() => handleDelete(user.id)} className="px-3 py-1 sm:text-sm text-sm text-white col-start-2 bg-red-600 border border-red-800 rounded-full cursor-pointer flex justify-center items-center hover:bg-red-700"> {deleting ? 'Deleting' : 'Delete'} </button>}
                      </div>
                    )}
                  </div>
                ))
            }
          </div>
        </main>

        <div className="h-14 shrink-0">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Roles;
