import mongoose from "mongoose";

const bannerItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "Promotional Banner",
      maxlength: 120,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    linkUrl: {
      type: String,
      trim: true,
      default: "/products",
      maxlength: 300,
    },
    order: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const topOfferSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "Top Offers",
      maxlength: 100,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },
    bgColor: {
      type: String,
      trim: true,
      default: "#eff6ff",
    },
    titleColor: {
      type: String,
      trim: true,
      default: "#0f172a",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    banners: [bannerItemSchema],
  },
  {
    timestamps: true,
    collection: "top_offer_sections",
  }
);

export default mongoose.model("TopOfferSection", topOfferSectionSchema);
