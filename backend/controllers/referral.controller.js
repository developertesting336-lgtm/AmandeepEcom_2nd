import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import redis from "../config/redis.js";

/**
 * @desc    Generate a unique referral link for a product with signed JWT and Redis JTI tracking
 * @route   POST /api/referral/create-link
 * @route   POST /api/referral/create-link/:productId
 * @access  Private (Logged-in User)
 */
export const createReferralLink = async (req, res) => {
  try {
    const creatorId = req.user?._id;
    const productId = req.body?.productId || req.params?.productId;

    if (!creatorId) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to create a referral link",
      });
    }

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "A valid Product ID is required",
      });
    }

    // 1. Fetch Product
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or is currently inactive",
      });
    }

    // 2. Check if referral is enabled on this product
    if (product.referral && product.referral.isEnabled === false) {
      return res.status(400).json({
        success: false,
        message: "Referral program is not enabled for this product",
      });
    }

    // 3. Extract admin-configured discount and reward points (with safe defaults)
    const discountAmount =
      typeof product.referral?.discountAmount === "number"
        ? product.referral.discountAmount
        : 50;

    const rewardPoints =
      typeof product.referral?.rewardPoints === "number"
        ? product.referral.rewardPoints
        : 100;

    // 4. Generate unique JTI (JWT ID) for Redis single-use tracking
    const jti = `ref_${crypto.randomUUID().replace(/-/g, "")}`;

    // 5. Expiry: 7 days in seconds
    const expiresInSeconds = 7 * 24 * 60 * 60;
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresInSeconds;

    // 6. Build JWT Payload matching user specification
    const payload = {
      jti,
      type: "referral_coupon",
      creator_id: creatorId.toString(),
      product_id: product._id.toString(),
      discount_amount: discountAmount,
      reward_points: rewardPoints,
      iat,
      exp,
    };

    // 7. Sign JWT with secret key
    const secret =
      process.env.REFERRAL_JWT_SECRET || process.env.JWT_SECRET || "referral_jwt_default_secret_key";

    const token = jwt.sign(payload, secret);

    // 8. Store JTI in Redis with TTL matching token expiry for single-use check
    const redisKey = `referral:jti:${jti}`;
    await redis.set(
      redisKey,
      JSON.stringify({
        status: "active",
        creator_id: creatorId.toString(),
        product_id: product._id.toString(),
        discount_amount: discountAmount,
        reward_points: rewardPoints,
        createdAt: new Date().toISOString(),
      }),
      "EX",
      expiresInSeconds
    );

    // 9. Construct shareable URL
    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    const referralLink = `${frontendUrl}/products/${product._id}?ref=${token}`;

    return res.status(201).json({
      success: true,
      message: "Referral link created successfully",
      data: {
        referralLink,
        token,
        payload,
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          salePrice: product.salePrice,
        },
      },
    });
  } catch (error) {
    console.error("Create Referral Link Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate referral link",
      error: error.message,
    });
  }
};
