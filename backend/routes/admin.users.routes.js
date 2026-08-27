import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import { getAllUsers, toggleUserActive } from "../controllers/admin.users.js";

const router = express.Router();

// =====================================================
// USER MANAGEMENT ROUTES (ADMIN ONLY)
// =====================================================

// Get all users
// router.get("/all", protect, adminOnly, getAllUsers);
router.get("/", protect, adminOnly, getAllUsers);

// Toggle active/inactive status
router.post("/toggle-active/:userId", protect, adminOnly, toggleUserActive);

export default router;

