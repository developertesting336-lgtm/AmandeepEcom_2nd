import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    // Unique JWT ID (JTI) for single-use referral tracking (e.g., ref_a1b2c3d4...)
    jti: {
      type: String,
      required: [true, "Referral JTI is required"],
      unique: true,
      index: true,
      trim: true,
    },

    // Optional raw signed JWT token string
    token: {
      type: String,
      trim: true,
      default: "",
    },

    // User who generated the referral link
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator user ID is required"],
      index: true,
    },

    // Product being referred
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Referred product ID is required"],
      index: true,
    },

    // Fixed discount amount applied to the referred product for the buyer
    discountAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Reward points credited to creator upon successful buyer purchase
    rewardPoints: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Referral token lifecycle status
    status: {
      type: String,
      enum: ["active", "used", "expired", "revoked"],
      default: "active",
      index: true,
    },

    // Buyer who redeemed the referral link
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Associated Order reference upon redemption
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    // Human-readable Order ID (e.g. ORD-1727258410294-8219)
    orderId: {
      type: String,
      trim: true,
      default: "",
    },

    // Timestamp when the referral link was redeemed
    usedAt: {
      type: Date,
      default: null,
    },

    // MongoDB TTL Index: Document automatically deleted once expiresAt timestamp is reached
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast query resolution
referralSchema.index({ creator: 1, status: 1 });
referralSchema.index({ product: 1, status: 1 });
referralSchema.index({ jti: 1, status: 1 });

const Referral = mongoose.model("Referral", referralSchema);

export default Referral;
