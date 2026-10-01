import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Check,
  X,
  SlidersHorizontal,
  CircleDot,
  Ban,
  Globe,
  Compass,
} from "lucide-react";
import Footer from "../Home/footersection";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import "./Legal.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CookiePolicy: React.FC = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [consentStatus, setConsentStatus] = useState<"accepted" | "rejected" | "none">("none");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cookie_consent");
    if (saved === "accepted" || saved === "rejected") {
      setConsentStatus(saved);
    } else if (user?.isCookiesAccepted !== undefined) {
      setConsentStatus(user.isCookiesAccepted ? "accepted" : "rejected");
    }
  }, [user]);

  const handleConsent = async (accepted: boolean) => {
    setIsSaving(true);
    const choice = accepted ? "accepted" : "rejected";
    localStorage.setItem("cookie_consent", choice);
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    setConsentStatus(choice);

    if (isAuthenticated) {
      try {
        await fetch(`${API_BASE_URL}/api/profile/user/cookies`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isCookiesAccepted: accepted }),
        });
        refreshUser?.();
      } catch (err) {
        console.warn("Failed to update cookie consent in backend:", err);
      }
    }

    setIsSaving(false);
    if (accepted) {
      toast.success("Preferences updated: All cookies accepted");
    } else {
      toast.success("Preferences updated: Essential cookies only");
    }
  };

  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <Link to="/" className="legal-back-btn">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <header className="legal-header">
            <h1 className="legal-title">Cookie Policy</h1>
            <p className="legal-last-updated">Last Updated: September 2026</p>
          </header>

          <main className="legal-card">
            <p style={{ marginBottom: "18px", fontSize: "14.5px", lineHeight: "1.7", color: "#334155" }}>
              This Cookie Policy explains how <strong>Shopora</strong> ("we", "us", or "our") uses cookies and similar local storage technologies when you visit our website (the "Site").
            </p>

            {/* Quick Preference Management Panel */}
            <div className="legal-preference-box">
              <div className="legal-preference-header">
                <h3 className="legal-preference-title">
                  <SlidersHorizontal size={17} color="#7c3aed" />
                  Manage Your Cookie Preferences
                </h3>
                {consentStatus === "accepted" && (
                  <span className="legal-status-badge accepted">
                    <Check size={13} /> All Cookies Accepted
                  </span>
                )}
                {consentStatus === "rejected" && (
                  <span className="legal-status-badge rejected">
                    <X size={13} /> Essential Only (Rejected)
                  </span>
                )}
                {consentStatus === "none" && (
                  <span className="legal-status-badge default">
                    <CircleDot size={13} /> Not Configured Yet
                  </span>
                )}
              </div>
              <p className="legal-preference-desc">
                You can change your consent preferences for Shopora at any time. Essential cookies required for login, security, and checkout processing remain active.
              </p>
              <div className="legal-preference-actions">
                <button
                  type="button"
                  className="legal-btn-accept"
                  onClick={() => handleConsent(true)}
                  disabled={isSaving}
                  title="Allow all cookies including personalized recommendations"
                >
                  <Check size={15} /> Accept All Cookies
                </button>
                <button
                  type="button"
                  className="legal-btn-reject"
                  onClick={() => handleConsent(false)}
                  disabled={isSaving}
                  title="Only allow essential cookies for site functionality"
                >
                  <X size={15} /> Reject All Cookies
                </button>
              </div>
            </div>

            {/* 1. What Are Cookies and Local Storage? */}
            <section className="legal-section">
              <h2>1. What Are Cookies and Local Storage?</h2>
              <p>
                <strong>Cookies</strong> are small text files placed on your device by a website you visit. <strong>Local storage</strong> is a similar browser technology that allows a website to store data on your device for longer periods. Both help the site remember information about your visit.
              </p>
            </section>

            {/* 2. How We Use Cookies and Local Storage */}
            <section className="legal-section">
              <h2>2. How We Use Cookies and Local Storage</h2>
              <p>We use these technologies for the following specific purposes:</p>

              <h3>A. Authentication &amp; Session Management</h3>
              <p>
                When you log in to your account (via email/password or Google Sign-In), we issue a <strong>JSON Web Token (JWT)</strong> to keep you authenticated as you browse our store.
              </p>
              <ul className="legal-list">
                <li>
                  This token is <strong>stateless</strong>, meaning your session data is <strong>not stored on our servers</strong>.
                </li>
                <li>
                  The JWT may be stored in a secure cookie or in your browser's local storage, depending on your login method.
                </li>
                <li>When you log out, this token is invalidated.</li>
              </ul>

              <h3>B. Google Sign-In (OAuth)</h3>
              <p>
                If you choose to register or log in using your <strong>Google account</strong>, Google may set its own cookies on your device during the authentication process. These cookies are controlled by Google, not by us. You can review Google's cookie practices here:{" "}
                <a
                  href="https://policies.google.com/technologies/cookies"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Privacy &amp; Terms
                </a>
                .
              </p>

              <h3>C. Shipping &amp; Delivery Address</h3>
              <p>
                When you provide your delivery address during checkout, we store this information <strong>locally in your browser's local storage</strong> to process your order.
              </p>
              <ul className="legal-list">
                <li>
                  This data is <strong>not stored on our servers</strong> beyond what is necessary to fulfill your order.
                </li>
                <li>You can clear this data at any time by clearing your browser's local storage.</li>
              </ul>

              <h3>D. Product Browsing &amp; Personalized Recommendations</h3>
              <p>
                We operate a <strong>first-party tracking system</strong> that records:
              </p>
              <ul className="legal-list">
                <li>Which products you click on while browsing our store.</li>
                <li>How many times you interact with specific products.</li>
              </ul>
              <p>
                This data is used <strong>solely</strong> to power the <strong>"Recommended for You"</strong> section on our website, showing you products that match your browsing interests.
              </p>
              <ul className="legal-list">
                <li>
                  This tracking is done through our own API — <strong>no third-party analytics or advertising services are involved in this process</strong>.
                </li>
                <li>
                  The data collected is tied to your user account and is <strong>not shared with any third parties</strong>.
                </li>
              </ul>
            </section>

            {/* 3. What We Do NOT Collect or Store */}
            <section className="legal-section">
              <h2>3. What We Do NOT Collect or Store</h2>
              <p>For full transparency, we want you to know that:</p>
              <ul className="legal-not-list">
                <li>
                  <span className="legal-cross-icon">
                    <Ban size={15} color="#dc2626" />
                  </span>
                  <span>
                    We <strong>do not</strong> store your payment or credit card information on our servers.
                  </span>
                </li>
                <li>
                  <span className="legal-cross-icon">
                    <Ban size={15} color="#dc2626" />
                  </span>
                  <span>
                    We <strong>do not</strong> use third-party advertising pixels (e.g., Meta/Facebook Pixel, Google Ads, TikTok Pixel).
                  </span>
                </li>
                <li>
                  <span className="legal-cross-icon">
                    <Ban size={15} color="#dc2626" />
                  </span>
                  <span>
                    We <strong>do not</strong> use third-party analytics tools (e.g., Google Analytics) to track your behavior.
                  </span>
                </li>
                <li>
                  <span className="legal-cross-icon">
                    <Ban size={15} color="#dc2626" />
                  </span>
                  <span>
                    We <strong>do not</strong> sell or share your browsing data with third-party advertisers.
                  </span>
                </li>
              </ul>
            </section>

            {/* 4. Summary of Cookies & Storage Used */}
            <section className="legal-section">
              <h2>4. Summary of Cookies &amp; Storage Used</h2>
              <div className="legal-table-container">
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th>Purpose</th>
                      <th>Type</th>
                      <th>Storage Method</th>
                      <th>Duration</th>
                      <th>First/Third Party</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>User login session</strong>
                      </td>
                      <td>
                        <span className="legal-badge legal-badge-essential">Essential</span>
                      </td>
                      <td>JWT (Cookie or Local Storage)</td>
                      <td>Until logout or token expiry</td>
                      <td>First-party</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Google authentication</strong>
                      </td>
                      <td>
                        <span className="legal-badge legal-badge-essential">Essential</span>
                      </td>
                      <td>Cookie</td>
                      <td>Set by Google</td>
                      <td>Third-party (Google)</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Delivery address</strong>
                      </td>
                      <td>
                        <span className="legal-badge legal-badge-functional">Functional</span>
                      </td>
                      <td>Browser Local Storage</td>
                      <td>Until cleared by user</td>
                      <td>First-party</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Product click tracking</strong>
                      </td>
                      <td>
                        <span className="legal-badge legal-badge-functional">Functional</span>
                      </td>
                      <td>Server (via our API)</td>
                      <td>Until account deletion</td>
                      <td>First-party</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Personalized recommendations</strong>
                      </td>
                      <td>
                        <span className="legal-badge legal-badge-functional">Functional</span>
                      </td>
                      <td>Server (via our API)</td>
                      <td>Until account deletion</td>
                      <td>First-party</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. How You Can Manage or Delete Cookies and Local Storage */}
            <section className="legal-section">
              <h2>5. How You Can Manage or Delete Cookies and Local Storage</h2>
              <p>You can control cookies and local storage directly using the buttons below or through your browser settings:</p>

              {/* In-section Action Buttons */}
              <div className="legal-preference-actions" style={{ margin: "14px 0 20px 0" }}>
                <button
                  type="button"
                  className="legal-btn-accept"
                  onClick={() => handleConsent(true)}
                  disabled={isSaving}
                >
                  <Check size={15} /> Accept All Cookies
                </button>
                <button
                  type="button"
                  className="legal-btn-reject"
                  onClick={() => handleConsent(false)}
                  disabled={isSaving}
                >
                  <X size={15} /> Reject All Cookies
                </button>
                {consentStatus !== "none" && (
                  <span
                    className={`legal-status-badge ${consentStatus}`}
                    style={{ marginLeft: "6px" }}
                  >
                    {consentStatus === "accepted" ? (
                      <>
                        <Check size={13} /> Active: All Accepted
                      </>
                    ) : (
                      <>
                        <X size={13} /> Active: Essential Only
                      </>
                    )}
                  </span>
                )}
              </div>

              <ul className="legal-list">
                <li>
                  <strong>Clear cookies:</strong> This will log you out and remove session tokens.
                </li>
                <li>
                  <strong>Clear local storage:</strong> This will remove your saved delivery address.
                </li>
                <li>
                  <strong>Block cookies:</strong> Please note that blocking essential cookies may prevent you from logging in or completing purchases.
                </li>
              </ul>

              <h3>Browser-specific guides:</h3>
              <div className="legal-browsers-grid">
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="legal-browser-card"
                >
                  <span className="legal-browser-name">
                    <Globe size={15} color="#2563eb" /> Google Chrome
                  </span>
                  <ExternalLink size={14} color="#64748b" />
                </a>

                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="legal-browser-card"
                >
                  <span className="legal-browser-name">
                    <Compass size={15} color="#0284c7" /> Apple Safari
                  </span>
                  <ExternalLink size={14} color="#64748b" />
                </a>

                <a
                  href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="legal-browser-card"
                >
                  <span className="legal-browser-name">
                    <Globe size={15} color="#ea580c" /> Mozilla Firefox
                  </span>
                  <ExternalLink size={14} color="#64748b" />
                </a>

                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="legal-browser-card"
                >
                  <span className="legal-browser-name">
                    <Globe size={15} color="#0d9488" /> Microsoft Edge
                  </span>
                  <ExternalLink size={14} color="#64748b" />
                </a>
              </div>
            </section>

            {/* 6. Your Data Rights */}
            <section className="legal-section">
              <h2>6. Your Data Rights</h2>
              <p>Depending on your location, you may have the right to:</p>
              <ul className="legal-list">
                <li>Request access to the product browsing data we hold about you.</li>
                <li>Request deletion of your account and all associated recommendation data.</li>
                <li>Opt out of personalized recommendations (contact us below).</li>
              </ul>
            </section>

            {/* 7. Updates to This Policy */}
            <section className="legal-section">
              <h2>7. Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy if our use of cookies or storage technologies changes. The "Last Updated" date at the top will reflect any revisions.
              </p>
            </section>

            {/* 8. Contact Us */}
            <section className="legal-section">
              <h2>8. Contact Us</h2>
              <p>If you have questions about how we use cookies or your browsing data, reach out to us:</p>
              <div className="legal-contact-box">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:support@shopora.com">support@shopora.com</a>
                </p>
                <p>
                  <strong>Support:</strong> +1 (800) 555-7467
                </p>
                <p>
                  <strong>Operating Hours:</strong> Monday – Saturday, 9:00 AM – 6:00 PM
                </p>
                <p>
                  <strong>Contact Page:</strong>{" "}
                  <Link to="/contact-help">Help Center &amp; Support Form</Link>
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CookiePolicy;
