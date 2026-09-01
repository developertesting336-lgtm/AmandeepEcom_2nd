import express from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  verifyRegisterOtp,
  resendRegisterOtp,
  forgotPassword,
  verifyOtp,
} from "../controllers/auth.controllers.js";

const router = express.Router();

// =====================================================
// REGISTRATION FLOW (OTP BASED)
// =====================================================
// 1. Initiate registration (sends OTP to email)
router.post("/register", registerUser);

// 2. Verify registration OTP & create user
router.post("/verify-register-otp", verifyRegisterOtp);

// 3. Resend registration OTP
router.post("/resend-register-otp", resendRegisterOtp);

// =====================================================
// AUTHENTICATION & SESSIONS
// =====================================================
// Login user
router.post("/login", loginUser);

// Logout user
router.post("/logout", logoutUser);

// =====================================================
// PASSWORD RESET FLOW
// =====================================================
// Reset/Forgot password (request OTP)
router.post("/reset-password", forgotPassword);
router.post("/forgot-password", forgotPassword);

// Verify OTP & set new password
router.post("/verify-otp", verifyOtp);

export default router;