import express from "express";

import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { addProduct, updateProduct, getProduct, getProducts, deleteProduct, toggleProductActive, toggleProductFeatured } from "../controllers/admin.product.controller.js";
import { getCategories, addCategory, deleteCategory, updateCategory } from "../controllers/category.controller.js";
// import { cod, getUserOrders, stripePayments, cancelOrderForUser } from '../controllers/user.order.js'
import { getOrdersForadmin, refundGenrate, updatedOrderByAdmin } from "../controllers/admin.order.js";


const router = express.Router();






router.get(
    "/",
    protect,
    adminOnly,
    getOrdersForadmin
)

router.patch(
    "/:orderId",
    protect,
    adminOnly,
    updatedOrderByAdmin
)
router.patch(
    "/refund/:orderId",
    protect,
    adminOnly,
    refundGenrate
)

// router.patch(
//     "/cancel/:orderId",
//     protect,
//     adminOnly,
//     cancelOrderForUser
// )

// router.get(
//     "/:orderId",
//     // protect,
//     // adminOnly,
//     getOrderForadmin
// );



export default router;