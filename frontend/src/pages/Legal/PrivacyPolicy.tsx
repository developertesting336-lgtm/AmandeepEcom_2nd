import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "../Home/footersection";
import "./Legal.css";

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <Link to="/" className="legal-back-btn">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <header className="legal-header">
            <h1 className="legal-title">Privacy Policy</h1>
            <p className="legal-last-updated">Last Updated: August 2026</p>
          </header>

          <main className="legal-card">
            <section className="legal-section">
              <h2>1. Introduction</h2>
              <p>
                Welcome to <strong>Shopora</strong> ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what personal data we collect, how we use and protect it, and the rights you have concerning your information when you browse our website or purchase items from our store.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Information We Collect</h2>
              <p>
                We collect information necessary to provide and improve our products and services. This includes:
              </p>
              <ul className="legal-list">
                <li>
                  <strong>Personal Identification:</strong> Name, email address, phone number, shipping address, and billing address provided during checkout or account registration.
                </li>
                <li>
                  <strong>Payment Details:</strong> Transaction records, payment method identifiers, and billing confirmations. All card and payment credentials are encrypted and processed securely by authorized payment partners.
                </li>
                <li>
                  <strong>Order & Activity History:</strong> Details of products purchased, saved items in your wishlist, shopping cart contents, and customer service requests.
                </li>
                <li>
                  <strong>Technical & Usage Information:</strong> IP address, device type, browser specifications, operating system, and log data collected when interacting with our store.
                </li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. How We Use Your Information</h2>
              <p>We use the data we collect for legitimate business purposes, including:</p>
              <ul className="legal-list">
                <li>Processing, fulfilling, and delivering your orders.</li>
                <li>Communicating order confirmations, tracking details, and customer support responses.</li>
                <li>Managing your account, verifying identity, and protecting against fraudulent activity.</li>
                <li>Improving website functionality, user experience, and product offerings.</li>
                <li>Sending optional promotional newsletters and updates (only with your explicit consent).</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Information Sharing & Third Parties</h2>
              <p>
                We do not sell, rent, or trade your personal data to third parties. We share information only with trusted service partners essential for our operations, including:
              </p>
              <ul className="legal-list">
                <li>Logistics and shipping carriers to deliver your orders.</li>
                <li>Payment gateway providers for secure transaction processing.</li>
                <li>Cloud hosting and IT infrastructure services that power our website.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Cookies and Tracking</h2>
              <p>
                Our website uses cookies and similar technologies to remember your preferences, keep you signed in, manage shopping cart sessions, and analyze site performance. You can choose to disable cookies through your browser settings, though some store features may not function as intended.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Data Security & Retention</h2>
              <p>
                We implement industry-standard administrative and technical safeguards to keep your personal data secure. We retain your information only as long as necessary to fulfill orders, meet legal requirements, and maintain account services.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Your Privacy Rights</h2>
              <p>Depending on your location, you may have the right to:</p>
              <ul className="legal-list">
                <li>Access, review, or update your personal information through your account profile.</li>
                <li>Request deletion of your account and associated personal data.</li>
                <li>Opt out of marketing communications at any time by clicking the unsubscribe link in our emails.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>8. Contact Us</h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:
              </p>
              <div className="legal-contact-box">
                <p><strong>Email:</strong> <a href="mailto:support@shopora.com">support@shopora.com</a></p>
                <p><strong>Support:</strong> +1 (800) 555-7467</p>
                <p><strong>Operating Hours:</strong> Monday – Saturday, 9:00 AM – 6:00 PM</p>
              </div>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
