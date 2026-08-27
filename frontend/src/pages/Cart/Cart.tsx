import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft, Plus, Minus } from "lucide-react";
import { useCart } from "../../context/cartContext";
import { useEffect } from 'react'
import { useAuth } from "../../context/authContext";
// import toast from "react-hot-toast";

import Footer from "../Home/footersection";
import product1 from "../../assets/1.jpeg";
import "./Cart.css";

const formatImageUrl = (image?: any, fallback: string = product1) => {
  if (!image) return fallback;
  const rawUrl = typeof image === "string" ? image : image.url;
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

  const { isAuthenticated } = useAuth();
  const { cartItems, totalItems, subtotal, loading, updateQuantity, removeFromCart, fetchCart } = useCart();

  const isFreeShipping = subtotal >= 499;
  const shippingFee = isFreeShipping || cartItems.length === 0 ? 0 : 99;
  const grandTotal = subtotal + shippingFee;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      fetchCart();
    }
  }, [isAuthenticated]);

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
                  const itemPrice = item.price || (prod.salePrice && prod.salePrice < prod.price ? prod.salePrice : prod.price);
                  const itemTotal = itemPrice * item.quantity;
                  const imgUrl = formatImageUrl(prod.images?.[0], product1);
                  const catName = typeof prod.category === "object" ? prod.category?.name || "General" : prod.category || "General";

                  return (
                    <tr key={prod._id || item._id} className="cart-item-row">
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
                            onClick={() => updateQuantity(prod._id, item.quantity - 1)}
                            title="Decrease quantity"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="cart-qty-val">{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-qty-btn"
                            onClick={() => updateQuantity(prod._id, item.quantity + 1)}
                            title="Increase quantity"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>

                      <td className="cart-cell-total">
                        <span className="cart-cell-label">Total: </span>
                        <span className="cart-item-total">₹{itemTotal.toLocaleString("en-IN")}</span>
                      </td>

                      <td className="cart-cell-action">
                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={() => removeFromCart(prod._id)}
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

            <div className="summary-row">
              <span>Subtotal ({totalItems} items)</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

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
