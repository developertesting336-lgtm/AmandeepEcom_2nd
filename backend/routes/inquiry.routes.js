import express from "express";
import {
  submitInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
} from "../controllers/inquiry.controller.js";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Public / Authenticated route to submit contact inquiry
router.post("/", optionalAuth, submitInquiry);

// Admin-only management routes
router.get("/", protect, adminOnly, getAllInquiries);
router.get("/:id", protect, adminOnly, getInquiryById);
router.patch("/:id", protect, adminOnly, updateInquiryStatus);
router.delete("/:id", protect, adminOnly, deleteInquiry);

export default router;
