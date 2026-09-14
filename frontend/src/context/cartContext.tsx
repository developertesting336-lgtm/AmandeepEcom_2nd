import {
  createContext,
  useContext,
  useEffect,
  useState,
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

interface CartContextType {
  cartItems: CartItem[];
  totalItems: number;
  subtotal: number;
  loading: boolean;
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

  // ==========================================
  // CALCULATE CART TOTALS
  // ==========================================

  const calculateTotals = (items: CartItem[]) => {
    const total = items.reduce((acc, item) => acc + item.quantity, 0);

    const subTotal = items.reduce(
      (acc, item) =>
        acc + (item.price ?? item.product.price) * item.quantity,
      0
    );

    setTotalItems(total);
    setSubtotal(subTotal);
  };

  // ==========================================
  // PARSE CART RESPONSE
  // ==========================================

  const parseCartResponse = (data: any) => {
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
  };

  // ==========================================
  // FETCH CART WHEN USER LOGS IN
  // ==========================================

  const fetchCart = async () => {
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
  };

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
    // Update count optimistically
    setTotalItems((prev) => prev + quantity);
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

      // Roll back optimistic total count
      setTotalItems((prev) => Math.max(0, prev - quantity));

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
      setTotalItems((prev) => Math.max(0, prev - quantity));
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
      return match ? { ...item, quantity } : item;
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
