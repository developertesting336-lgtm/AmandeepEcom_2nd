import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { useCart } from "../../context/cartContext";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import productFallback from "../../assets/1.jpeg";
import "./SimilarProducts.css";

interface Product {
  _id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  images?: Array<string | { url?: string; secure_url?: string; path?: string; public_id?: string }>;
  category?: { name?: string } | string;
  subcategory?: { name?: string } | string;
  brand?: string;
  rating?: number;
  numReviews?: number;
  isFeatured?: boolean;
}

interface SimilarProductsProps {
  productId: string;
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

const SimilarProducts = ({ productId }: SimilarProductsProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  const parseProductsResponse = (result: any): Product[] => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.products)) return result.products;
    if (Array.isArray(result.data?.products)) return result.data.products;
    if (Array.isArray(result.data?.similarProducts)) return result.data.similarProducts;
    if (Array.isArray(result.data)) return result.data;
    return [];
  };

  // Fetch similar / for you products
  useEffect(() => {
    let isMounted = true;

    const fetchSimilarProducts = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        let items: Product[] = [];

        // 1. Try /api/products/similar/:productId
        try {
          const res = await fetch(`${API_BASE_URL}/api/products/similar/${productId}`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            const parsed = parseProductsResponse(data);
            if (parsed.length > 0) {
              items = parsed;
            }
          }
        } catch (err) {
          console.warn("Primary /api/products/similar fetch failed, trying fallback:", err);
        }

        // 2. Fallback to /products/similar/:productId if needed
        if (items.length === 0) {
          try {
            const res2 = await fetch(`${API_BASE_URL}/products/similar/${productId}`, {
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
            console.warn("Secondary /products/similar fetch failed:", err);
          }
        }

        if (isMounted) {
          setProducts(items.filter((p) => p._id !== productId));
        }
      } catch (error) {
        console.error("Error fetching similar products:", error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSimilarProducts();

    return () => {
      isMounted = false;
    };
  }, [productId]);

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
        console.error("Failed to fetch wishlist in SimilarProducts:", error);
      }
    };

    fetchWishlist();
  }, [isAuthenticated]);

  const toggleWishlist = async (e: React.MouseEvent, targetProductId: string) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to add to wishlist");
      return;
    }

    const isCurrentlyInWishlist = Boolean(wishlist[targetProductId]);
    const nextState = !isCurrentlyInWishlist;

    // Optimistic UI update
    setWishlist((prev) => ({
      ...prev,
      [targetProductId]: nextState,
    }));

    if (nextState) {
      toast.success("Item added to wishlist");
    } else {
      toast.success("Item removed from wishlist");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/wishlist/${targetProductId}`, {
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
          [targetProductId]: data.action === "added",
        }));
      }
    } catch (error: any) {
      setWishlist((prev) => ({
        ...prev,
        [targetProductId]: isCurrentlyInWishlist,
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

  const handleProductClick = (targetId: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/product/${targetId}`);
  };

  if (loading) {
    return (
      <section className="similar-products-section">
        <div className="similar-products-container">
          <div className="similar-products-header">
            <div className="similar-heading-wrap">
              <h2 className="similar-products-title">More Products For You</h2>
            </div>
          </div>
          <div className="similar-products-grid">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="similar-skeleton-card">
                <div className="sim-skeleton-img" />
                <div className="sim-skeleton-tag" />
                <div className="sim-skeleton-line sim-skeleton-title" />
                <div className="sim-skeleton-line sim-skeleton-sub" />
                <div className="sim-skeleton-price" />
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
    <section className="similar-products-section">
      <div className="similar-products-container">
        {/* HEADER */}
        <div className="similar-products-header">
          <div className="similar-heading-wrap">
            <h2 className="similar-products-title">More Products For You</h2>
            {/* <p className="similar-products-subtitle">
              Handpicked products closely matching this category, style, and price range.
            </p> */}
          </div>

          <div className="similar-header-actions">
            <Link to="/products" className="similar-view-all-btn">
              Explore More <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="similar-products-grid">
          {products.map((prod, index) => {
            const currentPrice =
              prod.salePrice && prod.salePrice < prod.price ? prod.salePrice : prod.price;
            const hasDiscount = prod.salePrice && prod.salePrice < prod.price;
            const discountPercent = hasDiscount
              ? Math.round(((prod.price - prod.salePrice!) / prod.price) * 100)
              : 0;

            const categoryName =
              typeof prod.category === "object" ? prod.category?.name : prod.category;
            const brand = prod.brand || categoryName || "Similar Match";
            const imgUrl = formatImageUrl(prod.images?.[0], productFallback);
            const isLiked = !!wishlist[prod._id];

            return (
              <div
                key={prod._id || index}
                className="similar-product-card"
                onClick={() => handleProductClick(prod._id)}
              >
                {/* IMAGE BOX */}
                <div className="similar-img-box">
                  <img
                    src={imgUrl}
                    alt={prod.name}
                    className="similar-img"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = productFallback;
                    }}
                  />

                  {/* WISHLIST BUTTON */}
                  <button
                    type="button"
                    className={`similar-wishlist-btn ${isLiked ? "active" : ""}`}
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
                <div className="similar-card-info">
                  <div className="similar-meta-row">
                    <span className="similar-category">{brand}</span>
                    {hasDiscount && (
                      <span className="similar-discount-chip">-{discountPercent}%</span>
                    )}
                  </div>

                  <h3 className="similar-product-name" title={prod.name}>
                    {prod.name}
                  </h3>

                  <div className="similar-price-row">
                    <div className="similar-prices">
                      <span className="similar-current-price">
                        ₹{(currentPrice || 0).toLocaleString("en-IN")}
                      </span>
                      {hasDiscount && (
                        <span className="similar-old-price">
                          ₹{(prod.price || 0).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="similar-cart-btn"
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

export default SimilarProducts;
