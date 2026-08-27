import React from "react";
import { Link } from "react-router-dom";
import { XCircle, ShoppingBag, ArrowLeft, RefreshCw, ShieldAlert } from "lucide-react";
import Footer from "../Home/footersection";
import "./PaymentSuccess.css";

const PaymentCancelled: React.FC = () => {
  return (
    <div className="payment-status-page">
      <div className="payment-status-container">
        <div className="payment-status-card cancel-card">
          <div className="status-icon-wrapper cancel-icon-wrapper">
            <XCircle size={54} className="cancel-icon" />
          </div>

          <span className="payment-badge cancel-pill">Payment Cancelled</span>
          <h1 className="payment-title">Payment was not completed</h1>
          <p className="payment-desc">
            Your payment session was cancelled or could not be completed. No money was deducted from your account. You can retry your checkout anytime.
          </p>

          <div className="payment-actions">
            <Link to="/checkout" className="primary-action-btn retry-btn">
              <RefreshCw size={18} />
              <span>Return to Checkout</span>
            </Link>

            <Link to="/cart" className="secondary-action-btn">
              <ArrowLeft size={16} />
              <span>Back to Cart</span>
            </Link>

            <Link to="/products" className="tertiary-action-btn">
              <ShoppingBag size={16} />
              <span>Browse Products</span>
            </Link>
          </div>

          <div className="payment-security-note">
            <ShieldAlert size={16} />
            <span>If you experienced an issue with Stripe, feel free to try Cash on Delivery (COD)</span>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentCancelled;
