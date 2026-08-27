export interface PlaceCodOrderPayload {
  userId?: string;
  productId?: string;
  products?: Array<{
    productId: string;
    quantity: number;
    price?: number;
  }>;
  items?: Array<{
    productId: string;
    quantity: number;
    price?: number;
  }>;
  paymentMode: string;
  address: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    tag?: string;
  };
  totalAmount?: number;
}

export interface PlaceCodOrderResponse {
  success: boolean;
  orderId?: string;
  data?: any;
  message?: string;
  error?: string;
}

export interface OrderProductImage {
  _id?: string;
  url: string;
  public_id?: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface OrderItemProduct {
  _id?: string;
  name?: string;
  price?: number;
  salePrice?: number | null;
  salesPrice?: number | null;
  images?: Array<OrderProductImage | string | { url?: string }>;
  image?: string;
  category?: any;
  brand?: string;
}

export interface UserOrderItem {
  _id?: string;
  productId?: string | OrderItemProduct;
  product?: OrderItemProduct | string;
  name?: string;
  productName?: string;
  purchasePrice?: number;
  price?: number;
  quantity: number;
  images?: Array<OrderProductImage | string | { url?: string }>;
  image?: string;
}

export interface UserOrderAddress {
  fullname?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  address?: string;
  addressLine?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  pincode?: string;
  zipCode?: string;
  country?: string;
  tag?: string;
}

export interface UserOrder {
  _id: string;
  orderId?: string;
  user?: string | any;
  userId?: string | any;
  products?: UserOrderItem[];
  items?: UserOrderItem[];
  itemsTotal?: number;
  deliveryCharges?: number;
  orderTotal?: number;
  totalAmount?: number;
  amount?: number;
  shippingAddress?: UserOrderAddress;
  address?: UserOrderAddress;
  paymentMode?: string;
  paymentMethod?: string;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded" | string;
  orderStatus?: "Pending" | "Processing" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled" | string;
  status?: string;
  reason?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface GetOrdersResponse {
  success: boolean;
  count?: number;
  orders: UserOrder[];
  message?: string;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface PlaceStripeOrderPayload {
  userId?: string;
  productId?: string;
  products?: Array<{
    productId: string;
    quantity: number;
    price?: number;
    purchasePrice?: number;
  }>;
  items?: Array<{
    productId: string;
    quantity: number;
    price?: number;
  }>;
  paymentMode?: string;
  address?: {
    fullName?: string;
    fullname?: string;
    phone?: string;
    addressLine?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    postalCode?: string;
    tag?: string;
    country?: string;
  };
  shippingAddress?: {
    fullname?: string;
    fullName?: string;
    phone?: string;
    address?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    pincode?: string;
    country?: string;
    tag?: string;
  };
  itemsTotal?: number;
  deliveryCharges?: number;
  totalAmount?: number;
  orderTotal?: number;
}

export interface PlaceStripeOrderResponse {
  success: boolean;
  url?: string;
  sessionUrl?: string;
  checkoutUrl?: string;
  sessionId?: string;
  orderId?: string;
  data?: any;
  message?: string;
  error?: string;
}

/**
 * Places a Cash on Delivery (COD) order via POST /api/order/cod
 */
export const placeCodOrder = async (
  payload: PlaceCodOrderPayload,
  token?: string | null
): Promise<PlaceCodOrderResponse> => {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/order/cod`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success !== false) {
      // Extract orderId from various possible response formats
      const orderId =
        result.orderId ||
        result.order?._id ||
        result.order?.orderId ||
        result.data?.orderId ||
        result.data?._id ||
        result.data?.order?._id ||
        result._id ||
        `OD${Date.now().toString().slice(-8)}`;

      return {
        success: true,
        orderId,
        data: result.data || result,
        message: result.message || "Order placed successfully!",
      };
    } else {
      return {
        success: false,
        error: result.message || "Failed to place COD order. Please try again.",
      };
    }
  } catch (err: any) {
    console.error("Error placing COD order:", err);
    return {
      success: false,
      error: err.message || "Network error while connecting to server. Please try again.",
    };
  }
};

/**
 * Creates a Stripe Checkout Session via POST /api/order/payment-checkout-session
 */
export const placestripeOrder = async (
  payload: PlaceStripeOrderPayload | PlaceCodOrderPayload | any,
  token?: string | null
): Promise<PlaceStripeOrderResponse> => {
  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/order/payment-checkout-session`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success !== false) {
      const redirectUrl =
        result.url ||
        result.sessionUrl ||
        result.checkoutUrl ||
        result.session?.url ||
        result.data?.url ||
        result.data?.sessionUrl ||
        result.data?.checkoutUrl;

      return {
        success: true,
        url: redirectUrl,
        sessionId: result.sessionId || result.session?.id || result.data?.id,
        orderId: result.orderId || result.order?._id || result.data?.orderId,
        data: result.data || result,
        message: result.message || "Stripe checkout session created successfully",
      };
    } else {
      return {
        success: false,
        error: result.message || "Failed to create Stripe payment checkout session. Please try again.",
      };
    }
  } catch (err: any) {
    console.error("Error creating Stripe checkout session:", err);
    return {
      success: false,
      error: err.message || "Network error while connecting to payment gateway.",
    };
  }
};

export const placeStripeOrder = placestripeOrder;

/**
 * Fetches user orders via GET /api/order
 */
export const getUserOrders = async (token?: string | null): Promise<GetOrdersResponse> => {
  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/order`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok && result.success !== false) {
      // Handle various response wrappers: { orders: [...] }, { data: [...] }, { data: { orders: [...] } }, or array directly
      let ordersList: UserOrder[] = [];
      if (Array.isArray(result)) {
        ordersList = result;
      } else if (Array.isArray(result.orders)) {
        ordersList = result.orders;
      } else if (Array.isArray(result.data)) {
        ordersList = result.data;
      } else if (result.data && Array.isArray(result.data.orders)) {
        ordersList = result.data.orders;
      } else if (result.order && typeof result.order === "object") {
        ordersList = [result.order];
      }

      return {
        success: true,
        orders: ordersList,
        message: result.message || "Orders fetched successfully",
      };
    } else {
      return {
        success: false,
        orders: [],
        error: result.message || "Failed to load orders",
      };
    }
  } catch (err: any) {
    console.error("Error fetching user orders from /api/order:", err);
    return {
      success: false,
      orders: [],
      error: err.message || "Network error while fetching orders",
    };
  }
};

export interface CancelOrderResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Cancels an order via PATCH / POST /api/order/cancel/:orderId with reason
 */
export const cancelUserOrder = async (
  orderId: string,
  reason: string,
  token?: string | null
): Promise<CancelOrderResponse> => {
  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    // Attempt PATCH first (or fallback to POST if 404/405)
    let response = await fetch(`${API_BASE_URL}/api/order/cancel/${orderId}`, {
      method: "PATCH",
      headers,
      credentials: "include",
      body: JSON.stringify({ reason }),
    });

    if (response.status === 404 || response.status === 405) {
      response = await fetch(`${API_BASE_URL}/api/order/cancel/${orderId}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
    }

