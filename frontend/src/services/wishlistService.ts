// Wishlist Service for fetching and toggling wishlisted items
// Communicates with /api/wishlist and /api/wishlist/:productId

export interface WishlistProductImage {
  _id?: string;
  url: string;
  public_id?: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface WishlistProduct {
  _id: string;
  name: string;
  description?: string;
  short_description?: string;
  full_description?: string;
  price: number;
  salePrice?: number | null;
  sku?: string;
  stock?: number;
  category?: string | { _id?: string; name?: string };
  subcategory?: string | { _id?: string; name?: string };
  brand?: string;
  images?: WishlistProductImage[] | string[];
  isFeatured?: boolean;
  isActive?: boolean;
  highlights?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GetWishlistResponse {
  success: boolean;
  products: WishlistProduct[];
  message?: string;
  error?: string;
}

export interface ToggleWishlistResponse {
  success: boolean;
  action?: "added" | "removed" | string;
  message?: string;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * Fetches wishlisted products via GET /api/wishlist
 */
export const getWishlist = async (token?: string | null): Promise<GetWishlistResponse> => {
  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok && result.success !== false) {
      // Products can be at result.products, result.data, or result directly
      let productsList: WishlistProduct[] = [];
      if (Array.isArray(result.products)) {
        productsList = result.products;
      } else if (Array.isArray(result.data)) {
        productsList = result.data;
      } else if (result.data && Array.isArray(result.data.products)) {
        productsList = result.data.products;
      } else if (Array.isArray(result)) {
        productsList = result;
      }

      return {
        success: true,
        products: productsList,
        message: result.message || "Wishlist fetched successfully",
      };
    } else {
      return {
        success: false,
        products: [],
        error: result.message || "Failed to fetch wishlist",
      };
    }
  } catch (err: any) {
    console.error("Error fetching wishlist from /api/wishlist:", err);
    return {
      success: false,
      products: [],
      error: err.message || "Network error while fetching wishlist",
    };
  }
};

/**
 * Toggles product in wishlist via POST /api/wishlist/:productId
 */
export const toggleWishlistItem = async (
  productId: string,
  token?: string | null
): Promise<ToggleWishlistResponse> => {
  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/wishlist/${productId}`, {
      method: "POST",
      headers,
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok && result.success !== false) {
      return {
        success: true,
        action: result.action || (result.message?.includes("removed") ? "removed" : "added"),
        message: result.message || "Wishlist updated",
      };
    } else {
      return {
        success: false,
        error: result.message || "Failed to update wishlist",
      };
    }
  } catch (err: any) {
    console.error("Error toggling wishlist item:", err);
    return {
      success: false,
      error: err.message || "Network error while updating wishlist",
    };
  }
};
