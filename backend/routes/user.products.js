import express from 'express'
import { getHomeTaglines } from '../controllers/admin.tagline.controller.js'
import { getProducts, wishListManage, getWishlist, getRecommendedProducts, getSimilarProducts } from '../controllers/user.products.js';
import { getFeaturedProducts } from '../controllers/featured.product.js';
import { getCategories } from '../controllers/category.controller.js';
import { userOnly } from '../middlewares/admin.middleware.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.get("/featured", getFeaturedProducts);
router.get("/hometaglines", getHomeTaglines);
router.get("/products", getProducts);
router.get("/recommended", optionalAuth, getRecommendedProducts);
router.get("/products/recommended", optionalAuth, getRecommendedProducts);
router.get("/similar/:productId", getSimilarProducts);
router.get("/products/similar/:productId", getSimilarProducts);
// router.get("/categories",getCategories)
router.post("/wishlist/:productId", protect, userOnly, wishListManage)

router.get("/wishlist", protect, userOnly, getWishlist)

export default router