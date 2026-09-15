import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/user.js";

/**
 * Fetch and return detailed order information for a given user ID.
 * @param {string|mongoose.Types.ObjectId} userId - The user's ID.
 * @param {Object} [options={}] - Optional query options (e.g., limit, status).
 * @returns {Promise<Array<Object>>} List of orders with populated product details.
 */
export const getOrderDetailsByUserId = async (userId, options = {}) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to fetch order details.");
    }

    // Convert string to ObjectId if valid
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const query = { user: userObjectId };

    if (options.orderStatus) {
      query.orderStatus = options.orderStatus;
    }

    if (options.orderId) {
      query.orderId = options.orderId;
    }

    const limit = options.limit ? Number(options.limit) : 10;

    const orders = await Order.find(query)
      .populate({
        path: "products.productId",
        select: "name short_description price salePrice images mainImage sku",
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (!orders || orders.length === 0) {
      return [];
    }

    // Format orders for clean AI ingestion and readability
    return orders.map((order) => ({
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMode: order.paymentMode,
      orderTotal: order.orderTotal,
      itemsTotal: order.itemsTotal,
      deliveryCharges: order.deliveryCharges,
      createdAt: order.createdAt,
      shippingAddress: {
        fullname: order.shippingAddress?.fullname,
        phone: order.shippingAddress?.phone,
        city: order.shippingAddress?.city,
        state: order.shippingAddress?.state,
        postalCode: order.shippingAddress?.postalCode,
        country: order.shippingAddress?.country,
      },
      products: (order.products || []).map((item) => ({
        productName: item.productId?.name || "Unknown Product",
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        variantAttributes: item.variantAttributes || [],
      })),
      cancellationReason: order.cancellationReason || null,
      cancelledAt: order.cancelledAt || null,
    }));
  } catch (error) {
    console.error("Error in getOrderDetailsByUserId:", error);
    throw error;
  }
};

/**
 * Fetch and return user profile and contact information by user ID.
 * @param {string|mongoose.Types.ObjectId} userId - The user's ID.
 * @returns {Promise<Object|null>} User profile details without sensitive credentials.
 */
export const getUserInfoByUserId = async (userId) => {
  try {

    console.log("userID in tool", userId);
    if (!userId) {
      throw new Error("User ID is required to fetch user information.");
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const user = await User.findById(userObjectId)
      .select("-password -googleId")
      .lean();

    if (!user) {
      return null;
    }

    return {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      avatar: user.avatar || "",
      isActive: user.isActive,
      authProvider: user.authProvider,
      addresses: (user.addresses || []).map((addr) => ({
        addressId: addr._id ? addr._id.toString() : null,
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || "",
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        isDefault: addr.isDefault || false,
      })),
      memberSince: user.createdAt,
    };
  } catch (error) {
    console.error("Error in getUserInfoByUserId:", error);
    throw error;
  }
};

/**
 * Groq / OpenAI compatible tool definition for fetching order details.
 */
export const orderDetailsToolDefinition = {
  type: "function",
  function: {
    name: "getOrderDetailsByUserId",
    description: "Get list and details of recent orders placed by a specific user including status, items, amounts, and shipping address.",
    parameters: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The MongoDB ID of the user whose orders need to be fetched.",
        },
        orderId: {
          type: "string",
          description: "Optional specific Order ID to look up.",
        },
        orderStatus: {
          type: "string",
          enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
          description: "Optional order status filter.",
        },
        limit: {
          type: "number",
          description: "Maximum number of orders to return (default: 10).",
        },
      },
      required: ["userId"],
    },
  },
};

/**
 * Groq / OpenAI compatible tool definition for fetching user profile info.
 */
export const userInfoToolDefinition = {
  type: "function",
  function: {
    name: "getUserInfoByUserId",
    description: "Fetch profile, contact information, and saved addresses of a user using their user ID.",
    parameters: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The MongoDB ID of the user.",
        },
      },
      required: ["userId"],
    },
  },
};

// Aliases for convenience
export const findOrderDetailsByUserId = getOrderDetailsByUserId;
export const getUserOrderDetails = getOrderDetailsByUserId;
export const getUserInformation = getUserInfoByUserId;
export const getUserProfileByUserId = getUserInfoByUserId;

export default {
  getOrderDetailsByUserId,
  findOrderDetailsByUserId,
  getUserOrderDetails,
  getUserInfoByUserId,
  getUserInformation,
  getUserProfileByUserId,
  orderDetailsToolDefinition,
  userInfoToolDefinition,
};
