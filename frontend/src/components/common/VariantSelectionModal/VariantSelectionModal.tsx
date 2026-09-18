import React, { useState, useEffect } from "react";
import { X, ShoppingCart, Check, AlertCircle } from "lucide-react";
import { triggerFlyToCart } from "../FlyToCart/FlyToCart";
import { useCart } from "../../../context/cartContext";
import { useAuth } from "../../../context/authContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import productFallback from "../../../assets/1.jpeg";
import "./VariantSelectionModal.css";

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface ProductVariant {
  _id?: string;
  price: number;
  salePrice?: number | null;
  attributes: VariantAttribute[];
  isActive?: boolean;
}

export interface ModalProduct {
  _id: string;
  name: string;
  brand?: string;
  price: number;
  salePrice?: number | null;
  images?: any[];
  hasVariants?: boolean | string | number;
  variants?: ProductVariant[] | string;
  stock?: number;
}

export const parseVariants = (rawVariants: any): ProductVariant[] => {
  if (!rawVariants) return [];
  if (Array.isArray(rawVariants)) return rawVariants;
  if (typeof rawVariants === "string") {
    try {
      const parsed = JSON.parse(rawVariants);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
    } catch {
      return [];
    }
  }
  return [];
};

export const isProductWithVariants = (p: any): boolean => {
  if (!p) return false;
  const parsed = parseVariants(p.variants);
  if (parsed.length > 0) return true;
  if (
    p.hasVariants === true ||
    String(p.hasVariants).toLowerCase() === "true" ||
    p.hasVariants === 1 ||
    p.hasVariants === "1"
  ) {
    return true;
  }
  return false;
};

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ModalProduct | null;
  onSuccess?: (variantIndex?: number) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formatImageUrl = (path?: any, fallback: string = productFallback): string => {
  if (!path) return fallback;
  let rawUrl = "";
  if (typeof path === "string") {
    rawUrl = path;
  } else if (typeof path === "object" && path !== null) {
    rawUrl = path.url || path.secure_url || path.path || "";
  }
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

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  isOpen,
  onClose,
  product: initialProduct,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [fullProduct, setFullProduct] = useState<ModalProduct | null>(initialProduct);
  const [loadingProduct, setLoadingProduct] = useState<boolean>(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [adding, setAdding] = useState<boolean>(false);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // If initial product lacks variants array, fetch full details with robust multi-endpoint fallback
  useEffect(() => {
    let isMounted = true;

    if (!isOpen || !initialProduct?._id) {
      setFullProduct(null);
      return;
    }

    setFullProduct(initialProduct);
    setSelectedVariantIndex(0);
    setQuantity(1);
    setIsAdded(false);

    const initialParsed = parseVariants(initialProduct.variants);
    const hasLoadedVariants = initialParsed.length > 0;

    if (!hasLoadedVariants) {
      setLoadingProduct(true);

      const fetchDetails = async () => {
        let fetched: any = null;
        try {
          // 1. Try public product endpoint
          try {
            const res = await fetch(`${API_BASE_URL}/api/products/${initialProduct._id}`, {
              credentials: "include",
            });
            if (res.ok) {
              const data = await res.json();
              fetched = data.data?.product || data.product || data.data;
            }
          } catch (e) {
            // ignore
          }

          // 2. Try admin endpoint
          if (!fetched || typeof fetched !== "object" || !fetched._id) {
            try {
              const res = await fetch(`${API_BASE_URL}/api/admin/product/${initialProduct._id}`, {
                credentials: "include",
              });
              if (res.ok) {
                const data = await res.json();
                fetched = data.data?.product || data.product || data.data;
              }
            } catch (e) {
              // ignore
            }
          }

          // 3. Fallback to /api/products list
          if (!fetched || typeof fetched !== "object" || !fetched._id) {
            try {
              const res = await fetch(`${API_BASE_URL}/api/products`, {
                credentials: "include",
              });
              if (res.ok) {
                const data = await res.json();
                const list = data.data?.products || data.data || data.products || (Array.isArray(data) ? data : []);
                if (Array.isArray(list)) {
                  fetched = list.find((p: any) => p._id === initialProduct._id);
                }
              }
            } catch (e) {
              // ignore
            }
          }

          if (isMounted && fetched && typeof fetched === "object" && fetched._id) {
            setFullProduct(fetched);
          }
        } catch (err) {
          console.error("Error loading product variants for modal:", err);
        } finally {
          if (isMounted) setLoadingProduct(false);
        }
      };

      fetchDetails();
    } else {
      setLoadingProduct(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialProduct]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !initialProduct) return null;

  const currentProduct = fullProduct || initialProduct;
  const parsedVariantsList = parseVariants(currentProduct.variants);
  const activeVariants = parsedVariantsList.filter(
    (v) =>
      v &&
      (v.isActive === true ||
        v.isActive === undefined ||
        v.isActive === null ||
        String(v.isActive) !== "false")
  );

  const hasActiveVariants = activeVariants.length > 0;
  const selectedVariant = hasActiveVariants
    ? activeVariants[selectedVariantIndex] || activeVariants[0]
    : null;

  // Dynamic pricing
  const basePrice = selectedVariant
    ? Number(selectedVariant.price) || 0
    : Number(currentProduct.price) || 0;

  const rawSalePrice = selectedVariant
    ? selectedVariant.salePrice !== undefined && selectedVariant.salePrice !== null
      ? Number(selectedVariant.salePrice)
      : null
    : currentProduct.salePrice !== undefined && currentProduct.salePrice !== null
      ? Number(currentProduct.salePrice)
      : null;

  const currentPrice = rawSalePrice && rawSalePrice < basePrice ? rawSalePrice : basePrice;
  const hasDiscount = Boolean(rawSalePrice && rawSalePrice < basePrice);
  const discountPercent = hasDiscount
    ? Math.round(((basePrice - (rawSalePrice || 0)) / basePrice) * 100)
    : 0;
  const savingsAmount = hasDiscount ? basePrice - (rawSalePrice || 0) : 0;

  const imgUrl = formatImageUrl(currentProduct.images?.[0]);

  const handleAddToCart = async () => {
    if (isAdded) {
      onClose();
      navigate("/cart");
      return;
    }

    if (!currentProduct?._id) return;

    if (!isAuthenticated) {
      onClose();
      navigate("/login");
      toast.error("Please login to add product to cart");
      return;
    }

    if (hasActiveVariants && !selectedVariant?._id) {
      toast.error("Please select a variant option");
      return;
    }

    setAdding(true);
    try {
      const variantSuffix = selectedVariant?.attributes?.length
        ? ` (${selectedVariant.attributes.map((a) => a.value).join(" / ")})`
        : "";

      const res = await addToCart(
        currentProduct._id,
        quantity,
        selectedVariant?._id || null
      );

      if (res.success) {
        setIsAdded(true);

        triggerFlyToCart({
          productName: `${currentProduct.name}${variantSuffix}`,
          price: currentPrice,
          quantity: quantity,
          imageUrl: imgUrl,
        });

        if (onSuccess) onSuccess(selectedVariantIndex);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error("Modal Add To Cart Error:", err);
      toast.error(err?.message || "Failed to add product to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="vsm-backdrop" onClick={onClose}>
      <div className="vsm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* CLOSE BUTTON */}
        <button
          type="button"
          className="vsm-close-btn"
          onClick={onClose}
          aria-label="Close variant selector"
        >
          <X size={20} />
        </button>

        {/* PRODUCT HEADER INFO */}
        <div className="vsm-product-header">
          <div className="vsm-image-wrap">
            <img
              src={imgUrl}
              alt={currentProduct.name}
              className="vsm-product-img"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = productFallback;
              }}
            />
          </div>
          <div className="vsm-header-details">
            {Boolean(currentProduct.brand) && (
              <span className="vsm-brand-badge">{currentProduct.brand}</span>
            )}
            <h3 className="vsm-product-title">{currentProduct.name}</h3>

            {/* PRICING BLOCK */}
            <div className="vsm-price-box">
              <span className="vsm-current-price">
                ₹{currentPrice.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <>
                  <span className="vsm-old-price">
                    ₹{basePrice.toLocaleString("en-IN")}
                  </span>
                  <span className="vsm-discount-tag">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
            {hasDiscount && savingsAmount > 0 && (
              <span className="vsm-savings-note">
                Save ₹{savingsAmount.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>

        {/* BODY: VARIANTS LIST */}
        <div className="vsm-body">
          {loadingProduct ? (
            <div className="vsm-loading-state">
              <div className="vsm-spinner" />
              <p>Loading available options...</p>
            </div>
          ) : hasActiveVariants ? (
            <div className="vsm-variants-wrapper">
              <div className="vsm-section-label-row">
                <span className="vsm-section-label">Select Option / Variant:</span>
                {selectedVariant && selectedVariant.attributes?.length > 0 && (
                  <span className="vsm-selected-summary">
                    {selectedVariant.attributes
                      .map((a) => `${a.name}: ${a.value}`)
                      .join(" • ")}
                  </span>
                )}
              </div>

              <div className="vsm-variants-grid">
                {activeVariants.map((variant, idx) => {
                  const isSelected = idx === selectedVariantIndex;
                  const attrSummary =
                    variant.attributes?.map((a) => a.value).join(" / ") ||
                    `Option ${idx + 1}`;
                  const vPrice =
                    variant.salePrice && variant.salePrice < variant.price
                      ? variant.salePrice
                      : variant.price;

                  return (
                    <button
                      key={variant._id || idx}
                      type="button"
                      className={`vsm-variant-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedVariantIndex(idx)}
                    >
                      <div className="vsm-variant-card-top">
                        <span className="vsm-variant-name">{attrSummary}</span>
                        {isSelected && <Check size={16} className="vsm-check-icon" />}
                      </div>
                      <span className="vsm-variant-price">
                        ₹{Number(vPrice).toLocaleString("en-IN")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="vsm-no-variants">
              <AlertCircle size={18} />
              <span>Standard Product (No additional options required)</span>
            </div>
          )}

          {/* QUANTITY ROW */}
          <div className="vsm-qty-row">
            <span className="vsm-qty-label">Quantity:</span>
            <div className="vsm-qty-stepper">
              <button
                type="button"
                className="vsm-qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="vsm-qty-val">{quantity}</span>
              <button
                type="button"
                className="vsm-qty-btn"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="vsm-footer">
          <button
            type="button"
            className="vsm-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className={`vsm-submit-btn ${isAdded ? "added" : ""}`}
            onClick={handleAddToCart}
            disabled={adding || (currentProduct.stock !== undefined && currentProduct.stock <= 0)}
          >
            {isAdded ? (
              <>
                <ShoppingCart size={19} className="vsm-moving-cart-icon" />
                <span>Go to Cart</span>
              </>
            ) : adding ? (
              <>
                <div className="vsm-btn-spinner" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantSelectionModal;
