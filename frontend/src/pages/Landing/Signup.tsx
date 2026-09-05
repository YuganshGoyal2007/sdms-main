import React, { useState } from "react";
import logo from "../../assets/images/logo.png";
import LandingNavbar from "../../components/Home/Navbar";
import LandingFooter from "../../components/Home/Footer";
import { useNavigate } from "react-router-dom";
import { UserRound, CheckCircle2, AlertCircle, Lock, EyeClosed, Eye } from "lucide-react";
import type { StudentAuthProps } from "../../types/types";
import { userRegister, sendOtp, validateUsername, verifyOtp } from "../../lib/auth.api";

type RegistrationStep = "enrollment" | "info" | "otp" | "password" | "success";

const StudentRegistration = () => {
  // Form states
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  // UI states
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("enrollment");
  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentAuthProps | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // Enrollment verification handler
  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (enrollmentNo.trim().length > 0) {
        const data = await validateUsername(enrollmentNo);
        if (data) {
          setStudentInfo(data.user);
          setSuccess("Enrollment verified successfully!");
          setCurrentStep("info");
        }
      } else {
        setError("Please enter a valid enrollment number");
      }
    } catch (error: any) {
      switch (error.response.status) {
        case 404:
          setError("User not found, kindly contact admin!");
          break;
        case 409:
          setError("User already registered, kindly login");
          break;
        case 429:
          setError("Too many requests. Please try again later.");
          break;
        default:
          setError("Failed to verify enrollment. Please try again.");
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP handler
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const email = studentInfo?.email;
      const data = await sendOtp(email);
      if (data) {
        { import.meta.env.VITE_ENV_MODE === 'development' && console.log(data.preview) }
        setCurrentStep('otp');
        setSuccess('OTP sent successfully to registered email!');
        if (import.meta.env.VITE_ENV_MODE === 'development' && data.preview) {
          const confirmOpen = window.confirm(
            "Confirm to view OTP - only DEVELOPMENT mode!"
          );
          if (confirmOpen) {
            const newWindow = window.open(
              data.preview,
              "_blank",
              "noopener,noreferrer"
            );
            if (!newWindow) {
              alert("Popup blocked. Please allow popups for this site.");
            }
          }
        }
      }
    } catch (error: any) {
      switch (error.status) {
        case 400:
          setSuccess('');
          setError('Email not found!');
          break;
        case 429:
          setSuccess('');
          setError('Too many request, please try again later.');
          break;
        default:
          setSuccess('');
          setError('Bad Request Detected');
          break;
      }
    } finally {
      setLoading(false);
    }
  }

  // OTP verification handler
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (otp.length !== 6) {
        setError("Please enter a valid 6-digit OTP");
        setLoading(false);
        return;
      }

      const email = studentInfo?.email

      const data = await verifyOtp(email, otp)
      if (data) {
        setSuccess("Email verified successfully!");
        setCurrentStep("password");
      }
    } catch (error: any) {
      switch (error.status) {
        case 422:
          setError("Invalid OTP.");
          break;
        case 429:
          setError('Too many request, please try again later.');
          break;
        default:
          setError("Failed to verify OTP. Please try again.");
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  // Email verification handler
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      // Validate password
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

      if (!passwordRegex.test(password)) {
        setError("Password must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and one symbol.");
        return setLoading(false);
      }

      // Confirm Password
      if (password !== confirmPassword) return setError("Passwords do not match");

      const data = await userRegister(enrollmentNo, password)

      if (data) {
        setCurrentStep('success');
      }

    } catch (error: any) {
      console.log(error);
      setError(error?.response?.data?.message || error?.message || 'Failed to create password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle success and redirect
  const handleRedirectToLogin = () => {
    navigate("/login");
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
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src={logo} alt="GBU Logo" className="h-12 w-12" />
                <div className="text-left">
                  <h2 className="font-bold text-gray-900 leading-tight text-sm md:text-base">
                    GAUTAM BUDDHA UNIVERSITY
                  </h2>
                  <p className="text-lg font-semibold text-gray-600 mt-1">
                    Registration
                  </p>
                </div>
              </div>
            </div>

            {/* Success Alert */}
            {success && currentStep !== "success" && (
              <div
                className="mb-4 p-4 rounded-lg flex items-start gap-3"
                style={{ backgroundColor: "#dcfce7" }}
              >
                <CheckCircle2
                  size={20}
                  className="text-green-600 shrink-0 mt-0.5"
                />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Error Alert */}
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

            {/* Step 1: Enrollment Verification */}
            {currentStep === "enrollment" && (
              <form onSubmit={handleVerifyEnrollment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Enrollment No
                  </label>
                  <div className="relative">
                    <UserRound
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      value={enrollmentNo}
                      maxLength={50}
                      onChange={(e) => {
                        setEnrollmentNo(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter enrollment number"
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                      style={
                        { "--tw-ring-color": "#7b3b5a" } as React.CSSProperties
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || enrollmentNo.trim().length === 0}
                  className="w-full py-3 rounded-lg cursor-pointer text-white font-semibold mt-6 transition transform hover:scale-101 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#7b3b5a" }}
                >
                  {loading ? "Verifying..." : "Verify Enrollment"}
                </button>
              </form>
            )}

            {/* Step 2: Student Info Display */}
            {currentStep === "info" && studentInfo && (
              <form
                onSubmit={handleSendOTP}
                className="space-y-4"
              >
                {/* Student Info Card */}
                <div
                  className="p-4 rounded-lg border-2 mb-4"
                  style={{ borderColor: "#e5d0d9", backgroundColor: "#fafaf9" }}
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Name
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {studentInfo.name}
                      </p>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Programme / Specialization
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {studentInfo.program} {studentInfo.specialization}
                      </p>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Email ID
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {studentInfo?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div
                  className="flex items-start gap-3 p-4 rounded-lg"
                  style={{ backgroundColor: "#f9f5f7" }}
                >
                  <input
                    type="checkbox"
                    id="confirmation"
                    checked={confirmationChecked}
                    onChange={(e) => setConfirmationChecked(e.target.checked)}
                    className="w-5 h-5 mt-1 rounded cursor-pointer accent-gray-400"
                  />
                  <label htmlFor="confirmation" className="cursor-pointer">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-semibold">I confirm that</span> all
                      information provided herein is accurate and complete to
                      the best of our knowledge at the time of data collection.
                    </p>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!confirmationChecked || loading}
                  className="w-full py-3 rounded-lg text-white font-semibold mt-6 transition transform hover:scale-101 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  style={{ backgroundColor: "#7b3b5a" }}
                >
                  {loading ? 'Sending OTP...' : 'Continue to Email Verification'}
                </button>
              </form>
            )}

            {/* Step 3: OTP Verification */}
            {currentStep === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Enter OTP
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    We've sent a 6-digit OTP to your email address
                  </p>
                  <input
                    type="text"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    placeholder="000000"
                    inputMode="numeric"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition text-center text-lg tracking-widest font-semibold"
                    style={
                      { "--tw-ring-color": "#7b3b5a" } as React.CSSProperties
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 rounded-lg cursor-pointer text-white font-semibold mt-6 transition transform hover:scale-101 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#7b3b5a" }}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                {/* <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0}
                  className="w-full py-3 text-sm font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    color: resendTimer > 0 ? "#9ca3af" : "#7b3b5a",
                    backgroundColor: "#f9f5f7",
                  }}
                >
                  {resendTimer > 0
                    ? `Resend OTP in ${resendTimer}s`
                    : "Resend OTP"}
                </button> */}
              </form>
            )}

            {/* Step 4: Password Creation */}
            {currentStep === "password" && (
              <form onSubmit={handleCreatePassword} className="space-y-4">
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
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter password"
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                      style={{ "--tw-ring-color": "#7b3b5a" } as React.CSSProperties}
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

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
                      style={{ "--tw-ring-color": "#7b3b5a" } as React.CSSProperties}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 cursor-pointer -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {!showConfirmPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    password.length === 0 ||
                    confirmPassword.length === 0
                  }
                  className="w-full py-3 rounded-lg cursor-pointer text-white font-semibold mt-6 transition transform hover:scale-101 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#7b3b5a" }}
                >
                  {loading ? "Creating password..." : "Create Password"}
                </button>

                {/* {error && (
                  <p className="text-sm text-red-600 text-center mt-2">{error}</p>
                )} */}
              </form>

            )}

            {/* Step 5: Success */}
            {currentStep === "success" && (
              <div className="text-center space-y-4">
                <div className="flex justify-center mb-4">
                  <div
                    className="p-4 rounded-full"
                    style={{ backgroundColor: "#dcfce7" }}
                  >
                    <CheckCircle2 size={48} className="text-green-600" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Registration Successful!
                  </h3>
                  <p className="text-sm text-gray-600 my-2">
                    Your account has been verified and is ready to use. You can
                    now sign in with your credentials.
                  </p>
                  <p>Username - {enrollmentNo}</p>
                </div>

                <button
                  onClick={handleRedirectToLogin}
                  className="w-full py-3 rounded-lg cursor-pointer text-white font-semibold mt-6 transition transform hover:scale-101 active:scale-95 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#7b3b5a" }}
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Footer text for login redirect */}
            {currentStep !== "success" && (
              <p className="text-center text-sm text-gray-600 mt-6">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="font-semibold cursor-pointer transition hover:underline"
                  style={{ color: "#7b3b5a" }}
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
      <LandingFooter />
    </>
  );
};

export default StudentRegistration;