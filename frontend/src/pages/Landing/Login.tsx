import { useState } from "react";
import logo from "../../assets/images/logo.png";
import LandingNavbar from "../../components/Home/Navbar";
import LandingFooter from "../../components/Home/Footer";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeClosed, Lock, UserRound } from "lucide-react";
import { userLogin } from "../../lib/auth.api";

const StudentLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await userLogin(username, password);
      if (data) {
        localStorage.setItem('authToken', data.accessToken);
        switch (data.role) {
          case 'student':
            navigate("/student");
            break;
          case 'admin':
            navigate("/admin/dashboard");
            break;
          case 'coordinator':
            navigate("/coordinator/dashboard");
            break;
          case 'chairperson':
            navigate("/chairperson/dashboard");
            break;
          case 'faculty':
            navigate("/faculty/dashboard");
            break;
          default:
            navigate("/admin/dashboard");
            break;
        }
      }
    } catch (error: any) {
      const status = error.response?.status || error.status;
      const msg = error.response?.data?.message || error.response?.data?.error;
      switch (status) {
        case 404:
          setError(msg || 'User not found. Kindly register or check your username!');
          break;
        case 401:
        case 422:
          setError(msg || 'Invalid Credentials! Please check your username and password.');
          break;
        case 429:
          setError('Too many login attempts. Please wait a moment and try again.');
          break;
        case 500:
          setError('Internal Server Error! Please try again later.');
          break;
        default:
          setError(msg || error.message || 'Something went wrong. Please check your credentials.');
          console.log(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LandingNavbar />
      <div
        className="flex items-center justify-center py-12"
        style={{ backgroundColor: "#f6eef2" }}
      >
        <div className="w-full max-w-md px-6">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src={logo} alt="GBU Logo" className="h-12 w-12" />
                <div className="text-left">
                  <h2 className="font-bold text-gray-900 leading-tight">
                    GAUTAM BUDDHA UNIVERSITY
                  </h2>
                  <p className="text-lg font-semibold text-gray-600 mt-1">Login</p>
                </div>
              </div>
            </div>

            {error && (
              <div
                className="mb-4 p-4 rounded-lg flex items-start gap-3"
                style={{ backgroundColor: "#fee2e2" }}
              >
                <AlertCircle
                  size={20}
                  className="text-red-600 shrink-0 mt-0.5"
                />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Enrollment Number / Roll Number Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Username
                </label>
                <div className="relative">
                  <UserRound
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={username}
                    maxLength={50}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                    style={
                      { "--tw-ring-color": "#7b3b5a" } as React.CSSProperties
                    }
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                    style={
                      { "--tw-ring-color": "#7b3b5a" } as React.CSSProperties
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 cursor-pointer -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {!showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg cursor-pointer text-white font-semibold mt-4 transition transform hover:scale-101 active:scale-95 disabled:opacity-70"
                style={{ backgroundColor: "#7b3b5a" }}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="cursor-pointer font-semibold transition hover:underline"
                style={{ color: "#7b3b5a" }}
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
      <LandingFooter />
    </>
  );
};

export default StudentLogin;
