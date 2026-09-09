import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  BookOpen,
  Home as HomeIcon,
  Trophy,
  GraduationCap,
  Laptop,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import logo from "../../assets/images/logo.png";
import { officerLogin } from "../../lib/auth.api";
import { setAdmin } from "../../context/features/adminSlice";

interface DeskConfig {
  code: string;
  slug: string;
  name: string;
  category: string;
  scope: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  defaultEmail: string;
  guidelines: string[];
}

const DESK_CONFIGS: Record<string, DeskConfig> = {
  library: {
    code: "LIB",
    slug: "library",
    name: "Central Bodhisattva Library",
    category: "Auxiliary Resource Center",
    scope: "Circulation records, overdue book fines, and digital repository access clearance.",
    icon: BookOpen,
    defaultEmail: "library@gbu.ac.in",
    guidelines: [
      "Verify physically issued textbook returns",
      "Settle book lost or damaged penalties",
      "Revoke institutional library card and e-resource access",
    ],
  },
  hostel: {
    code: "HST",
    slug: "hostel",
    name: "Hostel Administration & Mess Office",
    category: "Residential Services",
    scope: "Room inventory inspection, mess rebate settlement, caution refund, and key handover.",
    icon: HomeIcon,
    defaultEmail: "hostel@gbu.ac.in",
    guidelines: [
      "Inspect hostel room fixtures and furniture condition",
      "Verify monthly mess ledger and rebate claims",
      "Collect room, wardrobe, and main gate keys",
    ],
  },
  sports: {
    code: "SPT",
    slug: "sports",
    name: "University Sports Council",
    category: "Athletics & Recreation",
    scope: "Sports equipment verification, kit return, gymnasium clearance, and tournament dues.",
    icon: Trophy,
    defaultEmail: "sports@gbu.ac.in",
    guidelines: [
      "Verify return of university sports kits and gear",
      "Check gym access pass and equipment liability",
      "Confirm clearance for university tournament participation",
    ],
  },
  dean: {
    code: "DEAN",
    slug: "dean",
    name: "School Dean Clearance Desk",
    category: "Academic Executive",
    scope: "Academic standing endorsement, departmental council clearance, and disciplinary check.",
    icon: GraduationCap,
    defaultEmail: "dean.soict@gbu.ac.in",
    guidelines: [
      "Review academic council standing and required credits",
      "Verify lab equipment clearance and thesis submission",
      "Finalize school-level endorsement for graduation",
    ],
  },
  ict: {
    code: "ICT",
    slug: "ict",
    name: "Information & Communication Technology Office",
    category: "Digital Infrastructure",
    scope: "Network authentication credentials, lab workstation liability, and email revocation.",
    icon: Laptop,
    defaultEmail: "ict@gbu.ac.in",
    guidelines: [
      "Verify campus Wi-Fi MAC address revocation",
      "Check workstation and server lab liabilities",
      "Schedule institutional email archiving and access sunset",
    ],
  },
};

export default function DeskLogin() {
  const { deskSlug } = useParams<{ deskSlug: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const deskKey = String(deskSlug || "").toLowerCase().trim();
  const desk = DESK_CONFIGS[deskKey];

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (desk) {
      setUsername(desk.defaultEmail);
      setPassword("TestPass@123");
      setError(null);
    }
  }, [deskKey]);

  if (!desk) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Clearance Desk</h2>
          <p className="text-sm text-gray-600 mb-6">
            The clearance authentication endpoint specified does not match any recognized university department desk.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg transition"
          >
            Return to University SDMS Portal
          </button>
        </div>
      </div>
    );
  }

  const DeskIcon = desk.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await officerLogin({
        username,
        password,
        officeCode: desk.code,
      });

      if (res.accessToken) {
        localStorage.setItem("token", res.accessToken);
        localStorage.setItem("role", res.role);
        localStorage.setItem("officeCode", res.officeCode || desk.code);

        dispatch(
          setAdmin({
            name: res.name || username,
            email: username,
            role: res.role,
            officeCode: res.officeCode || desk.code,
          })
        );

        navigate(`/no-dues/portal/${desk.slug}`);
      } else {
        setError(res.message || "Officer authentication failed.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Authentication error. Please verify credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-[#7b3b5a] text-white px-6 py-3 flex items-center justify-between text-xs font-medium">
        <span>Gautam Buddha University - Official Clearance Authentication</span>
        <span>Secure Institutional Endpoint</span>
      </header>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden">
          {/* Desk Header Banner */}
          <div className="bg-gradient-to-r from-[#7b3b5a] to-[#5a2a41] text-white p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <img src={logo} alt="GBU Logo" className="h-10 w-10 bg-white rounded-full p-1" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-white/20 px-2 py-0.5 rounded">
                    {desk.category}
                  </span>
                  <h1 className="text-xl font-bold leading-tight">{desk.name}</h1>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <DeskIcon size={20} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-rose-100 leading-relaxed">{desk.scope}</p>
          </div>

          {/* Verification Scope Checklist */}
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-3">
            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
              Authorized Clearance Scope ({desk.code}):
            </span>
            <div className="space-y-1">
              {desk.guidelines.map((g, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Official Officer Email / Username
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder={desk.defaultEmail}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b3b5a] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Department Officer Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter clearance desk password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b3b5a] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#7b3b5a] hover:bg-[#682e4a] text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                >
                  <ShieldCheck size={16} />
                  <span>{loading ? "Authorizing Session..." : `Authorize & Enter ${desk.code} Desk`}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Station: Bound to {desk.code} clearance queue</span>
              <button
                type="button"
                onClick={() => {
                  setUsername(desk.defaultEmail);
                  setPassword("TestPass@123");
                }}
                className="text-[#7b3b5a] font-medium hover:underline cursor-pointer"
              >
                Pre-fill credentials
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 text-center text-xs text-gray-500">
        GBU Student Data Management System (SDMS) | Departmental Clearance Gateway
      </footer>
    </div>
  );
}
