import express from "express";
import { testAi, getAvailableModels } from "../controllers/ai.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/models", getAvailableModels);
router.get("/test", optionalAuth, testAi);
router.post("/test", optionalAuth, testAi);

export default router;
