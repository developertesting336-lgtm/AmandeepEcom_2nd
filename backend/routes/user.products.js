import express from 'express'
import { getHomeTaglines } from '../controllers/admin.tagline.controller.js'
import { getProducts, wishListManage, getWishlist } from '../controllers/user.products.js';
import { getFeaturedProducts } from '../controllers/featured.product.js';
import { getCategories } from '../controllers/category.controller.js';
import { userOnly } from '../middlewares/admin.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.get("/featured", getFeaturedProducts);
router.get("/hometaglines", getHomeTaglines);
router.get("/products", getProducts);
// router.get("/categories",getCategories)
router.post("/wishlist/:productId", protect, userOnly, wishListManage)

router.get("/wishlist", protect, userOnly, getWishlist)

export default router