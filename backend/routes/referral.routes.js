import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { createReferralLink } from "../controllers/referral.controller.js";

const router = express.Router();

// Generate referral link for a product (logged-in users only)
// Supports productId either in JSON body or as URL param
router.post("/create-link", protect, createReferralLink);
router.post("/create-link/:productId", protect, createReferralLink);

export default router;
