import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useChat } from "../contexts/ChatContext";
import { socket } from "../api/socket";
import { 
  Lock, Phone, MessageSquare, Shield, 
  ArrowRight, Smartphone, Mail, CheckCircle, Zap,
  Twitter, Instagram, Facebook, Globe, ChevronRight
} from "lucide-react";

const API_URL = "https://zatbackend.onrender.com";

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
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400;1,700&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #DBEAFE; color: #1D4ED8; }
        .btn-primary { transition: all 0.2s ease; background: linear-gradient(135deg, #2563EB, #7C3AED); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.3); }
        .btn-primary:active { transform: translateY(0); }
        .social-icon { transition: all 0.2s ease; }
        .social-icon:hover { background: #EFF6FF; border-color: #BFDBFE; color: #2563EB; transform: translateY(-2px); }
        
        /* Loading animation */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .loading-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #2563EB, #7C3AED);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Simple background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50"></div>

      {/* Main container - minimal padding for small screens */}
      <div className="relative min-h-screen flex items-center justify-center p-3">
        {/* Login Card - optimized for small screens */}
        <div className="relative w-full max-w-[320px] xs:max-w-[360px] sm:max-w-[380px]">
          {/* Loading Overlay - compact for small screens */}
          {showLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl">
              <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col items-center w-40 border border-slate-100">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full loading-pulse" style={{ 
                    width: '100%',
                    background: "linear-gradient(90deg, #2563EB, #7C3AED, #2563EB)",
                    backgroundSize: '200% 100%',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}></div>
                </div>
                <p className="text-xs font-semibold gradient-text">
                  Connecting...
                </p>
              </div>
            </div>
          )}

          {/* Main Card - compact design */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header - minimal with proper logo */}
            <div className="px-4 pt-5 pb-3 text-center">
              {/* Logo - prominently displayed */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 8px 16px rgba(37,99,235,0.2)" }}>
                <MessageSquare size={32} className="text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                <span className="gradient-text">ZATCHAT</span>
              </h1>
              
              {/* Security badge - minimal */}
              <div className="flex items-center justify-center gap-1 mt-2">
                <Shield size={12} className="text-blue-600" />
                <span className="text-[10px] font-medium text-slate-500">Encrypted</span>
                <CheckCircle size={12} className="text-green-600" />
              </div>
            </div>

            <div className="px-4 pb-5">
              {/* Error message - compact */}
              {error && (
                <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 flex items-start gap-1">
                  <span className="font-medium">⚠️</span>
                  <span className="text-[11px]">{error}</span>
                </div>
              )}

              {/* Mobile OTP Flow */}
              <div className="space-y-3">
                {mobileStep === "mobile" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider px-1">Mobile Number</label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          disabled={isLoading}
                          className="w-24 px-2 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                          {countryOptions.map((item) => (
                            <option key={item.code} value={item.code}>{item.label} {item.code}</option>
                          ))}
                        </select>

                        <div className="relative flex-1">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="Enter number"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                          value={localNumber}
                          onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ""))}
                          disabled={isLoading}
                        />
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn-primary w-full py-3 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-1 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                    >
                      {isLoading && !showLoading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Send OTP
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </>
                )}

                {mobileStep === "otp" && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-500 text-center">
                        OTP sent to <span className="font-semibold text-slate-700">{mobileNumber}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider px-1 text-center block">6-Digit OTP</label>
                      <div className="flex items-center justify-center gap-2">
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
                            className="w-10 h-12 text-center text-lg font-bold bg-white border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      className="btn-primary w-full py-3 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-1 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleVerifyOtp}
                      disabled={isLoading}
                    >
                      {isLoading && !showLoading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Verify
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>

                    <button
                      className="w-full text-center text-[10px] text-slate-500 hover:text-blue-600 transition-colors py-1 flex items-center justify-center gap-0.5"
                      onClick={() => setMobileStep("mobile")}
                      disabled={isLoading}
                      type="button"
                    >
                      <ChevronRight size={12} className="rotate-180" />
                      Change number
                    </button>
                  </>
                )}
              </div>

              {/* Social icons - minimal */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-center gap-2">
                  {[Twitter, Instagram, Facebook].map((Icon, i) => (
                    <div key={i} className="social-icon w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border border-slate-200 text-slate-400 hover:text-blue-600">
                      <Icon size={12} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer - minimal */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
              <div className="flex justify-center items-center gap-2 text-[9px]">
                <span className="flex items-center gap-0.5 text-slate-500">
                  <Shield size={9} className="text-green-600" />
                  <span>Secure</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-0.5 text-slate-500">
                  <Lock size={9} className="text-blue-600" />
                  <span>Private</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-0.5 text-slate-500">
                  <Zap size={9} className="text-yellow-600" />
                  <span>Fast</span>
                </span>
              </div>
            </div>
          </div>

          {/* Platform badges - minimal */}
          <div className="flex flex-wrap gap-1 justify-center mt-3">
            {[
              { icon: Smartphone, name: "📱" },
              { icon: Globe, name: "🌐" },
              { icon: Mail, name: "📧" },
            ].map((platform, i) => (
               <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-medium text-slate-400 bg-white/80 border border-slate-200">
                <span>{platform.name}</span>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
