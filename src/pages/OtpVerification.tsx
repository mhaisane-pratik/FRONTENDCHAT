import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useChat } from "../contexts/ChatContext";
import { socket } from "../api/socket";
import { Home, User, Lock, Phone, MessageSquare } from "lucide-react";
import "./Login.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");

export default function ChatLogin() {
  const navigate = useNavigate();
  const { setCurrentUser, currentUser } = useChat();

  const [loginMode, setLoginMode] = useState<"password" | "mobile">("password");
  // Password mode fields
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  // Mobile mode fields
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileDisplayName, setMobileDisplayName] = useState("");
  const [mobileStep, setMobileStep] = useState<"mobile" | "otp">("mobile");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    const existingUser = localStorage.getItem("chatUser");
    if (existingUser || currentUser) {
      navigate("/chat", { replace: true });
    }
  }, [navigate, currentUser]);

  // Focus mobile input on mount
  useEffect(() => {
    if (loginMode === "password") {
      mobileInputRef.current?.focus();
    }
  }, [loginMode]);

  /* ================= FORMAT PHONE ================= */
  const formatPhone = (phone: string) => {
    return phone.replace(/\D/g, "");
  };

  /* ================= mobile/PASSWORD LOGIN ================= */
  const validateMobile = (name: string) => {
    if (name.length < 3) return "Mobile must be at least 3 characters";
    if (name.length > 20) return "Mobile must be less than 20 characters";
    if (!/^[a-zA-Z0-9_\+]+$/.test(name))
      return "Only letters, numbers, +, and underscores allowed";
    return "";
  };

  const handlePasswordLogin = async () => {
    const trimmedMobile = mobile.trim();
    const valError = validateMobile(trimmedMobile);
    if (valError) {
      setError(valError);
      return;
    }
    // Password is ignored – any value works
    setIsLoading(true);
    setError("");

    try {
      // Health check
      const health = await fetch(`${API_URL}/health`);
      if (!health.ok) throw new Error("Backend not responding");

      // Try to get existing user or create new one
      let userData: any = null;
      const res = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(trimmedMobile)}`);
      if (res.ok) userData = await res.json();

      if (!userData) {
        const createRes = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile: trimmedMobile,
            display_name: trimmedMobile,
          }),
        });
        if (!createRes.ok) throw new Error("Failed to create user");
        userData = await createRes.json();
      }

      localStorage.setItem("chatUser", trimmedMobile);
      setCurrentUser(userData);

      if (!socket.connected) socket.connect();
      socket.emit("user_join", { mobile: trimmedMobile });

      navigate("/chat", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= SEND OTP ================= */
  const handleSendOtp = async () => {
    if (!mobileNumber) {
      setError("Enter mobile number");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const formattedPhone = formatPhone(mobileNumber);
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
      setMobileStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const handleVerifyOtp = async () => {
    if (!otp) {
      setError("Enter OTP");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mobileNumber,
          otp,
          name: mobileDisplayName || mobileNumber,
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

      navigate("/chat", { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Home button */}
      <Link to="/" className="home-button">
        <Home size={20} />
        <span>Home</span>
      </Link>

      <div className="login-container">
        <div className="login-card">
          {/* Brand - ZatChat */}
          <div className="brand">
            <div className="logo">
              <MessageSquare size={32} />
            </div>
            <h1>ZatChat</h1>
            <p>Connect with anyone, anywhere</p>
          </div>

          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${loginMode === "password" ? "active" : ""}`}
              onClick={() => {
                setLoginMode("password");
                setError("");
              }}
            >
              <User size={18} />
              Password
            </button>
            <button
              className={`mode-btn ${loginMode === "mobile" ? "active" : ""}`}
              onClick={() => {
                setLoginMode("mobile");
                setError("");
              }}
            >
              <Phone size={18} />
              Mobile
            </button>
          </div>

          {/* Error message */}
          {error && <div className="error-message">⚠️ {error}</div>}

          {/* Password Login Form */}
          {loginMode === "password" && (
            <div className="form">
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  placeholder="Mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="input-group">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  placeholder="Password (any value)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <button
                className="login-button"
                onClick={handlePasswordLogin}
                disabled={isLoading}
              >
                {isLoading ? <span className="spinner" /> : "Log In"}
              </button>
            </div>
          )}

          {/* Mobile OTP Flow */}
          {loginMode === "mobile" && (
            <div className="form">
              {mobileStep === "mobile" && (
                <>
                  <div className="input-group">
                    <Phone size={18} className="input-icon" />
                    <input
                      type="tel"
                      placeholder="+919373372183"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    className="login-button"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="spinner" /> : "Send OTP"}
                  </button>
                </>
              )}

              {mobileStep === "otp" && (
                <>
                  <div className="input-group">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={mobileDisplayName}
                      onChange={(e) => setMobileDisplayName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="input-group">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="text"
                      placeholder="OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    className="login-button"
                    onClick={handleVerifyOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="spinner" /> : "Verify & Login"}
                  </button>
                  <button
                    className="back-link"
                    onClick={() => setMobileStep("mobile")}
                    disabled={isLoading}
                  >
                    ← Change number
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
