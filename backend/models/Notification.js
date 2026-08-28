import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        type: {
            type: String,
            required: true,
            enum: [
                "ORDER_PLACED",
                "ORDER_CONFIRMED",
                "ORDER_PACKED",
                "ORDER_SHIPPED",
                "OUT_FOR_DELIVERY",
                "ORDER_DELIVERED",
                "ORDER_CANCELLED",

                "PAYMENT_SUCCESS",
                "PAYMENT_FAILED",

                "REFUND_INITIATED",
                "REFUND_COMPLETED",

                "PRODUCT_BACK_IN_STOCK",
                "LOW_STOCK",

                "PROMOTION",
                "SYSTEM",
            ],
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null,
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        readAt: {
            type: Date,
            default: null,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;