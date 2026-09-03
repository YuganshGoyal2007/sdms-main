import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import { getChairpersonClasses, getMessages } from "../../lib/user.api";

const StatCard = ({ label, value, onClick }: { label: string; value: number | string; onClick?: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-start justify-center p-5 bg-white rounded-lg shadow-sm border border-[#e6e6e6] text-left w-full ${onClick ? "hover:shadow-md transition" : "cursor-default"}`}
    >
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-3xl font-semibold text-gray-900 mt-2">{value}</span>
    </button>
);

const QuickAction = ({ title, description, onClick }: { title: string; description: string; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-start p-4 bg-white rounded-lg shadow-sm border border-[#e6e6e6] text-left w-full hover:shadow-md transition"
    >
        <span className="text-base font-semibold text-gray-900">{title}</span>
        <span className="text-sm text-gray-500 mt-1">{description}</span>
    </button>
);

type AdminState = {
    id?: number;
    name?: string | null;
    username?: string | null;
    role?: string;
};

const ChairpersonDashboard = () => {
    const navigate = useNavigate();
    const admin = useSelector((state: { admin: AdminState }) => state.admin);
    const [classesCount, setClassesCount] = useState<number>(0);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [classesRes, messagesRes] = await Promise.allSettled([
                    getChairpersonClasses(),
                    getMessages(),
                ]);
                if (classesRes.status === "fulfilled") {
                    setClassesCount(classesRes.value?.count ?? 0);
                }
                if (messagesRes.status === "fulfilled") {
                    const list: { read?: boolean }[] = Array.isArray(messagesRes.value?.messages)
                        ? messagesRes.value.messages
                        : [];
                    setUnreadCount(list.filter((m) => !m.read).length);
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const displayName = admin?.name || admin?.username || "Chairperson";

    return (
        <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
            <AdminSideNav activeTab={"dashboard"} />

            <div className="flex flex-col flex-1">
                <div className="sm:h-[10vh] shrink-0">
                    <Header />
                </div>

                <main className="flex-1 overflow-y-auto min-h-[88vh] sm:min-h-[83vh] bg-[#f3f3f3] px-5 sm:px-0">
                    <div className="min-h-full w-full bg-[#f3f3f3] px-4 sm:px-6 lg:px-10 py-6">

                        <div className="mb-6">
                            <h1 className="text-2xl font-semibold text-gray-900">Chairperson Dashboard</h1>
                            <p className="text-sm text-gray-500 mt-1">Welcome back, {displayName}.</p>
                        </div>

                        <section className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Overview</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <StatCard
                                    label="Assigned Classes"
                                    value={loading ? "…" : classesCount}
                                    onClick={() => navigate("/chairperson/classes")}
                                />
                                <StatCard
                                    label="Unread Messages"
                                    value={loading ? "…" : unreadCount}
                                />
                                <StatCard
                                    label="Role"
                                    value="Chairperson"
                                />
                            </div>
                        </section>

                        <section className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <QuickAction
                                    title="My Classes"
                                    description="View classes assigned to you"
                                    onClick={() => navigate("/chairperson/classes")}
                                />
                                <QuickAction
                                    title="Browse Student Records"
                                    description="Search and view student profiles"
                                    onClick={() => navigate("/chairperson/records")}
                                />
                                <QuickAction
                                    title="Messages"
                                    description="View and send messages"
                                    onClick={() => navigate("/chairperson/messages")}
                                />
                                <QuickAction
                                    title="Activity Log"
                                    description="Review your activity history"
                                    onClick={() => navigate("/chairperson/logs")}
                                />
                            </div>
                        </section>

                        <section className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Account</h2>
                            <div className="bg-white rounded-lg shadow-sm border border-[#e6e6e6] p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Name</span>
                                        <p className="font-medium text-gray-900">{displayName}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Username</span>
                                        <p className="font-medium text-gray-900">{admin?.username ?? "—"}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Role</span>
                                        <p className="font-medium text-gray-900">Chairperson</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Classes assigned</span>
                                        <p className="font-medium text-gray-900">{loading ? "…" : classesCount}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </main>

                <div className="h-14 shrink-0">
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default ChairpersonDashboard;
