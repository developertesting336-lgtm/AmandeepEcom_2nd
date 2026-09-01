import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle, KeyRound } from "lucide-react";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import "./ResetPasswordEmail.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const ResetPasswordEmail: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Read email from search query param or location state or logged-in user
  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get("email") || (location.state as any)?.email || user?.email || "";

  const [email, setEmail] = useState<string>(emailParam);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to send password reset OTP. Please check the email.");
      }

      toast.success(data.message || "Verification OTP sent to your email!");
      navigate(`/verify-otp?email=${encodeURIComponent(trimmedEmail)}`, {
        state: { email: trimmedEmail },
      });
    } catch (err: any) {
      setError(err?.message || "Something went wrong while sending the OTP.");
      toast.error(err?.message || "Failed to send reset OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-flow-page-wrapper">
      <div className="auth-flow-card">
        <div className="auth-flow-icon-bubble">
          <KeyRound size={32} />
        </div>

        <div className="auth-flow-header">
          <h1 className="auth-flow-title">Reset Password</h1>
          <p className="auth-flow-subtitle">
            Enter your account's email address. We'll send a 6-digit One-Time Password (OTP) to verify and reset your password.
          </p>
        </div>

        {error && (
          <div className="auth-flow-error-alert" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-flow-form">
          <div className="auth-flow-group">
            <label htmlFor="reset-email" className="auth-flow-label">
              <Mail size={14} />
              Registered Email Address
            </label>
            <div className="auth-flow-input-wrap">
              <Mail size={16} className="input-left-icon" />
              <input
                id="reset-email"
                type="email"
                className="auth-flow-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-flow-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Sending Verification OTP...</span>
              </>
            ) : (
              <>
                <span>Send Verification OTP</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-flow-footer-nav">
          <Link to="/profile" className="auth-flow-back-link">
            <ArrowLeft size={14} />
            <span>Back to Profile</span>
          </Link>

          <Link to="/login" className="auth-flow-login-link">
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordEmail;
