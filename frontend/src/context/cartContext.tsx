import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./authContext";
import toast from "react-hot-toast";

export interface CartProduct {
  _id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  images?: Array<string | { url?: string }>;
  stock?: number;
  category?: { name?: string } | string;
  brand?: string;
}

export interface CartItemVariant {
  _id?: string;
  price?: number;
  salePrice?: number | null;
  attributes?: Array<{ name: string; value: string }>;
  isActive?: boolean;
}

export interface CartItem {
  _id?: string;
  product: CartProduct;
  variantId?: string | null;
  variant?: CartItemVariant | null;
  quantity: number;
  price?: number;
  lineTotal?: number;
}

export interface AddToCartResult {
  success: boolean;
  requiresVariant?: boolean;
  message?: string;
}

export interface ActiveReferral {
  token: string;
  productId: string;
  productName?: string;
  discountAmount: number;
  rewardPoints: number;
  creatorId?: string;
  originalPrice?: number;
  regularPrice?: number;
  updatedPrice?: number;
  discountedPrice?: number;
  timestamp?: number;
}

export const getStoredReferrals = (): Record<string, ActiveReferral> => {
  try {
    const rawMulti = localStorage.getItem("active_referrals");
    let map: Record<string, ActiveReferral> = {};
    if (rawMulti) {
      const parsed = JSON.parse(rawMulti);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        map = parsed;
      }
    }
    // Backward compatibility with legacy active_referral
    const rawSingle = localStorage.getItem("active_referral");
    if (rawSingle) {
      try {
        const single = JSON.parse(rawSingle);
        if (single && single.productId && !map[single.productId]) {
          map[single.productId] = single;
          localStorage.setItem("active_referrals", JSON.stringify(map));
        }
      } catch {}
    }
    return map;
  } catch {
    return {};
  }
};

export const saveStoredReferrals = (refs: Record<string, ActiveReferral>) => {
  try {
    localStorage.setItem("active_referrals", JSON.stringify(refs));
    const values = Object.values(refs);
    if (values.length > 0) {
      const latest = values[values.length - 1];
      localStorage.setItem("active_referral", JSON.stringify(latest));
      localStorage.setItem("referral_token", latest.token);
      localStorage.setItem("referral_product_id", latest.productId);
    } else {
      localStorage.removeItem("active_referral");
      localStorage.removeItem("referral_token");
      localStorage.removeItem("referral_product_id");
    }
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to save referrals to localStorage", e);
  }
};

export const removeStoredReferral = (productId: string) => {
  try {
    const current = getStoredReferrals();
    delete current[productId];
    localStorage.setItem("active_referrals", JSON.stringify(current));

    const rawSingle = localStorage.getItem("active_referral");
    if (rawSingle) {
      try {
        const single = JSON.parse(rawSingle);
        if (single?.productId === productId) {
          localStorage.removeItem("active_referral");
          localStorage.removeItem("referral_token");
          localStorage.removeItem("referral_product_id");
        }
      } catch {}
    }

    const remaining = Object.values(current);
    if (remaining.length > 0) {
      const latest = remaining[remaining.length - 1];
      localStorage.setItem("active_referral", JSON.stringify(latest));
      localStorage.setItem("referral_token", latest.token);
      localStorage.setItem("referral_product_id", latest.productId);
    } else {
      localStorage.removeItem("active_referral");
      localStorage.removeItem("referral_token");
      localStorage.removeItem("referral_product_id");
    }

    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to remove referral from localStorage", e);
  }
};

export const clearAllStoredReferrals = () => {
  try {
    localStorage.removeItem("active_referrals");
    localStorage.removeItem("active_referral");
    localStorage.removeItem("referral_token");
    localStorage.removeItem("referral_product_id");
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to clear referrals from localStorage", e);
  }
};

// ==========================================
// REWARD POINTS LOCALSTORAGE HELPERS
// ==========================================
export const getStoredRewardPoints = (): number => {
  try {
    const raw = localStorage.getItem("applied_reward_points");
    if (!raw) return 0;
    const num = parseInt(raw, 10);
    return isNaN(num) || num < 0 ? 0 : num;
  } catch {
    return 0;
  }
};

export const saveStoredRewardPoints = (points: number) => {
  try {
    if (points > 0) {
      localStorage.setItem("applied_reward_points", points.toString());
    } else {
      localStorage.removeItem("applied_reward_points");
    }
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to save reward points to localStorage", e);
  }
};

export const clearStoredRewardPoints = () => {
  try {
    localStorage.removeItem("applied_reward_points");
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Failed to clear reward points from localStorage", e);
  }
};

