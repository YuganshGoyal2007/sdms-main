import { useEffect, useState } from "react";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import { getChairpersonLogs } from "../../lib/user.api";

type LogEntry = {
    id: number;
    userId: number;
    action: string;
    entity: string;
    entityId?: string | number | null;
    createdAt: string;
};

const actionBadge = (action: string) => {
    const a = (action || "").toLowerCase();
    if (a.includes("delete")) return "bg-red-100 text-red-700 border-red-300";
    if (a.includes("create") || a.includes("add")) return "bg-emerald-100 text-emerald-700 border-emerald-300";
    if (a.includes("update")) return "bg-blue-100 text-blue-700 border-blue-300";
    if (a.includes("upload")) return "bg-purple-100 text-purple-700 border-purple-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
};

const ChairpersonLogs = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getChairpersonLogs();
                setLogs(Array.isArray(data?.logs) ? data.logs : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="w-full h-full flex overflow-hidden">
            <AdminSideNav activeTab={"logs"} />
            <div className="flex flex-col sm:w-[80vw] w-[85vw] transition-all">
                <Header />
                <main className="p-6 bg-[#f3f3f3] min-h-[80vh]">
                    <h1 className="text-2xl font-semibold mb-4">My Activity</h1>

                    {loading ? (
                        <p>Loading activity…</p>
                    ) : logs.length === 0 ? (
                        <p>No activity recorded yet.</p>
                    ) : (
                        <div className="bg-white border rounded overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[#f8f9fa] border-b">
                                    <tr className="text-left">
                                        <th className="p-3">When</th>
                                        <th className="p-3">Action</th>
                                        <th className="p-3">Entity</th>
                                        <th className="p-3">Entity ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="border-t">
                                            <td className="p-3 text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${actionBadge(log.action)}`}>
                                                    {(log.action || "").toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-3">{log.entity}</td>
                                            <td className="p-3 text-gray-500">{log.entityId ?? "—"}</td>
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

export default ChairpersonLogs;
