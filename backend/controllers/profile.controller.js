import bcrypt from "bcrypt";
import User from "../models/user.js";

// =====================================================
// GET USER PROFILE
// =====================================================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get User Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load user profile",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE USER PROFILE (Requires Old Password)
// =====================================================
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone, avatar, addresses, oldPassword, currentPassword, password } = req.body;
    const enteredOldPassword = oldPassword || currentPassword || password;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify old password if user has a password set (local auth)
    if (user.password) {
      if (!enteredOldPassword) {
        return res.status(400).json({
          success: false,
          message: "Old password is required to update profile",
        });
      }

      const isPasswordMatch = await bcrypt.compare(enteredOldPassword, user.password);
      if (!isPasswordMatch) {
        return res.status(400).json({
          success: false,
          message: "Incorrect old password",
        });
      }
    }

    // Handle email change if provided
    if (email && email.toLowerCase().trim() !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this email already exists",
        });
      }
      user.email = normalizedEmail;
    }

    // Update optional profile fields
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (addresses !== undefined) user.addresses = addresses;

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update User Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE PASSWORD (Requires Old Password)
// =====================================================
export const updatePassword = async (req, res) => {
  try {
    const { oldPassword, currentPassword, newPassword, confirmPassword } = req.body;
    const enteredOldPassword = oldPassword || currentPassword;

    if (!enteredOldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Password cannot be updated for social login accounts",
      });
    }

    // Verify old password
    const isPasswordMatch = await bcrypt.compare(enteredOldPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect old password",
      });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as old password",
      });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update password",
      error: error.message,
    });
  }
};

// =====================================================
// GET ADMIN PROFILE
// =====================================================
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin dashboard accessed successfully",
      data: {
        admin,
      },
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      error: error.message,
    });
  }
};