    const result = await response.json();

    if (response.ok && result.success !== false) {
      return {
        success: true,
        message: result.message || "Order cancelled successfully",
        data: result.data || result,
      };
    } else {
      return {
        success: false,
        error: result.message || "Failed to cancel order. Please try again.",
      };
    }
  } catch (err: any) {
    console.error("Error cancelling order:", err);
    return {
      success: false,
      error: err.message || "Network error while cancelling order.",
    };
  }
};

export const cancelOrder = cancelUserOrder;

/**
 * Fetches all orders for Admin via GET /api/admin/order
 */
export const getAdminOrders = async (token?: string | null): Promise<GetOrdersResponse> => {
  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    let response = await fetch(`${API_BASE_URL}/api/admin/order`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (response.status === 404) {
      response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
        method: "GET",
        headers,
        credentials: "include",
      });
    }

    const result = await response.json();

    if (response.ok && result.success !== false) {
      let ordersList: UserOrder[] = [];
      if (Array.isArray(result)) {
        ordersList = result;
      } else if (Array.isArray(result.orders)) {
        ordersList = result.orders;
      } else if (Array.isArray(result.data)) {
        ordersList = result.data;
      } else if (result.data && Array.isArray(result.data.orders)) {
        ordersList = result.data.orders;
      } else if (result.order && typeof result.order === "object") {
        ordersList = [result.order];
      }

      return {
        success: true,
        count: result.count || ordersList.length,
        orders: ordersList,
        message: result.message || "Admin orders fetched successfully",
      };
    } else {
      return {
        success: false,
        orders: [],
        error: result.message || "Failed to load admin orders",
      };
    }
  } catch (err: any) {
    console.error("Error fetching admin orders from /api/admin/order:", err);
    return {
      success: false,
      orders: [],
      error: err.message || "Network error while fetching admin orders",
    };
  }
};

