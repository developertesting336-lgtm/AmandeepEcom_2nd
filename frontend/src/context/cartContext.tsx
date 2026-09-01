import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./authContext";
// import { useNavigate } from "react-router-dom";


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

export interface CartItem {
  _id?: string;
  product: CartProduct;
  quantity: number;
  price?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  totalItems: number;
  subtotal: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  fetchCart: () => Promise<void>;
}

//  const navigate = useNavigate();

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const API_CART = `${API_BASE_URL}/api/cart`;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, logout } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // ==========================================
  // CALCULATE CART TOTALS
  // ==========================================

  const calculateTotals = (items: CartItem[]) => {
    const total = items.reduce(
      (acc, item) => acc + item.quantity,
      0
    );

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

      const itemPrice =
        item.price ??
        (productObj.salePrice &&
          productObj.salePrice < productObj.price
          ? productObj.salePrice
          : productObj.price || 0);

      return {
        _id: item._id || productObj._id,

        product: {
          _id: productObj._id || item.productId,
          name: productObj.name || "Product",
          price: productObj.price || 0,
          salePrice: productObj.salePrice || null,
          images: productObj.images || [],
          stock: productObj.stock ?? 10,
          category: productObj.category || "General",
          brand: productObj.brand || "",
        },

        quantity: qty,
        price: itemPrice,
      };
    });

    setCartItems(formattedItems);

    const calculatedTotalItems =
      data.totalItems ??
      data.data?.totalItems ??
      formattedItems.reduce(
        (acc, item) => acc + item.quantity,
        0
      );

    const calculatedSubtotal =
      data.subtotal ??
      data.data?.subtotal ??
      formattedItems.reduce(
        (acc, item) =>
          acc +
          (item.price ?? item.product.price) * item.quantity,
        0
      );

    setTotalItems(calculatedTotalItems);
    setSubtotal(calculatedSubtotal);
  };

  // ==========================================
  // FETCH CART
  // ==========================================

  const fetchCart = async () => {

    // console.log("isAuthenticated : ", isAuthenticated)
    // if (!isAuthenticated) {
    //   await logout();
    // }

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
        console.warn(
          "Cart fetch returned non-ok status:",
          result.message
        );

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

  // ==========================================
  // FETCH CART WHEN USER LOGS IN
  // ==========================================

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const addToCart = async (
    productId: string,
    quantity: number = 1
  ): Promise<boolean> => {

    // Update count immediately
    setTotalItems((prev) => prev + quantity);
    try {
      setLoading(true);

      const res = await fetch(API_CART, {
        method: "POST",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success !== false) {
        // Adding a product can change an existing cart item,
        // so fetch the latest cart after successful addition.
        // await fetchCart();

        return true;
      }

      if (res.status === 401) {
        alert("Your session has expired. Please log in again.");

        await logout(); // backend clears cookie + frontend clears user

        // navigate("/login", { replace: true });

        return false;
      }

      alert(result.message || "Failed to add product to cart.");
      return false;
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("An error occurred while adding to cart.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UPDATE QUANTITY - OPTIMISTIC UPDATE
  // ==========================================

  const updateQuantity = async (
    productId: string,
    quantity: number
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    // ------------------------------------------
    // Save previous state for rollback
    // ------------------------------------------

    const previousItems = cartItems;
    const previousTotalItems = totalItems;
    const previousSubtotal = subtotal;

    // ------------------------------------------
    // Update UI immediately
    // ------------------------------------------

    const updatedItems = cartItems.map((item) =>
      item.product._id === productId
        ? {
          ...item,
          quantity,
        }
        : item
    );

    setCartItems(updatedItems);
    calculateTotals(updatedItems);

    // ------------------------------------------
    // Send API request in background
    // ------------------------------------------

    try {
      const res = await fetch(`${API_CART}/${productId}`, {
        method: "PATCH",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          quantity,
        }),
      });

      const result = await res.json();

      // ------------------------------------------
      // API SUCCESS
      // ------------------------------------------

      if (res.ok && result.success !== false) {
        // Don't call fetchCart().
        // UI is already updated.
        return true;
      }

      // ------------------------------------------
      // API FAILURE → ROLLBACK
      // ------------------------------------------

      setCartItems(previousItems);
      setTotalItems(previousTotalItems);
      setSubtotal(previousSubtotal);

      if (res.status === 401) {
        alert("Your session has expired. Please log in again.");
        return false;
      }

      alert(result.message || "Failed to update quantity.");

      return false;
    } catch (err) {
      console.error("Update cart quantity error:", err);

      // ------------------------------------------
      // NETWORK ERROR → ROLLBACK
      // ------------------------------------------

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
    productId: string
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    // ------------------------------------------
    // Save previous state for rollback
    // ------------------------------------------

    const previousItems = cartItems;
    const previousTotalItems = totalItems;
    const previousSubtotal = subtotal;

    // ------------------------------------------
    // Remove from UI immediately
    // ------------------------------------------

    const updatedItems = cartItems.filter(
      (item) => item.product._id !== productId
    );

    setCartItems(updatedItems);
    calculateTotals(updatedItems);

    // ------------------------------------------
    // Send DELETE request in background
    // ------------------------------------------

    try {
      const res = await fetch(`${API_CART}/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await res.json();

      // ------------------------------------------
      // API SUCCESS
      // ------------------------------------------

      if (res.ok && result.success !== false) {
        // Don't call fetchCart().
        // UI is already updated.
        return true;
      }

      // ------------------------------------------
      // API FAILURE → ROLLBACK
      // ------------------------------------------

      setCartItems(previousItems);
      setTotalItems(previousTotalItems);
      setSubtotal(previousSubtotal);

      if (res.status === 401) {
        alert("Your session has expired. Please log in again.");
        return false;
      }

      alert(result.message || "Failed to remove item from cart.");

      return false;
    } catch (err) {
      console.error("Remove from cart error:", err);

      // ------------------------------------------
      // NETWORK ERROR → ROLLBACK
      // ------------------------------------------

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
    throw new Error(
      "useCart must be used within a CartProvider"
    );
  }

  return context;
};