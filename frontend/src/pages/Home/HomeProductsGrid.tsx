import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Heart, ShoppingCart } from "lucide-react";
import { useCart } from "../../context/cartContext";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import product1 from "../../assets/1.jpeg";
import "./HomeProductsGrid.css";

interface Product {
  _id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  images?: Array<string | { url?: string; public_id?: string }>;
  category?: { name?: string } | string;
  brand?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formatImageUrl = (path?: any, fallback: string = product1) => {
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

const HomeProductsGrid = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const result = await res.json();
        const list = result.data?.products || result.data || result.products || (Array.isArray(result) ? result : []);

        if (res.ok && Array.isArray(list) && list.length > 0) {
          setProducts(list.slice(0, 12));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Home products fetch error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
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
        console.error("Failed to fetch wishlist in HomeProductsGrid:", error);
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

    // Optimistic UI update (instant heart fill and message)
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
      // Revert optimistic update on failure
      setWishlist((prev) => ({
        ...prev,
        [productId]: isCurrentlyInWishlist,
      }));
      console.error("Wishlist error:", error);
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

    // const toastId = toast.loading(`Adding "${prod.name}" to cart...`);
    try {
      toast.success(`"${prod.name}" added to cart!`);
      const success = await addToCart(prod._id, 1);
      if (success) {
      } else {
        toast.error("Failed to add product to cart");
      }
    } catch (error: any) {
      toast.error("Failed to add product to cart");
    }
  };

  if (loading) {
    return (
      <section className="home-products-section">
        <div className="home-products-container">
          <div className="home-products-header">
            <div>
              <h2 className="home-products-title">Our Premium Catalog</h2>
            </div>
            <Link to="/products" className="home-explore-btn-top">
              Explore All Products <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-products-grid">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="home-product-skeleton-card">
                <div className="skeleton-image" />
                <div className="skeleton-pill" />
                <div className="skeleton-title" />
                <div className="skeleton-title-short" />
                <div className="skeleton-price" />
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
    <section className="home-products-section">
      <div className="home-products-container">
        {/* HEADER */}
        <div className="home-products-header">
          <div>
            <h2 className="home-products-title">Our Premium Catalog</h2>
          </div>

          <Link to="/products" className="home-explore-btn-top">
            Explore All Products <ArrowRight size={16} />
          </Link>
        </div>

        {/* PRODUCTS GRID */}
        <div className="home-products-grid">
          {products.map((prod) => {
            const currentPrice = prod.salePrice && prod.salePrice < prod.price ? prod.salePrice : prod.price;
            const hasDiscount = prod.salePrice && prod.salePrice < prod.price;
            const discountPercent = hasDiscount
              ? Math.round(((prod.price - prod.salePrice!) / prod.price) * 100)
              : 0;

            const categoryName = typeof prod.category === "object" ? prod.category?.name : prod.category;
            const brand = prod.brand || categoryName || "Featured";
            const imgUrl = formatImageUrl(prod.images?.[0], product1);
            const isLiked = !!wishlist[prod._id];

            return (
              <div
                key={prod._id}
                className="home-product-card"
                onClick={() => navigate(`/product/${prod._id}`)}
              >
                <div className="home-product-img-wrap">
                  <img
                    src={imgUrl}
                    alt={prod.name}
                    className="home-product-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = product1;
                    }}
                  />
                  <button
                    type="button"
                    className={`home-product-wishlist-btn ${isLiked ? "active" : ""}`}
                    onClick={(e) => toggleWishlist(e, prod._id)}
                    aria-label="Add to Wishlist"
                  >
                    <Heart size={15} fill={isLiked ? "#dc2626" : "none"} color={isLiked ? "#dc2626" : "#64748b"} />
                  </button>
                </div>

                <div className="home-product-info">
                  <div className="home-product-meta">
                    <span className="home-product-cat">{brand}</span>
                    {hasDiscount && (
                      <span className="home-product-discount-tag">-{discountPercent}%</span>
                    )}
                  </div>

                  <h3 className="home-product-name">{prod.name}</h3>

                  <div className="home-product-price-row">
                    <div className="home-product-price-block">
                      <span className="home-product-price">₹{(currentPrice || 0).toLocaleString("en-IN")}</span>
                      {hasDiscount && (
                        <span className="home-product-old-price">₹{(prod.price || 0).toLocaleString("en-IN")}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="home-product-add-btn"
                      onClick={(e) => handleAddToCart(e, prod)}
                      title="Add to Cart"
                      aria-label="Add to Cart"
                    >
                      <ShoppingCart size={15} strokeWidth={2} />
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

export default HomeProductsGrid;
