import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["registration", "forgot_password"],
      required: [true, "OTP type is required"],
    },
    // Staged user data for pending registration (stored until OTP is verified)
    userData: {
      name: {
        type: String,
        trim: true,
      },
      password: {
        type: String,
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
    },
    // Attempt counter to prevent brute-force attacks
    attempts: {
      type: Number,
      default: 0,
    },
    // MongoDB TTL index: MongoDB will automatically delete documents once expiresAt is reached
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for rapid query by email and OTP type
otpSchema.index({ email: 1, type: 1 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