interface CartContextType {
  cartItems: CartItem[];
  totalItems: number;
  subtotal: number;
  loading: boolean;
  appliedReferrals: Record<string, ActiveReferral>;
  appliedReferral: ActiveReferral | null;
  referralDiscount: number;
  removeReferral: (productId?: string) => void;
  syncReferralFromStorage: () => void;
  // Reward Points Support
  appliedPoints: number;
  pointsDiscount: number;
  maxRedeemablePoints: number;
  userRewardPoints: number;
  applyRewardPoints: (points?: number) => void;
  removeRewardPoints: () => void;
  addToCart: (
    productId: string,
    quantity?: number,
    variantId?: string | null
  ) => Promise<AddToCartResult>;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null
  ) => Promise<boolean>;
  removeFromCart: (
    productId: string,
    variantId?: string | null
  ) => Promise<boolean>;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const API_CART = `${API_BASE_URL}/api/cart`;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, logout, user } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [appliedReferrals, setAppliedReferrals] = useState<Record<string, ActiveReferral>>({});
  const [appliedPoints, setAppliedPoints] = useState<number>(() => getStoredRewardPoints());

  // Sync referrals from localStorage on mount & when storage events trigger
  const syncReferralFromStorage = useCallback(() => {
    try {
      const storedMap = getStoredReferrals();
      const uid = (user?._id || user?.id)?.toString();

      if (uid) {
        let changed = false;
        const validMap: Record<string, ActiveReferral> = {};
        for (const [pid, ref] of Object.entries(storedMap)) {
          if (ref.creatorId && uid === ref.creatorId.toString()) {
            removeStoredReferral(pid);
            changed = true;
          } else {
            validMap[pid] = ref;
          }
        }
        if (changed) {
          toast.error("You cannot use your own referral links", {
            id: "self-referral-cart-toast",
            icon: "⚠️",
          });
          setAppliedReferrals(validMap);
          return;
        }
      }

      setAppliedReferrals((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(storedMap);
        if (prevKeys.length === 0 && nextKeys.length === 0) {
          return prev;
        }
        if (
          prevKeys.length === nextKeys.length &&
          prevKeys.every(
            (k) =>
              prev[k]?.token === storedMap[k]?.token &&
              prev[k]?.discountAmount === storedMap[k]?.discountAmount
          )
        ) {
          return prev;
        }
        return storedMap;
      });
    } catch {
      setAppliedReferrals((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    }
  }, [user]);

  // Sync applied reward points from localStorage
  const syncRewardPointsFromStorage = useCallback(() => {
    try {
      const stored = getStoredRewardPoints();
      setAppliedPoints(stored);
    } catch {
      setAppliedPoints(0);
    }
  }, []);

  useEffect(() => {
    syncReferralFromStorage();
    syncRewardPointsFromStorage();
    const handleStorage = () => {
      syncReferralFromStorage();
      syncRewardPointsFromStorage();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [syncReferralFromStorage, syncRewardPointsFromStorage]);

  const removeReferral = (productId?: string) => {
    if (productId) {
      removeStoredReferral(productId);
      setAppliedReferrals((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      toast.success("Referral discount removed", { id: `cart-referral-remove-${productId}` });
    } else {
      clearAllStoredReferrals();
      setAppliedReferrals({});
      toast.success("Referral discounts removed", { id: "cart-referral-remove" });
    }
  };

  // Determine sum of discounts for all referred products currently in cart (per-unit based)
  const referralDiscount = (() => {
    let total = 0;

    for (const item of cartItems) {
      const pid = item.product?._id ? String(item.product._id) : null;
      if (pid && appliedReferrals[pid]) {
        const ref = appliedReferrals[pid];
        const unitDiscount = Number(ref.discountAmount || 0);
        const itemPrice =
          item.price ??
          (item.product.salePrice && item.product.salePrice < item.product.price
            ? item.product.salePrice
            : item.product.price);

        const effectiveUnitDiscount = Math.min(itemPrice, unitDiscount);
        total += effectiveUnitDiscount * item.quantity;
      }
    }
    return total;
  })();

  const appliedReferral = Object.values(appliedReferrals)[0] || null;

  // Reward points calculations
  const userRewardPoints = Number(user?.rewardPoints) || 0;
  const deliveryFee = subtotal >= 499 || cartItems.length === 0 ? 0 : 99;
  const cartAmountAfterReferral = Math.max(0, subtotal - referralDiscount) + deliveryFee;
  const maxRedeemablePoints = Math.min(userRewardPoints, Math.floor(cartAmountAfterReferral));
  const pointsDiscount = Math.min(appliedPoints, maxRedeemablePoints);

  const applyRewardPoints = (points?: number) => {
    if (userRewardPoints <= 0) {
      toast.error("You have no reward points to redeem", { id: "no-points-toast" });
      return;
    }
    if (maxRedeemablePoints <= 0) {
      toast.error("Cart total is already 0 or no points can be redeemed", { id: "max-points-zero-toast" });
      return;
    }

    const toApply =
      points !== undefined
        ? Math.min(Math.max(1, Math.floor(points)), maxRedeemablePoints)
        : maxRedeemablePoints;

    saveStoredRewardPoints(toApply);
    setAppliedPoints(toApply);
    toast.success(`Applied ${toApply} Reward Points (₹${toApply} OFF)!`, {
      id: "points-applied-toast",
      icon: "🪙",
    });
  };

  const removeRewardPoints = () => {
    clearStoredRewardPoints();
    setAppliedPoints(0);
    toast.success("Reward points removed", { id: "points-removed-toast" });
  };

  // ==========================================
  // CALCULATE CART TOTALS
  // ==========================================

  const calculateTotals = useCallback((items: CartItem[]) => {
    const total = items.reduce((acc, item) => acc + item.quantity, 0);

    const subTotal = items.reduce(
      (acc, item) =>
        acc + (item.price ?? item.product.price) * item.quantity,
      0
    );

    setTotalItems(total);
    setSubtotal(subTotal);
  }, []);

  // ==========================================
  // PARSE CART RESPONSE
  // ==========================================

  const parseCartResponse = useCallback((data: any) => {
    if (!data) return;

    const rawItems =
      data.items ||
      data.data?.items ||
      (Array.isArray(data) ? data : []);

    const formattedItems: CartItem[] = (
      Array.isArray(rawItems) ? rawItems : []
    ).map((item: any) => {
      const productObj = item.product || item.productId || item;
      const qty = item.quantity || 1;
      const variantId =
        item.variantId || (item.variant ? item.variant._id : null);

      let itemVariant = item.variant || null;
      if (!itemVariant && variantId && Array.isArray(productObj.variants)) {
        itemVariant =
          productObj.variants.find(
            (v: any) => v._id?.toString() === variantId.toString()
          ) || null;
      }

      const itemPrice =
        (itemVariant
          ? itemVariant.salePrice && itemVariant.salePrice > 0
            ? itemVariant.salePrice
            : itemVariant.price
          : null) ??
        item.price ??
        (productObj.salePrice && productObj.salePrice < productObj.price
          ? productObj.salePrice
          : productObj.price || 0);

      const uniqueKey =
        item._id ||
        (variantId
          ? `${productObj._id || item.productId}_${variantId}`
          : productObj._id || item.productId);

      return {
        _id: uniqueKey,
        product: {
          _id: productObj._id || item.productId,
          name: productObj.name || "Product",
          price: productObj.price || 0,
          salePrice: productObj.salePrice || null,
          images: productObj.images || [],
          stock: productObj.stock || 0,
          category: productObj.category,
          brand: productObj.brand || "",
        },
        variantId: variantId || undefined,
        variant: itemVariant,
        quantity: qty,
        price: itemPrice,
        lineTotal: item.lineTotal ?? itemPrice * qty,
      };
    });

    setCartItems(formattedItems);
    calculateTotals(formattedItems);
  }, [calculateTotals]);

  // ==========================================
  // FETCH CART WHEN USER LOGS IN
  // ==========================================

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || user?.role === "admin") {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(API_CART, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (res.ok) {
        parseCartResponse(result.data || result);
      } else {
        console.warn("Cart fetch returned non-ok status:", result.message);
        if (res.status === 401) {
          await logout();
        }
      }
    } catch (err) {
      console.error("Fetch cart error:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.role, logout, parseCartResponse]);

  useEffect(() => {
    if (isAuthenticated && user?.role !== "admin") {
      fetchCart();
    } else {
      setCartItems([]);
      setTotalItems(0);
      setSubtotal(0);
    }
  }, [isAuthenticated, user?.role]);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const addToCart = async (
    productId: string,
    quantity: number = 1,
    variantId?: string | null
  ): Promise<AddToCartResult> => {
    try {
      setLoading(true);

      const payload: {
        productId: string;
        quantity: number;
        variantId?: string;
      } = {
        productId,
        quantity,
      };

      if (variantId) {
        payload.variantId = variantId;
      }

      const res = await fetch(API_CART, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success !== false) {
        await fetchCart();
        return { success: true };
      }

      if (res.status === 401) {
        toast.error("Your session has expired. Please log in again.");
        await logout();
        return { success: false, message: "Unauthorized" };
      }

      const msg = result.message || "";
      if (res.status === 400 && msg.toLowerCase().includes("variant")) {
        return { success: false, requiresVariant: true, message: msg };
      }

      toast.error(msg || "Failed to add product to cart.");
      return { success: false, message: msg };
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error("An error occurred while adding to cart.");
      return { success: false, message: "An error occurred while adding to cart." };
    } finally {
      setLoading(false);
    }
  };


  // const addToCart = async (
  //     productId: string,
  //     quantity: number = 1
  //   ): Promise<boolean> => {

  //     // Update count immediately
  //     setTotalItems((prev) => prev + quantity);
  //     try {
  //       setLoading(true);

  //       const res = await fetch(API_CART, {
  //         method: "POST",
  //         credentials: "include",

  //         headers: {
  //           "Content-Type": "application/json",
  //         },

  //         body: JSON.stringify({
  //           productId,
  //           quantity,
  //         }),
  //       });

  //       const result = await res.json();

  //       if (res.ok && result.success !== false) {
  //         // Adding a product can change an existing cart item,
  //         // so fetch the latest cart after successful addition.
  //         // await fetchCart();

  //         return true;
  //       }

  //       if (res.status === 401) {
  //         alert("Your session has expired. Please log in again.");

  //         await logout(); // backend clears cookie + frontend clears user

  //         // navigate("/login", { replace: true });

  //         return false;
  //       }

  //       alert(result.message || "Failed to add product to cart.");
  //       return false;
  //     } catch (err) {
  //       console.error("Add to cart error:", err);
  //       alert("An error occurred while adding to cart.");
  //       return false;
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  // ==========================================
  // UPDATE QUANTITY - OPTIMISTIC UPDATE
  // ==========================================

  const updateQuantity = async (
    productId: string,
    quantity: number,
    variantId?: string | null
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    if (quantity <= 0) {
      return removeFromCart(productId, variantId);
    }

    const previousItems = cartItems;
    const previousTotalItems = totalItems;
    const previousSubtotal = subtotal;

    const updatedItems = cartItems.map((item) => {
      const match =
        item.product._id === productId &&
        (!variantId || item.variantId === variantId);
      if (match) {
        const itemPrice =
          item.price ??
          (item.product.salePrice && item.product.salePrice < item.product.price
            ? item.product.salePrice
            : item.product.price);
        return { ...item, quantity, lineTotal: itemPrice * quantity };
      }
      return item;
    });

    setCartItems(updatedItems);
    calculateTotals(updatedItems);

    try {
      const payload: { quantity: number; variantId?: string } = { quantity };
      if (variantId) {
        payload.variantId = variantId;
      }

      const res = await fetch(`${API_CART}/${productId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success !== false) {
        return true;
      }

      setCartItems(previousItems);
      setTotalItems(previousTotalItems);
      setSubtotal(previousSubtotal);

      if (res.status === 401) {
        toast.error("Your session has expired. Please log in again.");
        return false;
      }

      toast.error(result.message || "Failed to update quantity.");
      return false;
    } catch (err) {
      console.error("Update cart quantity error:", err);
      setCartItems(previousItems);
      setTotalItems(previousTotalItems);
      setSubtotal(previousSubtotal);
      return false;
    }
  };

  // ==========================================
  // REMOVE FROM CART - OPTIMISTIC UPDATE
  // ==========================================

  const removeFromCart = async (
    productId: string,
    variantId?: string | null
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    const previousItems = cartItems;
    const previousTotalItems = totalItems;
    const previousSubtotal = subtotal;

    const updatedItems = cartItems.filter((item) => {
      if (variantId) {
        return !(
          item.product._id === productId && item.variantId === variantId
        );
      }
      return item.product._id !== productId;
    });

    setCartItems(updatedItems);
    calculateTotals(updatedItems);

    try {
      const deleteUrl = variantId
        ? `${API_CART}/${productId}?variantId=${encodeURIComponent(variantId)}`
        : `${API_CART}/${productId}`;

      const res = await fetch(deleteUrl, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await res.json();

      if (res.ok && result.success !== false) {
        return true;
      }

      setCartItems(previousItems);
      setTotalItems(previousTotalItems);
      setSubtotal(previousSubtotal);

      if (res.status === 401) {
        toast.error("Your session has expired. Please log in again.");
        return false;
      }

      toast.error(result.message || "Failed to remove item from cart.");
      return false;
    } catch (err) {
      console.error("Remove from cart error:", err);
      setCartItems(previousItems);
      setTotalItems(previousTotalItems);
      setSubtotal(previousSubtotal);
      return false;
    }
  };

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        subtotal,
        loading,
        appliedReferrals,
        appliedReferral,
        referralDiscount,
        removeReferral,
        syncReferralFromStorage,
        appliedPoints,
        pointsDiscount,
        maxRedeemablePoints,
        userRewardPoints,
        applyRewardPoints,
        removeRewardPoints,
        addToCart,
        updateQuantity,
        removeFromCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ==========================================
// USE CART
// ==========================================

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
};
