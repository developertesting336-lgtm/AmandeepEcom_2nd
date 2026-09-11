import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "../Home/footersection";
import "./Legal.css";

const ShippingPolicy: React.FC = () => {
  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <Link to="/" className="legal-back-btn">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <header className="legal-header">
            <h1 className="legal-title">Shipping & Return Policy</h1>
            <p className="legal-last-updated">Last Updated: August 2026</p>
          </header>

          <main className="legal-card">
            <section className="legal-section">
              <h2>1. Shipping Options & Delivery Timelines</h2>
              <p>
                We deliver orders nationwide and internationally using trusted delivery partners. Estimated shipping times depend on your chosen delivery option at checkout:
              </p>
              <ul className="legal-list">
                <li>
                  <strong>Standard Shipping:</strong> 3 – 5 business days (Free on all orders over $49; flat $4.99 on orders under $49).
                </li>
                <li>
                  <strong>Express Shipping:</strong> 1 – 2 business days (Flat rate of $9.99 for priority processing and express courier handling).
                </li>
                <li>
                  <strong>International Shipping:</strong> 7 – 14 business days depending on destination country and customs clearance.
                </li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>2. Order Processing & Tracking</h2>
              <p>
                Orders placed on business days (Monday through Friday, excluding holidays) are typically processed and handed over to our courier partner within 24 to 48 hours.
              </p>
              <p>
                As soon as your package ships, you will receive a confirmation email and SMS containing a carrier tracking number and a live tracking link so you can monitor your shipment's progress.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Shipping Address & Delivery Attempts</h2>
              <p>
                Please ensure that your shipping address and contact phone number are entered correctly during checkout. Our courier partners will make up to three delivery attempts before returning the package to our warehouse.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. 30-Day Return & Exchange Policy</h2>
              <p>
                We want you to be completely satisfied with your purchase. If you are not satisfied, you may initiate a return or exchange within 30 days of receiving your order, subject to the following criteria:
              </p>
              <ul className="legal-list">
                <li>Items must be unused, unwashed, and in the same condition as received.</li>
                <li>Items must have all original product tags, security seals, and packaging intact.</li>
                <li>Personal care items, perishables, and clearance sale items marked "Final Sale" cannot be returned.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Refund Process & Timelines</h2>
              <p>
                Once your returned package is received and inspected at our fulfillment center, we will notify you via email regarding the approval or rejection of your refund.
              </p>
              <ul className="legal-list">
                <li>Approved refunds are credited back to your original payment method within 3 – 5 business days.</li>
                <li>For Cash on Delivery (COD) orders, refunds are issued via direct bank transfer or store credit.</li>
                <li>Original shipping fees are non-refundable unless the return is due to our error.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>6. Damaged, Defective or Incorrect Items</h2>
              <p>
                If your order arrives damaged, defective, or contains the wrong item, please contact our support team within 48 hours of delivery. We will arrange a free replacement or issue a full refund immediately.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Shipping & Support Contacts</h2>
              <p>
                If you have questions regarding your delivery or need assistance with a return, please contact our support team:
              </p>
              <div className="legal-contact-box">
                <p><strong>Email:</strong> <a href="mailto:shipping@shopora.com">shipping@shopora.com</a></p>
                <p><strong>Support:</strong> +1 (800) 555-7467</p>
                <p><strong>Support Hours:</strong> Monday – Saturday, 9:00 AM – 6:00 PM</p>
              </div>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ShippingPolicy;
