import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Home,
  Trophy,
  GraduationCap,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Building,
} from "lucide-react";
import AdminSideNav from "../../components/Admin/AdminSideNav";
import Header from "../../components/Admin/Header";
import Footer from "../../components/Admin/Footer";
import { getAllOfficesOverview, type OfficeConfig, type OfficeStats } from "../../lib/noDues.api";

interface OfficeOverviewItem extends OfficeConfig {
  stats: OfficeStats;
}

const getOfficeIcon = (iconName: string) => {
  switch (iconName) {
    case "BookOpen":
      return BookOpen;
    case "Home":
      return Home;
    case "Trophy":
      return Trophy;
    case "GraduationCap":
      return GraduationCap;
    case "Laptop":
      return Laptop;
    default:
      return Building;
  }
};

const NoDuesPortalsHub: React.FC = () => {
  const navigate = useNavigate();
  const [offices, setOffices] = useState<OfficeOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await getAllOfficesOverview();
      if (res.success) {
        setOffices(res.offices || []);
      }
    } catch (err) {
      console.error("Failed to load offices overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const totalPending = offices.reduce((acc, o) => acc + (o.stats?.pending || 0), 0);
  const totalApproved = offices.reduce((acc, o) => acc + (o.stats?.approved || 0), 0);
  const totalWithDues = offices.reduce((acc, o) => acc + (o.stats?.rejected || 0), 0);
  const totalDuesAmount = offices.reduce((acc, o) => acc + (o.stats?.totalDues || 0), 0);

  const filteredOffices = offices.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.slug.toLowerCase().includes(q) ||
      o.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8f9fa]">
      <AdminSideNav activeTab={"nodues"} />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 z-10">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] min-h-0">
          <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
            {/* Header Hero Banner matching SDMS vibe */}
            <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#7b3b5a]/10 text-[#7b3b5a]">
                    <ShieldCheck size={14} />
                    <span>Institutional Clearance Framework</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Departmental No-Dues Portals
                  </h1>
                  <p className="text-sm md:text-base text-gray-600 max-w-2xl">
                    Dedicated clearance desks for Central Library, Hostel Administration, Sports Council, School Dean, and ICT Office.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchOverview}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={() => navigate("/admin/no-dues")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7b3b5a] text-white hover:bg-[#682e49] text-sm font-medium transition shadow-sm cursor-pointer"
                  >
                    <span>Master Queue</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Universal Search Bar */}
              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clearance department or keyword..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7b3b5a]/20 focus:border-[#7b3b5a] transition"
                  />
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  Showing {filteredOffices.length} of 5 Desks
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Pending Clearances</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {loading ? "--" : totalPending}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>Awaiting desk review</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Cleared Endorsements</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {loading ? "--" : totalApproved}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                  <CheckCircle2 size={12} />
                  <span>Zero liability verified</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Pending Dues Holds</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">
                  {loading ? "--" : totalWithDues}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                  <AlertCircle size={12} />
                  <span>Action required</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Total Dues Levied</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  INR {totalDuesAmount.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                  <ShieldCheck size={12} />
                  <span>Institutional liabilities</span>
                </div>
              </div>
            </div>

            {/* Department Clearance Cards Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Official Clearance Desks
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200">
                  5 Department Desks Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOffices.map((office) => {
                  const IconComponent = getOfficeIcon(office.icon);
                  const stats = office.stats || {
                    total: 0,
                    pending: 0,
                    ready: 0,
                    approved: 0,
                    rejected: 0,
                    totalDues: 0,
                  };

                  return (
                    <div
                      key={office.slug}
                      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-xl bg-[#7b3b5a]/10 text-[#7b3b5a] flex items-center justify-center group-hover:bg-[#7b3b5a] group-hover:text-white transition-colors">
                            <IconComponent size={24} />
                          </div>
                          <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            {office.code}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {office.category}
                          </p>
                          <h3 className="text-lg font-bold text-gray-900 mt-1 leading-snug">
                            {office.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                            {office.description}
                          </p>
                        </div>

                        {/* Desk specific counts */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center">
                          <div className="bg-amber-50/70 border border-amber-100 rounded-lg py-2 px-1">
                            <span className="text-xs text-amber-700 font-semibold block">
                              {stats.pending}
                            </span>
                            <span className="text-[10px] text-amber-600 font-medium">Pending</span>
                          </div>

                          <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg py-2 px-1">
                            <span className="text-xs text-emerald-700 font-semibold block">
                              {stats.approved}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">Cleared</span>
                          </div>

                          <div className="bg-rose-50/70 border border-rose-100 rounded-lg py-2 px-1">
                            <span className="text-xs text-rose-700 font-semibold block">
                              {stats.rejected}
                            </span>
                            <span className="text-[10px] text-rose-600 font-medium">Dues</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <Link
                          to={`/no-dues/portal/${office.slug}`}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-[#7b3b5a] transition cursor-pointer"
                        >
                          <span>Open Desk</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
        <div className="shrink-0 z-10 border-t border-[#d9d9d9] bg-[#f8f9fa]">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default NoDuesPortalsHub;
