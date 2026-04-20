import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");

export default function ChatLogin() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ssoToken = params.get("ssoToken");

    if (ssoToken) {
      handleSsoLogin(ssoToken);
    }
  }, []);

  const handleSsoLogin = async (token: string) => {
    setLoading(true);
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

      navigate("/chat");
    } catch (err) {
      console.error("SSO Error:", err);
      setError("Synchronized login failed. Please login manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError("Please enter phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) {
        throw new Error("Failed to send OTP");
      }

      // Save phone temporarily
      localStorage.setItem("otp_phone", phone);

      navigate("/verify-otp");
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2>Login with OTP</h2>

        <input
          type="text"
          placeholder="+91XXXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          onClick={handleSendOtp}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "linear-gradient(135deg,#667eea,#764ba2)",
};

const cardStyle: React.CSSProperties = {
  background: "white",
  padding: "40px",
  borderRadius: "12px",
  width: "350px",
  display: "flex",
  flexDirection: "column",
  gap: "15px",
};

const inputStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: "16px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px",
  background: "#25d366",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  cursor: "pointer",
};