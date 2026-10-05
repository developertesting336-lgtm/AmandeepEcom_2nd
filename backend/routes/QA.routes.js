import express from "express";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";
import { userOnly, adminOnly } from "../middlewares/admin.middleware.js";
import { askQuestion, answerQuestion, getProductQAs, getAllQAs } from "../controllers/QA.controller.js"


const router = express.Router();

router.post("/ask", protect, askQuestion);
router.post("/answer/:id", protect, adminOnly, answerQuestion);
router.get("/product/:id", optionalAuth, getProductQAs);
router.get('/all', protect, adminOnly, getAllQAs);

export default router;
