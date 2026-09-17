import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import {
  getActivePromos,
  getAllPromosAdmin,
  createPromoAdmin,
  updatePromoAdmin,
  deletePromoAdmin,
  togglePromoStatus,
} from "../controllers/videoPromo.controller.js";

const router = express.Router();

// Public routes
router.get("/promos", getActivePromos);

// Admin routes (Protected)
router.get("/admin/promos", protect, adminOnly, getAllPromosAdmin);
router.post("/admin/promos", protect, adminOnly, createPromoAdmin);
router.put("/admin/promos/:id", protect, adminOnly, updatePromoAdmin);
router.delete("/admin/promos/:id", protect, adminOnly, deletePromoAdmin);
router.patch("/admin/promos/:id/toggle", protect, adminOnly, togglePromoStatus);

export default router;
