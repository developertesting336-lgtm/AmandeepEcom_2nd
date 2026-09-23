import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// =====================================================
// 1. GET ALL REVIEWS FOR A PRODUCT (Public)
// =====================================================
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Verify product exists and fetch cached ratings & distribution
    const product = await Product.findById(productId).select(
      "ratingsAverage ratingsCount ratingDistribution name"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Query parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Filter by specific star rating if requested
    const filter = { productId };
    if (req.query.stars && [1, 2, 3, 4, 5].includes(Number(req.query.stars))) {
      filter.stars = Number(req.query.stars);
    }

    // Sort order
    const sortBy = req.query.sort || "newest";
    let sortQuery = { createdAt: -1 };
    if (sortBy === "highest") {
      sortQuery = { stars: -1, createdAt: -1 };
    } else if (sortBy === "lowest") {
      sortQuery = { stars: 1, createdAt: -1 };
    } else if (sortBy === "helpful") {
      sortQuery = { helpfulVotes: -1, createdAt: -1 };
    }

    // Query reviews and count
    const [reviews, totalFiltered] = await Promise.all([
      Review.find(filter)
        .populate("userId", "name")
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: {
        ratingsAverage: product.ratingsAverage || 0,
        ratingsCount: product.ratingsCount || 0,
        ratingDistribution: product.ratingDistribution || {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        reviews,
        pagination: {
          page,
          limit,
          totalFiltered,
          totalPages: Math.ceil(totalFiltered / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("Get Product Reviews Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// =====================================================
// 2. CHECK REVIEW ELIGIBILITY (Protected)
// =====================================================
export const checkReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check if the user has a DELIVERED order for this product
    const deliveredOrder = await Order.findOne({
      user: userId,
      orderStatus: "delivered",
      "products.productId": productId,
    }).select("_id orderId orderStatus createdAt");

    // Check if the user has already submitted a review for this product
    const existingReview = await Review.findOne({
      productId,
      userId,
    }).lean();

    const canReview = Boolean(deliveredOrder);
    const hasReviewed = Boolean(existingReview);

    let message = "";
    if (!canReview) {
      message = "You can only review products that have been delivered to you.";
    } else if (hasReviewed) {
      message = "You have already reviewed this product. You can edit your review.";
    } else {
      message = "You are eligible to review this product.";
    }

    return res.status(200).json({
      success: true,
      canReview,
      hasReviewed,
      review: existingReview || null,
      deliveredOrder: deliveredOrder || null,
      message,
    });
  } catch (error) {
    console.error("Check Review Eligibility Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check review eligibility",
      error: error.message,
    });
  }
};

// =====================================================
// 3. CREATE OR UPDATE REVIEW (Protected - Upsert)
// =====================================================
export const createOrUpdateReview = async (req, res) => {
  try {
    const { productId, stars, detailedReview } = req.body;
    const userId = req.user._id;

    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "A valid product ID is required",
      });
    }

    // Validate stars rating (1 to 5)
    const numStars = Number(stars);
    if (!numStars || isNaN(numStars) || numStars < 1 || numStars > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5 stars",
      });
    }

    // Validate detailed review text
    if (
      !detailedReview ||
      typeof detailedReview !== "string" ||
      detailedReview.trim().length < 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Detailed review must be at least 5 characters long",
      });
    }

    if (detailedReview.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Detailed review cannot exceed 2000 characters",
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Verify user has purchased and received delivery of this product
    const deliveredOrder = await Order.findOne({
      user: userId,
      orderStatus: "delivered",
      "products.productId": productId,
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: "You can only review products that have been delivered to you.",
      });
    }

    // Check if user already reviewed this product (Upsert pattern)
    let review = await Review.findOne({ productId, userId });
    let isUpdated = false;

    if (review) {
      // Update existing review
      review.stars = numStars;
      review.detailedReview = detailedReview.trim();
      await review.save(); // triggers post("save") which recalculates average and star distribution
      isUpdated = true;
    } else {
      // Create new review
      review = await Review.create({
        productId,
        userId,
        stars: numStars,
        detailedReview: detailedReview.trim(),
      });
      // Review.create() calls save(), which triggers post("save")
    }

    // Populate user info for immediate frontend display
    await review.populate("userId", "name");

    return res.status(isUpdated ? 200 : 201).json({
      success: true,
      isUpdated,
      message: isUpdated
        ? "Review updated successfully!"
        : "Review submitted successfully!",
      data: {
        review,
      },
    });
  } catch (error) {
    console.error("Create or Update Review Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message,
    });
  }
};

// =====================================================
// 4. DELETE REVIEW (Protected)
// =====================================================
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Only owner of the review or admin can delete it
    if (
      review.userId.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review",
      });
    }

    // Deleting the document triggers post("deleteOne") hook to recalculate product rating
    await review.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete Review Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

// =====================================================
// 5. UPVOTE HELPFUL VOTES (Protected)
// =====================================================
export const voteHelpfulReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulVotes: 1 } },
      { new: true }
    ).select("helpfulVotes");

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Thank you for your feedback!",
      data: {
        helpfulVotes: updatedReview.helpfulVotes,
      },
    });
  } catch (error) {
    console.error("Vote Helpful Review Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit helpful vote",
      error: error.message,
    });
  }
};
