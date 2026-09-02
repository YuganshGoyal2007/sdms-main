import { Link } from "react-router-dom";
import logo from "/Images/gbu_logo.png";
import { useEffect, useState } from "react";

const LandingNavbar = () => {
    const [open, setOpen] = useState(false);
    const [time, setTime] = useState<Date>(new Date());

    useEffect(() => {
        const intervalId: number = window.setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    return (
        <header className="w-full sticky top-0 z-50">
            {/* TOP MAROON BAR */}
            <div className="bg-[#7b3b5a] text-white text-sm">
                <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
                    <span className="text-xs sm:text-sm">
                        Student Data Management System
                    </span>

                    <div className="hidden sm:flex gap-4">
                        {time.toString()}
                    </div>
                    <div className="sm:hidden gap-4">
                        {time.toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* MAIN NAVBAR */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    {/* LEFT */}
                    <div className="flex items-center gap-3">
                        <Link to={'/'} className="flex justify-center items-center gap-2">
                            <img src={logo} alt="GBU Logo" className="h-12 w-12" />
                            <div className="leading-tight">
                                <h1 className="font-semibold text-gray-800 text-sm sm:text-base">
                                    गौतम बुद्ध विश्वविद्यालय
                                </h1>
                                <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
                                    GAUTAM BUDDHA UNIVERSITY
                                </h2>
                                <p className="text-xs text-gray-500 hidden sm:block">
                                    An Ultimate Destination for Higher Learning
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* DESKTOP MENU */}
                    <div className="hidden md:flex items-center gap-8">

                        <div className="flex items-center gap-3">
                            <Link to={'/login'}>
                                <button className="cursor-pointer px-4 py-2 text-[#7b3b5a] border border-[#7b3b5a] rounded-md hover:bg-[#6a324d] hover:text-white transition">
                                    Login
                                </button>
                            </Link>
                            <Link to={'/register'}>
                                <button className="cursor-pointer px-4 py-2 bg-[#874263] text-white rounded-md hover:bg-[#6a324d] transition">
                                    Register
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* MOBILE HAMBURGER */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="md:hidden text-gray-700 text-2xl"
                    >
                        ☰
                    </button>
                </div>

                {/* MOBILE MENU */}
                {open && (
                    <div className="md:hidden bg-white">
                        <nav className="flex flex-col gap-4 px-6 py-4 font-bold text-gray-700">

                            <div className="flex justify-center items-center gap-3">
                                {/* <a
                                    href="/login"
                                    className="cursor-pointer flex-1 px-4 py-2 text-center text-[#7b3b5a] border border-[#7b3b5a] rounded-md"
                                >
                                    Login
                                </a> */}
                                <Link className="w-full" to={'/login'}>
                                    <button className="cursor-pointer min-w-full px-4 py-2 text-[#7b3b5a] border border-[#7b3b5a] rounded-md hover:bg-[#6a324d] hover:text-white transition">
                                        Login
                                    </button>
                                </Link>
                                <Link className="w-full" to={'/register'}>
                                    <button className="cursor-pointer min-w-full px-4 py-2 bg-[#874263] text-white rounded-md hover:bg-[#6a324d] transition">
                                        Register
                                    </button>
                                </Link>
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default LandingNavbar