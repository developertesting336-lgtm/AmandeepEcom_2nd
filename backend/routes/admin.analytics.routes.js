import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import {
  getAnalytics,
  getLast30DaysAnalytics,
} from "../controllers/admin.analytics.controller.js";

const router = express.Router();

// GET /api/admin/analytics/overview
router.get("/overview", protect, adminOnly, getAnalytics);

// GET /api/admin/analytics/last-30-days
router.get("/last-30-days", protect, adminOnly, getLast30DaysAnalytics);

export default router;