/**
 * Updates order status or payment status via PATCH /api/admin/order/:orderId
 */
export const updateAdminOrderStatus = async (
  orderId: string,
  updates: { orderStatus?: string; status?: string; paymentStatus?: string;[key: string]: any },
  token?: string | null
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const payload = {
      ...updates,
      ...(updates.orderStatus ? { orderStatus: updates.orderStatus, status: updates.orderStatus } : {}),
    };

    let response = await fetch(`${API_BASE_URL}/api/admin/order/${orderId}`, {
      method: "PATCH",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (response.status === 404 || response.status === 405) {
      response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });
    }

    if (response.status === 404 || response.status === 405) {
      response = await fetch(`${API_BASE_URL}/api/order/status/${orderId}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });
    }

    const result = await response.json();

    if (response.ok && result.success !== false) {
      return {
        success: true,
        message: result.message || "Order updated successfully",
      };
    } else {
      return {
        success: false,
        error: result.message || "Failed to update order",
      };
    }
  } catch (err: any) {
    console.error("Error updating admin order:", err);
    return {
      success: false,
      error: err.message || "Network error while updating order",
    };
  }
};

/**
 * Issues a refund for an order via /refund/:orderId endpoint
 */
export const refundAdminOrder = async (
  orderId: string,
  token?: string | null
): Promise<{ success: boolean; message?: string; data?: any; error?: string }> => {
  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    // Primary: PATCH /api/admin/order/refund/:orderId
    let response = await fetch(`${API_BASE_URL}/api/admin/order/refund/${orderId}`, {
      method: "PATCH",
      headers,
      credentials: "include",
    });

    if (response.status === 404 || response.status === 405) {
      // Fallback 1: PATCH /api/order/refund/:orderId
      response = await fetch(`${API_BASE_URL}/api/order/refund/${orderId}`, {
        method: "PATCH",
        headers,
        credentials: "include",
      });
    }

    if (response.status === 404 || response.status === 405) {
      // Fallback 2: PATCH /api/refund/:orderId
      response = await fetch(`${API_BASE_URL}/api/refund/${orderId}`, {
        method: "PATCH",
        headers,
        credentials: "include",
      });
    }

    const result = await response.json();

    if (response.ok && result.success !== false) {
      return {
        success: true,
        message: result.message || "Refund processed successfully",
        data: result.data || result,
      };
    } else {
      return {
        success: false,
        error: result.message || "Failed to process refund",
      };
    }
  } catch (err: any) {
    console.error("Error issuing refund:", err);
    return {
      success: false,
      error: err.message || "Network error while processing refund",
    };
  }
};

export const refundOrder = refundAdminOrder;




