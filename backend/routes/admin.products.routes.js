import express from "express";

import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly, userOnly } from "../middlewares/admin.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { addProduct, updateProduct, getProduct, getProducts, deleteProduct, toggleProductActive, toggleProductFeatured } from "../controllers/admin.product.controller.js";
import { getCategories, addCategory, deleteCategory, updateCategory } from "../controllers/category.controller.js";


const router = express.Router();






router.post(
  "/add/product",
  protect,
  adminOnly,
  upload.array("images", 5),
  addProduct
)
router.get(
  "/product/:productId",
  // protect,
  // adminOnly,
  getProduct
);

router.delete(
  "/products/:productId",
  protect,
  adminOnly,
  deleteProduct
);


router.put(
  "/product/:productId",
  protect,
  adminOnly,
  upload.array("images", 5),
  updateProduct
);
router.put(
  "/active/:productID",
  protect,
  adminOnly,
  toggleProductActive
);
router.put(
  "/featured/:productID",
  protect,
  adminOnly,
  toggleProductFeatured
);


router.get(
  "/all/products",
  protect,
  adminOnly,
  getProducts
);

router.post(
  "/add/categories",
  protect,
  adminOnly,
  upload.single("image"),
  addCategory
);

router.get(
  "/categories/all",
  protect,
  adminOnly,
  getCategories
);

router.put(
  "/category/:categoryId",
  protect,
  adminOnly,
  upload.single("image"),
  updateCategory
);

router.delete(
  "/category/:categoryId",
  protect,
  adminOnly,
  deleteCategory
);






// router.get("/admin/products", protect, adminOnly, );

// router.delete("/admin/:product", protect, adminOnly, getAdminDashboard);

// router.get("/admin/:product", protect, adminOnly, getAdminDashboard);

export default router;