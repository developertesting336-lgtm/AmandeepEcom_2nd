import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  Heart,
  ShoppingCart,
  Star,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useCart } from "../../context/cartContext";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import productFallback from "../../assets/1.jpeg";
import "./RecommendedSection.css";

interface Product {
  _id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  images?: Array<string | { url?: string; secure_url?: string; path?: string; public_id?: string }>;
  category?: { name?: string } | string;
  brand?: string;
  rating?: number;
  numReviews?: number;
  isFeatured?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formatImageUrl = (path?: any, fallback: string = productFallback) => {
  if (!path) return fallback;
  const rawUrl = typeof path === "string" ? path : (path.url || path.secure_url || path.path || "");
  if (!rawUrl || typeof rawUrl !== "string") return fallback;
  if (
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://") ||
    rawUrl.startsWith("data:") ||
    rawUrl.startsWith("blob:") ||
    rawUrl.startsWith("/") ||
    rawUrl.includes("/assets/")
  ) {
    return rawUrl;
  }
  const cleanPath = rawUrl.replace(/\\/g, "/");
  const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${API_BASE_URL}${formattedPath}`;
};

const RecommendedSection = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  // Helper to extract list from various response envelopes
  const parseProductsResponse = (result: any): Product[] => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.products)) return result.products;
    if (Array.isArray(result.recommended)) return result.recommended;
    if (Array.isArray(result.data?.products)) return result.data.products;
    if (Array.isArray(result.data?.recommended)) return result.data.recommended;
    if (Array.isArray(result.data)) return result.data;
    return [];
  };

  // Fetch from /api/recommended or fallback to /api/products/recommended
  useEffect(() => {
    let isMounted = true;

    const fetchRecommended = async () => {
      try {
        setLoading(true);
        let items: Product[] = [];

        // 1. Try primary endpoint: /api/recommended
        try {
          const res1 = await fetch(`${API_BASE_URL}/api/recommended`, {
            credentials: "include",
          });
          if (res1.ok) {
            const data1 = await res1.json();
            const parsed1 = parseProductsResponse(data1);
            if (parsed1.length > 0) {
              items = parsed1;
            }
          }
        } catch (err) {
          console.warn("Primary /api/recommended fetch failed, trying fallback:", err);
        }

        // 2. Fallback to /api/products/recommended if needed
        if (items.length === 0) {
          try {
            const res2 = await fetch(`${API_BASE_URL}/api/products/recommended`, {
              credentials: "include",
            });
            if (res2.ok) {
              const data2 = await res2.json();
              const parsed2 = parseProductsResponse(data2);
              if (parsed2.length > 0) {
                items = parsed2;
              }
            }
          } catch (err) {
            console.warn("Secondary /api/products/recommended fetch failed:", err);
          }
        }

        if (isMounted) {
          setProducts(items.slice(0, 10));
        }
      } catch (error) {
        console.error("Error loading recommended products:", error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecommended();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Wishlist status
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        if (!isAuthenticated) {
          setWishlist({});
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();
        if (response.ok && data.success && Array.isArray(data.products)) {
          const wishlistMap: Record<string, boolean> = {};
          data.products.forEach((product: any) => {
            const id = product._id || product.id;
            if (id) wishlistMap[id] = true;
          });
          setWishlist(wishlistMap);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist in RecommendedSection:", error);
      }
    };

    fetchWishlist();
  }, [isAuthenticated]);

  const toggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to add to wishlist");
      return;
    }

    const isCurrentlyInWishlist = Boolean(wishlist[productId]);
    const nextState = !isCurrentlyInWishlist;

    // Optimistic UI update
    setWishlist((prev) => ({
      ...prev,
      [productId]: nextState,
    }));

    if (nextState) {
      toast.success("Item added to wishlist");
    } else {
      toast.success("Item removed from wishlist");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/wishlist/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update wishlist");
      }

      if (data.success) {
        setWishlist((prev) => ({
          ...prev,
          [productId]: data.action === "added",
        }));
      }
    } catch (error: any) {
      setWishlist((prev) => ({
        ...prev,
        [productId]: isCurrentlyInWishlist,
      }));
      toast.error(error?.message || "Failed to update wishlist");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to add product to cart");
      return;
    }

    try {
      toast.success(`"${prod.name}" added to cart!`);
      const success = await addToCart(prod._id, 1);
      if (!success) {
        toast.error("Failed to add product to cart");
      }
    } catch (error: any) {
      toast.error("Failed to add product to cart");
    }
  };

  if (loading) {
    return (
      <section className="recommended-section">
        <div className="recommended-container">
          <div className="recommended-header">
            <div className="recommended-heading-wrap">
              <span className="recommended-badge-pill">
                <Sparkles size={14} className="sparkle-icon" /> AI Picked For You
              </span>
              <h2 className="recommended-title">Recommended Products</h2>
            </div>
          </div>
          <div className="recommended-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="recommended-skeleton-card">
                <div className="rec-skeleton-img" />
                <div className="rec-skeleton-tag" />
                <div className="rec-skeleton-line rec-skeleton-title" />
                <div className="rec-skeleton-line rec-skeleton-sub" />
                <div className="rec-skeleton-price" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="recommended-section">
      <div className="recommended-container">
        {/* SECTION HEADER */}
        <div className="recommended-header">
          <div className="recommended-heading-wrap">
            <span className="recommended-badge-pill">
              <Sparkles size={14} className="sparkle-icon" /> Handpicked For You
            </span>
            <div className="recommended-title-row">
              <h2 className="recommended-title">Recommended Products</h2>
              <span className="recommended-badge-tag">
                <TrendingUp size={13} /> Top Picks
              </span>
            </div>
            <p className="recommended-subtitle">
              Curated picks tailored to your style, popular choices, and latest arrivals.
            </p>
          </div>

          <div className="recommended-header-actions">
            <Link to="/products" className="recommended-view-all-btn">
              Explore All <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="recommended-grid">
          {products.map((prod, index) => {
            const currentPrice =
              prod.salePrice && prod.salePrice < prod.price ? prod.salePrice : prod.price;
            const hasDiscount = prod.salePrice && prod.salePrice < prod.price;
            const discountPercent = hasDiscount
              ? Math.round(((prod.price - prod.salePrice!) / prod.price) * 100)
              : 0;

            const categoryName =
              typeof prod.category === "object" ? prod.category?.name : prod.category;
            const brand = prod.brand || categoryName || "Recommended";
            const imgUrl = formatImageUrl(prod.images?.[0], productFallback);
            const isLiked = !!wishlist[prod._id];
            const ratingVal = prod.rating || 4.8;
            const reviewsCount = prod.numReviews || 24 + (index * 7) % 50;

            return (
              <div
                key={prod._id || index}
                className="recommended-card"
                onClick={() => navigate(`/product/${prod._id}`)}
              >
                {/* IMAGE & OVERLAY ACTIONS */}
                <div className="recommended-img-box">
                  <img
                    src={imgUrl}
                    alt={prod.name}
                    className="recommended-img"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = productFallback;
                    }}
                  />

                  {/* DISCOUNT BADGE ONLY (NO PER-CARD RECOMMENDED BADGE) */}
                  {hasDiscount && (
                    <div className="recommended-card-top-badges">
                      <span className="recommended-discount-chip">-{discountPercent}%</span>
                    </div>
                  )}

                  {/* WISHLIST BUTTON */}
                  <button
                    type="button"
                    className={`recommended-wishlist-btn ${isLiked ? "active" : ""}`}
                    onClick={(e) => toggleWishlist(e, prod._id)}
                    aria-label="Add to Wishlist"
                  >
                    <Heart
                      size={16}
                      fill={isLiked ? "#dc2626" : "none"}
                      color={isLiked ? "#dc2626" : "#475569"}
                    />
                  </button>
                </div>

                {/* CARD BODY */}
                <div className="recommended-card-info">
                  <div className="recommended-meta-row">
                    <span className="recommended-category">{brand}</span>
                    <div className="recommended-rating">
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <span>{ratingVal.toFixed(1)}</span>
                      <span className="rec-review-count">({reviewsCount})</span>
                    </div>
                  </div>

                  <h3 className="recommended-product-title" title={prod.name}>
                    {prod.name}
                  </h3>

                  <div className="recommended-price-row">
                    <div className="recommended-prices">
                      <span className="recommended-current-price">
                        ₹{(currentPrice || 0).toLocaleString("en-IN")}
                      </span>
                      {hasDiscount && (
                        <span className="recommended-old-price">
                          ₹{(prod.price || 0).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="recommended-cart-btn"
                      onClick={(e) => handleAddToCart(e, prod)}
                      title="Add to Cart"
                      aria-label="Add to Cart"
                    >
                      <ShoppingCart size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecommendedSection;
