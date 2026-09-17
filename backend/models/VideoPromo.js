import mongoose from "mongoose";

const videoPromoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: 255,
      default: "",
    },
    badge: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "FEATURED",
    },
    badgeTheme: {
      type: String,
      enum: ["dark", "blue", "purple", "rose", "emerald", "amber"],
      default: "dark",
    },
    pricePrefix: {
      type: String,
      trim: true,
      default: "From",
    },
    price: {
      type: String,
      trim: true,
      default: "",
    },
    linkUrl: {
      type: String,
      trim: true,
      default: "/products",
    },
    btnText: {
      type: String,
      trim: true,
      default: "Shop Now",
    },
    mediaType: {
      type: String,
      enum: ["video", "image"],
      default: "video",
    },
    videoUrl: {
      type: String,
      trim: true,
      required: true,
    },
    posterUrl: {
      type: String,
      trim: true,
      default: "",
    },
    bgGradient: {
      type: String,
      trim: true,
      default: "linear-gradient(135deg, #c7cbd3 0%, #b2b9c5 50%, #9ba3b2 100%)",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "video_promos",
  }
);

export default mongoose.model("VideoPromo", videoPromoSchema);
