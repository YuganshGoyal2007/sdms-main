import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '../../lib/user.api';

const Header = () => {
    const [q, setQ] = useState('');
    const [unread, setUnread] = useState(0);
    const navigate = useNavigate();
    const role = useSelector((state: { admin?: { role?: string } }) => state.admin?.role);

    useEffect(() => {
        let mounted = true;
        const fetchUnread = async () => {
            try {
                const res = await getUnreadCount();
                if (mounted) setUnread(res?.count ?? 0);
            } catch {
                // silent
            }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const submit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const query = q.trim();
        if (!query) return;
        let base = '/admin';
        if (role === 'chairperson') base = '/chairperson';
        else if (role === 'coordinator') base = '/coordinator';
        navigate(`${base}/records/${encodeURIComponent(query)}`);
        setQ('');
    };

    const messagesPath =
        role === 'chairperson' ? '/chairperson/messages' :
        role === 'coordinator' ? '/coordinator/messages' :
        role === 'student' ? '/student/messages' :
        '/admin/messages';

    return (
        <>
            <div className={`min-h-[7vh] sm:min-h-[10vh] flex items-center justify-between px-4 transition-all batch-300 bg-[#f8f9fa] border-b border-[#d9d9d9] sm:w-[80vw] w-[85vw]`}>
                <p className='text-xl font-semibold '>GBU-SDMS {role === 'chairperson' ? 'Chairperson' : role === 'coordinator' ? 'Coordinator' : 'Admin'} Panel</p>
                <div className="flex items-center gap-3">
                    <form onSubmit={submit} className="flex items-center gap-2">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search roll no or enrollment"
                            className="input-text"
                            aria-label="Search students"
                        />
                        <button type="submit" className="px-3 py-1 bg-black text-white text-sm rounded">Go</button>
                    </form>
                    <button
                        onClick={() => navigate(messagesPath)}
                        className="relative p-2 rounded hover:bg-gray-100 transition"
                        title={`${unread} unread message${unread === 1 ? '' : 's'}`}
                    >
                        <Bell size={18} className="text-gray-700" />
                        {unread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                {unread > 99 ? '99+' : unread}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </>
    )
}

export default Header
