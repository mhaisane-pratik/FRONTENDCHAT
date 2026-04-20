import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useChat } from "../contexts/ChatContext";
import { socket } from "../api/socket";
import { 
  Lock, Phone, MessageSquare, Shield, 
  ArrowRight, Smartphone, Mail, CheckCircle, Zap,
  Twitter, Instagram, Facebook, Globe, ChevronRight,
  Sparkles, Send, KeyRound, Users, Heart
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");

export default function ChatLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser, currentUser } = useChat();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ssoToken = params.get("ssoToken");

    if (ssoToken) {
      handleSsoLogin(ssoToken);
    }
  }, []);

  const handleSsoLogin = async (token: string) => {
    setIsLoading(true);
    setError("");
    try {
      const SSO_BACKEND_URL = "http://localhost:4002";
      const res = await fetch(`${SSO_BACKEND_URL}/api/v1/auth/sso-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sso_token: token }),
      });

      if (!res.ok) throw new Error("SSO Login failed");

      const data = await res.json();
      
      // Save user and token
      localStorage.setItem("chatUser", JSON.stringify(data.user));
      localStorage.setItem("chatToken", data.token);
      setCurrentUser(data.user);

      navigate("/chat", { replace: true });
    } catch (err) {
      console.error("SSO Error:", err);
      setError("Synchronized login failed. Please login manually.");
    } finally {
      setIsLoading(false);
    }
  };

  const [countryCode, setCountryCode] = useState("+91");
  const [localNumber, setLocalNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [mobileStep, setMobileStep] = useState<"mobile" | "otp">("mobile");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const countryOptions = [
    { label: "IN", code: "+91" },
    { label: "US", code: "+1" },
    { label: "UK", code: "+44" },
    { label: "AE", code: "+971" },
    { label: "SA", code: "+966" },
    { label: "PK", code: "+92" },
    { label: "BD", code: "+880" },
  ];

  useEffect(() => {
    const existingUser = localStorage.getItem("chatUser");
    if (existingUser || currentUser) {
      navigate("/chat", { replace: true });
    }
  }, [navigate, currentUser]);

  const formatPhone = (phone: string) => {
    return phone.replace(/\D/g, "");
  };

  const otpValue = otpDigits.join("");

  const handleOtpDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const next = [...otpDigits];
    next[index] = cleaned.slice(-1);
    setOtpDigits(next);

    if (cleaned && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }
  };

  const handleOtpBackspace = (index: number, key: string) => {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null;
      prevInput?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!localNumber.trim()) {
      setError("Enter mobile number");
      return;
    }
    setShowLoading(true);
    setIsLoading(true);
    setError("");

    try {
      const formattedPhone = formatPhone(localNumber);
      const res = await fetch(`${API_URL}/api/v1/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send OTP");
      }
      setMobileNumber(formattedPhone);

      setTimeout(() => {
        setShowLoading(false);
        setIsLoading(false);
        setMobileStep("otp");
      }, 2000);
    } catch (err: any) {
      setShowLoading(false);
      setIsLoading(false);
      setError(err.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      setError("Enter OTP");
      return;
    }
    setShowLoading(true);
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mobileNumber,
          otp: otpValue,
          name: mobileNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid OTP");
      }

      localStorage.setItem("chatUser", data.mobile);
      setCurrentUser(data);

      if (!socket.connected) socket.connect();
      socket.emit("user_join", { mobile: data.mobile });

      setTimeout(() => {
        setShowLoading(false);
        setIsLoading(false);
        navigate("/chat", { replace: true });
      }, 2000);
    } catch (err: any) {
      setShowLoading(false);
      setIsLoading(false);
      setError(err.message || "Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40 text-slate-900 overflow-hidden" style={{ fontFamily: "'Inter', 'DM Sans', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #DBEAFE; color: #1D4ED8; }
        
        .btn-primary {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(135deg, #2563EB, #7C3AED);
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        .btn-primary:hover::before {
          left: 100%;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -8px rgba(37,99,235,0.4);
        }
        .btn-primary:active {
          transform: translateY(0);
        }
        
        .social-icon {
          transition: all 0.25s ease;
        }
        .social-icon:hover {
          background: linear-gradient(135deg, #EFF6FF, #F3E8FF);
          border-color: #C7D2FE;
          color: #4F46E5;
          transform: translateY(-2px) scale(1.05);
        }
        
        /* Modern loading animation */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .loading-shimmer {
          background: linear-gradient(90deg, #2563EB, #7C3AED, #2563EB);
          background-size: 200% 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        
        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #2563EB, #7C3AED);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Card hover effect */
        .glass-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(0px);
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 48px -12px rgba(0,0,0,0.15);
        }
        
        /* OTP Input Focus Effect */
        .otp-input:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
          transform: scale(1.02);
        }
        
        /* Animated background blobs */
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .blob {
          animation: blob 12s infinite cubic-bezier(0.45, 0.05, 0.2, 0.99);
        }
        .blob-delay {
          animation-delay: -6s;
        }
      `}</style>

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-20 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl blob"></div>
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl blob blob-delay"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Main container */}
      <div className="relative min-h-screen flex items-center justify-center p-4 md:p-6">
        {/* Login Card */}
        <div className="relative w-full max-w-[360px] sm:max-w-[400px] md:max-w-[420px]">
          {/* Loading Overlay */}
          {showLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100">
              <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center w-48 border border-slate-100">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 shadow-lg" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
                  <MessageSquare size={28} className="text-white" />
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full loading-shimmer"></div>
                </div>
                <p className="text-xs font-semibold gradient-text">
                  Connecting securely...
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Please wait</p>
              </div>
            </div>
          )}

          {/* Main Card - Glass morphism style */}
          <div className="glass-card bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden transition-all duration-300">
            {/* Decorative top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
            
            {/* Header */}
            <div className="px-5 pt-6 pb-4 text-center">
              {/* Logo with glow effect */}
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl"></div>
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
                  <MessageSquare size={32} className="text-white" />
                </div>
              </div>
              
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                <span className="gradient-text">ZATCHAT</span>
              </h1>
            
              
              {/* Security badges */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full">
                  <Shield size={10} className="text-green-600" />
                  <span className="text-[9px] font-semibold text-green-700">End-to-end encrypted</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full">
                  <Zap size={10} className="text-blue-600" />
                  <span className="text-[9px] font-semibold text-blue-700">Real-time</span>
                </div>
              </div>
            </div>

            <div className="px-5 pb-6">
              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50/80 border border-red-100 text-red-600 flex items-start gap-2 backdrop-blur-sm">
                  <span className="font-medium text-sm">⚠️</span>
                  <span className="text-xs flex-1">{error}</span>
                </div>
              )}

              {/* Mobile OTP Flow */}
              <div className="space-y-4">
                {mobileStep === "mobile" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1">
                        <Phone size={12} />
                        Mobile Number
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          disabled={isLoading}
                          className="w-28 px-3 py-3 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                        >
                          {countryOptions.map((item) => (
                            <option key={item.code} value={item.code}>{item.label} {item.code}</option>
                          ))}
                        </select>

                        <div className="relative flex-1">
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            placeholder="Enter mobile number"
                            className="w-full pl-9 pr-3 py-3 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                            value={localNumber}
                            onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ""))}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
      
                    </div>

                    <button
                      className="btn-primary w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                    >
                      {isLoading && !showLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          Continue with OTP
                          <Send size={14} />
                        </>
                      )}
                    </button>
                  </>
                )}

                {mobileStep === "otp" && (
                  <>
                    <div className="text-center space-y-1">
                      <KeyRound size={20} className="text-blue-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-600">
                        OTP sent to <span className="font-bold text-slate-900">{mobileNumber}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">Please enter the verification code</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 text-center block">
                        Enter 6-digit OTP
                      </label>
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        {otpDigits.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            disabled={isLoading}
                            onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpBackspace(index, e.key)}
                            className="otp-input w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-white/80 border border-slate-200 rounded-xl text-slate-900 outline-none transition-all duration-200 focus:border-blue-400"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      className="btn-primary w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 mt-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleVerifyOtp}
                      disabled={isLoading}
                    >
                      {isLoading && !showLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          Verify & Continue
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>

                    <button
                      className="w-full text-center text-[11px] text-slate-500 hover:text-blue-600 transition-colors py-2 flex items-center justify-center gap-1 font-medium"
                      onClick={() => setMobileStep("mobile")}
                      disabled={isLoading}
                      type="button"
                    >
                      <ChevronRight size={12} className="rotate-180" />
                      Change mobile number
                    </button>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white/80 text-slate-400 text-[10px] font-medium">Or connect via</span>
                </div>
              </div>

              {/* Social icons */}
              <div className="flex justify-center gap-3">
                {[
               
                ].map(({ Icon, label }, i) => (
                  <div 
                    key={i} 
                    className="social-icon w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer border border-slate-200 text-slate-500 bg-white/50 transition-all duration-200 hover:shadow-md"
                    title={label}
                  >
                    <Icon size={14} />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
              <div className="flex justify-center items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-slate-500">
                  <Shield size={10} className="text-green-500" />
                  <span>Secure</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Lock size={10} className="text-blue-500" />
                  <span>Private</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Zap size={10} className="text-yellow-500" />
                  <span>Instant</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Users size={10} className="text-purple-500" />
                  <span>Global</span>
                </span>
              </div>
            </div>
          </div>

          {/* Platform badges */}
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {[
            
              { icon: Globe, name: "Web Access", color: "text-purple-500" },
              { icon: Mail, name: "Email Support", color: "text-indigo-500" },
              { icon: Heart, name: "24/7 Chat", color: "text-pink-500" }
            ].map((platform, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-medium text-slate-600 bg-white/70 backdrop-blur-sm border border-slate-200 shadow-sm">
                <platform.icon size={10} className={platform.color} />
                <span>{platform.name}</span>
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div className="text-center mt-4">
          
          </div>
        </div>
      </div>
    </div>
  );
}