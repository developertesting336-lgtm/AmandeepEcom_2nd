import mongoose from "mongoose";

const speedTierSchema = new mongoose.Schema(
  {
    maxDistanceKm: {
      type: Number,
      required: true,
    },
    minDays: {
      type: Number,
      required: true,
    },
    maxDays: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Central Distribution Center",
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      default: "110001",
    },
    address: {
      type: String,
      trim: true,
      default: "Connaught Place Logistics Hub",
    },
    city: {
      type: String,
      trim: true,
      default: "New Delhi",
    },
    state: {
      type: String,
      trim: true,
      default: "Delhi",
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    latitude: {
      type: Number,
      required: true,
      default: 28.6292,
    },
    longitude: {
      type: Number,
      required: true,
      default: 77.2192,
    },
    isPrimary: {
      type: Boolean,
      default: true,
    },
    handlingDays: {
      type: Number,
      default: 0, // Dispatch/packaging processing days before shipment
      min: 0,
    },
    speedTiers: {
      type: [speedTierSchema],
      default: [
        { maxDistanceKm: 50, minDays: 1, maxDays: 2, label: "Local Delivery" },
        { maxDistanceKm: 250, minDays: 2, maxDays: 3, label: "Regional Delivery" },
        { maxDistanceKm: 600, minDays: 3, maxDays: 4, label: "Zonal Delivery" },
        { maxDistanceKm: 1200, minDays: 4, maxDays: 6, label: "National Delivery" },
        { maxDistanceKm: 999999, minDays: 6, maxDays: 8, label: "Remote / Outstation" },
      ],
    },
  },
  {
    timestamps: true,
    collection: "warehouses",
  }
);

export default mongoose.model("Warehouse", warehouseSchema);
