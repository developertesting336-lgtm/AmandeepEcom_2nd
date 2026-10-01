import express from "express";
import { getDeliveryEstimate } from "../controllers/delivery.controller.js";

const router = express.Router();

// Public delivery estimation routes
router.get("/estimate/:pincode", getDeliveryEstimate);
// router.post("/estimate", getDeliveryEstimate);

export default router;
