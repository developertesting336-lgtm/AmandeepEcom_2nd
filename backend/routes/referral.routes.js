import express from "express";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";
import {
  createReferralLink,
  verifyReferralToken,
} from "../controllers/referral.controller.js";
import { getUserRewardHistory } from "../controllers/reward.controller.js";

const router = express.Router();

// 1. Create referral link
router.post("/create-link", protect, createReferralLink);

// 2. Validate referral link
router.post("/validate", optionalAuth, verifyReferralToken);

// 3. User reward points history
router.get("/points-history", protect, getUserRewardHistory);
router.get("/history", protect, getUserRewardHistory);

export default router;
