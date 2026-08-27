import express from "express";

import {
  getUserDashboard,
  getAdminDashboard,
} from "../controllers/dashboard.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly, userOnly } from "../middlewares/admin.middleware.js";

const router = express.Router();


router.get("/user", protect,userOnly, getUserDashboard);


router.get("/admin", protect, adminOnly, getAdminDashboard);

export default router;