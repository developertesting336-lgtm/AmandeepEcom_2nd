import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import {
  getPublicTopOffers,
  getAdminTopOffers,
  updateTopOfferSettings,
  addTopOfferBanner,
  updateTopOfferBanner,
  deleteTopOfferBanner,
  toggleTopOfferBannerStatus,
  reorderTopOfferBanners,
  uploadTopOfferImage,
} from "../controllers/topOffer.controller.js";

const router = express.Router();

// Public route for homepage
router.get("/top-offers", getPublicTopOffers);

// Admin routes (Protected by authentication + admin role)
router.get("/admin/top-offers", protect, adminOnly, getAdminTopOffers);
router.put("/admin/top-offers/settings", protect, adminOnly, updateTopOfferSettings);

router.post(
  "/admin/top-offers/banners",
  protect,
  adminOnly,
  upload.single("image"),
  addTopOfferBanner
);

router.put(
  "/admin/top-offers/banners/:bannerId",
  protect,
  adminOnly,
  upload.single("image"),
  updateTopOfferBanner
);

router.delete(
  "/admin/top-offers/banners/:bannerId",
  protect,
  adminOnly,
  deleteTopOfferBanner
);

router.patch(
  "/admin/top-offers/banners/:bannerId/toggle",
  protect,
  adminOnly,
  toggleTopOfferBannerStatus
);

router.put(
  "/admin/top-offers/reorder",
  protect,
  adminOnly,
  reorderTopOfferBanners
);

router.post(
  "/admin/top-offers/upload",
  protect,
  adminOnly,
  upload.single("image"),
  uploadTopOfferImage
);

export default router;
