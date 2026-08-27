import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, PackageCheck } from "lucide-react";
import { useCart } from "../../context/cartContext";
import Footer from "../Home/footersection";
import "./PaymentSuccess.css";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") || searchParams.get("sessionId");
  const { fetchCart } = useCart();

  useEffect(() => {
    // Refresh cart on successful payment
    if (fetchCart) {
      fetchCart().catch(() => {});
    }
  }, [fetchCart]);

  return (
    <div className="payment-status-page">
      <div className="payment-status-container">
        <div className="payment-status-card success-card">
          <div className="status-icon-wrapper success-icon-wrapper">
            <CheckCircle2 size={54} className="success-icon" />
          </div>

          <span className="payment-badge success-pill">Payment Confirmed</span>
          <h1 className="payment-title">Thank you for your order!</h1>
          <p className="payment-desc">
            Your payment via Stripe was processed successfully. We've received your order and our team has started preparing it for delivery.
          </p>

          {sessionId && (
            <div className="session-id-box">
              <span className="session-label">Transaction Reference:</span>
              <span className="session-val">{sessionId.slice(0, 24)}...</span>
            </div>
          )}

          <div className="payment-actions">
            <Link to="/order" className="primary-action-btn">
              <PackageCheck size={18} />
              <span>View My Orders</span>
            </Link>

            <Link to="/products" className="secondary-action-btn">
              <ShoppingBag size={18} />
              <span>Continue Shopping</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="payment-security-note">
            <ShieldCheck size={16} />
            <span>Secure 256-Bit Encrypted Payment processed via Stripe</span>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
