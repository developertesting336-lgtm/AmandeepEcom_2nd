import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "../Home/footersection";
import "./Legal.css";

const TermsConditions: React.FC = () => {
  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <Link to="/" className="legal-back-btn">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <header className="legal-header">
            <h1 className="legal-title">Terms & Conditions</h1>
            <p className="legal-last-updated">Last Updated: August 2026</p>
          </header>

          <main className="legal-card">
            <section className="legal-section">
              <h2>1. Agreement to Terms</h2>
              <p>
                By visiting, browsing, or placing an order on <strong>Shopora</strong>, you agree to be bound by these Terms & Conditions and all applicable laws and regulations. If you do not agree with any part of these terms, please discontinue using our website and services immediately.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Account Registration & Responsibilities</h2>
              <p>
                To access certain features such as order tracking and wishlist management, you may be required to create an account. You agree to provide accurate and complete information during registration and keep your account credentials secure. You are responsible for all activities that occur under your account.
              </p>
              <ul className="legal-list">
                <li>You must be at least 18 years old or use the site with parental or guardian consent.</li>
                <li>You must not share your login credentials or allow unauthorized access to your account.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Product Information & Pricing</h2>
              <p>
                We make every effort to display product descriptions, specifications, and prices as accurately as possible. However, occasional typographical errors, inaccuracies, or omissions may occur.
              </p>
              <ul className="legal-list">
                <li>All prices are listed in local currency and are inclusive of applicable taxes unless stated otherwise.</li>
                <li>We reserve the right to correct pricing errors and cancel orders placed at an incorrect price.</li>
                <li>Products and promotions are subject to availability and may be withdrawn or modified without prior notice.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Orders & Payment Processing</h2>
              <p>
                When you place an order, it represents an offer to purchase the specified products. Order confirmation is sent via email or SMS. We accept payments through authorized payment gateways including credit/debit cards, UPI, net banking, and supported digital wallets.
              </p>
              <p>
                We reserve the right to decline or cancel any order for reasons including inventory unavailability, suspicion of fraudulent activity, or payment authorization failures.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Shipping & Delivery</h2>
              <p>
                Delivery timeframes and shipping costs are calculated at checkout and detailed in our Shipping Policy. While we work diligently with our courier partners to meet estimated delivery dates, delays may occasionally occur due to logistics constraints, weather, or customs procedures.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Returns, Exchanges & Refunds</h2>
              <p>
                Eligible items may be returned within 30 days of delivery in accordance with our return guidelines. Returned products must be unused, in original condition, and with all tags and original packaging intact. Approved refunds are processed back to your original payment method.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Intellectual Property</h2>
              <p>
                All content published on Shopora—including text, graphics, logos, images, icons, and software—is the property of Shopora or its content suppliers and is protected by applicable copyright and intellectual property laws. You may not copy, reproduce, distribute, or create derivative works without prior written consent.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Shopora shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use or inability to use our services, products, or website.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Changes to Terms</h2>
              <p>
                We reserve the right to update or modify these Terms & Conditions at any time. Any changes will be posted directly on this page with an updated revision date. Your continued use of the site constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Contact Information</h2>
              <p>
                For questions regarding these Terms & Conditions, please reach out to our team:
              </p>
              <div className="legal-contact-box">
                <p><strong>Email:</strong> <a href="mailto:legal@shopora.com">legal@shopora.com</a></p>
                <p><strong>Support:</strong> +1 (800) 555-7467</p>
                <p><strong>Address:</strong> Shopora Global Retail Inc., 100 Commerce Way, Suite 400</p>
              </div>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsConditions;
