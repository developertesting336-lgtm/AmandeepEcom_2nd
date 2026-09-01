import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import "./VerifyOtpResetPassword.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const VerifyOtpResetPassword: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get("email") || (location.state as any)?.email || "";

  const [email, setEmail] = useState<string>(initialEmail);
  const [otp, setOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

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
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to resend OTP.");
      }

      toast.success("A fresh OTP has been sent to your email!");
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
      setError("Email address is missing.");
      return;
    }

    if (!trimmedOtp || trimmedOtp.length < 4) {
      setError("Please enter the complete verification OTP.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: trimmedEmail,
          otp: trimmedOtp,
          newPassword,
          confirmPassword,
          password: newPassword, // fallback field for backends expecting 'password'
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to verify OTP or update password.");
      }

      toast.success(data.message || "Password reset successfully! You can now use your new password.");

      // Redirect to profile page based on response
      if (isAuthenticated) {
        navigate("/profile");
      } else {
        navigate("/profile");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. Please check your OTP and try again.");
      toast.error(err?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="verify-otp-page-wrapper">
      <div className="verify-otp-card">
        <div className="verify-otp-icon-bubble">
          <ShieldCheck size={32} />
        </div>

        <div className="verify-otp-header">
          <h1 className="verify-otp-title">Verify OTP & Set Password</h1>
          <p className="auth-flow-subtitle">
            Enter the OTP sent to your email and choose your new password.
          </p>

          {email && (
            <div className="verify-otp-email-badge">
              <Mail size={13} />
              <span>{email}</span>
              <button
                type="button"
                className="change-email-btn"
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
              >
                Change
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="verify-otp-error-alert" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="verify-otp-form">
          {/* If email wasn't provided in query, show input */}
          {!initialEmail && (
            <div className="verify-otp-group">
              <label htmlFor="verify-email" className="verify-otp-label">
                <Mail size={14} />
                Email Address
              </label>
              <div className="password-input-wrapper">
                <Mail size={16} className="input-left-icon" />
                <input
                  id="verify-email"
                  type="email"
                  className="password-input-field"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          {/* OTP Code Input */}
          <div className="verify-otp-group">
            <label htmlFor="verify-otp" className="verify-otp-label">
              <ShieldCheck size={14} />
              6-Digit OTP Code
            </label>
            <input
              id="verify-otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="otp-input-field"
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
            <div className="otp-resend-row">
              <span>Didn't receive the OTP?</span>
              <button
                type="button"
                className="resend-otp-btn"
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

          {/* New Password */}
          <div className="verify-otp-group">
            <label htmlFor="verify-new-password" className="verify-otp-label">
              <Lock size={14} />
              New Password
            </label>
            <div className="password-input-wrapper">
              <Lock size={16} className="input-left-icon" />
              <input
                id="verify-new-password"
                type={showNewPassword ? "text" : "password"}
                className="password-input-field"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-eye-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label="Toggle new password visibility"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="verify-otp-group">
            <label htmlFor="verify-confirm-password" className="verify-otp-label">
              <Lock size={14} />
              Confirm New Password
            </label>
            <div className="password-input-wrapper">
              <Lock size={16} className="input-left-icon" />
              <input
                id="verify-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className="password-input-field"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-eye-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="verify-requirements-box">
            <div className={`requirement-row ${newPassword.length >= 6 ? "met" : ""}`}>
              <CheckCircle2 size={13} />
              <span>At least 6 characters</span>
            </div>
            <div className={`requirement-row ${confirmPassword && newPassword === confirmPassword ? "met" : ""}`}>
              <CheckCircle2 size={13} />
              <span>Passwords must match</span>
            </div>
          </div>

          <button
            type="submit"
            className="verify-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Verifying OTP & Updating...</span>
              </>
            ) : (
              <>
                <span>Confirm & Reset Password</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="verify-footer-nav">
          <Link to={`/reset-password?email=${encodeURIComponent(email)}`} className="verify-back-link">
            <ArrowLeft size={14} />
            <span>Back to Request OTP</span>
          </Link>

          <Link to="/profile" className="auth-flow-login-link">
            Back to Profile
          </Link>
        </div>
      </div>
    </main>
  );
};

export default VerifyOtpResetPassword;
