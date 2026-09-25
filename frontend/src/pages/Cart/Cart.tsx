import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  X,
  Tag,
  Coins,
  // Sparkles,
} from "lucide-react";
import { useCart } from "../../context/cartContext";
import { useAuth } from "../../context/authContext";
import Footer from "../Home/footersection";
import product1 from "../../assets/1.jpeg";
import "./Cart.css";

const formatImageUrl = (path?: any, fallback: string = product1) => {
  if (!path) return fallback;
  let rawUrl = "";
  if (typeof path === "string") {
    rawUrl = path;
  } else if (typeof path === "object" && path !== null) {
    rawUrl = path.url || (path as any).secure_url || (path as any).path || "";
  }
  if (!rawUrl) return fallback;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const cleanPath = rawUrl.replace(/\\/g, "/");
  const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  return `${API_BASE_URL}${formattedPath}`;
};

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    totalItems,
    subtotal,
    loading,
    appliedReferrals,
    referralDiscount,
    pointsDiscount,
    maxRedeemablePoints,
    userRewardPoints,
    applyRewardPoints,
    removeRewardPoints,
    removeReferral,
    updateQuantity,
    removeFromCart,
    fetchCart,
  } = useCart();

  const isFreeShipping = subtotal >= 499;
  const shippingFee = isFreeShipping || cartItems.length === 0 ? 0 : 99;
  const grandTotal = Math.max(0, subtotal - referralDiscount - pointsDiscount) + shippingFee;

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading && cartItems.length === 0) {
    return (
      <div className="cart-page">
        <main className="cart-container">
          <div className="cart-header">
            <span className="cart-eyebrow">YOUR SHOPPING BAG</span>
            <h1>Shopping Cart</h1>
          </div>
          <div className="cart-empty-card">
            <p>Loading cart items...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <main className="cart-container">
          <div className="cart-header">
            <span className="cart-eyebrow">YOUR SHOPPING BAG</span>
            <h1>Shopping Cart</h1>
          </div>

          <div className="cart-empty-card">
            <div className="cart-empty-icon">
              <ShoppingCart size={40} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/products" className="cart-browse-btn">
              Explore Products <ArrowRight size={16} />
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <main className="cart-container">
        {/* HEADER */}
        <div className="cart-header">
          <span className="cart-eyebrow">YOUR SHOPPING BAG</span>
          <h1>Shopping Cart ({totalItems} {totalItems === 1 ? "item" : "items"})</h1>
          <p>Review your selected products before proceeding to secure checkout.</p>
        </div>

        {/* LAYOUT GRID */}
        <div className="cart-layout">
          {/* ITEMS LIST */}
          <div className="cart-items-card">
            <table className="cart-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => {
                  const prod = item.product;
                  if (!prod) return null;

                  const itemRef = prod._id ? appliedReferrals[String(prod._id)] : undefined;
                  const unitDiscount = itemRef && itemRef.discountAmount ? Number(itemRef.discountAmount) : 0;
                  const itemPrice = item.price ?? (prod.salePrice && prod.salePrice < prod.price ? prod.salePrice : prod.price);
                  const itemTotal = itemPrice * item.quantity;
                  const effectiveUnitDiscount = Math.min(itemPrice, unitDiscount);
                  const lineDiscount = effectiveUnitDiscount * item.quantity;
                  const hasItemReferral = Boolean(lineDiscount > 0);

                  const imgUrl = formatImageUrl(prod.images?.[0], product1);
                  const catName = typeof prod.category === "object" ? prod.category?.name || "General" : prod.category || "General";

                  const variantSummary = item.variant?.attributes && item.variant.attributes.length > 0
                    ? item.variant.attributes.map((a) => `${a.name}: ${a.value}`).join(" • ")
                    : null;

                  const rowKey = item._id || (item.variantId ? `${prod._id}_${item.variantId}` : prod._id);

                  return (
                    <tr key={rowKey} className="cart-item-row">
                      <td className="cart-cell-product">
                        <div className="cart-product-cell">
                          <div className="cart-product-image">
                            <img src={imgUrl} alt={prod.name} onError={(e) => { (e.target as HTMLImageElement).src = product1; }} />
                          </div>
                          <div className="cart-product-info">
                            <h3
                              className="cart-product-title"
                              onClick={() => navigate(`/product/${prod._id}`)}
                            >
                              {prod.name}
                            </h3>
                            {variantSummary && (
                              <div className="cart-product-variant-badge">
                                {variantSummary}
                              </div>
                            )}
                            {hasItemReferral && (
                              <div className="cart-item-referral-tag">
                                <Tag size={12} />
                                <span>
                                  -₹{lineDiscount.toLocaleString("en-IN")} Referral Discount
                                  {item.quantity > 1 ? ` (₹${unitDiscount.toLocaleString("en-IN")}/unit)` : ""}
                                </span>
                              </div>
                            )}
                            <span className="cart-product-category">{catName}</span>
                            <span className="cart-mobile-price">₹{itemPrice.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </td>

                      <td className="cart-cell-price">
                        <span className="cart-unit-price">₹{itemPrice.toLocaleString("en-IN")}</span>
                      </td>

                      <td className="cart-cell-qty">
                        <div className="cart-qty-control">
                          <button
                            type="button"
                            className="cart-qty-btn"
                            onClick={() => updateQuantity(prod._id, item.quantity - 1, item.variantId)}
                            title="Decrease quantity"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="cart-qty-val">{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-qty-btn"
                            onClick={() => updateQuantity(prod._id, item.quantity + 1, item.variantId)}
                            title="Increase quantity"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>

                      <td className="cart-cell-total">
                        <span className="cart-cell-label">Total: </span>
                        {hasItemReferral ? (
                          <div className="cart-total-group">
                            <span className="cart-item-total discounted">
                              ₹{Math.max(0, itemTotal - lineDiscount).toLocaleString("en-IN")}
                            </span>
                            <span className="cart-item-original-total">
                              ₹{itemTotal.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ) : (
                          <span className="cart-item-total">₹{itemTotal.toLocaleString("en-IN")}</span>
                        )}
                      </td>

                      <td className="cart-cell-action">
                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={() => removeFromCart(prod._id, item.variantId)}
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ORDER SUMMARY */}
          <aside className="cart-summary-card">
            <h2 className="cart-summary-title">Order Summary</h2>

            {/* APPLIED REFERRAL COUPONS LIST WITH [X] REMOVE BUTTON FOR EACH */}
            {Object.values(appliedReferrals).length > 0 && (
              <div className="cart-referral-coupons-wrapper">
                {Object.values(appliedReferrals).map((ref) => {
                  const matchingItems = cartItems.filter(
                    (i) => i.product && String(i.product._id) === String(ref.productId)
                  );
                  const isItemInCart = matchingItems.length > 0;
                  const totalQtyForProduct = matchingItems.reduce((acc, i) => acc + i.quantity, 0);
                  const unitDiscount = Number(ref.discountAmount || 0);
                  const totalDiscountForProduct = matchingItems.reduce((acc, i) => {
                    const p = i.price ?? (i.product.salePrice && i.product.salePrice < i.product.price ? i.product.salePrice : i.product.price);
                    return acc + Math.min(p, unitDiscount) * i.quantity;
                  }, 0);
                  const displayName = ref.productName || matchingItems[0]?.product?.name || "Referral Discount";

                  return (
                    <div
                      key={ref.productId}
                      className={`cart-referral-coupon-card ${isItemInCart ? "active" : "pending"}`}
                    >
                      <div className="cart-coupon-left">
                        <div className="cart-coupon-icon-wrap">
                          <Tag size={15} color="#059669" />
                        </div>
                        <div className="cart-coupon-details">
                          <div className="cart-coupon-title-row">
                            <span className="cart-coupon-title" title={displayName}>
                              {displayName}
                            </span>
                            <span className="cart-coupon-amt">
                              -₹{(isItemInCart ? totalDiscountForProduct : unitDiscount).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="cart-coupon-sub">
                            {isItemInCart ? (
                              totalQtyForProduct > 1 ? (
                                <>Applied ₹{unitDiscount.toLocaleString("en-IN")}/unit × {totalQtyForProduct} to <strong>{displayName}</strong></>
                              ) : (
                                <>Applied to <strong>{displayName}</strong></>
                              )
                            ) : (
                              <span className="cart-coupon-warning">
                                Add {displayName} to cart to apply discount
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="cart-remove-coupon-btn"
                        onClick={() => removeReferral(ref.productId)}
                        title={`Remove referral discount for ${displayName}`}
                        aria-label={`Remove referral discount for ${displayName}`}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reward Points Redemption Widget */}
            {user && userRewardPoints > 0 && cartItems.length > 0 && (
              <div className="cart-points-redemption-container">
                {pointsDiscount > 0 ? (
                  <div className="cart-points-card applied">
                    <div className="cart-points-left">
                      <div className="cart-points-icon-wrap applied-icon">
                        <Coins size={16} />
                      </div>
                      <div className="cart-points-info">
                        <div className="cart-points-title-row">
                          <span className="cart-points-title">
                            {pointsDiscount} Points Applied
                          </span>
                          <span className="cart-points-discount-amt">
                            -₹{pointsDiscount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <p className="cart-points-sub">
                          ₹1 OFF per point • {userRewardPoints - pointsDiscount} pts remaining
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cart-remove-points-btn"
                      onClick={removeRewardPoints}
                      title="Remove reward points discount"
                      aria-label="Remove reward points discount"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="cart-points-card available">
                    <div className="cart-points-left">
                      <div className="cart-points-icon-wrap available-icon">
                        <Coins size={17} />
                      </div>
                      <div className="cart-points-info">
                        <div className="cart-points-title-row">
                          <span className="cart-points-title">Redeem Reward Points</span>
                          <span className="cart-points-balance-chip">
                            {userRewardPoints} Pts Available
                          </span>
                        </div>
                        <p className="cart-points-sub">
                          {maxRedeemablePoints > 0 ? (
                            <>
                              Save <strong className="cart-points-savings">₹{maxRedeemablePoints.toLocaleString("en-IN")}</strong> on this order
                            </>
                          ) : (
                            "Points cannot be applied on ₹0 cart balance"
                          )}
                        </p>
                      </div>
                    </div>
                    {maxRedeemablePoints > 0 && (
                      <button
                        type="button"
                        className="cart-apply-points-btn"
                        onClick={() => applyRewardPoints()}
                      >
                        {/* <Sparkles size={12} className="btn-sparkle-icon" /> */}
                        <span>Apply</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="summary-row">
              <span>Subtotal ({totalItems} items)</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            {referralDiscount > 0 && (
              <div className="summary-row referral-discount-summary">
                <span className="referral-summary-label">
                  <span className="referral-chip">Referral</span> Discount
                  {Object.values(appliedReferrals).filter((r) =>
                    cartItems.some((i) => i.product && String(i.product._id) === String(r.productId))
                  ).length > 1 && (
                      <span className="cart-coupon-count-badge">
                        ({Object.values(appliedReferrals).filter((r) =>
                          cartItems.some((i) => i.product && String(i.product._id) === String(r.productId))
                        ).length})
                      </span>
                    )}
                </span>
                <span className="referral-summary-amt">-₹{referralDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}

            {pointsDiscount > 0 && (
              <div className="summary-row points-discount-summary">
                <span className="points-summary-label">
                  <span className="points-chip">
                    <Coins size={10} /> Points
                  </span>{" "}
                  Reward Discount
                </span>
                <span className="points-summary-amt">
                  -₹{pointsDiscount.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className={`summary-row ${isFreeShipping ? "free-ship" : ""}`}>
              <span>Shipping</span>
              <span>{isFreeShipping ? "FREE" : `₹${shippingFee}`}</span>
            </div>

            {isFreeShipping && (
              <div className="summary-row free-ship">
                <span>Free Shipping Unlocked!</span>
              </div>
            )}

            <div className="summary-divider"></div>

            <div className="summary-row grand-total">
              <span>Total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>

            <button
              className="cart-checkout-btn"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>

            <Link to="/products" className="cart-continue-link">
              <ArrowLeft size={13} style={{ display: "inline", marginRight: "4px" }} /> Continue Shopping
            </Link>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
