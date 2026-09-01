import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getAdminProfile,
} from "../controllers/profile.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly, userOnly } from "../middlewares/admin.middleware.js";

const router = express.Router();

// =====================================================
// USER PROFILE ROUTES
// =====================================================

// 1. Get user profile
router.get("/user", protect, userOnly, getUserProfile);

// 2. Edit user profile (with old password verification)
router.put("/user", protect, userOnly, updateUserProfile);
router.put("/user/profile", protect, userOnly, updateUserProfile);

// 3. Update password (with old password verification)
router.put("/user/password", protect, userOnly, updatePassword);
router.put("/password", protect, userOnly, updatePassword);

// =====================================================
// ADMIN PROFILE ROUTES
// =====================================================
router.get("/admin", protect, adminOnly, getAdminProfile);

export default router;