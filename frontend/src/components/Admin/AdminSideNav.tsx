import { useState } from "react";
import { LayoutDashboard, Menu, Power, Table2, UserCog, UsersRound, X, CalendarDays, ClipboardCheck, UserRound } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../context/app/store";

const userSideNav = ({ activeTab }: { activeTab: string }) => {
    const [menu, setMenu] = useState(false);
    const navigate = useNavigate();

    const user = useSelector((state: RootState) => state.admin);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    const isChair = user?.role === 'chairperson';
    const isCoord = user?.role === 'coordinator';
    const isFaculty = user?.role === 'faculty';

    const dashboardPath = isChair ? '/chairperson/dashboard' : isCoord ? '/coordinator/dashboard' : isFaculty ? '/faculty/dashboard' : '/admin/dashboard';
    const recordsPath = user.role === 'chairperson' ? '/chairperson/records' : user.role === 'coordinator' ? '/coordinator/records' : '/admin/records';
    const classesPath = user.role === 'chairperson' ? '/chairperson/classes' : user.role === 'coordinator' ? '/coordinator/classes' : '/admin/classes';
    const markAttendancePath = user.role === 'chairperson' ? '/chairperson/mark-attendance' : user.role === 'coordinator' ? '/coordinator/mark-attendance' : user.role === 'faculty' ? '/faculty/mark-attendance' : '/admin/faculty-assignments';

    const displayName = user?.name || user?.username || "User";
    const initial = (user?.name?.charAt(0) ?? (user?.email || user?.username || "?").charAt(0)).toUpperCase();

    return (
        <>
            {/* For Smaller Screen */}
            <div className="sm:hidden block border-r bg-[#f8f9fa] border-[#d9d9d9] h-screen transition-all batch-300">
                <div className={`border-b border-[#d9d9d9] h-[7vh] sm:h-[10vh] w-full flex items-center px-5 ${menu ? 'justify-center' : 'justify-between'}`}>
                    <Link to={'/'}>
                        <img className={`h-10 transition-all batch-300 ${!menu ? 'hidden' : ''}`} src="/Images/fulllogogbu.png" alt="GBU Logo" />
                    </Link>
                    <button className="cursor-pointer sm:hidden" onClick={() => setMenu(!menu)}>
                        {!menu ? <Menu /> : <X />}
                    </button>
                </div>

                <div className="h-[80vh] sm:h-[75vh] w-full p-5 space-y-4">
                    {isFaculty ? (
                        <>
                            <Link to="/faculty/dashboard" className="block">
                                <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                    <LayoutDashboard />
                                    {menu && <h1 className={activeTab === 'dashboard' ? 'text-black font-bold' : ''}>Dashboard</h1>}
                                </button>
                            </Link>

                            <Link to="/faculty/profile" className="block">
                                <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                    <UserRound size={20} />
                                    {menu && <h1 className={activeTab === 'profile' ? 'text-black font-bold' : ''}>My Profile</h1>}
                                </button>
                            </Link>

                            <Link to="/faculty/classes" className="block">
                                <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                    <Table2 size={20} />
                                    {menu && <h1 className={activeTab === 'classes' ? 'text-black font-bold' : ''}>My Classes</h1>}
                                </button>
                            </Link>

                            <Link to="/faculty/mark-attendance" className="block">
                                <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                    <ClipboardCheck size={20} />
                                    {menu && <h1 className={activeTab === 'attendance' ? 'text-black font-bold' : ''}>Mark Attendance</h1>}
                                </button>
                            </Link>

                            <Link to="/faculty/messages" className="block">
                                <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                    <UsersRound size={20} />
                                    {menu && <h1 className={activeTab === 'messages' ? 'text-black font-bold' : ''}>Messages</h1>}
                                </button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to={dashboardPath} className="block">
                                <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                    <LayoutDashboard />
                                    {menu && <h1 className={activeTab === 'dashboard' ? 'text-black font-bold' : ''}>Dashboard</h1>}
                                </button>
                            </Link>

                            <Link to={recordsPath} className="block">
                                <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                    <Table2 />
                                    {menu && <h1 className={activeTab === 'records' ? 'text-black font-bold' : ''}>Records</h1>}
                                </button>
                            </Link>

                            {(user.role === 'admin' || user.role === 'coordinator' || user.role === 'chairperson') && (
                                <Link to={classesPath} className="block">
                                    <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                        <Table2 />
                                        {menu && <h1 className={activeTab === 'classes' ? 'text-black font-bold' : ''}>Classes</h1>}
                                    </button>
                                </Link>
                            )}

                            {(user.role === 'admin' || user.role === 'coordinator' || user.role === 'chairperson') && (
                                <Link to={markAttendancePath} className="block">
                                    <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                        <ClipboardCheck size={20} />
                                        {menu && <h1 className={activeTab === 'attendance' ? 'text-black font-bold' : ''}>Marking Attendance</h1>}
                                    </button>
                                </Link>
                            )}

                            {user.role === 'admin' && (
                                <>
                                    <Link to={'/admin/faculty'} className="block">
                                        <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                            <UsersRound size={20} />
                                            {menu && <h1 className={activeTab === 'faculty' ? 'text-black font-bold' : ''}>Faculty Members</h1>}
                                        </button>
                                    </Link>

                                    <Link to={'/admin/faculty-assignments'} className="block">
                                        <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                            <UserCog size={20} />
                                            {menu && <h1 className={activeTab === 'faculty-assignments' ? 'text-black font-bold' : ''}>Faculty Assignments</h1>}
                                        </button>
                                    </Link>

                                    <Link to={'/admin/attendance'} className="block">
                                        <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                            <ClipboardCheck size={20} />
                                            {menu && <h1 className={activeTab === 'admin-attendance' ? 'text-black font-bold' : ''}>Attendance Sessions</h1>}
                                        </button>
                                    </Link>

                                    <Link to={'/admin/roles'} className="block">
                                        <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                            <UserCog size={20} />
                                            {menu && <h1 className={activeTab === 'roles' ? 'text-black font-bold' : ''}>Roles</h1>}
                                        </button>
                                    </Link>

                                    <Link to={'/admin/chairpersons'} className="block">
                                        <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                            <UsersRound size={20} />
                                            {menu && <h1 className={activeTab === 'chairpersons' ? 'text-black font-bold' : ''}>Chairpersons</h1>}
                                        </button>
                                    </Link>

                                    <Link to={'/admin/timetable'} className="block">
                                        <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                            <CalendarDays size={20} />
                                            {menu && <h1 className={activeTab === 'timetable' ? 'text-black font-bold' : ''}>Timetable Mappings</h1>}
                                        </button>
                                    </Link>
                                </>
                            )}

                            {isChair && (
                                <Link to={'/chairperson/messages'} className="block">
                                    <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                        <UsersRound size={20} />
                                        {menu && <h1 className={activeTab === 'messages' ? 'text-black font-bold' : ''}>Messages</h1>}
                                    </button>
                                </Link>
                            )}

                            {isCoord && (
                                <Link to={'/coordinator/messages'} className="block">
                                    <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                        <UsersRound size={20} />
                                        {menu && <h1 className={activeTab === 'messages' ? 'text-black font-bold' : ''}>Messages</h1>}
                                    </button>
                                </Link>
                            )}

                            {user.role === 'admin' && (
                                <Link to={'/admin/messages'} className="block">
                                    <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                        <UsersRound size={20} />
                                        {menu && <h1 className={activeTab === 'messages' ? 'text-black font-bold' : ''}>Messages</h1>}
                                    </button>
                                </Link>
                            )}

                            {isChair && (
                                <Link to={'/chairperson/logs'} className="block">
                                    <button className="w-full flex items-center justify-start gap-3 cursor-pointer">
                                        <UserCog size={20} />
                                        {menu && <h1 className={activeTab === 'logs' ? 'text-black font-bold' : ''}>Activity</h1>}
                                    </button>
                                </Link>
                            )}
                        </>
                    )}
                </div>

                <div className="h-[13vh] sm:min-h-[15vh] p-5 flex justify-center items-center flex-col gap-5">
                    {menu ? (
                        <div className="flex items-center justify-between mt-2 bg-white border border-[#d9d9d9] w-full px-3 py-2 rounded-lg">
                            <div className="flex w-full items-center justify-between gap-2">
                                <div className="flex gap-2 items-center justify-center">
                                    <div className="bg-[#d9d9d9] text-black border rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg">{initial}</div>
                                    <div>
                                        <p className="sm:text-sm text-xs font-semibold">{displayName}</p>
                                        <p className="sm:text-xs text-[8px]">{user?.email || user?.username}</p>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="rounded hover:bg-[#f8f9fa]">
                                    <Power size={16} className="text-gray-400 p-2 hover:text-red-400 cursor-pointer" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#d9d9d9] text-black border cursor-not-allowed rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg">{initial}</div>
                    )}
                </div>
            </div>

            {/* For Bigger Screen */}
            <div className={`sm:block hidden border-r bg-[#f8f9fa] border-[#d9d9d9] h-screen transition-all batch-300 ${menu ? 'sm:w-[5vw]' : 'sm:w-[20vw] w-[80vw]'}`}>
                <div className={`border-b border-[#d9d9d9] h-[7vh] sm:h-[10vh] w-full flex items-center px-5 ${menu ? 'justify-center' : 'justify-between'}`}>
                    <Link to={'/'}>
                        <img className={`h-10 transition-all batch-300 ${menu ? 'hidden' : ''}`} src="/Images/fulllogogbu.png" alt="GBU Logo" />
                    </Link>
                    <button className="cursor-pointer sm:hidden" onClick={() => setMenu(!menu)}>
                        {menu ? <Menu /> : <X />}
                    </button>
                </div>

                <div className="h-[75vh] w-full p-5 space-y-4">
                    {isFaculty ? (
                        <>
                            <Link to="/faculty/dashboard" className="block">
                                <button className="w-full flex items-center gap-3 cursor-pointer">
                                    <LayoutDashboard />
                                    {!menu && <h1 className={activeTab === 'dashboard' ? 'text-black font-bold' : ''}>Dashboard</h1>}
                                </button>
                            </Link>

                            <Link to="/faculty/profile" className="block">
                                <button className="w-full flex items-center gap-3 cursor-pointer">
                                    <UserRound size={20} />
                                    {!menu && <h1 className={activeTab === 'profile' ? 'text-black font-bold' : ''}>My Profile</h1>}
                                </button>
                            </Link>

                            <Link to="/faculty/classes" className="block">
                                <button className="w-full flex items-center gap-3 cursor-pointer">
                                    <Table2 size={20} />
                                    {!menu && <h1 className={activeTab === 'classes' ? 'text-black font-bold' : ''}>My Classes</h1>}
                                </button>
                            </Link>

                            <Link to="/faculty/mark-attendance" className="block">
                                <button className="w-full flex items-center gap-3 cursor-pointer">
                                    <ClipboardCheck size={20} />
                                    {!menu && <h1 className={activeTab === 'attendance' ? 'text-black font-bold' : ''}>Mark Attendance</h1>}
                                </button>
                            </Link>

                            <Link to="/faculty/messages" className="block">
                                <button className="w-full flex items-center gap-3 cursor-pointer">
                                    <UsersRound size={20} />
                                    {!menu && <h1 className={activeTab === 'messages' ? 'text-black font-bold' : ''}>Messages</h1>}
                                </button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to={dashboardPath} className="block">
                                <button className="w-full flex items-center gap-3 cursor-pointer">
                                    <LayoutDashboard />
                                    {!menu && <h1 className={activeTab === 'dashboard' ? 'text-black font-bold' : ''}>Dashboard</h1>}
                                </button>
                            </Link>

                            {!isFaculty && (
                                <Link to={recordsPath} className="block">
                                    <button className="w-full flex items-center gap-3 cursor-pointer">
                                        <Table2 />
                                        {!menu && <h1 className={activeTab === 'records' ? 'text-black font-bold' : ''}>Records</h1>}
                                    </button>
                                </Link>
                            )}

                            {(user.role === 'admin' || user.role === 'coordinator' || user.role === 'chairperson') && (
                                <Link to={classesPath} className="block">
                                    <button className="w-full flex items-center gap-3 cursor-pointer">
                                        <Table2 />
                                        {!menu && <h1 className={activeTab === 'classes' ? 'text-black font-bold' : ''}>Classes</h1>}
                                    </button>
                                </Link>
                            )}

                            {(user.role === 'admin' || user.role === 'coordinator' || user.role === 'chairperson' || user.role === 'faculty') && (
                                <Link to={markAttendancePath} className="block">
                                    <button className="w-full flex items-center gap-3 cursor-pointer">
                                        <ClipboardCheck size={20} />
                                        {!menu && <h1 className={activeTab === 'attendance' ? 'text-black font-bold' : ''}>Marking Attendance</h1>}
                                    </button>
                                </Link>
                            )}

                            {user.role === 'admin' && (
                                <>
                                    <Link to={'/admin/faculty'} className="block">
                                        <button className="w-full flex items-center gap-3 cursor-pointer">
                                            <UsersRound size={20} />
                                            {!menu && <h1 className={activeTab === 'faculty' ? 'text-black font-bold' : ''}>Faculty Members</h1>}
                                        </button>
                                    </Link>

                                    <Link to={'/admin/faculty-assignments'} className="block">
                                        <button className="w-full flex items-center gap-3 cursor-pointer">
                                            <UserCog size={20} />
                                            {!menu && <h1 className={activeTab === 'faculty-assignments' ? 'text-black font-bold' : ''}>Faculty Assignments</h1>}
                                        </button>
                                    </Link>

                                    <Link to={'/admin/attendance'} className="block">
                                        <button className="w-full flex items-center gap-3 cursor-pointer">
                                            <ClipboardCheck size={20} />
                                            {!menu && <h1 className={activeTab === 'admin-attendance' ? 'text-black font-bold' : ''}>Attendance Sessions</h1>}
                                        </button>
                                    </Link>

                                    <Link to={'/admin/roles'} className="block">
                                        <button className="w-full flex items-center gap-3 cursor-pointer">
                                            <UserCog size={20} />
                                            {!menu && <h1 className={activeTab === 'roles' ? 'text-black font-bold' : ''}>Roles</h1>}
                                        </button>
                                    </Link>

                                    <Link to={'/admin/chairpersons'} className="block">
                                        <button className="w-full flex items-center gap-3 cursor-pointer">
                                            <UsersRound size={20} />
                                            {!menu && <h1 className={activeTab === 'chairpersons' ? 'text-black font-bold' : ''}>Chairpersons</h1>}
                                        </button>
                                    </Link>

                                    <Link to={'/admin/timetable'} className="block">
                                        <button className="w-full flex items-center gap-3 cursor-pointer">
                                            <CalendarDays size={20} />
                                            {!menu && <h1 className={activeTab === 'timetable' ? 'text-black font-bold' : ''}>Timetable Mappings</h1>}
                                        </button>
                                    </Link>
                                </>
                            )}

                            {isChair && (
                                <Link to={'/chairperson/messages'} className="block">
                                    <button className="w-full flex items-center gap-3 cursor-pointer">
                                        <UsersRound size={20} />
                                        {!menu && <h1 className={activeTab === 'messages' ? 'text-black font-bold' : ''}>Messages</h1>}
                                    </button>
                                </Link>
                            )}

                            {isCoord && (
                                <Link to={'/coordinator/messages'} className="block">
                                    <button className="w-full flex items-center gap-3 cursor-pointer">
                                        <UsersRound size={20} />
                                        {!menu && <h1 className={activeTab === 'messages' ? 'text-black font-bold' : ''}>Messages</h1>}
                                    </button>
                                </Link>
                            )}

                            {user.role === 'admin' && (
                                <Link to={'/admin/messages'} className="block">
                                    <button className="w-full flex items-center gap-3 cursor-pointer">
                                        <UsersRound size={20} />
                                        {!menu && <h1 className={activeTab === 'messages' ? 'text-black font-bold' : ''}>Messages</h1>}
                                    </button>
                                </Link>
                            )}

                            {isChair && (
                                <Link to={'/chairperson/logs'} className="block">
                                    <button className="w-full flex items-center gap-3 cursor-pointer">
                                        <UserCog size={20} />
                                        {!menu && <h1 className={activeTab === 'logs' ? 'text-black font-bold' : ''}>Activity</h1>}
                                    </button>
                                </Link>
                            )}
                        </>
                    )}
                </div>

                <div className="h-[15vh] p-5 flex justify-center items-center flex-col gap-5">
                    {!menu ? (
                        <div className="flex items-center justify-between mt-2 bg-white border border-[#d9d9d9] w-full px-3 py-2 rounded-lg">
                            <div className="flex w-full items-center justify-between gap-2">
                                <div className="flex gap-2 items-center justify-center">
                                    <div className="bg-[#d9d9d9] text-black border rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg">{initial}</div>
                                    <div>
                                        <p className="sm:text-sm text-xs font-semibold">{displayName}</p>
                                        <p className="sm:text-xs text-[8px]">{user?.email || user?.username}</p>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="rounded hover:bg-[#f8f9fa]">
                                    <Power size={16} className="text-gray-400 p-2 hover:text-red-400 cursor-pointer" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#d9d9d9] text-black border cursor-not-allowed rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg">{initial}</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default userSideNav;
