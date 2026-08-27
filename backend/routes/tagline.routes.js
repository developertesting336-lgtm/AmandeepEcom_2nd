import express from "express";

import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";

import {
    addTagline,
    getTaglines,
    updateTagline,
    deleteTagline
} from "../controllers/admin.tagline.controller.js";

const router = express.Router();

router.post(
    "/taglines",
    protect,
    adminOnly,
    addTagline
);

router.get(
    "/taglines",
    protect,
    adminOnly,
    getTaglines
);

router.put(
    "/taglines/:taglineId",
    protect,
    adminOnly,
    updateTagline
);

router.delete(
    "/taglines/:taglineId",
    protect,
    adminOnly,
    deleteTagline
);

export default router;