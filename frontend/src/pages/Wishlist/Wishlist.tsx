import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { useCart } from "../../context/cartContext";
import {
  getWishlist,
  toggleWishlistItem,
  type WishlistProduct,
} from "../../services/wishlistService";
import {
  Heart,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Check,
  AlertCircle,
  Tag,
} from "lucide-react";
import productFallback from "../../assets/electronic.png";
import "./Wishlist.css";

const formatImageUrl = (images?: any): string => {
  if (!images) return productFallback;
  if (typeof images === "string") return images;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && first.url) return first.url;
  }
  if (typeof images === "object" && images.url) return images.url;
  return productFallback;
};

const formatCurrency = (amount?: number): string => {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const Wishlist = () => {
  const { token, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingCartId, setAddingCartId] = useState<string | null>(null);
  const [addedCartSuccessId, setAddedCartSuccessId] = useState<string | null>(null);

  const fetchWishlistData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await getWishlist(token);
      if (res.success) {
        setProducts(res.products);
      } else {
        setError(res.error || "Failed to load wishlist");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching your wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistData();
  }, [token, isAuthenticated]);

  const handleRemove = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setRemovingId(productId);
      const res = await toggleWishlistItem(productId, token);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
      } else {
        alert(res.error || "Failed to remove item from wishlist");
      }
    } catch (err: any) {
      alert(err.message || "Error removing item");
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: WishlistProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setAddingCartId(product._id);
      const success = await addToCart(product._id, 1);
      if (success) {
        setAddedCartSuccessId(product._id);
        setTimeout(() => {
          setAddedCartSuccessId(null);
        }, 2000);
        navigate('/cart')
      }
    } catch (err) {
      console.error("Add to cart error:", err);
    } finally {
      setAddingCartId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-container">
          <div className="wishlist-auth-prompt">
            <div className="prompt-icon-bubble">
              <Heart size={36} className="heart-pulse-icon" />
            </div>
            <h2>Save Your Favorite Items</h2>
            <p>Log in to view and sync your wishlist across all your devices.</p>
            <div className="prompt-actions">
              <button
                type="button"
                className="wishlist-primary-btn"
                onClick={() => navigate("/login")}
              >
                Sign In to View Wishlist
              </button>
              <Link to="/products" className="wishlist-secondary-btn">
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-page">
      <div className="wishlist-container">
        {/* Page Header */}
        <header className="wishlist-header">
          <div className="wishlist-header-left">
            <div className="wishlist-eyebrow">
              <Sparkles size={14} />
              <span>SAVED FOR LATER</span>
            </div>
            <h1 className="wishlist-title">My Wishlist</h1>
            <p className="wishlist-subtitle">
              Items you love and want to purchase later.
            </p>
          </div>

          {!loading && products.length > 0 && (
            <div className="wishlist-header-right">
              <span className="wishlist-count-badge">
                {products.length} {products.length === 1 ? "Item" : "Items"}
              </span>
              <Link to="/products" className="wishlist-continue-link">
                <span>Continue Shopping</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </header>

        {/* Loading State */}
        {loading && (
          <div className="wishlist-grid-loading">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="wishlist-card-skeleton">
                <div className="skeleton-img" />
                <div className="skeleton-line title" />
                <div className="skeleton-line price" />
                <div className="skeleton-line btn" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="wishlist-error-box">
            <AlertCircle size={22} />
            <p>{error}</p>
            <button
              type="button"
              className="wishlist-retry-btn"
              onClick={fetchWishlistData}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty Wishlist State */}
        {!loading && !error && products.length === 0 && (
          <div className="wishlist-empty-box">
            <div className="empty-heart-ring">
              <Heart size={44} strokeWidth={1.5} />
            </div>
            <h2>Your wishlist is empty</h2>
            <p>
              Explore our wide variety of premium products and tap the heart icon
              to save items here.
            </p>
            <Link to="/products" className="wishlist-explore-btn">
              <ShoppingBag size={18} />
              <span>Explore Products</span>
            </Link>
          </div>
        )}

        {/* Wishlist Product Cards Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="wishlist-grid">
            {products.map((product) => {
              const hasSale =
                product.salePrice != null &&
                product.salePrice > 0 &&
                product.salePrice < product.price;

              const displayPrice = hasSale ? product.salePrice! : product.price;
              const originalPrice = product.price;

              const discountPercent = hasSale
                ? Math.round(((originalPrice - product.salePrice!) / originalPrice) * 100)
                : 0;

              const isOutOfStock = product.stock !== undefined && product.stock <= 0;
              const isRemoving = removingId === product._id;
              const isAddingCart = addingCartId === product._id;
              const isCartSuccess = addedCartSuccessId === product._id;

              return (
                <div
                  key={product._id}
                  className={`wishlist-card ${isRemoving ? "removing" : ""}`}
                >
                  {/* Card Thumbnail / Link */}
                  <div className="wishlist-card-media">
                    <Link
                      to={`/product/${product._id}`}
                      className="wishlist-card-link"
                    >
                      <img
                        src={formatImageUrl(product.images)}
                        alt={product.name}
                        className="wishlist-card-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = productFallback;
                        }}
                      />
                    </Link>

                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                      <span className="wishlist-discount-badge">
                        <Tag size={11} /> {discountPercent}% OFF
                      </span>
                    )}

                    {/* Stock Status Badge */}
                    {isOutOfStock && (
                      <span className="wishlist-out-of-stock-badge">
                        Out of Stock
                      </span>
                    )}

                    {/* Quick Heart Toggle Button */}
                    <button
                      type="button"
                      className={`wishlist-heart-btn ${isRemoving ? "removing" : "active"}`}
                      onClick={(e) => handleRemove(product._id, e)}
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                      disabled={isRemoving}
                    >
                      <Heart
                        size={18}
                        fill={isRemoving ? "none" : "#dc2626"}
                        color={isRemoving ? "#94a3b8" : "#dc2626"}
                        strokeWidth={isRemoving ? 2 : 0}
                        className="heart-icon-svg"
                      />
                    </button>
                  </div>

                  {/* Card Details */}
                  <div className="wishlist-card-body">
                    {product.brand && (
                      <span className="wishlist-brand-tag">{product.brand}</span>
                    )}

                    <h3 className="wishlist-item-title">
                      <Link to={`/product/${product._id}`}>
                        {product.name}
                      </Link>
                    </h3>

                    {/* Price Section */}
                    <div className="wishlist-price-row">
                      <span className="wishlist-current-price">
                        {formatCurrency(displayPrice)}
                      </span>
                      {hasSale && (
                        <span className="wishlist-original-price">
                          {formatCurrency(originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Action Button: Add to Cart */}
                    <button
                      type="button"
                      className={`wishlist-add-cart-btn ${isCartSuccess ? "success" : ""
                        }`}
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={isOutOfStock || isAddingCart}
                    >
                      {isCartSuccess ? (
                        <>
                          <Check size={16} />
                          <span>Added to Cart</span>
                        </>
                      ) : isAddingCart ? (
                        <>
                          <div className="wishlist-btn-spinner" />
                          <span>Adding...</span>
                        </>
                      ) : isOutOfStock ? (
                        <span>Out of Stock</span>
                      ) : (
                        <>
                          <ShoppingCart size={16} />
                          <span>Move to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Wishlist;
