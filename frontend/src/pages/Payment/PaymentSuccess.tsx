import React, { useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, PackageCheck, Banknote, Coins } from "lucide-react";
import { useCart, clearAllStoredReferrals, clearStoredRewardPoints } from "../../context/cartContext";
import Footer from "../Home/footersection";
import "./PaymentSuccess.css";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { fetchCart } = useCart();
  const hasExecutedRef = useRef(false);

  const sessionId = searchParams.get("session_id") || searchParams.get("sessionId");
  const paymentMode = (
    searchParams.get("paymentMode") ||
    searchParams.get("payment_mode") ||
    location.state?.paymentMode ||
    (sessionId ? "ONLINE" : "COD")
  ).toUpperCase();

  const isPoints = paymentMode === "POINTS";
  const isCod = paymentMode === "COD";

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    // Clear applied referral tokens and reward points from storage once order is placed / paid
    clearAllStoredReferrals();
    clearStoredRewardPoints();

    // Refresh cart once on successful order / payment
    if (fetchCart) {
      fetchCart().catch(() => {});
    }

    // Refresh user reward points in auth state and navbar badge
    window.dispatchEvent(new Event("reward-points-updated"));
  }, []);

  return (
    <div className="payment-status-page">
      <div className="payment-status-container">
        <div className="payment-status-card success-card">
          <div className="status-icon-wrapper success-icon-wrapper">
            <CheckCircle2 size={54} className="success-icon" />
          </div>

          <span className="payment-badge success-pill">
            {isPoints
              ? "Paid with Reward Points"
              : isCod
                ? "Order Confirmed"
                : "Payment Confirmed"}
          </span>
          <h1 className="payment-title">Thank you for your order!</h1>
          <p className="payment-desc">
            {isPoints
              ? "Your order has been fully paid using your reward points. We've received your order and our team has started preparing it for delivery."
              : isCod
                ? "Your Cash on Delivery order has been placed successfully. We've received your order and our team has started preparing it for delivery."
                : "Your payment was processed successfully. We've received your order and our team has started preparing it for delivery."}
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
            {isPoints ? (
              <>
                <Coins size={16} />
                <span>100% paid using reward points — No cash or card payment needed</span>
              </>
            ) : isCod ? (
              <>
                <Banknote size={16} />
                <span>Payment will be collected in cash upon delivery at your doorstep</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Secure 256-Bit Encrypted Payment processed via Stripe</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
