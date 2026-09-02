import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const [q, setQ] = useState('');
    const navigate = useNavigate();

    const submit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const query = q.trim();
        if (!query) return;
        navigate(`/admin/records/${encodeURIComponent(query)}`);
        setQ('');
    };

    return (
        <>
            <div className={`min-h-[7vh] sm:min-h-[10vh] flex items-center justify-between px-4 transition-all batch-300 bg-[#f8f9fa] border-b border-[#d9d9d9] sm:w-[80vw] w-[85vw]`}>
                <p className='text-xl font-semibold '>GBU-SDMS Admin Panel</p>
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
            </div>
        </>
    )
}

export default Header