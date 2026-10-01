import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import {
  addPincode,
  bulkAddPincodes,
  getAllPincodes,
  getPincodeDetails,
  updatePincode,
  deletePincode,
  getWarehouseConfig,
  updateWarehouseConfig,
} from "../controllers/admin.delivery.controller.js";

const router = express.Router();

// Apply auth and admin check to all admin delivery routes
router.use(protect, adminOnly);

// Pincode management
router.post("/pincode", addPincode);
router.post("/pincode/bulk", bulkAddPincodes);
router.get("/pincodes", getAllPincodes);
router.get("/pincode/:pincode", getPincodeDetails);
router.patch("/pincode/:pincode", updatePincode);
router.delete("/pincode/:pincode", deletePincode);

// Warehouse configuration
router.get("/warehouse", getWarehouseConfig);
router.put("/warehouse", updateWarehouseConfig);

export default router;
