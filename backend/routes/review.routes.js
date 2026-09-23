import express from "express";
import {
  getProductReviews,
  checkReviewEligibility,
  createOrUpdateReview,
  deleteReview,
  voteHelpfulReview,
} from "../controllers/review.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { userOnly } from "../middlewares/admin.middleware.js";

const router = express.Router();

// =====================================================
// PUBLIC ROUTES
// =====================================================

// 1. Get all reviews for a specific product
router.get("/product/:productId", getProductReviews);

// =====================================================
// PROTECTED USER ROUTES
// =====================================================

// 2. Check if logged-in user is eligible to review (has delivered order)
// and fetch their existing review if already submitted
router.get("/eligibility/:productId", protect, userOnly, checkReviewEligibility);

// 3. Create or update review (unified endpoint: 1 review per product per user)
router.post("/", protect, userOnly, createOrUpdateReview);

// 4. Delete user's own review
router.delete("/:reviewId", protect, userOnly, deleteReview);

// 5. Upvote helpful count on a review
router.post("/:reviewId/helpful", protect, userOnly, voteHelpfulReview);

export default router;
