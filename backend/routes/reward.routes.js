import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import {
  getUserRewardHistory,
  getAdminRewardHistory,
} from "../controllers/reward.controller.js";

const router = express.Router();

// 1. Get current user's reward point history (earned & redeemed)
router.get("/history", protect, getUserRewardHistory);

// 2. Admin: Get all reward points transactions across all users
router.get("/admin/history", protect, adminOnly, getAdminRewardHistory);

export default router;
