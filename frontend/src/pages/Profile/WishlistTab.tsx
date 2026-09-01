import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Sparkles,
  AlertCircle,
  RotateCcw,
  // Check,
  Tag,
  // ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import { useCart } from "../../context/cartContext";
import {
  getWishlist,
  toggleWishlistItem,
  type WishlistProduct,
} from "../../services/wishlistService";
import productFallback from "../../assets/electronic.png";
import toast from "react-hot-toast";

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

const formatCurrency = (amount?: number | null): string => {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
};

export const WishlistTab: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingCartId, setAddingCartId] = useState<string | null>(null);

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
        setError(res.error || "Failed to load favourite items");
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
        toast.success("Removed from favourite items");
      } else {
        toast.error(res.error || "Failed to remove item");
      }
    } catch (err: any) {
      toast.error(err.message || "Error removing item");
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
        toast.success(`"${product.name}" added to cart!`);
      }
    } catch (err) {
      toast.error("Failed to add product to cart");
    } finally {
      setAddingCartId(null);
    }
  };

  return (
    <div className="wishlist-tab-container">
      {/* Header */}
      <div className="wishlist-tab-header">
        <div>
          <h3>Favourite Items ({products.length})</h3>
          <p>Your curated wishlist of saved products. Move items to your cart anytime.</p>
        </div>

        {products.length > 0 && (
          <button
            type="button"
            className="wishlist-add-all-btn"
            onClick={async () => {
              for (const p of products) {
                await addToCart(p._id, 1);
              }
              toast.success("All items added to cart!");
              navigate("/cart");
            }}
          >
            <ShoppingCart size={15} />
            Move All to Cart
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="wishlist-loading-box">
          <div className="profile-spinner" />
          <p>Loading your saved favourites...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="orders-error-card">
          <AlertCircle size={24} />
          <div>
            <h4>Unable to load wishlist</h4>
            <p>{error}</p>
          </div>
          <button onClick={fetchWishlistData} className="retry-orders-btn">
            <RotateCcw size={14} />
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="wishlist-empty-state">
          <div className="empty-state-icon-wrap heart-icon-wrap">
            <Heart size={36} />
          </div>
          <h3>Your Wishlist is Empty</h3>
          <p>
            Explore our vast catalog and tap the heart icon on any product to save it here for later!
          </p>
          <Link to="/products" className="empty-state-cta-btn">
            <Sparkles size={16} />
            Browse Trending Products
          </Link>
        </div>
      )}

      {/* Wishlist Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="wishlist-products-grid">
          {products.map((product) => {
            const imgUrl = formatImageUrl(product.images);
            const hasSale =
              product.salePrice &&
              product.salePrice < product.price &&
              product.salePrice > 0;
            const discountPct = hasSale
              ? Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100)
              : 0;

            return (
              <div key={product._id} className="wishlist-product-card">
                {/* Image Container */}
                <Link to={`/product/${product._id}`} className="wishlist-card-image-wrap">
                  <img
                    src={imgUrl}
                    alt={product.name}
                    className="wishlist-card-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = productFallback;
                    }}
                  />
                  {hasSale && (
                    <span className="wishlist-discount-tag">
                      <Tag size={11} />
                      {discountPct}% OFF
                    </span>
                  )}
                  <button
                    type="button"
                    className="wishlist-delete-btn"
                    title="Remove from favourites"
                    disabled={removingId === product._id}
                    onClick={(e) => handleRemove(product._id, e)}
                  >
                    <Trash2 size={15} />
                  </button>
                </Link>

                {/* Details */}
                <div className="wishlist-card-body">
                  <div className="wishlist-card-category">
                    {typeof product.category === "object"
                      ? product.category?.name
                      : product.category || "General"}
                  </div>

                  <Link to={`/product/${product._id}`} className="wishlist-card-title">
                    {product.name}
                  </Link>

                  <div className="wishlist-card-pricing">
                    <span className="wishlist-active-price">
                      {formatCurrency(hasSale ? product.salePrice : product.price)}
                    </span>
                    {hasSale && (
                      <span className="wishlist-old-price">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>

                  <div className="wishlist-card-actions">
                    <button
                      type="button"
                      className="wishlist-cart-btn"
                      disabled={addingCartId === product._id}
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <ShoppingCart size={15} />
                      {addingCartId === product._id ? "Adding..." : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistTab;
