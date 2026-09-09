import { useState, useEffect } from "react";
import logo from "../../assets/images/logo.png";
import LandingNavbar from "../../components/Home/Navbar";
import LandingFooter from "../../components/Home/Footer";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  UserRound,
  BookOpen,
  Home,
  Trophy,
  GraduationCap,
  Laptop,
  ShieldCheck,
  Building,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { officerLogin, userLogin } from "../../lib/auth.api";

interface DepartmentPreset {
  code: string;
  slug: string;
  name: string;
  category: string;
  icon: any;
  defaultEmail: string;
  defaultPass: string;
  scope: string;
}

const DEPARTMENTS: DepartmentPreset[] = [
  {
    code: "LIB",
    slug: "library",
    name: "Central Bodhisattva Library",
    category: "Auxiliary Resource Center",
    icon: BookOpen,
    defaultEmail: "library@gbu.ac.in",
    defaultPass: "TestPass@123",
    scope: "Circulation records, overdue fines, and e-library access revocation",
  },
  {
    code: "HST",
    slug: "hostel",
    name: "Hostel Administration & Mess",
    category: "Residential Services",
    icon: Home,
    defaultEmail: "hostel@gbu.ac.in",
    defaultPass: "TestPass@123",
    scope: "Room inventory inspection, mess rebate settlement, and key handover",
  },
  {
    code: "SPT",
    slug: "sports",
    name: "University Sports Council",
    category: "Athletics & Recreation",
    icon: Trophy,
    defaultEmail: "sports@gbu.ac.in",
    defaultPass: "TestPass@123",
    scope: "Athletic kit returns, gym pass deactivation, and tournament inventory",
  },
  {
    code: "DEAN",
    slug: "dean",
    name: "School Dean Clearance Desk",
    category: "Academic Executive",
    icon: GraduationCap,
    defaultEmail: "dean.soict@gbu.ac.in",
    defaultPass: "TestPass@123",
    scope: "School academic council endorsement and final graduation clearance",
  },
  {
    code: "ICT",
    slug: "ict",
    name: "ICT Infrastructure Office",
    category: "Digital Infrastructure",
    icon: Laptop,
    defaultEmail: "ict@gbu.ac.in",
    defaultPass: "TestPass@123",
    scope: "University email deactivation, Wi-Fi MAC revocation, and lab hardware return",
  },
  {
    code: "ADMIN",
    slug: "admin",
    name: "Central HOD / Administrator",
    category: "Institutional Master Control",
    icon: Building,
    defaultEmail: "hod.cs@gbu.ac.in",
    defaultPass: "TestPass@123",
    scope: "Master oversight across all 5 clearance desks and university SDMS administration",
  },
];

const CODE_TO_SLUG: Record<string, string> = {
  LIB: "library",
  HST: "hostel",
  SPT: "sports",
  DEAN: "dean",
  ICT: "ict",
};

