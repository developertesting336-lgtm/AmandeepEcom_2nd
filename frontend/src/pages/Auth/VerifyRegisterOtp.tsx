import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  UserCheck,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import "./VerifyRegisterOtp.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const VerifyRegisterOtp: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get("email") || (location.state as any)?.email || "";

  const [email, setEmail] = useState<string>(initialEmail);
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [resendCountdown, setResendCountdown] = useState<number>(60);
  const [error, setError] = useState<string>("");

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || resending) return;
    setError("");
    setResending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to resend registration OTP.");
      }

      toast.success(data.message || "A fresh registration OTP has been sent to your email!");
      setResendCountdown(60);
    } catch (err: any) {
      toast.error(err?.message || "Could not resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    if (!trimmedEmail) {
      setError("Email address is required.");
      return;
    }

    if (!trimmedOtp || trimmedOtp.length < 4) {
      setError("Please enter the complete verification OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-register-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: trimmedEmail,
          otp: trimmedOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Invalid or expired OTP. Please try again.");
      }

      toast.success(data.message || "Account verified & registered successfully!");

      // If response includes logged in user object, initialize session
      if (data.user || data.data?.user) {
        const userObj = data.user || data.data?.user;
        login(userObj);
        navigate("/profile");
      } else {
        // Otherwise navigate to login page
        navigate("/login");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please check the OTP code.");
      toast.error(err?.message || "Failed to verify registration OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-otp-page-wrapper">
      <div className="register-otp-card">
        <div className="register-otp-icon-bubble">
          <UserCheck size={32} />
        </div>

        <div className="register-otp-header">
          <h1 className="register-otp-title">Verify Your Email</h1>
          <p className="register-otp-subtitle">
            We've sent a 6-digit verification OTP to activate your account.
          </p>

          {email && (
            <div className="register-otp-email-badge">
              <Mail size={13} />
              <span>{email}</span>
              <button
                type="button"
                className="register-change-email-btn"
                onClick={() => navigate("/register")}
              >
                Change
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="register-otp-error-alert" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-otp-form">
          {!initialEmail && (
            <div className="register-otp-group">
              <label htmlFor="reg-verify-email" className="register-otp-label">
                <Mail size={14} />
                Registered Email Address
              </label>
              <input
                id="reg-verify-email"
                type="email"
                className="register-otp-input"
                style={{ fontSize: "14px", letterSpacing: "normal", textAlign: "left" }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="register-otp-group">
            <label htmlFor="register-otp-input" className="register-otp-label">
              <ShieldCheck size={14} />
              6-Digit OTP Code
            </label>
            <input
              id="register-otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="register-otp-input"
              placeholder="••••••"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setOtp(val);
                if (error) setError("");
              }}
              disabled={loading}
              required
              autoFocus
            />
            <div className="register-resend-row">
              <span>Didn't get the code?</span>
              <button
                type="button"
                className="register-resend-btn"
                disabled={resendCountdown > 0 || resending || loading}
                onClick={handleResendOtp}
              >
                {resending
                  ? "Resending..."
                  : resendCountdown > 0
                  ? `Resend OTP (${resendCountdown}s)`
                  : "Resend OTP"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="register-verify-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Verifying Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="register-otp-footer-nav">
          <Link to="/register" className="register-otp-back-link">
            <ArrowLeft size={14} />
            <span>Back to Registration</span>
          </Link>

          <Link to="/login" className="register-otp-login-link">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </main>
  );
};

export default VerifyRegisterOtp;
