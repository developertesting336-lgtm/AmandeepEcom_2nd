import express from 'express'
import { getHomeTaglines } from '../controllers/admin.tagline.controller.js'
import {
  getProducts,
  wishListManage,
  getWishlist,
  getRecommendedProducts,
  getSimilarProducts,
  getPopularProducts,
} from '../controllers/user.products.js';
import { getProduct } from '../controllers/admin.product.controller.js';
import { getFeaturedProducts } from '../controllers/featured.product.js';
import { getCategories } from '../controllers/category.controller.js';
import { userOnly } from '../middlewares/admin.middleware.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.get("/featured", getFeaturedProducts);
router.get("/hometaglines", getHomeTaglines);

// Popular / Best-selling products (orders in last 30 days)
router.get("/popular", getPopularProducts);
router.get("/products/popular", getPopularProducts);

// Personalized recommendations
router.get("/recommended", optionalAuth, getRecommendedProducts);
router.get("/products/recommended", optionalAuth, getRecommendedProducts);

// All products & category search
router.get("/products", getProducts);

// Similar products
router.get("/similar/:productId", getSimilarProducts);
router.get("/products/similar/:productId", getSimilarProducts);

// Single product details
router.get("/product/:productId", optionalAuth, getProduct);
router.get("/products/:productId", optionalAuth, getProduct);

// Wishlist
router.post("/wishlist/:productId", protect, userOnly, wishListManage);
router.get("/wishlist", protect, userOnly, getWishlist);

export default router;