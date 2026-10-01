import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ShoppingCart, ArrowRight } from "lucide-react";
import { triggerFlyToCart } from "../../components/common/FlyToCart/FlyToCart";
import { useCart } from "../../context/cartContext";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import productFallback from "../../assets/1.jpeg";
import VariantSelectionModal, {
  isProductWithVariants,
} from "../../components/common/VariantSelectionModal/VariantSelectionModal";
import "./PopularProductsSection.css";

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
  stock?: number;
  isFeatured?: boolean;
  totalSold?: number;
  orderCount?: number;
  hasVariants?: boolean;
  variants?: any[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formatImageUrl = (path?: any, fallback: string = productFallback) => {
  if (!path) return fallback;
  const rawUrl = typeof path === "string" ? path : path.url || path.secure_url || path.path || "";
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

export const PopularProductsSection = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [addedCartIds, setAddedCartIds] = useState<Record<string, boolean>>({});
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  // Helper to extract product array from various envelope structures
  const parseProductsResponse = (result: any): Product[] => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.products)) return result.products;
    if (Array.isArray(result.data?.products)) return result.data.products;
    if (Array.isArray(result.data)) return result.data;
    return [];
  };

  // Fetch popular products - Public API (No auth required)
  useEffect(() => {
    let isMounted = true;

    const fetchPopular = async () => {
      try {
        setLoading(true);
        let items: Product[] = [];

        // 1. Try primary endpoint: /api/products/popular
        try {
          const res1 = await fetch(`${API_BASE_URL}/api/products/popular?limit=10&days=30`);
          if (res1.ok) {
            const data1 = await res1.json();
            const parsed1 = parseProductsResponse(data1);
            if (parsed1.length > 0) {
              items = parsed1;
            }
          }
        } catch (err) {
          console.warn("Primary /api/products/popular fetch failed, trying alias:", err);
        }

        // 2. Fallback to /api/popular
        if (items.length === 0) {
          try {
            const res2 = await fetch(`${API_BASE_URL}/api/popular?limit=10&days=30`);
            if (res2.ok) {
              const data2 = await res2.json();
              const parsed2 = parseProductsResponse(data2);
              if (parsed2.length > 0) {
                items = parsed2;
              }
            }
          } catch (err) {
            console.warn("Secondary /api/popular fetch failed:", err);
          }
        }

        if (isMounted) {
          setProducts(items.slice(0, 10));
        }
      } catch (error) {
        console.error("Error loading popular products:", error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPopular();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Wishlist status if user happens to be logged in
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) {
        setWishlist({});
        return;
      }
      try {
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
        console.error("Failed to fetch wishlist in PopularProductsSection:", error);
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

    if (addedCartIds[prod._id]) {
      navigate("/cart");
      return;
    }

    const rawImg = prod.images && prod.images.length > 0 ? prod.images[0] : undefined;
    const imgUrl = formatImageUrl(rawImg, productFallback);

    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to add product to cart");
      return;
    }

    if (isProductWithVariants(prod)) {
      setVariantModalProduct(prod);
      setIsVariantModalOpen(true);
      return;
    }

    try {
      const res = await addToCart(prod._id, 1);
      if (res.requiresVariant) {
        setVariantModalProduct(prod);
        setIsVariantModalOpen(true);
        return;
      }
      if (res.success) {
        const currentPrice = prod.salePrice && prod.salePrice > 0 ? prod.salePrice : prod.price;
        triggerFlyToCart({
          productName: prod.name,
          price: currentPrice,
          quantity: 1,
          imageUrl: imgUrl,
        });

        setAddedCartIds((prev) => ({ ...prev, [prod._id]: true }));
        setTimeout(() => {
          setAddedCartIds((prev) => ({ ...prev, [prod._id]: false }));
        }, 4500);
      }
    } catch (error: any) {
      toast.error("Failed to add product to cart");
    }
  };

  if (loading) {
    return (
      <section className="popular-section">
        <div className="popular-container">
          <div className="popular-header">
            <div className="popular-heading-wrap">
              <span className="popular-badge-pill">
                <span className="flame-icon">🔥</span> Trending Now
              </span>
              <h2 className="popular-title">Popular Products</h2>
            </div>
          </div>
          <div className="popular-grid">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="popular-skeleton-card">
                <div className="pop-skeleton-img" />
                <div className="pop-skeleton-line pop-skeleton-title" />
                <div className="pop-skeleton-line pop-skeleton-sub" />
                <div className="pop-skeleton-price" />
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
    <section className="popular-section">
      <div className="popular-container">
        {/* SECTION HEADER */}
        <div className="popular-header">
          <div className="popular-heading-wrap">
            <span className="popular-badge-pill">
              <span className="flame-icon">🔥</span> Most Ordered
            </span>
            <h2 className="popular-title">Popular Products</h2>
            <p className="popular-subtitle">
              Our most ordered items and customer favorites over the last 30 days.
            </p>
          </div>

          <div className="popular-header-actions">
            <Link to="/products" className="popular-view-all-btn">
              Explore All <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="popular-grid">
          {products.map((prod, index) => {
            const currentPrice =
              prod.salePrice && prod.salePrice < prod.price ? prod.salePrice : prod.price;
            const hasDiscount = prod.salePrice && prod.salePrice < prod.price;
            const discountPercent = hasDiscount
              ? Math.round(((prod.price - prod.salePrice!) / prod.price) * 100)
              : 0;

            const categoryName =
              typeof prod.category === "object" ? prod.category?.name : prod.category;
            const brand = prod.brand || categoryName || "Top Choice";
            const imgUrl = formatImageUrl(prod.images?.[0], productFallback);
            const isLiked = !!wishlist[prod._id];

            return (
              <div
                key={prod._id || index}
                className="popular-card"
                onClick={() => navigate(`/product/${prod._id}`)}
              >
                {/* IMAGE BOX */}
                <div className="popular-img-box">
                  <img
                    src={imgUrl}
                    alt={prod.name}
                    className="popular-img"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = productFallback;
                    }}
                  />

                  {/* FLOATING BADGES */}
                  <div className="popular-badges-stack">
                    {prod.totalSold && prod.totalSold > 0 ? (
                      <span className="popular-sold-badge">
                        🔥 {prod.totalSold} sold
                      </span>
                    ) : (
                      <span className="popular-sold-badge">🔥 Best Seller</span>
                    )}

                    {hasDiscount && (
                      <span className="popular-discount-badge">-{discountPercent}%</span>
                    )}
                  </div>

                  {/* WISHLIST BUTTON */}
                  <button
                    type="button"
                    className={`popular-wishlist-btn ${isLiked ? "active" : ""}`}
                    onClick={(e) => toggleWishlist(e, prod._id)}
                    aria-label="Add to Wishlist"
                  >
                    <Heart
                      size={15}
                      fill={isLiked ? "#dc2626" : "none"}
                      color={isLiked ? "#dc2626" : "#475569"}
                    />
                  </button>
                </div>

                {/* CARD INFO */}
                <div className="popular-card-info">
                  <div className="popular-meta-row">
                    <span className="popular-brand">{brand}</span>
                  </div>

                  <h3 className="popular-product-title" title={prod.name}>
                    {prod.name}
                  </h3>

                  <div className="popular-price-row">
                    <div className="popular-prices">
                      <span className="popular-current-price">
                        ₹{(currentPrice || 0).toLocaleString("en-IN")}
                      </span>
                      {hasDiscount && (
                        <span className="popular-old-price">
                          ₹{(prod.price || 0).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`popular-cart-btn ${addedCartIds[prod._id] ? "go-to-cart-btn" : ""}`}
                      onClick={(e) => handleAddToCart(e, prod)}
                      title={addedCartIds[prod._id] ? "Go to Cart" : "Add to Cart"}
                      aria-label={addedCartIds[prod._id] ? "Go to Cart" : "Add to Cart"}
                    >
                      {addedCartIds[prod._id] ? (
                        <ShoppingCart size={15} strokeWidth={2.4} />
                      ) : (
                        <ShoppingCart size={15} strokeWidth={2.2} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {variantModalProduct && (
        <VariantSelectionModal
          isOpen={isVariantModalOpen}
          onClose={() => {
            setIsVariantModalOpen(false);
            setVariantModalProduct(null);
          }}
          product={variantModalProduct}
          onSuccess={() => {
            if (variantModalProduct?._id) {
              const pId = variantModalProduct._id;
              setAddedCartIds((prev) => ({ ...prev, [pId]: true }));
              setTimeout(() => {
                setAddedCartIds((prev) => ({ ...prev, [pId]: false }));
              }, 4500);
            }
          }}
        />
      )}
    </section>
  );
};

export default PopularProductsSection;
