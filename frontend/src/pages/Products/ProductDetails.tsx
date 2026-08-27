import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Check,
  Heart,
} from "lucide-react";
import { useCart } from "../../context/cartContext";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import Footer from "../Home/footersection";
import "./ProductDetails.css";

import product1 from "../../assets/1.jpeg";

type ProductImageItem = string | { public_id?: string; url?: string; _id?: string };

interface CategoryRef {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  short_description?: string;
  full_description?: string;
  fullDescription?: string;
  description?: string;
  highlights?: string[] | string;
  price: number;
  salePrice: number | null;
  sku: string;
  stock: number;
  category: CategoryRef | string | null;
  subcategory?: CategoryRef | string | null;
  brand: string;
  images: ProductImageItem[];
  isFeatured: boolean;
  manufacturer?:
    | string
    | {
        name?: string;
        address?: string;
        country?: string;
        contact?: string;
        email?: string;
        website?: string;
      };
  warranty?:
    | string
    | {
        available?: boolean;
        duration?: number | null | string;
        unit?: string;
        type?: string;
        description?: string;
        terms?: string;
      };
  returnPolicy?:
    | string
    | {
        eligible?: boolean;
        returnWindow?: number | null | string;
        returnWindowUnit?: string;
        replacementAvailable?: boolean;
        refundAvailable?: boolean;
        conditions?: string;
        description?: string;
      };
  attributes?:
    | string
    | {
        color?: string;
        size?: string;
        material?: string;
        screenSize?: string;
        weight?: { value?: number | null | string; unit?: string };
        weightValue?: string | number;
        weightUnit?: string;
        dimensions?: {
          length?: number | null | string;
          width?: number | null | string;
          height?: number | null | string;
          unit?: string;
        };
        length?: string | number;
        width?: string | number;
        height?: string | number;
        dimUnit?: string;
      };
}

