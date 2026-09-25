import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Heart,
  Loader2,
  Star,
  Share2,
  Gift,
  Copy,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerFlyToCart } from "../../components/common/FlyToCart/FlyToCart";
import {
  useCart,
  getStoredReferrals,
  saveStoredReferrals,
  removeStoredReferral,
  type ActiveReferral,
} from "../../context/cartContext";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import Footer from "../Home/footersection";
import SimilarProducts from "./SimilarProducts";
import RecommendedSection from "../Home/RecommendedSection";
import VariantSelectionModal, { isProductWithVariants, parseVariants } from "../../components/common/VariantSelectionModal/VariantSelectionModal";
import ProductReviews from "../../components/common/ProductReviews/ProductReviews";
import "./ProductDetails.css";

import product1 from "../../assets/1.jpeg";

export const triggerReferralCelebration = () => {
  // Center cannon burst
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.6 },
    colors: ["#2563eb", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"],
    zIndex: 99999,
  });

  // Left cannon burst
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.65 },
      colors: ["#10b981", "#059669", "#34d399", "#fbbf24"],
      zIndex: 99999,
    });
  }, 180);

  // Right cannon burst
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.65 },
      colors: ["#2563eb", "#3b82f6", "#60a5fa", "#f43f5e"],
      zIndex: 99999,
    });
  }, 360);

  // Floating star / circle shower
  setTimeout(() => {
    confetti({
      particleCount: 45,
      spread: 100,
      origin: { y: 0.4 },
      shapes: ["circle"],
      scalar: 1.2,
      colors: ["#f59e0b", "#10b981", "#6366f1", "#ec4899"],
      zIndex: 99999,
    });
  }, 550);
};

type ProductImageItem = string | { public_id?: string; url?: string; _id?: string };

interface CategoryRef {
  _id: string;
  name: string;
}

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

