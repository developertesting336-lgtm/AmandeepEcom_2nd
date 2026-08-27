import express from "express";

import { protect } from "../middlewares/auth.middleware.js";
import { userOnly } from "../middlewares/admin.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { addProduct, updateProduct, getProduct, getProducts, deleteProduct, toggleProductActive, toggleProductFeatured } from "../controllers/admin.product.controller.js";
import { getCategories, addCategory, deleteCategory, updateCategory } from "../controllers/category.controller.js";
import { cod, getUserOrders, stripePayments, cancelOrderForUser } from '../controllers/user.order.js'


const router = express.Router();






router.post(
    "/cod",
    protect,
    userOnly,
    cod
)

router.post(
    "/payment-checkout-session",
    protect,
    userOnly,
    stripePayments
)
router.get(
    "",
    protect,
    userOnly,
    getUserOrders
)

router.patch(
    "/cancel/:orderId",
    protect,
    userOnly,
    cancelOrderForUser
)

// router.get(
//   "/product/:productId",
//   // protect,
//   // adminOnly,
//   getProduct
// );



export default router;