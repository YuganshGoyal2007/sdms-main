import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">403</h1>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Access Forbidden</h2>
        <p className="text-sm text-gray-600 mb-6">
          You do not have the required permissions to access this institutional resource or departmental clearance desk.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-[#7b3b5a] text-white rounded-lg text-sm font-medium hover:bg-[#642d47] transition cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
