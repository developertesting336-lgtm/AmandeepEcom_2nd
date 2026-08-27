import express from 'express'
import {getHomeTaglines} from '../controllers/admin.tagline.controller.js'
import { getProducts } from '../controllers/user.products.js';
import { getFeaturedProducts } from '../controllers/featured.product.js';
import { userOnly } from '../middlewares/admin.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';
import { addToCart, getCart, removeCartItem, updateCartItem } from '../controllers/cart.controller.js';
const router = express.Router();

router.post(
  "/cart",
  protect,
  userOnly,
  addToCart
);

router.get(
  "/cart",
  protect,
  userOnly,
  getCart
);

router.patch(
  "/cart/:productId",
  protect,
  userOnly,
  updateCartItem
);

router.delete(
  "/cart/:productId",
  protect,
  userOnly,
  removeCartItem
);
export default router