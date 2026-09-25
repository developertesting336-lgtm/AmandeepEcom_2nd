import mongoose from "mongoose";

const rewardPointTransactionSchema = new mongoose.Schema(
  {
    // The user whose account points are credited or debited
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Transaction type:
    // 'EARNED': points earned when another user buys a product using this user's referral
    // 'REDEEMED': points used/spent by this user as a discount on an order
    // 'REFUNDED': points refunded if order was cancelled
    type: {
      type: String,
      enum: ["EARNED", "REDEEMED", "REFUNDED"],
      required: true,
      index: true,
    },

    // Number of points (positive number)
    points: {
      type: Number,
      required: true,
      min: 1,
    },

    // User's point balance after this transaction was applied
    balanceAfter: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Associated Order ObjectId reference
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },

    // Human-readable Order ID (e.g., "ORD-1727258410294-8219")
    orderId: {
      type: String,
      index: true,
    },

    // Product info (which product was bought)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    productName: {
      type: String,
      trim: true,
      default: "",
    },

    // Buyer info (which user bought the product via the referral link)
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    buyerName: {
      type: String,
      trim: true,
      default: "",
    },
    buyerEmail: {
      type: String,
      trim: true,
      default: "",
    },

    // Quantity of product bought
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Referral token used for this transaction
    referralToken: {
      type: String,
      trim: true,
      default: "",
    },

    // Discount amount in currency (1 point = 1 rupee discount) when redeemed
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Human-readable transaction description
    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["COMPLETED", "PENDING", "CANCELLED"],
      default: "COMPLETED",
    },
  },
  {
    timestamps: true,
  }
);

// Fast index for user point statement / history
rewardPointTransactionSchema.index({ user: 1, createdAt: -1 });

const RewardPointTransaction = mongoose.model(
  "RewardPointTransaction",
  rewardPointTransactionSchema
);

export default RewardPointTransaction;
