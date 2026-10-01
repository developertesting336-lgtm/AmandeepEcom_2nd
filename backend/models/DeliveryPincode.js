import mongoose from "mongoose";

const deliveryPincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    district: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    displayName: {
      type: String,
      trim: true,
      default: "",
    },
    placeId: {
      type: String,
      trim: true,
      default: "",
    },
    isDeliverable: {
      type: Boolean,
      default: true,
      index: true,
    },
    distanceFromWarehouseKm: {
      type: Number,
      default: 0,
    },
    customMinDays: {
      type: Number,
      default: null,
    },
    customMaxDays: {
      type: Number,
      default: null,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "delivery_pincodes",
  }
);

// Index for geo/pincode queries
deliveryPincodeSchema.index({ pincode: 1, isDeliverable: 1 });

export default mongoose.model("DeliveryPincode", deliveryPincodeSchema);
