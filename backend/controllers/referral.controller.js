import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import redis from "../config/redis.js";

/**
 * @desc    Generate a unique referral link for a product with signed JWT and Redis JTI tracking
 * @route   POST /api/referral/create-link
 * @access  Private (Logged-in User)
 */
export const createReferralLink = async (req, res) => {
  try {
    const creatorId = req.user?._id;
    const { productId } = req.body;

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
    if (!product.referral || !product.referral.isEnabled) {
      return res.status(400).json({
        success: false,
        message: "Referral program is not enabled for this product",
      });
    }

    // 3. Extract admin-configured discount and reward points
    const discountAmount = Number(product.referral.discountAmount) || 0;
    const rewardPoints = Number(product.referral.rewardPoints) || 0;

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

    const referralLink = `${frontendUrl}/product/${product._id}?ref=${token}`;

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

/**
 * @desc    Validate a referral token: check JWT signature, expiry, and Redis JTI single-use existence
 * @route   POST /api/referral/validate
 * @access  Public
 */
export const verifyReferralToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Referral token is required",
      });
    }

    // 1. Verify JWT signature & expiration
    const secret =
      process.env.REFERRAL_JWT_SECRET || process.env.JWT_SECRET || "referral_jwt_default_secret_key";

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "This referral link has expired"
          : "Invalid or corrupted referral link";

      return res.status(400).json({
        success: false,
        message,
      });
    }

    // 2. Validate payload structure
    if (decoded.type !== "referral_coupon" || !decoded.jti || !decoded.product_id) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral coupon payload",
      });
    }

    // 3. Prevent self-referral: current user cannot use their own referral link
    const currentUserId = (
      req.user?._id ||
      req.user?.id ||
      req.body?.currentUserId
    )?.toString();
    const creatorId = decoded.creator_id?.toString();

    if (currentUserId && creatorId && currentUserId === creatorId) {
      return res.status(400).json({
        success: false,
        isSelfReferral: true,
        message: "You cannot use your own referral link",
      });
    }

    // 4. Verify JTI exists in Redis (ensures single-use and not yet burned/expired)
    const redisKey = `referral:jti:${decoded.jti}`;
    const redisData = await redis.get(redisKey);

    if (!redisData) {
      return res.status(400).json({
        success: false,
        message: "This referral link has already been used or has expired",
      });
    }

    // 5. Verify product exists and is active
    const product = await Product.findById(decoded.product_id).select(
      "name price salePrice images isActive referral variants hasVariants"
    );

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "The referred product is no longer active or available",
      });
    }

    const basePrice = Number(product.price) || 0;
    const regularPrice =
      product.salePrice !== undefined && product.salePrice !== null && Number(product.salePrice) < basePrice
        ? Number(product.salePrice)
        : basePrice;

    const discountAmount = Number(decoded.discount_amount) || 0;
    const updatedPrice = Math.max(0, regularPrice - discountAmount);

    return res.status(200).json({
      success: true,
      message: "Referral coupon is valid",
      data: {
        productId: decoded.product_id,
        productName: product.name,
        discountAmount: discountAmount,
        rewardPoints: decoded.reward_points,
        creatorId: decoded.creator_id,
        originalPrice: basePrice,
        regularPrice: regularPrice,
        updatedPrice: updatedPrice,
        discountedPrice: updatedPrice,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Verify Referral Token Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify referral token",
      error: error.message,
    });
  }
};

