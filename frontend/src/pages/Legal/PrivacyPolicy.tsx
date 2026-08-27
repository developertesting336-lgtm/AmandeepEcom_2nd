import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Lock, Eye, FileText, Bell } from "lucide-react";
import "./Legal.css";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back-btn">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="legal-header">
          <span className="legal-eyebrow">
            <ShieldCheck size={14} /> TRUST & PRIVACY
          </span>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-last-updated">Last Updated: August 7, 2026</p>
        </div>

        <div className="legal-card">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              Welcome to <strong>Shopora</strong> ("we", "our", or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make purchases through our store.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We collect information to provide better services to all our users. The types of data collected include:</p>
            <ul className="legal-list">
              <li>
                <strong>Personal Data:</strong> Name, email address, phone number, shipping and billing addresses provided during checkout or account creation.
              </li>
              <li>
                <strong>Payment Information:</strong> Credit/debit card numbers, UPI details, and payment authorization tokens (processed securely through encrypted gateway partners).
              </li>
              <li>
                <strong>Order History & Preferences:</strong> Purchased items, saved wishlist items, cart contents, and customer service communication records.
              </li>
              <li>
                <strong>Technical & Usage Data:</strong> IP address, browser type, device information, operating system, and browsing behavior on our platform.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for various business purposes, including:</p>
            <div className="legal-grid-features">
              <div className="legal-feature-box">
                <FileText className="feature-icon" size={20} />
                <h4>Order Fulfillment</h4>
                <p>Processing transactions, shipping packages, and sending order confirmation updates.</p>
              </div>
              <div className="legal-feature-box">
                <Lock className="feature-icon" size={20} />
                <h4>Account Security</h4>
                <p>Verifying credentials, detecting fraud, and safeguarding user data against unauthorized access.</p>
              </div>
              <div className="legal-feature-box">
                <Eye className="feature-icon" size={20} />
                <h4>Personalized Experience</h4>
                <p>Recommending products, remembering shopping preferences, and tailoring promotional offers.</p>
              </div>
              <div className="legal-feature-box">
                <Bell className="feature-icon" size={20} />
                <h4>Customer Support</h4>
                <p>Responding to queries, processing returns/refunds, and improving platform usability.</p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>4. Data Sharing & Third Parties</h2>
            <p>
              We do not sell or rent your personal data to third parties. We share information only with trusted service providers necessary to operate our business, such as:
            </p>
            <ul className="legal-list">
              <li>Logistics & Delivery Partners (for package dispatch and tracking)</li>
              <li>Encrypted Payment Processing Gateways</li>
              <li>Cloud Infrastructure & Analytics Services</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Cookies & Tracking Technologies</h2>
            <p>
              Shopora uses cookies and similar tracking technologies to enhance user navigation, maintain shopping cart sessions, and analyze website traffic patterns. You can manage cookie preferences through your web browser settings.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Your Rights & Choices</h2>
            <p>You have the right to:</p>
            <ul className="legal-list">
              <li>Access, update, or delete your account information at any time via your profile settings.</li>
              <li>Unsubscribe from marketing emails using the 'Unsubscribe' link included in our newsletters.</li>
              <li>Request details regarding the personal data we store about you.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our Data Protection Officer at:
            </p>
            <div className="legal-contact-box">
              <p><strong>Email:</strong> support@shopora.com</p>
              <p><strong>Support Line:</strong> +1 (800) 555-7467</p>
              <p><strong>Address:</strong> Shopora Global Retail Inc., 100 Commerce Way, Suite 400</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
