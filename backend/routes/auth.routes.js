import express from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/auth.controllers.js";

const router = express.Router();

// Register user
router.post("/register", registerUser);


// Login user
router.post("/login", loginUser);

// Logout user
router.post("/logout", logoutUser);


export default router;