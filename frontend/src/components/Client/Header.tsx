import { Menu, Power } from "lucide-react";
import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
import universityLogo from "../../assets/images/logo.png";
import { Link, useNavigate } from "react-router-dom";

export function Header({
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    navigate("/login");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    }

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 h-16 z-50">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <Link to={'/'}>
            <img
              src={universityLogo}
              alt="University Logo"
              className="w-10 h-10 md:w-14 md:h-14 object-contain"
            />
          </Link>

          <div>
            <h1 className="font-semibold text-gray-900 text-sm md:text-base">
              Gautam Buddha University
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              An Ultimate Destination for Higher Learning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 sm:px-4 p-2 sm:w-auto sm:h-auto w-7 h-7 sm:py-2 rounded-lg transition-colors cursor-pointer bg-[#faf7f9] text-[#7b3b5a] hover:bg-[#f3edf1] font-medium"
          >
            <Power className="sm:hidden block" />
            <span className="sm:block text-sm hidden">Logout</span>
          </button>
          {/* <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5 text-gray-600" />
            </button>

            <AnimatePresence>
              {isNotificationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  // transition={{ batch: 0.2 }}
                  className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                    </div>
                  </div>
                  <div className="min-h-36 overflow-y-auto notification-scroll flex justify-center items-center">
                    <p className="text-center">No new notification</p>
                  </div>
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button className="w-full text-center text-sm text-[#7b3b5a] hover:text-[#5f2e46] font-medium cursor-pointer">
                      View All Notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div> */}
        </div>
      </div>
    </header>
  );
}
