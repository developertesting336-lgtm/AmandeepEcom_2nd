import React from "react";
import { Link } from "react-router-dom";
import { Truck, ArrowLeft, Clock, MapPin } from "lucide-react";
import "./Legal.css";

const ShippingPolicy: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back-btn">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="legal-header">
          <span className="legal-eyebrow">
            <Truck size={14} /> FULFILLMENT & DELIVERY
          </span>
          <h1 className="legal-title">Shipping & Return Policy</h1>
          <p className="legal-last-updated">Last Updated: August 7, 2026</p>
        </div>

        <div className="legal-card">
          <section className="legal-section">
            <h2>1. Shipping Rates & Delivery Estimates</h2>
            <p>
              We partner with top-tier courier networks to ensure prompt and secure delivery of your Shopora orders.
            </p>
            <div className="legal-grid-features">
              <div className="legal-feature-box">
                <Clock className="feature-icon" size={20} />
                <h4>Standard Delivery</h4>
                <p>3 - 5 Business Days. Free on orders above $49.</p>
              </div>
              <div className="legal-feature-box">
                <Truck className="feature-icon" size={20} />
                <h4>Express Shipping</h4>
                <p>1 - 2 Business Days. Flat rate $9.99 for priority dispatch.</p>
              </div>
              <div className="legal-feature-box">
                <MapPin className="feature-icon" size={20} />
                <h4>International Delivery</h4>
                <p>7 - 14 Business Days across supported international regions.</p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>2. Order Tracking</h2>
            <p>
              Once your package is dispatched, you will receive an email and SMS containing a tracking link and live updates on your order status.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. 30-Day Easy Returns</h2>
            <p>
              If you are not 100% satisfied with your purchase, you may return eligible items within 30 days of delivery for a full refund or exchange.
            </p>
            <ul className="legal-list">
              <li>Items must be unused, in original packaging, with all product tags attached.</li>
              <li>Free return shipping is provided for damaged, defective, or incorrect items.</li>
              <li>Refunds are processed back to the original payment method within 3 - 5 business days after inspection.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Damaged or Missing Shipments</h2>
            <p>
              If your package arrives damaged or if items are missing, please contact our support team within 48 hours of delivery with photos of the package.
            </p>
            <div className="legal-contact-box">
              <p><strong>Support Email:</strong> shipping@shopora.com</p>
              <p><strong>Hotline:</strong> +1 (800) 555-7467</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
