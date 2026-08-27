import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  MapPin,
  CreditCard,
  User as UserIcon,
  Download,
  Check,
  RotateCcw,
  X,
  AlertTriangle,
  Clock,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import { useCart } from "../../context/cartContext";
import { getUserOrders, cancelUserOrder } from "../../services/orderService";
import type { UserOrder, UserOrderItem } from "../../services/orderService";
import productFallback from "../../assets/1.jpeg";
import Footer from "../Home/footersection";
import "./UserOrders.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CANCEL_REASONS = [
  "Ordered by mistake / accidental order",
  "Found a better price elsewhere",
  "Delivery time is too long",
  "Need to change shipping address",
  "Incorrect product or quantity selected",
  "Payment issue / want to change payment mode",
  "Other reason",
];

const formatImageUrl = (image?: any): string => {
  if (!image) return productFallback;
  const rawUrl =
    typeof image === "string"
      ? image
      : image?.url ||
        (Array.isArray(image) && image[0]?.url) ||
        (Array.isArray(image) && typeof image[0] === "string" ? image[0] : null);

  if (!rawUrl || typeof rawUrl !== "string") return productFallback;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const cleanPath = rawUrl.replace(/\\/g, "/");
  const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${API_BASE_URL}${formattedPath}`;
};

const formatCurrency = (amount?: number): string => {
  if (typeof amount !== "number" || isNaN(amount)) return "₹ 0.00";
  return `₹ ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getStepperStage = (status?: string, paymentStatus?: string) => {
  const normStatus = (status || "").toLowerCase();
  const normPay = (paymentStatus || "").toLowerCase();

  if (normStatus.includes("deliver")) return 3; // Delivered
  if (normStatus.includes("ship")) return 2; // Shipped
  if (normStatus.includes("process") || normStatus.includes("confirm") || normPay === "paid") return 1; // Packed
  return 1; // Order Confirmed / Packed
};

const getPaymentStatusBadge = (paymentStatus?: string, isCod?: boolean) => {
  const status = (paymentStatus || (isCod ? "pending" : "paid")).toLowerCase();

  switch (status) {
    case "paid":
      return {
        label: "Paid",
        className: "pay-status-paid",
      };
    case "refunded":
      return {
        label: "Refunded",
        className: "pay-status-refunded",
      };
    case "failed":
      return {
        label: "Failed",
        className: "pay-status-failed",
      };
    case "pending":
    default:
      return {
        label: "Pending",
        className: "pay-status-pending",
      };
  }
};

const UserOrders: React.FC = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(6);

  // Buy Again State
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Cancel Order Modal State
  const [cancellingOrder, setCancellingOrder] = useState<UserOrder | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string>("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getUserOrders(token);
      if (res.success) {
        setOrders(res.orders || []);
      } else {
        setError(res.error || "Unable to fetch orders at the moment.");
      }
    } catch (err: any) {
      console.error("Orders fetching error:", err);
      setError(err?.message || "Something went wrong while fetching orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  // Handle Buy Again
  const handleBuyAgain = async (order: UserOrder) => {
    const products = order.products || order.items || [];
    if (products.length === 0) return;

    try {
      setAddingToCartId(order._id);
      for (const item of products) {
        const prodId =
          typeof item.productId === "string"
            ? item.productId
            : (item.productId as any)?._id || (typeof item.product === "string" ? item.product : (item.product as any)?._id);

        if (prodId && addToCart) {
          await addToCart(prodId, item.quantity || 1);
        }
      }
      setToastMessage("Items added to your cart successfully!");
      setTimeout(() => {
        setToastMessage("");
        navigate("/cart");
      }, 800);
    } catch (err) {
      console.error("Buy again error:", err);
      alert("Failed to add items to cart. Please try again.");
    } finally {
      setAddingToCartId(null);
    }
  };

  // Open Cancel Modal
  const handleOpenCancelModal = (order: UserOrder) => {
    setCancellingOrder(order);
    setSelectedReason(CANCEL_REASONS[0]);
    setCustomReason("");
    setCancelError("");
  };

  // Confirm Order Cancellation with Reason & Order ID
  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;

    const finalReason = selectedReason === "Other reason" && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    if (!finalReason) {
      setCancelError("Please select or enter a cancellation reason.");
      return;
    }

    try {
      setIsSubmittingCancel(true);
      setCancelError("");

      const orderIdentifier = cancellingOrder.orderId || cancellingOrder._id;
      const res = await cancelUserOrder(orderIdentifier, finalReason, token);

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === cancellingOrder._id || o.orderId === cancellingOrder.orderId
              ? { ...o, orderStatus: "Cancelled", status: "Cancelled" }
              : o
          )
        );
        setCancellingOrder(null);
        setToastMessage("Order has been cancelled successfully.");
        setTimeout(() => setToastMessage(""), 2500);
      } else {
        setCancelError(res.error || "Failed to cancel order. Please try again.");
      }
    } catch (err: any) {
      console.error("Cancellation error:", err);
      setCancelError(err?.message || "Something went wrong while cancelling the order.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Handle Download Invoice
  const handleDownloadInvoice = (_order: UserOrder) => {
    alert("Invoice is not ready, please download later.");
  };

  const displayedOrders = orders.slice(0, visibleCount);

  return (
    <div className="user-orders-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="orders-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="orders-main-wrapper">
        {/* Top Header - Neat and Clean */}
        <div className="orders-top-header">
          <h1 className="orders-title-text">Your Orders</h1>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="orders-skeleton-wrapper">
            <div className="order-skeleton shimmer"></div>
            <div className="order-skeleton shimmer"></div>
          </div>
        ) : error ? (
          <div className="orders-empty-card">
            <AlertCircle size={40} className="error-icon" />
            <h3>Unable to load orders</h3>
            <p>{error}</p>
            <button onClick={fetchOrders} className="orders-retry-btn">
              <RefreshCw size={15} /> Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty-card">
            <div className="empty-icon-circle">
              <ShoppingBag size={42} />
            </div>
            <h2>No orders found</h2>
            <p>You haven't placed any orders yet. Start exploring our collections!</p>
            <Link to="/products" className="orders-primary-btn">
              <span>Start Shopping</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="orders-cards-list">
            {displayedOrders.map((order) => {
              const orderId = order.orderId || order._id;
              const productsList: UserOrderItem[] = order.products || order.items || [];
              const address = order.shippingAddress || order.address;
              const paymentMode = (order.paymentMode || order.paymentMethod || "COD").toUpperCase();
              const stage = getStepperStage(order.orderStatus || order.status, order.paymentStatus);
              const isCancelled = (order.orderStatus || order.status || "").toLowerCase().includes("cancel");
              const payStatus = (order.paymentStatus || "").toLowerCase();
              const payBadge = getPaymentStatusBadge(order.paymentStatus, paymentMode === "COD");

              // Price calculations
              const itemsTotal =
                typeof order.itemsTotal === "number"
                  ? order.itemsTotal
                  : productsList.reduce((sum, item) => {
                      const price =
                        item.purchasePrice ??
                        item.price ??
                        (typeof item.productId === "object" ? item.productId?.price : 0) ??
                        0;
                      return sum + price * (item.quantity || 1);
                    }, 0);

              const deliveryCharges = typeof order.deliveryCharges === "number" ? order.deliveryCharges : 0;
              const orderTotal =
                typeof order.orderTotal === "number"
                  ? order.orderTotal
                  : typeof order.totalAmount === "number"
                  ? order.totalAmount
                  : itemsTotal + deliveryCharges;

              return (
                <div key={order._id} className="pro-order-card">
                  {/* Card Header & Tracker */}
                  <div className="pro-card-header">
                    <div className="pro-header-info">
                      <span className="pro-order-id">#{orderId}</span>
                      <div className="pro-confirmed-badge">
                        {isCancelled ? (
                          <span className="badge-cancelled">● ORDER CANCELLED</span>
                        ) : (
                          <span className="badge-confirmed">● ORDER CONFIRMED</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Tracker Stepper (if not cancelled) */}
                    {!isCancelled && (
                      <div className="pro-stepper-wrapper">
                        <div className="pro-stepper-track">
                          <div
                            className="pro-stepper-progress"
                            style={{
                              width: stage === 1 ? "0%" : stage === 2 ? "50%" : "100%",
                            }}
                          ></div>
                        </div>

                        <div className="pro-stepper-points">
                          {/* Stage 1: Packed */}
                          <div className={`stepper-node ${stage >= 1 ? "active" : ""}`}>
                            <div className="node-dot">
                              <Check size={11} strokeWidth={3} />
                            </div>
                            <span className="node-label">Packed</span>
                          </div>

                          {/* Stage 2: Shipped */}
                          <div className={`stepper-node ${stage >= 2 ? "active" : ""}`}>
                            <div className="node-dot">
                              {stage >= 2 ? <Check size={11} strokeWidth={3} /> : null}
                            </div>
                            <span className="node-label">Shipped</span>
                          </div>

                          {/* Stage 3: Delivered */}
                          <div className={`stepper-node ${stage >= 3 ? "active" : ""}`}>
                            <div className="node-dot">
                              {stage >= 3 ? <Check size={11} strokeWidth={3} /> : null}
                            </div>
                            <span className="node-label">Delivered</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cancellation Refund Notification Banners */}
                  {payStatus === "refunded" ? (
                    <div className="refund-banner refund-success-banner">
                      <CheckCheck size={17} className="refund-icon-success" />
                      <div className="refund-banner-text">
                        <strong>Congratulations!</strong> Your money has been refunded successfully.
                      </div>
                    </div>
                  ) : isCancelled && payStatus === "paid" ? (
                    <div className="refund-banner refund-pending-banner">
                      <Clock size={17} className="refund-icon-pending" />
                      <div className="refund-banner-text">
                        Your money will be refunded to you after admin confirmation within 48 hrs.
                      </div>
                    </div>
                  ) : null}

                  {/* Products Section */}
                  <div className="pro-products-container">
                    {productsList.length === 0 ? (
                      <p className="no-products-msg">No product details attached to this order.</p>
                    ) : (
                      productsList.map((item, idx) => {
                        const productObj =
                          typeof item.productId === "object"
                            ? item.productId
                            : typeof item.product === "object"
                            ? item.product
                            : null;

                        const prodId =
                          typeof item.productId === "string"
                            ? item.productId
                            : productObj?._id || (typeof item.product === "string" ? item.product : undefined);

                        const prodName =
                          item.name || item.productName || productObj?.name || `Product Item #${idx + 1}`;

                        const firstImageObj =
                          (Array.isArray(item.images) && item.images.length > 0 && item.images[0]) ||
                          item.image ||
                          (productObj?.images && productObj.images[0]) ||
                          productObj?.image;

                        const prodImgUrl =
                          typeof firstImageObj === "string"
                            ? firstImageObj
                            : firstImageObj?.url || "";

                        const unitPrice =
                          item.purchasePrice ??
                          item.price ??
                          productObj?.price ??
                          productObj?.salePrice ??
                          productObj?.salesPrice ??
                          (itemsTotal && item.quantity ? itemsTotal / item.quantity : 0);

                        const quantity = item.quantity || 1;
                        const itemSubtotal = unitPrice * quantity;

                        return (
                          <div key={item._id || idx} className="pro-product-row">
                            <div className="product-thumb-wrap">
                              <img
                                src={formatImageUrl(prodImgUrl)}
                                alt={prodName}
                                className="product-thumb-img"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = productFallback;
                                }}
                              />
                            </div>

                            <div className="product-main-details">
                              <h4 className="product-row-title">{prodName}</h4>
                              <div className="product-pricing-line">
                                <span>Purchase Price: {formatCurrency(unitPrice)} × {quantity}</span>
                                <span className="line-bullet">•</span>
                                <span className="total-highlight">Total: {formatCurrency(itemSubtotal)}</span>
                              </div>
                            </div>

                            <div className="product-row-actions">
                              {paymentMode === "COD" && idx === 0 && (
                                <span className="cod-badge-tag">PAY ON DELIVERY</span>
                              )}
                              {prodId && (
                                <Link to={`/product/${prodId}`} className="view-product-btn">
                                  View
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* 2-Column Info: Shipping Address & Payment Summary */}
                  <div className="pro-info-columns">
                    {/* Left: Shipping Address */}
                    <div className="info-column address-column">
                      <div className="column-title">
                        <MapPin size={13} className="col-icon" />
                        <span>SHIPPING ADDRESS</span>
                      </div>

                      {address ? (
                        <div className="column-content">
                          <div className="recipient-name">
                            <UserIcon size={13} />
                            <strong>{address.fullname || address.fullName || address.name || user?.name || "Customer"}</strong>
                          </div>
                          <p className="address-text-line">
                            {address.address || address.addressLine || address.street || ""}
                          </p>
                          <p className="address-text-line">
                            {[address.city, address.state, address.postalCode || address.pincode, address.country]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      ) : (
                        <p className="fallback-info-text">Standard shipping address applied.</p>
                      )}
                    </div>

                    {/* Right: Payment & Summary */}
                    <div className="info-column payment-column">
                      <div className="column-title-row">
                        <div className="column-title">
                          <CreditCard size={13} className="col-icon" />
                          <span>PAYMENT & SUMMARY</span>
                        </div>
                        <span className="payment-mode-txt">
                          {paymentMode === "COD" ? "Cash on Delivery" : "Online Payment"}
                        </span>
                      </div>

                      <div className="column-content payment-details-grid">
                        <div className="summary-data-row">
                          <span className="data-lbl">Payment Status:</span>
                          <span className={`payment-status-pill ${payBadge.className}`}>
                            {payBadge.label}
                          </span>
                        </div>
                        <div className="summary-data-row">
                          <span className="data-lbl">Items Total:</span>
                          <span className="data-val bold-val">{formatCurrency(itemsTotal)}</span>
                        </div>
                        <div className="summary-data-row">
                          <span className="data-lbl">Delivery Charges:</span>
                          <span className="data-val bold-val">
                            {deliveryCharges === 0 ? "FREE" : `+ ${formatCurrency(deliveryCharges)}`}
                          </span>
                        </div>
                        <div className="summary-data-row total-row-highlight">
                          <span className="data-lbl">Order Total:</span>
                          <span className="data-val order-grand-total">{formatCurrency(orderTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Footer: Download Invoice / Buy Again / Cancel Order */}
                  <div className="pro-card-footer">
                    <button
                      className="footer-invoice-btn"
                      onClick={() => handleDownloadInvoice(order)}
                    >
                      <Download size={15} />
                      <span>Download Invoice</span>
                    </button>

                    <div className="footer-action-buttons">
                      <button
                        className="buy-again-btn"
                        disabled={addingToCartId === order._id}
                        onClick={() => handleBuyAgain(order)}
                      >
                        <RotateCcw size={14} className={addingToCartId === order._id ? "spin" : ""} />
                        <span>{addingToCartId === order._id ? "Adding..." : "Buy Again"}</span>
                      </button>

                      {!isCancelled && (
                        <button
                          className="cancel-order-btn"
                          onClick={() => handleOpenCancelModal(order)}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Show More Button */}
        {orders.length > visibleCount && (
          <div className="show-more-wrapper">
            <button
              className="show-more-btn"
              onClick={() => setVisibleCount((prev) => prev + 4)}
            >
              Show More
            </button>
          </div>
        )}
      </div>

      {/* Cancel Order Modal with Reason */}
      {cancellingOrder && (
        <div className="cancel-modal-overlay" onClick={() => !isSubmittingCancel && setCancellingOrder(null)}>
          <div className="cancel-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-modal-header">
              <div className="cancel-modal-title-wrap">
                <AlertTriangle size={20} className="cancel-warning-icon" />
                <h3>Cancel Order #{cancellingOrder.orderId || cancellingOrder._id}</h3>
              </div>
              <button
                className="cancel-modal-close"
                disabled={isSubmittingCancel}
                onClick={() => setCancellingOrder(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cancel-modal-body">
              <p className="cancel-modal-desc">
                Please tell us the reason for cancelling this order. Once confirmed, this cannot be undone.
              </p>

              {cancelError && (
                <div className="cancel-modal-error">
                  <AlertCircle size={15} />
                  <span>{cancelError}</span>
                </div>
              )}

              <div className="cancel-reasons-list">
                <label className="cancel-input-label">Select Reason:</label>
                {CANCEL_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`cancel-reason-option ${selectedReason === reason ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      disabled={isSubmittingCancel}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {selectedReason === "Other reason" && (
                <div className="custom-reason-wrap">
                  <label className="cancel-input-label">Please specify:</label>
                  <textarea
                    className="custom-reason-textarea"
                    placeholder="Provide additional details..."
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    disabled={isSubmittingCancel}
                  />
                </div>
              )}
            </div>

            <div className="cancel-modal-actions">
              <button
                type="button"
                className="cancel-modal-back-btn"
                disabled={isSubmittingCancel}
                onClick={() => setCancellingOrder(null)}
              >
                Nevermind, Keep Order
              </button>

              <button
                type="button"
                className="cancel-modal-submit-btn"
                disabled={isSubmittingCancel}
                onClick={handleConfirmCancelOrder}
              >
                {isSubmittingCancel ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserOrders;
