import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { triggerFlyToCart } from "../../components/common/FlyToCart/FlyToCart";
import { useCart } from "../../context/cartContext";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import "./ProductSection.css";

import product1 from "../../assets/1.jpeg";

interface DisplayProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviewsCount?: number;
  category: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formatImageUrl = (image: any, fallback: string = product1): string => {
  if (!image) return fallback;
  const rawUrl = typeof image === "string" ? image : (image?.url || image?.secure_url || image?.path || "");
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

const ProductSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [allProducts, setAllProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [addedCartIds, setAddedCartIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/featured`);
        if (!res.ok) {
          setAllProducts([]);
          return;
        }
        const result = await res.json();

        const rawList =
          result.data?.products ||
          result.data ||
          result.products ||
          (Array.isArray(result) ? result : []);

        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped: DisplayProduct[] = rawList.map((item: any) => {
            const itemPrice = typeof item.price === "number" && item.price > 0 ? item.price : 999;
            const itemSale = typeof item.salePrice === "number" && item.salePrice > 0 ? item.salePrice : itemPrice;
            const hasSale = itemSale < itemPrice;
            return {
              id: item._id || item.id,
              name: item.name || "Product",
              image: formatImageUrl(item.images?.[0], product1),
              price: hasSale ? itemSale : itemPrice,
              oldPrice: hasSale ? itemPrice : itemPrice,
              rating: item.rating || 4.5,
              reviewsCount: item.numReviews || 36,
              category:
                typeof item.category === "object"
                  ? item.category?.name || "Electronics"
                  : item.category || "Electronics",
            };
          });
          setAllProducts(mapped);
        } else {
          setAllProducts([]);
        }
      } catch (err) {
        console.error("Featured products fetch error:", err);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Fetch Wishlist from Backend
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
          const wishlistState: Record<string, boolean> = {};
          data.products.forEach((product: any) => {
            const id = product._id || product.id;
            if (id) wishlistState[id] = true;
          });
          setWishlist(wishlistState);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
      }
    };

    fetchWishlist();
  }, [isAuthenticated]);

  const displayList = allProducts;

  const toggleWishlist = async (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to add to wishlist");
      return;
    }

    const isCurrentlyInWishlist = Boolean(wishlist[id]);
    const nextState = !isCurrentlyInWishlist;

    // Optimistic UI update (instant heart fill and message)
    setWishlist((prev) => ({
      ...prev,
      [id]: nextState,
    }));

    if (nextState) {
      toast.success("Item added to wishlist");
    } else {
      toast.success("Item removed from wishlist");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/wishlist/${id}`, {
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
          [id]: data.action === "added",
        }));
      }
    } catch (error: any) {
      // Revert optimistic update on failure
      setWishlist((prev) => ({
        ...prev,
        [id]: isCurrentlyInWishlist,
      }));
      console.error("Wishlist error:", error);
      toast.error(error?.message || "Failed to update wishlist");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, product: DisplayProduct) => {
    e.stopPropagation();

    if (addedCartIds[product.id]) {
      navigate("/cart");
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to add product to cart");
      return;
    }

    try {
      const res = await addToCart(product.id, 1);
      if (res.requiresVariant) {
        navigate(`/product/${product.id}`);
        return;
      }
      if (res.success) {
        triggerFlyToCart({
          productName: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.image,
        });

        setAddedCartIds((prev) => ({ ...prev, [product.id]: true }));
        setTimeout(() => {
          setAddedCartIds((prev) => ({ ...prev, [product.id]: false }));
        }, 4500); // Redirect to cart button active for 4.5 seconds
      }
    } catch (error: any) {
      toast.error("Failed to add product to cart");
    }
  };

  const goToProduct = (id: string) => {
    navigate(`/product/${id}`);
  };

  return (
    <section className="product-section">
      <div className="product-section-wrapper">
        {/* HEADER */}
        <div className="product-section-header">
          <div className="product-heading-content">
            <h2 className="product-section-title">Featured Products</h2>
          </div>

          <div className="product-header-actions">
            <button
              className="product-section-viewall"
              onClick={() => navigate("/products")}
            >
              View All
            </button>
          </div>
        </div>

        {/* STATIC FIXED GRID */}
        {loading ? (
          /* SKELETON SHIMMER LOADING CARDS */
          <div className="product-grid">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="product-skeleton-card">
                <div className="skeleton-image" />
                <div className="skeleton-pill" />
                <div className="skeleton-title" />
                <div className="skeleton-title-short" />
                <div className="skeleton-price" />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <p>No featured products found.</p>
          </div>
        ) : (
          <div className="product-grid">
            {displayList.map((product) => {
              const discount =
                product.oldPrice > product.price
                  ? Math.round(
                      ((product.oldPrice - product.price) / product.oldPrice) * 100
                    )
                  : 0;

              const isWishlisted = !!wishlist[product.id];

              return (
                <article
                  key={product.id}
                  className="product-card"
                  onClick={() => goToProduct(product.id)}
                >
                  {/* IMAGE CONTAINER */}
                  <div className="product-image-wrap">
                    <span className="product-card-ad-badge">Ad</span>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image-slider"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = product1;
                      }}
                    />

                    {/* WISHLIST BUTTON */}
                    <button
                      className={`product-wishlist-btn ${isWishlisted ? "active" : ""}`}
                      onClick={(e) => toggleWishlist(e, product.id)}
                      aria-label="Wishlist product"
                    >
                      <Heart
                        size={15}
                        fill={isWishlisted ? "#dc2626" : "none"}
                        color={isWishlisted ? "#dc2626" : "#64748b"}
                      />
                    </button>
                  </div>

                  {/* PRODUCT DETAILS */}
                  <div className="product-info">
                    <div className="product-meta-row">
                      <span className="product-category">{product.category}</span>
                      {discount > 0 && (
                        <span className="product-discount-badge">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    <h3 className="product-name">{product.name}</h3>

                    <div className="product-bottom-row">
                      <div className="product-price-row">
                        <span className="product-price">
                          ₹{(product.price || 0).toLocaleString("en-IN")}
                        </span>
                        {typeof product.oldPrice === "number" && product.oldPrice > product.price && (
                          <span className="product-old-price">
                            ₹{product.oldPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`product-slider-cart-btn ${addedCartIds[product.id] ? "go-to-cart-btn" : ""}`}
                        onClick={(e) => handleAddToCart(e, product)}
                        title={addedCartIds[product.id] ? "Go to Cart" : "Add to Cart"}
                        aria-label={addedCartIds[product.id] ? "Go to Cart" : "Add to Cart"}
                      >
                        {addedCartIds[product.id] ? (
                          <ShoppingCart size={15} strokeWidth={2.4} className="moving-cart-icon" />
                        ) : (
                          <ShoppingCart size={14} strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;