const safeParse = (val: any) => {
  if (!val) return undefined;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === "object" ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const ProductDetails = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"specifications" | "description" | "warranty">("specifications");
  const [addedNotice, setAddedNotice] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        if (!isAuthenticated) {
          setIsWishlisted(false);
          return;
        }

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();
        if (response.ok && data.success && Array.isArray(data.products)) {
          const exists = data.products.some(
            (p: any) => (p._id || p.id) === productId
          );
          setIsWishlisted(exists);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
      }
    };

    fetchWishlist();
  }, [productId, isAuthenticated]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

        let res = await fetch(`${API_BASE_URL}/api/admin/product/${productId}`, {
          credentials: "include",
        });
        let result = await res.json();
        let fetchedProduct = result.data?.product || result.product || result.data;

        if (!res.ok || !fetchedProduct || typeof fetchedProduct !== "object" || !fetchedProduct._id) {
          res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
            credentials: "include",
          });
          result = await res.json();
          fetchedProduct = result.data?.product || result.product || result.data;
        }

        if (!res.ok || !fetchedProduct || typeof fetchedProduct !== "object" || !fetchedProduct._id) {
          res = await fetch(`${API_BASE_URL}/api/products`, {
            credentials: "include",
          });
          result = await res.json();
          const list = result.data?.products || result.data || result.products || (Array.isArray(result) ? result : []);
          if (Array.isArray(list) && list.length > 0) {
            fetchedProduct = list.find((p: Product) => p._id === productId);
          }
        }

        if (fetchedProduct && typeof fetchedProduct === "object" && fetchedProduct._id) {
          setProduct(fetchedProduct);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product?._id) return;
    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to add product to cart");
      return;
    }

    try {
      toast.success(`${quantity} x "${product.name}" added to cart!`);
      const success = await addToCart(product._id, quantity);
      if (success) {
        setAddedNotice(true);
      } else {
        toast.error("Failed to add product to cart");
      }
    } catch (error: any) {
      toast.error("Failed to add product to cart");
    }
  };

  const handleBuyNow = async () => {
    if (!product?._id) return;
    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to proceed to checkout");
      return;
    }

    const toastId = toast.loading("Processing checkout...");
    try {
      const success = await addToCart(product._id, quantity);
      if (success) {
        toast.dismiss(toastId);
        navigate("/checkout");
      } else {
        toast.error("Failed to proceed to checkout");
      }
    } catch (error: any) {
      toast.error("Failed to proceed to checkout");
    }
  };

  const toggleWishlist = async () => {
    if (!product?._id) return;

    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to add to wishlist");
      return;
    }

    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    if (nextState) {
      toast.success("Item added to your wishlist");
    } else {
      toast.success("Item removed from wishlist");
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    try {
      const response = await fetch(`${API_BASE_URL}/api/wishlist/${product._id}`, {
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
        setIsWishlisted(data.action === "added");
      }
    } catch (error: any) {
      setIsWishlisted(!nextState);
      console.error("Wishlist toggle error:", error);
      toast.error(error?.message || "Failed to update wishlist");
    }
  };

  const formatImageUrl = (path?: ProductImageItem, fallback: string = "") => {
    if (!path) return fallback;
    let rawUrl = "";
    if (typeof path === "string") {
      rawUrl = path;
    } else if (typeof path === "object" && path !== null) {
      rawUrl = path.url || (path as any).secure_url || (path as any).path || "";
    }
    if (!rawUrl) return fallback;
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("data:")) {
      return rawUrl;
    }
    const cleanPath = rawUrl.replace(/\\/g, "/");
    const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    return `${API_BASE_URL}${formattedPath}`;
  };

  if (loading) {
    return (
      <div className="pdp-page">
        <div className="pdp-container">
          <div className="pdp-loading">
            <div className="pdp-spinner" />
            <p>Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-page">
        <div className="pdp-container">
          <button className="pdp-back-btn" onClick={() => navigate("/products")}>
            <ArrowLeft size={16} /> Back to Products
          </button>
          <div className="pdp-not-found">
            <h2>Product Not Found</h2>
            <p>The product you are looking for does not exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = product.salePrice ? product.salePrice : product.price;
  const hasDiscount = Boolean(product.salePrice && product.salePrice < product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100)
    : 0;
  const savingsAmount = hasDiscount ? product.price - (product.salePrice || 0) : 0;

  const rawImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => formatImageUrl(img, "")).filter(Boolean)
      : [];

  const imagesList = rawImages.length > 0 ? rawImages : [product1];
  const mainImage = imagesList[selectedImgIndex] || imagesList[0];

  const categoryName: string =
    typeof product.category === "object" && product.category !== null
      ? product.category.name
      : typeof product.category === "string"
        ? product.category
        : "";

  const subcategoryName: string =
    typeof product.subcategory === "object" && product.subcategory !== null
      ? product.subcategory.name
      : typeof product.subcategory === "string"
        ? product.subcategory
        : "";

  // Dynamic Highlights List from Backend
  let highlightsList: string[] = [];
  if (Array.isArray(product.highlights) && product.highlights.length > 0) {
    highlightsList = product.highlights.filter((h) => typeof h === "string" && h.trim().length > 0);
  } else if (typeof product.highlights === "string") {
    try {
      const parsed = JSON.parse(product.highlights);
      if (Array.isArray(parsed)) {
        highlightsList = parsed.filter((h) => typeof h === "string" && h.trim().length > 0);
      } else if (parsed && typeof parsed === "string") {
        highlightsList = [parsed];
      }
    } catch {
      if (product.highlights.trim()) {
        highlightsList = [product.highlights.trim()];
      }
    }
  }

  // Parse backend dynamic objects
  const parsedWarranty = safeParse(product.warranty);
  const parsedReturnPolicy = safeParse(product.returnPolicy);
  const parsedManufacturer = safeParse(product.manufacturer);
  const parsedAttributes = safeParse(product.attributes);

  // Warranty availability from backend
  const hasWarranty = Boolean(
    parsedWarranty &&
    parsedWarranty.available === true
  );

  const warrantyDuration =
    parsedWarranty?.duration !== undefined && parsedWarranty?.duration !== null && String(parsedWarranty.duration).trim() !== ""
      ? `${parsedWarranty.duration} ${parsedWarranty.unit || "Months"}`
      : "";

  const warrantyType = parsedWarranty?.type && parsedWarranty.type !== "No Warranty" ? parsedWarranty.type : "Warranty";
  const warrantyTitle = warrantyDuration ? `${warrantyDuration} ${warrantyType}` : warrantyType;
  const warrantyDesc =
    parsedWarranty?.description || parsedWarranty?.terms || "Standard warranty against manufacturing defects";

  // Return Policy availability from backend
  const hasReturnPolicy = Boolean(
    parsedReturnPolicy &&
    parsedReturnPolicy.eligible === true
  );

  const returnWindow =
    parsedReturnPolicy?.returnWindow !== undefined && parsedReturnPolicy?.returnWindow !== null && String(parsedReturnPolicy.returnWindow).trim() !== ""
      ? `${parsedReturnPolicy.returnWindow} ${parsedReturnPolicy.returnWindowUnit || "Days"}`
      : "";

  const returnTitle = returnWindow
    ? `${returnWindow} ${
        parsedReturnPolicy?.replacementAvailable && parsedReturnPolicy?.refundAvailable
          ? "Return & Replacement"
          : parsedReturnPolicy?.replacementAvailable
          ? "Replacement"
          : parsedReturnPolicy?.refundAvailable
          ? "Return & Refund"
          : "Return Window"
      }`
    : parsedReturnPolicy?.replacementAvailable && parsedReturnPolicy?.refundAvailable
    ? "Return & Replacement Available"
    : parsedReturnPolicy?.replacementAvailable
    ? "Replacement Available"
    : parsedReturnPolicy?.refundAvailable
    ? "Refund Available"
    : "Return Policy Available";

  const returnDesc =
    parsedReturnPolicy?.description ||
    parsedReturnPolicy?.conditions ||
    (parsedReturnPolicy?.replacementAvailable && parsedReturnPolicy?.refundAvailable
      ? "Eligible for refund or replacement under policy"
      : parsedReturnPolicy?.refundAvailable
      ? "Eligible for refund under policy conditions"
      : parsedReturnPolicy?.replacementAvailable
      ? "Eligible for replacement under policy conditions"
      : "Eligible for return as per store policy");

  // Specs extraction helpers from parsed backend attributes
  const colorVal = parsedAttributes?.color?.trim();
  const sizeVal = (parsedAttributes?.size || parsedAttributes?.screenSize)?.trim();
  const materialVal = parsedAttributes?.material?.trim();

  const weightVal =
    parsedAttributes?.weight?.value !== undefined && parsedAttributes?.weight?.value !== null && String(parsedAttributes.weight.value).trim() !== ""
      ? `${parsedAttributes.weight.value} ${parsedAttributes.weight.unit || "g"}`
      : parsedAttributes?.weightValue !== undefined && parsedAttributes?.weightValue !== null && String(parsedAttributes.weightValue).trim() !== ""
      ? `${parsedAttributes.weightValue} ${parsedAttributes.weightUnit || "g"}`
      : undefined;

  const dimVal =
    parsedAttributes?.dimensions?.length ||
    parsedAttributes?.dimensions?.width ||
    parsedAttributes?.dimensions?.height
      ? `${[
          parsedAttributes.dimensions.length,
          parsedAttributes.dimensions.width,
          parsedAttributes.dimensions.height,
        ]
          .filter(Boolean)
          .join(" x ")} ${parsedAttributes.dimensions.unit || "cm"}`
      : parsedAttributes?.length || parsedAttributes?.width || parsedAttributes?.height
      ? `${[parsedAttributes.length, parsedAttributes.width, parsedAttributes.height]
          .filter(Boolean)
          .join(" x ")} ${parsedAttributes.dimUnit || "cm"}`
      : undefined;

  return (
    <div className="pdp-page">
      <div className="pdp-container">
        {/* BREADCRUMB NAVIGATION */}
        <div className="pdp-header-zone">
          <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/" className="pdp-bc-link">
              Home
            </Link>
            <ChevronRight size={13} className="pdp-bc-separator" />
            <Link to="/products" className="pdp-bc-link">
              {categoryName || "Products"}
            </Link>
            {Boolean(subcategoryName) && (
              <>
                <ChevronRight size={13} className="pdp-bc-separator" />
                <span className="pdp-bc-link">{subcategoryName}</span>
              </>
            )}
            <ChevronRight size={13} className="pdp-bc-separator" />
            <span className="pdp-bc-current">{product.name}</span>
          </nav>
        </div>

        {/* MAIN PRODUCT BOX */}
        <div className="pdp-main-card">
          {/* LEFT: GALLERY ZONE */}
          <div className="pdp-gallery-zone">
            <div className="pdp-main-image-wrap">
              {hasDiscount && (
                <div className="pdp-discount-badge">{discountPercent}% OFF</div>
              )}
              <button
                type="button"
                className={`pdp-wishlist-btn ${isWishlisted ? "active" : ""}`}
                onClick={toggleWishlist}
                aria-label="Toggle Wishlist"
              >
                <Heart
                  size={18}
                  fill={isWishlisted ? "#dc2626" : "none"}
                  color={isWishlisted ? "#dc2626" : "#64748b"}
                />
              </button>
              <img
                src={mainImage}
                alt={product.name}
                className="pdp-main-image"
              />
            </div>

            {/* THUMBNAILS ROW - DYNAMIC TO NUMBER OF IMAGES */}
            {imagesList.length > 1 && (
              <div className="pdp-thumbs-row">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`pdp-thumb-btn ${idx === selectedImgIndex ? "active" : ""}`}
                    onClick={() => setSelectedImgIndex(idx)}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} />
                    <span className="pdp-thumb-label">Thumb {idx + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: INFO & CONVERSION ZONE */}
          <div className="pdp-info-zone">
            {/* BRAND */}
            {Boolean(product.brand) && (
              <div className="pdp-brand-tag">{product.brand}</div>
            )}

            {/* PRODUCT TITLE */}
            <h2 className="pdp-product-title">{product.name}</h2>

            {/* SKU & STOCK STATUS */}
            <div className="pdp-meta-row">
              {Boolean(product.sku) && (
                <>
                  <span className="pdp-sku-text">SKU: {product.sku}</span>
                  <span className="pdp-meta-dot">•</span>
                </>
              )}
              <span className="pdp-stock-text">
                {product.stock > 0 ? (
                  <>
                    In Stock{" "}
                    <span className="pdp-stock-urgency">
                      ({product.stock} units available)
                    </span>
                  </>
                ) : (
                  <span className="pdp-out-of-stock">Out of Stock</span>
                )}
              </span>
            </div>

            {/* PRICE BANNER */}
            <div className="pdp-price-box">
              <span className="pdp-current-price">
                ₹{currentPrice.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <>
                  <span className="pdp-old-price">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                  <span className="pdp-save-text">
                    Save ₹{savingsAmount.toLocaleString("en-IN")} ({discountPercent}% OFF)
                  </span>
                </>
              )}
            </div>

            {/* KEY HIGHLIGHTS (DYNAMIC FROM BACKEND) */}
            {highlightsList.length > 0 && (
              <div className="pdp-highlights-wrap">
                <h3 className="pdp-highlights-title">Key Highlights:</h3>
                <ul className="pdp-highlights-list">
                  {highlightsList.map((item, idx) => (
                    <li key={idx}>
                      <span className="pdp-bullet">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TRUST / GUARANTEE BADGES - DYNAMIC FROM BACKEND */}
            {(hasWarranty || hasReturnPolicy) && (
              <div className="pdp-trust-cards-grid">
                {/* Warranty Card */}
                {hasWarranty && (
                  <div className="pdp-trust-card warranty">
                    <div className="pdp-trust-card-header">
                      <ShieldCheck size={16} className="pdp-trust-icon" />
                      <span className="pdp-trust-card-title">{warrantyTitle}</span>
                    </div>
                    <p className="pdp-trust-card-desc">{warrantyDesc}</p>
                  </div>
                )}

                {/* Return Policy Card */}
                {hasReturnPolicy && (
                  <div className="pdp-trust-card return-policy">
                    <div className="pdp-trust-card-header">
                      <RotateCcw size={16} className="pdp-trust-icon" />
                      <span className="pdp-trust-card-title">{returnTitle}</span>
                    </div>
                    <p className="pdp-trust-card-desc">{returnDesc}</p>
                  </div>
                )}
              </div>
            )}

            {/* PURCHASE CONTROLS */}
            <div className="pdp-actions-row">
              {/* Quantity Counter */}
              <div className="pdp-qty-counter">
                <button
                  type="button"
                  className="pdp-qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="pdp-qty-num">{quantity}</span>
                <button
                  type="button"
                  className="pdp-qty-btn"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                className="pdp-btn pdp-btn-cart"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                {addedNotice ? (
                  <>
                    <Check size={18} /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} /> Add to Cart
                  </>
                )}
              </button>

              {/* Buy Now */}
              <button
                type="button"
                className="pdp-btn pdp-btn-buy"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
              >
                <Zap size={18} fill="currentColor" /> Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: TABBED CARD CONTAINER */}
        <div className="pdp-tabs-card">
          {/* TAB BAR */}
          <div className="pdp-tabs-nav">
            <button
              type="button"
              className={`pdp-tab-item ${activeTab === "specifications" ? "active" : ""}`}
              onClick={() => setActiveTab("specifications")}
            >
              Specifications
            </button>
            <button
              type="button"
              className={`pdp-tab-item ${activeTab === "description" ? "active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Full Description
            </button>
            <button
              type="button"
              className={`pdp-tab-item ${activeTab === "warranty" ? "active" : ""}`}
              onClick={() => setActiveTab("warranty")}
            >
              Warranty & Returns
            </button>
          </div>

          {/* TAB CONTENT: SPECIFICATIONS */}
          {activeTab === "specifications" && (
            <div className="pdp-tab-body">
              <div className="pdp-specs-table-grid">
                {Boolean(product.brand) && (
                  <div className="pdp-spec-cell row-even">
                    <span className="pdp-spec-key">Brand</span>
                    <span className="pdp-spec-val">{product.brand}</span>
                  </div>
                )}
                {Boolean(categoryName) && (
                  <div className="pdp-spec-cell row-even">
                    <span className="pdp-spec-key">Category</span>
                    <span className="pdp-spec-val">
                      {categoryName} {subcategoryName ? `› ${subcategoryName}` : ""}
                    </span>
                  </div>
                )}
                {Boolean(product.sku) && (
                  <div className="pdp-spec-cell row-odd">
                    <span className="pdp-spec-key">Model SKU</span>
                    <span className="pdp-spec-val">{product.sku}</span>
                  </div>
                )}
                {Boolean(colorVal) && (
                  <div className="pdp-spec-cell row-odd">
                    <span className="pdp-spec-key">Color</span>
                    <span className="pdp-spec-val">{colorVal}</span>
                  </div>
                )}
                {Boolean(sizeVal) && (
                  <div className="pdp-spec-cell row-even">
                    <span className="pdp-spec-key">Size</span>
                    <span className="pdp-spec-val">{sizeVal}</span>
                  </div>
                )}
                {Boolean(materialVal) && (
                  <div className="pdp-spec-cell row-even">
                    <span className="pdp-spec-key">Material</span>
                    <span className="pdp-spec-val">{materialVal}</span>
                  </div>
                )}
                {Boolean(weightVal) && (
                  <div className="pdp-spec-cell row-odd">
                    <span className="pdp-spec-key">Weight</span>
                    <span className="pdp-spec-val">{weightVal}</span>
                  </div>
                )}
                {Boolean(dimVal) && (
                  <div className="pdp-spec-cell row-odd">
                    <span className="pdp-spec-key">Dimensions (L x W x H)</span>
                    <span className="pdp-spec-val">{dimVal}</span>
                  </div>
                )}
                {Boolean(parsedManufacturer?.name) && (
                  <div className="pdp-spec-cell row-even">
                    <span className="pdp-spec-key">Manufacturer</span>
                    <span className="pdp-spec-val">{parsedManufacturer.name}</span>
                  </div>
                )}
                {Boolean(parsedManufacturer?.country) && (
                  <div className="pdp-spec-cell row-even">
                    <span className="pdp-spec-key">Country of Origin</span>
                    <span className="pdp-spec-val">{parsedManufacturer.country}</span>
                  </div>
                )}
                {!product.brand && !categoryName && !colorVal && !sizeVal && !materialVal && !weightVal && !dimVal && (
                  <div className="pdp-spec-cell row-even" style={{ gridColumn: "1 / -1" }}>
                    <span className="pdp-spec-key">No specific attributes configured for this product.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: FULL DESCRIPTION */}
          {activeTab === "description" && (
            <div className="pdp-tab-body pdp-desc-tab">
              {product.full_description || product.fullDescription || product.description || product.short_description ? (
                <div
                  className="pdp-rich-description"
                  dangerouslySetInnerHTML={{
                    __html:
                      product.full_description ||
                      product.fullDescription ||
                      product.description ||
                      product.short_description ||
                      "",
                  }}
                />
              ) : (
                <p className="pdp-empty-desc">
                  No extended description available for this item.
                </p>
              )}
            </div>
          )}

          {/* TAB CONTENT: WARRANTY & RETURNS & MANUFACTURER */}
          {activeTab === "warranty" && (
            <div className="pdp-tab-body pdp-info-tab">
              <div className="pdp-info-tab-grid">
                {/* Warranty Block */}
                <div className="pdp-info-block">
                  <h4 className="pdp-info-block-title">
                    <ShieldCheck size={18} className="pdp-info-icon" />
                    Warranty Coverage
                  </h4>
                  {hasWarranty ? (
                    <>
                      <p className="pdp-info-line">
                        <strong>Status:</strong> Covered
                      </p>
                      {parsedWarranty?.type && (
                        <p className="pdp-info-line">
                          <strong>Type:</strong> {parsedWarranty.type}
                        </p>
                      )}
                      {warrantyDuration && (
                        <p className="pdp-info-line">
                          <strong>Duration:</strong> {warrantyDuration}
                        </p>
                      )}
                      {parsedWarranty?.description && (
                        <p className="pdp-info-line text-muted">{parsedWarranty.description}</p>
                      )}
                      {parsedWarranty?.terms && (
                        <p className="pdp-info-line text-muted">
                          <strong>Terms:</strong> {parsedWarranty.terms}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="pdp-info-line text-muted">
                      No warranty coverage provided for this product.
                    </p>
                  )}
                </div>

                {/* Return Policy Block */}
                <div className="pdp-info-block">
                  <h4 className="pdp-info-block-title">
                    <RotateCcw size={18} className="pdp-info-icon" />
                    Returns & Replacement
                  </h4>
                  {hasReturnPolicy ? (
                    <>
                      <p className="pdp-info-line">
                        <strong>Eligibility:</strong> Eligible for Return / Replacement
                      </p>
                      {returnWindow && (
                        <p className="pdp-info-line">
                          <strong>Return Window:</strong> {returnWindow}
                        </p>
                      )}
                      <p className="pdp-info-line">
                        <strong>Replacement:</strong>{" "}
                        {parsedReturnPolicy?.replacementAvailable ? "Available" : "Not Available"}
                      </p>
                      <p className="pdp-info-line">
                        <strong>Refund:</strong>{" "}
                        {parsedReturnPolicy?.refundAvailable ? "Available" : "Not Available"}
                      </p>
                      {parsedReturnPolicy?.conditions && (
                        <p className="pdp-info-line text-muted">
                          <strong>Conditions:</strong> {parsedReturnPolicy.conditions}
                        </p>
                      )}
                      {parsedReturnPolicy?.description && (
                        <p className="pdp-info-line text-muted">{parsedReturnPolicy.description}</p>
                      )}
                    </>
                  ) : (
                    <p className="pdp-info-line text-muted">
                      This item is non-returnable / no return policy provided.
                    </p>
                  )}
                </div>

                {/* Manufacturer Block */}
                {Boolean(
                  parsedManufacturer?.name ||
                  parsedManufacturer?.country ||
                  parsedManufacturer?.contact ||
                  parsedManufacturer?.email ||
                  parsedManufacturer?.address
                ) && (
                  <div className="pdp-info-block">
                    <h4 className="pdp-info-block-title">
                      <Sparkles size={18} className="pdp-info-icon" />
                      Manufacturer Details
                    </h4>
                    {parsedManufacturer?.name && (
                      <p className="pdp-info-line">
                        <strong>Company:</strong> {parsedManufacturer.name}
                      </p>
                    )}
                    {parsedManufacturer?.country && (
                      <p className="pdp-info-line">
                        <strong>Country of Origin:</strong> {parsedManufacturer.country}
                      </p>
                    )}
                    {parsedManufacturer?.contact && (
                      <p className="pdp-info-line">
                        <strong>Contact / Helpline:</strong> {parsedManufacturer.contact}
                      </p>
                    )}
                    {parsedManufacturer?.email && (
                      <p className="pdp-info-line">
                        <strong>Email:</strong> {parsedManufacturer.email}
                      </p>
                    )}
                    {parsedManufacturer?.address && (
                      <p className="pdp-info-line">
                        <strong>Address:</strong> {parsedManufacturer.address}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetails;
