import { useState } from "react"
import { LayoutDashboard, Menu, Power, Table2, UserCog, UsersRound, X } from 'lucide-react';
import { Link, useNavigate, } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../context/app/store";

const userSideNav = ({ activeTab }: { activeTab: string }) => {
    const [menu, setMenu] = useState(false);

    const navigate = useNavigate();

    const user = useSelector((state: RootState) => state.admin);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    }

    return (
        <>
            {/* For Mobile */}
            <div className={`sm:hidden block border-r bg-[#f8f9fa] border-[#d9d9d9] h-screen transition-all batch-300 ${!menu ? 'w-[20vw]' : 'w-[80vw]'}`}>

                {/* GBU Logo Side Nav */}
                <div className={`border-b border-[#d9d9d9] h-[7vh] sm:h-[10vh] w-full flex items-center px-5 ${menu ? 'justify-center' : 'justify-between'}`}>
                    <Link to={'/'}>
                        <img className={`h-10 transition-all batch-300 ${!menu ? 'hidden' : ''}`} src="/Images/fulllogogbu.png" />
                    </Link>
                    <button className="cursor-pointer sm:hidden" value={menu.toString()} onClick={() => setMenu(!menu)}>
                        {!menu ? <Menu /> : <X />}
                    </button>
                </div>

                {/* Top Menu Nav Links */}
                <div className="h-[80vh] sm:h-[75vh] w-full p-5">
                    <Link to={'/admin/dashboard'}>
                        <button className={`w-full flex justify-center cursor-pointer`}>
                            {!menu ?
                                <LayoutDashboard />
                                :
                                <div className="w-full flex justify-center items-center gap-3">
                                    <h1 className={`${activeTab === 'dashboard' ? 'text-black font-bold' : ''}`}>Dashboard</h1>
                                </div>}
                        </button>
                    </Link>
                    <Link to={'/admin/records'}>
                        <button className={`w-full flex justify-center mt-5 cursor-pointer`}>
                            {!menu ?
                                <Table2 />
                                :
                                <div className="w-full flex justify-center items-center gap-3">
                                    <h1 className={`${activeTab === 'records' ? 'text-black font-bold' : ''}`}>Records</h1>
                                </div>}
                        </button>
                    </Link>
                    {(user.role === 'admin' || user.role === 'coordinator' || user.role === 'chairperson') && <Link to={'/admin/classes'}>
                        <button className={`w-full flex justify-center mt-5 cursor-pointer`}>
                            {!menu ?
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M2 2h4v4H2V2zm8 0h4v4h-4V2zM2 10h4v4H2v-4zm8 0h4v4h-4v-4z"/>
                                </svg>
                                :
                                <div className="w-full flex justify-center items-center gap-3">
                                    <h1 className={`${activeTab === 'classes' ? 'text-black font-bold' : ''}`}>Classes</h1>
                                </div>}
                        </button>
                    </Link>}
                    {user.role === 'admin' && <Link to={'/admin/roles'}>
                        <button className={`w-full flex justify-center mt-5 cursor-pointer`}>
                            {!menu ?
                                <UserCog />
                                :
                                <div className="w-full flex justify-center items-center gap-3">
                                    <h1 className={`${activeTab === 'roles' ? 'text-black font-bold' : ''}`}>Roles</h1>
                                </div>}
                        </button>
                    </Link>}
                    {user.role === 'admin' && <Link to={'/admin/chairpersons'}>
                        <button className="w-full flex justify-center mt-5 cursor-pointer">
                            {!menu ? <UsersRound /> : <div className="w-full flex justify-center items-center gap-3"><h1 className={activeTab === 'chairpersons' ? 'text-black font-bold' : ''}>Chairpersons</h1></div>}
                        </button>
                    </Link>}
                </div>

                {/* Bottom Menu Nav Links */}
                <div className={`h-[13vh] sm:min-h-[15vh] p-5 flex justify-center items-center flex-col gap-5 transition-all batch-300`}>
                    {menu
                        ? <div className="flex items-center justify-between mt-2 bg-white border border-[#d9d9d9] w-full px-3 py-2 rounded-lg">
                            <div className="flex w-full items-center justify-between gap-2">
                                <div className="flex gap-2 items-center justify-center">
                                    <div className="bg-[#d9d9d9] text-black border rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg"> {user?.name.charAt(0)} </div>
                                    <div>
                                        <p className="sm:text-sm text-xs font-semibold">{user?.name}</p>
                                        <p className="sm:text-xs text-[8px]">{user?.email}</p>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className='rounded hover:bg-[#f8f9fa] transition-all batch-300 '>
                                    <Power size={16} className="text-gray-400 p-2 h-full w-full hover:text-red-400 cursor-pointer transition-all batch-300" />
                                </button>
                            </div>
                        </div>
                        : <div className="bg-[#d9d9d9] text-black border cursor-not-allowed rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg">{user?.name.charAt(0)}</div>
                    }
                </div>
            </div>

            {/* For Bigger Screen */}
            <div className={`sm:block hidden border-r bg-[#f8f9fa] border-[#d9d9d9] h-screen transition-all batch-300 ${menu ? 'sm:w-[5vw]' : 'sm:w-[20vw] w-[80vw]'}`}>

                {/* GBU Logo Side Nav */}
                <div className={`border-b border-[#d9d9d9] h-[7vh] sm:h-[10vh] w-full flex items-center px-5 ${menu ? 'justify-center' : 'justify-between'}`}>
                    <Link to={'/'}>
                        <img className={`h-10 transition-all batch-300 ${menu ? 'hidden' : ''}`} src="/Images/fulllogogbu.png" />
                    </Link>
                    <button className="cursor-pointer sm:hidden" value={menu.toString()} onClick={() => setMenu(!menu)}>
                        {menu ? <Menu /> : <X />}
                    </button>
                </div>

                {/* Top Menu Nav Links */}
                <div className="h-[75vh] w-full p-5">
                    <Link to={'/admin/dashboard'}>
                        <button className={`w-full flex justify-center cursor-pointer`}>
                            {menu ?
                                <LayoutDashboard />
                                :
                                <div className="w-full flex justify-center items-center gap-3">
                                    <h1 className={`${activeTab === 'dashboard' ? 'text-black font-bold' : ''}`}>Dashboard</h1>
                                </div>}
                        </button>
                    </Link>
                    <Link to={'/admin/records'}>
                        <button className={`w-full flex justify-center mt-5 cursor-pointer`}>
                            {menu ?
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M5 4h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1m-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1m0 2h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1" />
                                </svg>
                                :
                                <div className="w-full flex justify-center items-center gap-3">
                                    <h1 className={`${activeTab === 'records' ? 'text-black font-bold' : ''}`}>Records</h1>
                                </div>}
                        </button>
                    </Link>
                    {user.role === 'admin' && <Link to={'/admin/roles'}>
                        <button className={`w-full flex justify-center mt-5 cursor-pointer`}>
                            {menu ?
                                <UserCog />
                                :
                                <div className="w-full flex justify-center items-center gap-3">
                                    <h1 className={`${activeTab === 'roles' ? 'text-black font-bold' : ''}`}>Roles</h1>
                                </div>}
                        </button>
                    </Link>}
                    {user.role === 'admin' && <Link to={'/admin/chairpersons'}>
                        <button className="w-full flex justify-center mt-5 cursor-pointer">
                            {menu ? <UsersRound /> : <div className="w-full flex justify-center items-center gap-3"><h1 className={activeTab === 'chairpersons' ? 'text-black font-bold' : ''}>Chairpersons</h1></div>}
                        </button>
                    </Link>}
                    {(user.role === 'admin' || user.role === 'coordinator' || user.role === 'chairperson') && <Link to={'/admin/classes'}>
                        <button className="w-full flex justify-center mt-5 cursor-pointer">
                            {menu ? <Table2 /> : <div className="w-full flex justify-center items-center gap-3"><h1 className={activeTab === 'classes' ? 'text-black font-bold' : ''}>Classes</h1></div>}
                        </button>
                    </Link>}
                </div>

                {/* Bottom Menu Nav Links */}
                <div className={`h-[15vh] p-5 flex justify-center items-center flex-col gap-5 transition-all batch-300`}>
                    {!menu
                        ? <div className="flex items-center justify-between mt-2 bg-white border border-[#d9d9d9] w-full px-3 py-2 rounded-lg">
                            <div className="flex w-full items-center justify-between gap-2">
                                <div className="flex gap-2 items-center justify-center">
                                    <div className="bg-[#d9d9d9] text-black border rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg"> {user?.name.charAt(0)} </div>
                                    <div>
                                        <p className="sm:text-sm text-xs font-semibold">{user?.name}</p>
                                        <p className="sm:text-xs text-[8px]">{user.email}</p>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className='rounded hover:bg-[#f8f9fa] transition-all batch-300 '>
                                    <Power size={16} className="text-gray-400 p-2 h-full w-full hover:text-red-400 cursor-pointer transition-all batch-300" />
                                </button>
                            </div>
                        </div>
                        : <div className="bg-[#d9d9d9] text-black border cursor-not-allowed rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg">{user?.name.charAt(0)}</div>
                    }
                </div>
            </div>
        </>
    )
}

export default userSideNav
