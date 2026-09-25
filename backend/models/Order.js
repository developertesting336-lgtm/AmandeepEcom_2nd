import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {


        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },



        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },



        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },

                variantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    default: null,
                },

                variantAttributes: [
                    {
                        name: { type: String },
                        value: { type: String },
                    },
                ],

                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },

                purchasePrice: {
                    type: Number,
                    required: true,
                    min: 0,
                }
            },
        ],



        itemsTotal: {
            type: Number,
            required: true,
            min: 0,
        },

        referralDiscount: {
            type: Number,
            default: 0,
            min: 0,
        },

        pointsUsed: {
            type: Number,
            default: 0,
            min: 0,
        },

        pointsDiscount: {
            type: Number,
            default: 0,
            min: 0,
        },

        appliedReferrals: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                token: { type: String },
                jti: { type: String },
                creatorId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                discountAmount: { type: Number, default: 0 },
                rewardPoints: { type: Number, default: 0 },
                quantity: { type: Number, default: 1 },
                totalDiscount: { type: Number, default: 0 },
            },
        ],

        deliveryCharges: {
            type: Number,
            default: 0,
            min: 0,
        },

        orderTotal: {
            type: Number,
            required: true,
            min: 0,
        },


        shippingAddress: {
            fullname: {
                type: String,
                required: true,
                trim: true,
            },
            phone: {
                type: String,
                required: true,
                trim: true,
            },

            address: {
                type: String,
                required: true,
                trim: true,
            },

            city: {
                type: String,
                required: true,
                trim: true,
            },

            state: {
                type: String,
                required: true,
                trim: true,
            },

            postalCode: {
                type: String,
                required: true,
                trim: true,
            },

            country: {
                type: String,
                required: true,
                trim: true,
            },
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
        },

        paymentMode: {
            type: String,
            enum: ["online", "cod", "points"],
            required: true,
        },

        orderStatus: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
            ],
            default: "confirmed",
        },

        cancellationReason: {
            type: String,
            trim: true,
            default: null,
        },

        cancelledAt: {
            type: Date,
            default: null,
        },


        stripeCheckoutSessionId: {
            type: String,
            default: null,
        },

        stripePaymentIntentId: {
            type: String,
            default: null,
        },
        refundId: {
            type: String,
            default: null,
        },

        refundedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;