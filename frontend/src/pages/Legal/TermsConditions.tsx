import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Scale, CreditCard, RefreshCw } from "lucide-react";
import "./Legal.css";

const TermsConditions: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back-btn">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="legal-header">
          <span className="legal-eyebrow">
            <Scale size={14} /> TERMS OF SERVICE
          </span>
          <h1 className="legal-title">Terms & Conditions</h1>
          <p className="legal-last-updated">Last Updated: August 7, 2026</p>
        </div>

        <div className="legal-card">
          <section className="legal-section">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using the <strong>Shopora</strong> platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our website or online services.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Use of Site & User Accounts</h2>
            <p>
              When creating an account on Shopora, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account password and restricting access to your account.
            </p>
            <ul className="legal-list">
              <li>Users must be at least 18 years of age or accessing the site under parent/guardian supervision.</li>
              <li>Unauthorized access, automated web scraping, or disruptive activities are strictly prohibited.</li>
              <li>We reserve the right to suspend or terminate accounts that violate our community standards.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Product Pricing & Availability</h2>
            <p>
              All prices listed on Shopora are displayed in your local currency including applicable taxes, unless stated otherwise.
            </p>
            <div className="legal-grid-features">
              <div className="legal-feature-box">
                <CreditCard className="feature-icon" size={20} />
                <h4>Pricing Accuracy</h4>
                <p>We strive for price accuracy, but reserve the right to correct accidental pricing errors before order dispatch.</p>
              </div>
              <div className="legal-feature-box">
                <RefreshCw className="feature-icon" size={20} />
                <h4>Stock Availability</h4>
                <p>Products are subject to stock availability. In the event of stock shortage, full refunds will be issued.</p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>4. Orders & Payment Processing</h2>
            <p>
              An order placed on Shopora constitutes an offer to purchase. Order acceptance is confirmed only when a confirmation email or SMS with tracking information is dispatched. Payments are processed securely via verified third-party gateways.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Intellectual Property</h2>
            <p>
              All content on Shopora — including text, logos, product images, graphics, design assets, and software — is the exclusive property of Shopora Global Retail Inc. and protected by copyright and trademark laws.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Shopora shall not be liable for any indirect, incidental, or consequential damages resulting from your use or inability to use our products or services.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms & Conditions are governed by laws of Delaware, USA. Any disputes shall be resolved through binding arbitration or appropriate courts in that jurisdiction.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Contact Legal Department</h2>
            <p>
              For legal inquiries regarding these Terms and Conditions, please contact us:
            </p>
            <div className="legal-contact-box">
              <p><strong>Email:</strong> legal@shopora.com</p>
              <p><strong>Phone:</strong> +1 (800) 555-7467</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
