import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, ShieldCheck } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import toast from "react-hot-toast";
import "./CookieBanner.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface CookieBannerProps {
  /** If provided, controls banner visibility from parent */
  isOpen?: boolean;
  /** Callback when banner is dismissed or closed */
  onClose?: () => void;
  /** Callback when consent preference is accepted or rejected */
  onConsentChange?: (accepted: boolean) => void;
}

export const CookieBanner = ({ isOpen, onClose, onConsentChange }: CookieBannerProps) => {
  const { isAuthenticated, refreshUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with controlled isOpen prop if passed
  useEffect(() => {
    if (isOpen !== undefined) {
      if (isOpen) {
        setIsVisible(true);
        setIsClosing(false);
      } else if (isVisible) {
        setIsClosing(true);
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 320);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen]);

  // Uncontrolled fallback if isOpen is not passed
  useEffect(() => {
    if (isOpen !== undefined) return;

    const existingConsent = localStorage.getItem("cookie_consent");
    const dismissedSession = sessionStorage.getItem("cookie_consent_dismissed");

    if (existingConsent || dismissedSession) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 700);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleConsent = async (accepted: boolean) => {
    setIsSaving(true);
    const choice = accepted ? "accepted" : "rejected";
    localStorage.setItem("cookie_consent", choice);
    localStorage.setItem("cookie_consent_date", new Date().toISOString());

    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("cookie_banner_last_seen_date", today);

    // If authenticated, sync preference to user account in database
    if (isAuthenticated) {
      try {
        await fetch(`${API_BASE_URL}/api/profile/user/cookies`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ isCookiesAccepted: accepted }),
        });
        refreshUser?.();
      } catch (err) {
        console.warn("Failed to sync cookie consent to backend:", err);
      }
    }

    onConsentChange?.(accepted);

    if (accepted) {
      toast.success("Cookie preferences saved", { id: "cookie-consent-toast" });
    }

    // Trigger smooth exit animation
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsSaving(false);
      onClose?.();
    }, 320);
  };

  const handleDismiss = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("cookie_banner_last_seen_date", today);
    sessionStorage.setItem("cookie_consent_dismissed", "true");

    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 320);
  };

  if (!isVisible) return null;

  return (
    <aside
      className={`cookie-banner-wrapper ${isClosing ? "is-closing" : "is-entering"}`}
      role="region"
      aria-label="Cookie consent banner"
    >
      <div className="cookie-banner-card">
        {/* Glow ambient highlight */}
        <div className="cookie-banner-glow" aria-hidden="true" />

        {/* Close / Dismiss button */}
        <button
          type="button"
          className="cookie-banner-close"
          onClick={handleDismiss}
          aria-label="Dismiss cookie notice for now"
          title="Dismiss"
        >
          <X size={16} />
        </button>

        {/* Content Header */}
        <div className="cookie-banner-header">
          <div className="cookie-banner-icon-badge" aria-hidden="true">
            <span className="cookie-emoji">🍪</span>
          </div>
          <h3 className="cookie-banner-title">We value your privacy</h3>
        </div>

        {/* Content Body */}
        <p className="cookie-banner-text">
          We use essential cookies to keep you logged in and process your orders. We also track which products you browse to show you personalized recommendations — this data stays with us and is never shared.
        </p>

        {/* Action Buttons */}
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-btn cookie-btn-accept"
            onClick={() => handleConsent(true)}
            disabled={isSaving}
          >
            Accept All
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn-reject"
            onClick={() => handleConsent(false)}
            disabled={isSaving}
          >
            Reject All
          </button>
        </div>

        {/* Footer Policy Link */}
        <div className="cookie-banner-footer">
          <ShieldCheck size={14} className="cookie-policy-icon" aria-hidden="true" />
          <span>
            Learn more in our{" "}
            <Link to="/cookie-policy" className="cookie-policy-link">
              Cookie Policy
            </Link>
          </span>
        </div>
      </div>
    </aside>
  );
};

export default CookieBanner;