const OfficerLogin = () => {
  const { officeCode } = useParams<{ officeCode?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Determine initial selected department
  const initialSlug = (officeCode || searchParams.get("office") || "library").toLowerCase();
  const initialDept =
    DEPARTMENTS.find((d) => d.slug === initialSlug || d.code.toLowerCase() === initialSlug) ||
    DEPARTMENTS[0];

  const [selectedDept, setSelectedDept] = useState<DepartmentPreset>(initialDept);
  const [username, setUsername] = useState(initialDept.defaultEmail);
  const [password, setPassword] = useState(initialDept.defaultPass);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync if URL param changes
  useEffect(() => {
    if (officeCode) {
      const match = DEPARTMENTS.find(
        (d) => d.slug === officeCode.toLowerCase() || d.code.toLowerCase() === officeCode.toLowerCase()
      );
      if (match) {
        setSelectedDept(match);
        setUsername(match.defaultEmail);
        setPassword(match.defaultPass);
      }
    }
  }, [officeCode]);

  const handleSelectDept = (dept: DepartmentPreset) => {
    setSelectedDept(dept);
    setUsername(dept.defaultEmail);
    setPassword(dept.defaultPass);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (selectedDept.code === "ADMIN") {
        // HOD / Master Admin login
        const data = await userLogin(username, password);
        if (data?.accessToken) {
          localStorage.setItem("authToken", data.accessToken);
          navigate("/no-dues/portals");
        }
      } else {
        // Dedicated Departmental Officer login
        const data = await officerLogin({
          username,
          password,
          officeCode: selectedDept.code,
        });

        if (data?.accessToken) {
          localStorage.setItem("authToken", data.accessToken);
          const targetSlug = CODE_TO_SLUG[data.officeCode || selectedDept.code] || selectedDept.slug;
          navigate(`/no-dues/portal/${targetSlug}`);
        }
      }
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data?.error;
      if (status === 403) {
        setError(msg || "Department Authorization Mismatch: Access denied for this desk.");
      } else if (status === 401 || status === 422) {
        setError("Invalid officer credentials. Please verify your department email and password.");
      } else if (status === 404) {
        setError("Officer account not found in university directory.");
      } else {
        setError(msg || "Authentication failed. Please check credentials or contact ICT Office.");
      }
    } finally {
      setLoading(false);
    }
  };

  const SelectedIcon = selectedDept.icon;

  return (
    <div className="min-h-screen flex flex-col bg-[#f6eef2]">
      <LandingNavbar />

      <main className="flex-1 flex items-center justify-center py-10 px-4 md:px-6">
        <div className="w-full max-w-4xl">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
            {/* Top University Branding Banner */}
            <div className="bg-[#7b3b5a] text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={logo} alt="GBU Seal" className="h-14 w-14 bg-white rounded-xl p-1 shadow" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded">
                      Official Clearance Authentication
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-1">
                    Departmental Clearance Officer Portal
                  </h1>
                  <p className="text-xs text-rose-100 mt-0.5">
                    Gautam Buddha University Student Data Management System (GBU-SDMS)
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs text-rose-100 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                <ShieldCheck size={16} />
                <span>Zero Liability Audit Verified</span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Step 1: Select Department Desk */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Step 1: Select Your Department Clearance Desk
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DEPARTMENTS.map((dept) => {
                    const isSelected = selectedDept.code === dept.code;
                    const Icon = dept.icon;
                    return (
                      <button
                        key={dept.code}
                        type="button"
                        onClick={() => handleSelectDept(dept)}
                        className={`text-left p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#7b3b5a]/5 border-[#7b3b5a] ring-2 ring-[#7b3b5a]/20 shadow-sm"
                            : "bg-gray-50/70 border-gray-200 hover:bg-gray-100/80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected ? "bg-[#7b3b5a] text-white" : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isSelected
                                ? "bg-[#7b3b5a] text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {dept.code}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">
                            {dept.name}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                            {dept.category}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Department Details Banner */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7b3b5a]/10 text-[#7b3b5a] flex items-center justify-center shrink-0">
                    <SelectedIcon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">
                        {selectedDept.name} ({selectedDept.code})
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Authorized Scope
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedDept.scope}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUsername(selectedDept.defaultEmail);
                    setPassword(selectedDept.defaultPass);
                  }}
                  className="shrink-0 text-xs font-semibold text-[#7b3b5a] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  <span>Pre-fill Officer Credential</span>
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Step 2: Officer Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Step 2: Sign In with Department Credentials
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department Officer Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Officer Official Email / Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <UserRound size={16} />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder={`${selectedDept.slug}@gbu.ac.in`}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7b3b5a]/30 focus:border-[#7b3b5a] transition bg-white"
                      />
                    </div>
                  </div>

                  {/* Officer Password */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter password"
                        className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7b3b5a]/30 focus:border-[#7b3b5a] transition bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-gray-500">
                    <span>Redirect target: </span>
                    <span className="font-semibold text-gray-800">
                      {selectedDept.code === "ADMIN"
                        ? "/no-dues/portals (Master Hub)"
                        : `/no-dues/portal/${selectedDept.slug}`}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#7b3b5a] hover:bg-[#682e4a] text-white font-semibold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Authenticating...</span>
                    ) : (
                      <>
                        <span>Authorize & Open Desk</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Quick Links */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                <Link to="/login" className="hover:text-[#7b3b5a] transition font-medium">
                  &larr; Standard Student / Faculty Login
                </Link>

                <div className="flex items-center gap-3">
                  <Link to="/no-dues/portals" className="hover:text-[#7b3b5a] transition font-medium">
                    Master Desks Directory
                  </Link>
                  <span>&bull;</span>
                  <span className="text-gray-400">ICT Security Policy v2.4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default OfficerLogin;
