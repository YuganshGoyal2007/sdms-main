import { useEffect, useState } from "react";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import { getMessages, sendMessage } from "../../lib/user.api";

type Notification = {
    id: number;
    toRole: string;
    message: string;
    read: boolean;
    createdAt: string;
};

const ChairpersonMessages = () => {
    const [messages, setMessages] = useState<Notification[]>([]);
    const [content, setContent] = useState("");
    const [receiverRole, setReceiverRole] = useState("admin");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getMessages();
            setMessages(Array.isArray(data?.messages) ? data.messages : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = content.trim();
        if (!trimmed) return;
        setSending(true);
        try {
            await sendMessage(0, trimmed);
            setContent("");
            await load();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="w-full h-full flex overflow-hidden">
            <AdminSideNav activeTab={"messages"} />
            <div className="flex flex-col sm:w-[80vw] w-[85vw] transition-all">
                <Header />
                <main className="p-6 bg-[#f3f3f3] min-h-[80vh]">
                    <h1 className="text-2xl font-semibold mb-4">Messages</h1>

                    <form onSubmit={handleSend} className="bg-white border rounded p-4 mb-6 space-y-3">
                        <h2 className="font-semibold">Send a message</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                value={receiverRole}
                                onChange={(e) => setReceiverRole(e.target.value)}
                                className="border rounded px-3 py-2 sm:w-48"
                            >
                                <option value="admin">Admin</option>
                                <option value="coordinator">Coordinator</option>
                            </select>
                            <input
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Type your message…"
                                className="input-text flex-1"
                            />
                            <button
                                type="submit"
                                disabled={sending || !content.trim()}
                                className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
                            >
                                {sending ? "Sending…" : "Send"}
                            </button>
                        </div>
                    </form>

                    {loading ? (
                        <p>Loading messages…</p>
                    ) : messages.length === 0 ? (
                        <p>No messages yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((m) => (
                                <div key={m.id} className="bg-white border rounded p-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs uppercase font-semibold text-gray-500">
                                            to {m.toRole}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(m.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default ChairpersonMessages;