export interface ProductDetailsSpec {
  size?: string;
  material?: string;
  weight?: {
    value?: number | null | string;
    unit?: string;
  };
  dimensions?: {
    length?: number | null | string;
    width?: number | null | string;
    height?: number | null | string;
    unit?: string;
  };
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
  stock: number;
  category: CategoryRef | string | null;
  subcategory?: CategoryRef | string | null;
  brand: string;
  images: ProductImageItem[];
  isFeatured: boolean;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  referral?: {
    isEnabled?: boolean;
    discountAmount?: number;
    rewardPoints?: number;
  };
  details?: ProductDetailsSpec | string;
  ratingsAverage?: number;
  ratingsCount?: number;
  ratingDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
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
  attributes?: any;
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<"specifications" | "description" | "warranty">("specifications");
  // const [addedNotice, setAddedNotice] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Referral states
  const [appliedReferral, setAppliedReferral] = useState<ActiveReferral | null>(null);
  const [isGeneratingReferral, setIsGeneratingReferral] = useState(false);
  const [referralShareModalOpen, setReferralShareModalOpen] = useState(false);
  const [generatedReferralLink, setGeneratedReferralLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync active referral for this product from localStorage on mount or product change
  useEffect(() => {
    try {
      if (!productId) {
        setAppliedReferral(null);
        return;
      }
      const allRefs = getStoredReferrals();
      const thisRef = allRefs[productId];
      if (thisRef) {
        const uid = (user?._id || user?.id)?.toString();
        if (uid && thisRef.creatorId && uid === thisRef.creatorId.toString()) {
          removeStoredReferral(productId);
          setAppliedReferral(null);
          toast.error("You cannot use your own referral link", {
            id: "referral-toast",
            icon: "⚠️",
          });
        } else {
          setAppliedReferral(thisRef);
        }
      } else {
        setAppliedReferral(null);
      }
    } catch {
      setAppliedReferral(null);
    }
  }, [productId, user]);

  // ==========================================================
  // VERIFY REFERRAL TOKEN (?ref=...) WITH BACKEND BEFORE STORING
  // ==========================================================
  useEffect(() => {
    const refToken = searchParams.get("ref") || searchParams.get("refToken");
    if (!refToken || !refToken.trim()) return;

    const cleanToken = refToken.trim();

    const validateToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const currentUserId = (user?._id || user?.id)?.toString();

        const res = await fetch(`${API_BASE_URL}/api/referral/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            token: cleanToken,
            currentUserId,
          }),
        });

        const result = await res.json();

        // Check if self-referral was rejected
        if (
          result.isSelfReferral ||
          (currentUserId && result.data?.creatorId && currentUserId === result.data.creatorId.toString())
        ) {
          if (productId) {
            removeStoredReferral(productId);
          }
          setAppliedReferral(null);

          toast.error("You cannot use your own referral link", {
            id: "referral-toast",
            icon: "⚠️",
          });

          if (productId) {
            navigate(`/product/${productId}`, { replace: true });
          }
          return;
        }

        if (res.ok && result.success && result.data) {
          // Token is valid! Store into multi-referral storage without overwriting other products
          const targetPid = String(result.data.productId || productId);
          const refPayload: ActiveReferral = {
            token: cleanToken,
            productId: targetPid,
            productName: product?.name || result.data.productName || "Product",
            discountAmount: result.data.discountAmount,
            rewardPoints: result.data.rewardPoints,
            creatorId: result.data.creatorId,
            originalPrice: result.data.originalPrice,
            regularPrice: result.data.regularPrice,
            updatedPrice: result.data.updatedPrice,
            discountedPrice: result.data.discountedPrice,
            timestamp: Date.now(),
          };

          const allRefs = getStoredReferrals();
          allRefs[targetPid] = refPayload;
          saveStoredReferrals(allRefs);
          setAppliedReferral(refPayload);

          // Trigger confetti celebration!
          triggerReferralCelebration();

          const newPriceText = result.data.updatedPrice !== undefined ? ` New Price: ₹${result.data.updatedPrice}!` : "";
          toast.success(
            `Referral discount of ₹${result.data.discountAmount} applied!${newPriceText}`,
            {
              id: "referral-toast",
              icon: "🎉",
            }
          );
        } else {
          // Token is INVALID or EXPIRED or ALREADY USED
          if (productId) {
            removeStoredReferral(productId);
          }
          setAppliedReferral(null);

          toast.error(result.message || "Invalid or expired referral link", {
            id: "referral-toast",
          });

          // Redirect to clean product page (removes ?ref= from URL)
          if (productId) {
            navigate(`/product/${productId}`, { replace: true });
          }
        }
      } catch (err) {
        console.error("Referral validation error:", err);
        if (productId) {
          removeStoredReferral(productId);
        }
        setAppliedReferral(null);

        toast.error("Could not verify referral link", {
          id: "referral-toast",
        });

        if (productId) {
          navigate(`/product/${productId}`, { replace: true });
        }
      }
    };

    validateToken();
  }, [searchParams, productId, navigate, user, product?.name]);

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
          if (productId) {
            const allRefs = getStoredReferrals();
            if (allRefs[productId] && (!allRefs[productId].productName || allRefs[productId].productName === "Product")) {
              allRefs[productId].productName = fetchedProduct.name;
              saveStoredReferrals(allRefs);
              setAppliedReferral((prev) => (prev ? { ...prev, productName: fetchedProduct.name } : null));
            }
          }
          const pVars = parseVariants(fetchedProduct.variants);
          const actVars = pVars.filter((v: any) => v && (v.isActive === true || v.isActive === undefined || v.isActive === null || String(v.isActive) !== "false"));
          setSelectedVariantIndex(actVars.length > 0 ? 0 : -1);
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

  // Active variants handling
  const parsedVariants = parseVariants(product?.variants);
  const hasProductVariants = isProductWithVariants(product);
  const activeVariants = (hasProductVariants && parsedVariants.length > 0)
    ? parsedVariants.filter((v) => v && (v.isActive === true || v.isActive === undefined || v.isActive === null || String(v.isActive) !== "false"))
    : [];

  const hasActiveVariants = Boolean(hasProductVariants && activeVariants.length > 0);
  const selectedVariant = hasActiveVariants && selectedVariantIndex >= 0
    ? activeVariants[selectedVariantIndex] || null
    : null;

  const handleAddToCart = async () => {
    if (isAdded) {
      navigate("/cart");
      return;
    }

    if (!product?._id) return;
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${returnUrl}`);
      toast.error("Please login to add product to cart");
      return;
    }

    if (hasActiveVariants && !selectedVariant?._id) {
      setIsVariantModalOpen(true);
      return;
    }

    setIsAdding(true);
    try {
      const res = await addToCart(product._id, quantity, selectedVariant?._id);
      if (res.requiresVariant) {
        setIsVariantModalOpen(true);
        return;
      }
      if (res.success) {
        const variantSuffix = selectedVariant && selectedVariant.attributes && selectedVariant.attributes.length > 0
          ? ` (${selectedVariant.attributes.map(a => a.value).join(" / ")})`
          : "";
        // toast.success(`${quantity} x "${product.name}${variantSuffix}" added to cart!`);

        const currentPrice = selectedVariant
          ? (selectedVariant.salePrice && selectedVariant.salePrice > 0
            ? selectedVariant.salePrice
            : selectedVariant.price)
          : (product.salePrice && product.salePrice > 0
            ? product.salePrice
            : product.price);

        triggerFlyToCart({
          productName: `${product.name}${variantSuffix}`,
          price: currentPrice,
          quantity: quantity,
          imageUrl: mainImage,
        });

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 100000);
      }
    } catch (error: any) {
      toast.error("Failed to add product to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product?._id) return;
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${returnUrl}`);
      toast.error("Please login to proceed to checkout");
      return;
    }

    if (hasActiveVariants && !selectedVariant?._id) {
      setIsVariantModalOpen(true);
      return;
    }

    const toastId = toast.loading("Processing checkout...");
    try {
      const res = await addToCart(product._id, quantity, selectedVariant?._id);
      if (res.requiresVariant) {
        toast.dismiss(toastId);
        setIsVariantModalOpen(true);
        return;
      }
      if (res.success) {
        toast.dismiss(toastId);
        navigate("/checkout");
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error("Failed to proceed to checkout");
    }
  };

  const handleShareAndEarn = async () => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${returnUrl}`);
      toast.error("Please login to generate your referral link", {
        id: "referral-auth-toast",
        icon: "🔒",
      });
      return;
    }

    try {
      setIsGeneratingReferral(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/referral/create-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ productId: product?._id || productId }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data?.referralLink) {
        setGeneratedReferralLink(data.data.referralLink);
        setReferralShareModalOpen(true);
      } else {
        toast.error(data.message || "Failed to generate referral link");
      }
    } catch (err) {
      console.error("Referral link generation failed:", err);
      toast.error("Error creating referral link. Please try again.");
    } finally {
      setIsGeneratingReferral(false);
    }
  };

  const handleCopyReferralLink = async () => {
    if (!generatedReferralLink) return;
    try {
      await navigator.clipboard.writeText(generatedReferralLink);
      setCopiedLink(true);
      toast.success("Referral link copied to clipboard!", { icon: "📋" });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsAppShare = () => {
    if (!generatedReferralLink || !product) return;
    const text = `Hey! Check out ${product.name} on Amandeep Store. Use my referral link to get an instant ₹${product.referral?.discountAmount || 0} discount: ${generatedReferralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
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

  // Dynamic pricing based on selected variant or root product
  const basePrice = selectedVariant ? Number(selectedVariant.price) || 0 : Number(product.price) || 0;
  const rawSalePrice = selectedVariant
    ? (selectedVariant.salePrice !== undefined && selectedVariant.salePrice !== null ? Number(selectedVariant.salePrice) : null)
    : (product.salePrice !== undefined && product.salePrice !== null ? Number(product.salePrice) : null);

  const regularPrice = rawSalePrice && rawSalePrice < basePrice ? rawSalePrice : basePrice;

  // Referral discount application
  const referralDiscount =
    appliedReferral && (appliedReferral.productId === product._id || !appliedReferral.productId) && appliedReferral.discountAmount
      ? Number(appliedReferral.discountAmount)
      : 0;

  const currentPrice = referralDiscount > 0 ? Math.max(0, regularPrice - referralDiscount) : regularPrice;
  const hasDiscount = Boolean((rawSalePrice && rawSalePrice < basePrice) || referralDiscount > 0);
  const discountPercent = hasDiscount
    ? Math.round(((basePrice - currentPrice) / basePrice) * 100)
    : 0;
  const savingsAmount = hasDiscount ? basePrice - currentPrice : 0;

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
  const parsedDetails = safeParse(product.details) || safeParse(product.attributes);

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
    ? `${returnWindow} ${parsedReturnPolicy?.replacementAvailable && parsedReturnPolicy?.refundAvailable
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

  // Specs extraction helpers from parsed backend details
  const sizeVal = parsedDetails?.size?.trim();
  const materialVal = parsedDetails?.material?.trim();

  const weightVal =
    parsedDetails?.weight?.value !== undefined && parsedDetails?.weight?.value !== null && String(parsedDetails.weight.value).trim() !== ""
      ? `${parsedDetails.weight.value} ${parsedDetails.weight.unit || "g"}`
      : parsedDetails?.weightValue !== undefined && parsedDetails?.weightValue !== null && String(parsedDetails.weightValue).trim() !== ""
        ? `${parsedDetails.weightValue} ${parsedDetails.weightUnit || "g"}`
        : undefined;

  const dimVal =
    parsedDetails?.dimensions?.length ||
      parsedDetails?.dimensions?.width ||
      parsedDetails?.dimensions?.height
      ? `${[
        parsedDetails.dimensions.length,
        parsedDetails.dimensions.width,
        parsedDetails.dimensions.height,
      ]
        .filter(Boolean)
        .join(" x ")} ${parsedDetails.dimensions.unit || "cm"}`
      : parsedDetails?.length || parsedDetails?.width || parsedDetails?.height
        ? `${[parsedDetails.length, parsedDetails.width, parsedDetails.height]
          .filter(Boolean)
          .join(" x ")} ${parsedDetails.dimUnit || "cm"}`
        : undefined;

  return (
    <div className="pdp-page">
      <div className="pdp-container">


        {/* MAIN PRODUCT BOX */}
        <div className="pdp-main-card">
          {/* LEFT: GALLERY ZONE */}
          <div className="pdp-gallery-zone">
            <div className="pdp-main-image-wrap">
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
                    <span className="pdp-thumb-label">Image {idx + 1}</span>
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

            {/* RATING SNIPPET */}
            <div className="pdp-rating-row">
              <a
                href="#product-reviews-container"
                className="pdp-rating-badge-link"
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("open-product-reviews"));
                  setTimeout(() => {
                    document
                      .getElementById("product-reviews-container")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }}
              >
                <span className="pdp-star-val">
                  {product.ratingsAverage && product.ratingsAverage > 0
                    ? product.ratingsAverage.toFixed(1)
                    : "0.0"}
                </span>
                <Star size={12} className="pdp-star-icon" />
              </a>
              <a
                href="#product-reviews-container"
                className="pdp-reviews-count-link"
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("open-product-reviews"));
                  setTimeout(() => {
                    document
                      .getElementById("product-reviews-container")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }}
              >
                {product.ratingsCount && product.ratingsCount > 0
                  ? `${product.ratingsCount} ${product.ratingsCount === 1 ? "Rating" : "Ratings"}`
                  : "No reviews yet"}
              </a>
            </div>

            {/* STOCK STATUS */}
            {/* <div className="pdp-meta-row">
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
            </div> */}

            {/* VARIANT SELECTOR */}
            {hasActiveVariants && (
              <div className="pdp-variants-section">
                <div className="pdp-variants-header">
                  <span className="pdp-variants-label">Select Option:</span>
                  {selectedVariant && selectedVariant.attributes && selectedVariant.attributes.length > 0 ? (
                    <span className="pdp-selected-variant-summary">
                      {selectedVariant.attributes.map((a) => `${a.name}: ${a.value}`).join(" • ")}
                    </span>
                  ) : (
                    <span className="pdp-selected-variant-summary" style={{ color: "#2563eb", fontWeight: 500 }}>

                    </span>
                  )}
                </div>
                <div className="pdp-variants-grid">
                  {activeVariants.map((variant, idx) => {
                    const isSelected = idx === selectedVariantIndex;
                    const attrSummary = variant.attributes?.map((a) => a.value).join(" / ") || `Option ${idx + 1}`;
                    const vPrice = (variant.salePrice && variant.salePrice < variant.price) ? variant.salePrice : variant.price;
                    return (
                      <button
                        key={variant._id || idx}
                        type="button"
                        className={`pdp-variant-chip ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          setSelectedVariantIndex(idx);
                          setIsAdded(false);
                        }}
                      >
                        <span className="pdp-variant-chip-name">{attrSummary}</span>
                        <span className="pdp-variant-chip-price">₹{Number(vPrice).toLocaleString("en-IN")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PRICE BANNER */}
            <div className="pdp-price-box">
              <span className="pdp-current-price">
                ₹{currentPrice.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <>
                  <span className="pdp-old-price">
                    ₹{basePrice.toLocaleString("en-IN")}
                  </span>
                  <span className="pdp-save-text">
                    Save ₹{savingsAmount.toLocaleString("en-IN")} ({discountPercent}% OFF)
                  </span>
                </>
              )}
              {referralDiscount > 0 && (
                <span className="pdp-referral-applied-tag">
                  ₹{referralDiscount} Referral Discount Applied
                </span>
              )}
            </div>

            {/* REFER & EARN PROMO CARD */}
            {product.referral?.isEnabled && (
              <div className="pdp-referral-promo-card">
                <div className="pdp-referral-promo-header">
                  <div className="pdp-referral-promo-title-wrap">
                    <div className="pdp-referral-gift-wrap">
                      <Gift size={18} className="pdp-referral-gift-icon" />
                    </div>
                    <div>
                      <h4 className="pdp-referral-promo-title">Refer & Earn Rewards</h4>
                      <p className="pdp-referral-promo-subtitle">
                        Share this product with friends and earn rewards on every order!
                      </p>
                    </div>
                  </div>
                  <span className="pdp-referral-pill">
                    Earn ₹{product.referral.rewardPoints || 0}
                  </span>
                </div>

                <div className="pdp-referral-benefits-grid">
                  <div className="pdp-referral-benefit-item">
                    <span className="pdp-benefit-icon">
                      <Gift size={16} color="#2563eb" />
                    </span>
                    <div>
                      <span className="pdp-benefit-label">Friend Gets</span>
                      <strong className="pdp-benefit-value">₹{product.referral.discountAmount || 0} OFF</strong>
                    </div>
                  </div>
                  <div className="pdp-referral-benefit-item">
                    <span className="pdp-benefit-icon">🪙</span>
                    <div>
                      <span className="pdp-benefit-label">You Earn</span>
                      <strong className="pdp-benefit-value">{product.referral.rewardPoints || 0} Points (₹{product.referral.rewardPoints || 0})</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="pdp-referral-share-btn"
                  onClick={handleShareAndEarn}
                  disabled={isGeneratingReferral}
                >
                  {isGeneratingReferral ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Generating Link...
                    </>
                  ) : (
                    <>
                      <Share2 size={16} /> Share & Earn ₹{product.referral.rewardPoints || 0}
                    </>
                  )}
                </button>
              </div>
            )}

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

              {/* Action Buttons Group */}
              <div className="pdp-btns-group">
                {/* Add to Cart */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  className={`pdp-btn pdp-btn-cart ${isAdded ? "added" : ""}`}
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0 || isAdding}
                >
                  <AnimatePresence mode="wait">
                    {isAdded ? (
                      <motion.span
                        key="added"
                        initial={{ opacity: 0, y: 6, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                      >
                        <ShoppingCart size={19} strokeWidth={2.2} className="pdp-cart-icon-moving" /> Go to Cart
                      </motion.span>
                    ) : isAdding ? (
                      <motion.span
                        key="adding"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                      >
                        <Loader2 size={18} className="animate-spin" /> Adding...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                      >
                        <ShoppingCart size={18} /> Add to Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

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
                {hasActiveVariants && (
                  <div className="pdp-spec-cell row-odd" style={{ gridColumn: "1 / -1" }}>
                    <span className="pdp-spec-key">Available Options</span>
                    <span className="pdp-spec-val">
                      {activeVariants
                        .map((v) => v.attributes.map((a) => `${a.name}: ${a.value}`).join(", "))
                        .join(" | ")}
                    </span>
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
                {!product.brand && !categoryName && !sizeVal && !materialVal && !weightVal && !dimVal && !hasActiveVariants && (
                  <div className="pdp-spec-cell row-even" style={{ gridColumn: "1 / -1" }}>
                    <span className="pdp-spec-key">No specific specifications configured for this product.</span>
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

        {/* CUSTOMER REVIEWS & RATINGS SECTION */}
        {product && (
          <ProductReviews
            productId={product._id}
            productName={product.name}
            productImage={imagesList[0]}
          />
        )}
      </div>

      {productId && <SimilarProducts productId={productId} />}
      <RecommendedSection />

      {product && (
        <VariantSelectionModal
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          product={product}
          onSuccess={(vIdx) => {
            if (typeof vIdx === "number") {
              setSelectedVariantIndex(vIdx);
            }
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 100000);
          }}
        />
      )}

      {/* REFERRAL SHARE MODAL */}
      <AnimatePresence>
        {referralShareModalOpen && (
          <div
            className="pdp-modal-overlay"
            onClick={() => setReferralShareModalOpen(false)}
          >
            <motion.div
              className="pdp-referral-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="pdp-modal-header">
                <div className="pdp-modal-title-wrap">
                  <div className="pdp-modal-icon-badge">
                    <Gift size={22} color="#2563eb" />
                  </div>
                  <div>
                    <h3 className="pdp-modal-title">Share & Earn Rewards</h3>
                    <p className="pdp-modal-subtitle">
                      Your friend gets ₹{product?.referral?.discountAmount || 0} OFF, you earn {product?.referral?.rewardPoints || 0} points!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="pdp-modal-close-btn"
                  onClick={() => setReferralShareModalOpen(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="pdp-modal-body">
                <div className="pdp-referral-rewards-summary">
                  <div className="pdp-summary-box">
                    <span className="pdp-summary-label">Friend's Discount</span>
                    <span className="pdp-summary-amt friend">
                      ₹{product?.referral?.discountAmount || 0} OFF
                    </span>
                  </div>
                  <div className="pdp-summary-box">
                    <span className="pdp-summary-label">Your Reward</span>
                    <span className="pdp-summary-amt you">
                      +{product?.referral?.rewardPoints || 0} Points
                    </span>
                  </div>
                </div>

                <label className="pdp-modal-field-label">Your Unique Referral Link</label>
                <div className="pdp-link-copy-box">
                  <input
                    type="text"
                    readOnly
                    value={generatedReferralLink}
                    className="pdp-link-input"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    className={`pdp-copy-btn ${copiedLink ? "copied" : ""}`}
                    onClick={handleCopyReferralLink}
                  >
                    {copiedLink ? (
                      <>
                        <Check size={16} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="pdp-share-actions">
                  <button
                    type="button"
                    className="pdp-whatsapp-btn"
                    onClick={handleWhatsAppShare}
                  >
                    <span>💬 Share on WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default ProductDetails;
