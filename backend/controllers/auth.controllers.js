import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Otp from "../models/Otp.js";
import redis from "../config/redis.js";
import { Resend } from 'resend';


const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};



// =====================================================
// INITIATE REGISTRATION (Sends OTP to Email)
// =====================================================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Store pending user registration data and OTP in MongoDB with 5-minute TTL
    await Otp.deleteMany({ email: normalizedEmail, type: "registration" });
    await Otp.create({
      email: normalizedEmail,
      otp,
      type: "registration",
      userData: {
        name: name.trim(),
        password: hashedPassword,
        phone: phone ? phone.trim() : "",
      },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes TTL
    });

    // --- Redis storage (commented out) ---
    // const regDataKey = `reg_data:${normalizedEmail}`;
    // const regOtpKey = `reg_otp:${normalizedEmail}`;
    // const userData = {
    //   name: name.trim(),
    //   email: normalizedEmail,
    //   password: hashedPassword,
    //   phone: phone ? phone.trim() : "",
    // };
    // await redis.set(regDataKey, JSON.stringify(userData), "EX", 300);
    // await redis.set(regOtpKey, otp, "EX", 300);

    // Send OTP email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: `${normalizedEmail}`,
      subject: "Verify your email for Registration",
      html: `<p>Hi ${name.trim()},</p><p>Your OTP for account registration is: <strong>${otp}</strong>.</p><p>This OTP is valid for 5 minutes.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: "Registration OTP sent successfully to your email. It is valid for 5 minutes.",
      data: {
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process registration request",
      error: error.message,
    });
  }
};

// =====================================================
// VERIFY REGISTRATION OTP & CREATE USER
// =====================================================
export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query pending registration OTP from MongoDB
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: "registration",
      expiresAt: { $gt: new Date() },
    });

    // --- Redis retrieval (commented out) ---
    // const regDataKey = `reg_data:${normalizedEmail}`;
    // const regOtpKey = `reg_otp:${normalizedEmail}`;
    // const storedOtp = await redis.get(regOtpKey);
    // const storedUserData = await redis.get(regDataKey);

    if (!otpRecord || !otpRecord.userData) {
      return res.status(400).json({
        success: false,
        message: "Registration OTP has expired or session is invalid. Please register again.",
      });
    }

    if (otpRecord.otp.trim() !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    const userData = otpRecord.userData;

    // Check again if user was created in the meantime
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // await redis.del(regDataKey);
      // await redis.del(regOtpKey);
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create user in database
    const user = await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      authProvider: "local",
      isActive: true,
    });

    // Delete MongoDB OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    // --- Delete Redis keys (commented out) ---
    // await redis.del(regDataKey);
    // await redis.del(regOtpKey);

    // Generate token and set HTTP-only cookie
    const token = generateToken(user._id);
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "User registered and verified successfully",
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          rewardPoints: user.rewardPoints || 0,
        },
      },
    });
  } catch (error) {
    console.error("Verify Register OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify registration OTP",
      error: error.message,
    });
  }
};

// =====================================================
// RESEND REGISTRATION OTP
// =====================================================
export const resendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find pending registration in MongoDB
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: "registration",
      expiresAt: { $gt: new Date() },
    });

    // --- Redis retrieval (commented out) ---
    // const regDataKey = `reg_data:${normalizedEmail}`;
    // const regOtpKey = `reg_otp:${normalizedEmail}`;
    // const storedUserData = await redis.get(regDataKey);

    if (!otpRecord || !otpRecord.userData) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found or session expired. Please register again.",
      });
    }

    const userData = otpRecord.userData;

    // Generate fresh 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Store new OTP and reset TTL to 5 minutes in MongoDB
    otpRecord.otp = otp;
    otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await otpRecord.save();

    // --- Redis storage (commented out) ---
    // await redis.set(regOtpKey, otp, "EX", 300);
    // await redis.expire(regDataKey, 300);

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: `${normalizedEmail}`,
      subject: "Resent: Verify your email for Registration",
      html: `<p>Hi ${userData.name},</p><p>Your new OTP for account registration is: <strong>${otp}</strong>.</p><p>This OTP is valid for 5 minutes.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: "New registration OTP sent successfully. It is valid for 5 minutes.",
      data: {
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error("Resend Register OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resend registration OTP",
      error: error.message,
    });
  }
};



export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "lax",
    //   path: "/",
    //   maxAge: 1 * 24 * 60 * 60 * 1000,
    // });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    // console.log("cookie", cookie)

    return res.status(200).json({
      success: true,
      message: "Login successful",
      // token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rewardPoints: user.rewardPoints || 0,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// export const logoutUser = async (req, res) => {
//   try {
//     return res.status(200).json({
//       success: true,
//       message: "Logout successful",
//     });
//   } catch (error) {
//     console.error("Logout Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get Current User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email not found",
      });
    }
    // Check if an existing unexpired OTP exists in MongoDB
    const existingOtpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: "forgot_password",
      expiresAt: { $gt: new Date() },
    });

    // Remove any previous OTPs for this email and type in MongoDB
    await Otp.deleteMany({ email: normalizedEmail, type: "forgot_password" });

    // Generate fresh 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Store new OTP in MongoDB with 5-minute TTL
    await Otp.create({
      email: normalizedEmail,
      otp,
      type: "forgot_password",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // --- Redis storage (commented out) ---
    // const redisKey = `otp:${normalizedEmail}`;
    // const existingOtp = await redis.get(redisKey);
    // if (existingOtp) {
    //   await redis.del(redisKey);
    // }
    // await redis.set(redisKey, otp, "EX", 300);

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: `${normalizedEmail}`,
      subject: 'OTP for forgot password',
      html: `<p>Your OTP for forgot password is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`
    });

    return res.status(200).json({
      success: true,
      message: existingOtpRecord
        ? "New OTP resent successfully. It is valid for 5 minutes."
        : "OTP sent successfully. It is valid for 5 minutes."
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
      error: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, newPassword, password, confirmPassword } = req.body;
    const passwordToSet = newPassword || password;

    if (!email || !otp || !passwordToSet) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (passwordToSet.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    if (confirmPassword && passwordToSet !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find valid OTP record in MongoDB
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: "forgot_password",
      expiresAt: { $gt: new Date() },
    });

    // --- Redis retrieval (commented out) ---
    // const redisKey = `otp:${normalizedEmail}`;
    // const storedOtp = await redis.get(redisKey);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired or does not exist. Please request a new OTP.",
      });
    }

    if (otpRecord.otp.trim() !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // Find the user
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(passwordToSet, 12);
    user.password = hashedPassword;
    await user.save();

    // Delete verified OTP from MongoDB
    await Otp.deleteOne({ _id: otpRecord._id });

    // --- Delete verified OTP from Redis (commented out) ---
    // await redis.del(redisKey);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Verify OTP & Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP and reset password",
      error: error.message,
    });
  }
};