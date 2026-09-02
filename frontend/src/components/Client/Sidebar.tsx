import { User, ClipboardCheck, Landmark, ClipboardPen } from "lucide-react";
import { Link } from "react-router-dom";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const navItems = [
  // { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: User },
  { id: "registration", label: "Registration", icon: ClipboardPen },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
  { id: "fees", label: "Fees", icon: Landmark },
  // { id: "assignments", label: "Assignments", icon: ClipboardList },
  // { id: "clubs", label: "Clubs and Committee", icon: Users },
  // { id: "directory", label: "Directory", icon: BookOpenText },
  // { id: "documents", label: "Documents", icon: Files },
  // { id: "events", label: "Events", icon: Balloon },
  // { id: "exams", label: "Exams", icon: FileText },
  // { id: "academics", label: "GBU Academics", icon: BookA },
  // { id: "faculty", label: "Know Your Faculty", icon: GraduationCap },
  // { id: "library", label: "Library", icon: LibraryBig },
  // { id: "notices", label: "Notices", icon: Megaphone },
  // { id: "smartCards", label: "Smart Cards", icon: IdCard },
  // { id: "syllabus", label: "Syllabus", icon: NotebookText },
  // { id: "timetable", label: "Timetable", icon: CalendarDays },
  // { id: "results", label: "Results", icon: BarChart3 },
];

export function Sidebar({ activeView, setActiveView, isSidebarOpen, setIsSidebarOpen }: SidebarProps) {

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    // Close sidebar on mobile after selection
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors cursor-pointer ${isActive
                  ? "bg-[#faf7f9] text-[#7b3b5a] font-medium"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
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
