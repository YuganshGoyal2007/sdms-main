import { useEffect, useState } from "react";
import { User, ClipboardCheck, Landmark, ClipboardPen, MessageCircle, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { getUnreadCount, hasTimetableChangesSince } from "../../lib/user.api";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const navItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "registration", label: "Registration", icon: ClipboardPen },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
  { id: "timetable", label: "Timetable", icon: CalendarDays },
  { id: "fees", label: "Fees", icon: Landmark },
  { id: "messages", label: "Messages", icon: MessageCircle },
];

export function Sidebar({ activeView, setActiveView, isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const [unread, setUnread] = useState(0);
  const [ttChanged, setTtChanged] = useState(false);

  useEffect(() => {
    const lastSeenKey = "ttLastSeenAt";
    let mounted = true;
    const loadUnread = async () => {
      try {
        const r = await getUnreadCount();
        if (mounted) setUnread(r?.count ?? 0);
      } catch {
        // silent
      }
    };
    const loadTt = async () => {
      try {
        const stored = localStorage.getItem(lastSeenKey);
        const since = stored || "2000-01-01T00:00:00.000Z";
        const r = await hasTimetableChangesSince(since);
        if (mounted && r.changed) setTtChanged(true);
      } catch {
        // silent
      }
    };
    const markSeen = () => {
      if (activeView === "timetable") {
        try { localStorage.setItem(lastSeenKey, new Date().toISOString()); } catch {}
        setTtChanged(false);
      }
    };

    loadUnread();
    loadTt();
    markSeen();
    const id = setInterval(loadUnread, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, [activeView]);

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <aside
      className={`fixed left-0 top-16 w-72 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform batch-300 ease-in-out z-40 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
    >
      <div className="p-5 overflow-y-auto h-full flex flex-col">
        {/* <div className="bg-[#faf7f9] h-auto rounded-lg p-4 mb-6">
          <p className="font-semibold text-gray-900">{student?.specialization}</p>
          <p className="text-xs text-gray-500 my-1">{student?.program} {student?.department.toLocaleUpperCase()}</p>
        </div> */}

        <nav className="space-y-1 no-scrollbar overflow-scroll flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-colors cursor-pointer ${isActive
                  ? "bg-[#faf7f9] text-[#7b3b5a] font-medium"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.id === "messages" && unread > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
                {item.id === "timetable" && ttChanged && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    NEW
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="sm:hidden pt-4 flex justify-center mt-4 border-t border-gray-200">
          <p> Developed by <Link to={'/developers'} className='hover:underline font-semibold hover:text-[#6a334e]'>Nishant & Aman</Link></p>
        </div>
      </div>
    </aside>
  );
}
