import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClientHeader } from "../../components/Client/ClientHeader";
import { Sidebar } from "../../components/Client/Sidebar";
// import { DashboardView } from "../../components/Client/DashboardView";
import { ProfileView } from "../../components/Client/ProfileView";
import { RegistrationView } from "../../components/Client/RegistrationView";
import { ComingSoon } from "../../utils/ComingSoon";
import StudentMessagesView from "../../components/Client/StudentMessagesView";
import { TimetableView } from "../../components/Client/TimetableView";
import Footer from "../../components/Client/Footer";
import NotificationPermissionBanner from "../../components/Client/NotificationPermissionBanner";
import { getStudentDetails } from "../../lib/user.api";
import { useDispatch } from "react-redux";
import { setUser } from "../../context/features/userSlice";
import { useAuth } from "../../context/useAuth";

const StudentDashboard = () => {
    const [activeView, setActiveView] = useState("profile");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const auth = useAuth();
    const dispatch = useDispatch();

    useEffect(() => {
        if (!auth.isAuthenticated) {
            window.location.href = "/login";
        }
    }, [auth.isAuthenticated]);

    useEffect(() => {
        const getStudent = async () => {
            try {
                const data = await getStudentDetails();
                if (data) {
                    dispatch(setUser(data.student));
                }
            } catch (error) {
                console.log(error);
            }
        }
        getStudent()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            <ClientHeader
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                onMessagesClick={() => setActiveView("messages")}
            />

            <div className="flex">
                <Sidebar activeView={activeView} setActiveView={setActiveView} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                <main className="flex-1 p-4 md:p-6 md:ml-72 my-16 md:mt-16 w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        // transition={{ batch: 0.25 }}
                        >
                            {/* {activeView === "dashboard" && (
                                <DashboardView setActiveView={setActiveView} />
                            )} */}
                            {activeView === "profile" && <ProfileView />}
                            {/* {activeView === "assignments" && <ComingSoon feature={'Assignments'} />} */}
                            {activeView === "attendance" && <ComingSoon feature={'Attendance'} />}
                            {/* {activeView === "clubs" && <ComingSoon feature={'clubs and Committee'} />} */}
                            {/* {activeView === "directory" && <ComingSoon feature={'directory'} />} */}
                            {/* {activeView === "documents" && <ComingSoon feature={'documents'} />} */}
                            {/* {activeView === "events" && <ComingSoon feature={'events'} />} */}
                            {/* {activeView === "exams" && <ComingSoon feature={'exams'} />} */}
                            {activeView === "fees" && <ComingSoon feature={'fees'} />}
                            {/* {activeView === "academics" && <ComingSoon feature={'GBU Academics'} />} */}
                            {/* {activeView === "faculty" && <ComingSoon feature={'Know Your Faculty'} />} */}
                            {/* {activeView === "library" && <ComingSoon feature={'Library'} />} */}
                            {/* {activeView === "notices" && <ComingSoon feature={'Notices'} />} */}
                            {/* {activeView === "smartCards" && <ComingSoon feature={'Smart Cards'} />} */}
                            {/* {activeView === "syllabus" && <ComingSoon feature={'Syllabus'} />} */}
                            {activeView === "timetable" && <TimetableView />}
                            {activeView === "registration" && <RegistrationView />}
                            {activeView === "messages" && <StudentMessagesView />}
                            {/* {activeView === "results" && <ComingSoon feature={'Results'} />} */}
                        </motion.div>
                    </AnimatePresence>
                </main>

                <Footer />
            </div>

            <NotificationPermissionBanner />

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default StudentDashboard;