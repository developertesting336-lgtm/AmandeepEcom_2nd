import Order from '../models/Order.js'
import User from '../models/user.js'
import Product from '../models/Product.js'
import stripe from "../config/stripe.js";
import { createNotification } from "./notification.controller.js";




// export const getOrderForadmin = async (req, res) => {
//     try {
//         const { orderId } = req.params;

//         const order = await Order.findOne({ orderId })
//             .populate({
//                 path: "products.productId",
//                 select: "-__v",
//             })
//             .populate({
//                 path: "user",
//                 select: "name email phone",
//             });

//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Order not found",
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             message: "Order fetched successfully",
//             order,
//         });

//     } catch (error) {
//         console.error("Get order error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch order",
//         });
//     }
// };


export const getOrdersForadmin = async (req, res) => {
    try {
        const {
            orderId,
            paymentStatus,
            orderStatus,
            userName,
        } = req.query;

        const filter = {};

        // =========================
        // ORDER ID SEARCH
        // =========================

        if (orderId) {
            filter.orderId = {
                $regex: orderId,
                $options: "i",
            };
        }

        // =========================
        // PAYMENT STATUS
        // =========================

        if (paymentStatus) {
            filter.paymentStatus = paymentStatus;
        }

        // =========================
        // ORDER STATUS
        // =========================

        if (orderStatus) {
            filter.orderStatus = orderStatus;
        }

        // =========================
        // USER NAME SEARCH
        // =========================

        let query = Order.find(filter);

        if (userName) {
            const users = await mongoose.model("User").find({
                name: {
                    $regex: userName,
                    $options: "i",
                },
            }).select("_id");

            const userIds = users.map((user) => user._id);

            filter.user = {
                $in: userIds,
            };
        }

        const orders = await Order.find(filter)
            .populate({
                path: "products.productId",
                select: "name images sku price salePrice variants",
            })
            .populate({
                path: "user",
                select: "name email phone",
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });

    } catch (error) {
        console.error("Get all orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
        });
    }
};

export const updatedOrderByAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;

        const allowedFields = [
            "paymentStatus",
            "orderStatus",
            "shippingAddress",
            "cancellationReason",
        ];

        const updateData = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
        }

        // If order is being cancelled
        if (updateData.orderStatus === "cancelled") {
            updateData.cancelledAt = new Date();
        }

        const order = await Order.findOneAndUpdate(
            { orderId },
            { $set: updateData },
            {
                new: true,
                runValidators: true,
            }
        )
            .populate("products.productId")
            .populate("user", "name email phone");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Map status to corresponding Notification type
        let notifType = "SYSTEM";
        if (updateData.orderStatus === "delivered") notifType = "ORDER_DELIVERED";
        else if (updateData.orderStatus === "shipped") notifType = "ORDER_SHIPPED";
        else if (updateData.orderStatus === "cancelled") notifType = "ORDER_CANCELLED";
        else if (updateData.orderStatus === "processing") notifType = "ORDER_PACKED";
        else if (updateData.orderStatus === "confirmed") notifType = "ORDER_CONFIRMED";

        const notifMessage = updateData.orderStatus
            ? `Your order status has been updated to "${order.orderStatus}".`
            : "Your order details have been updated.";

        // Create in-app notification in DB & broadcast Web Push
        await createNotification({
            userId: order.user?._id || order.user,
            type: notifType,
            title: "Order Updated",
            message: notifMessage,
            orderId: order._id,
            url: "/order",
            metadata: {
                orderId: order.orderId,
                orderStatus: order.orderStatus,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
            order,
        });

    } catch (error) {
        console.error("Update order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update order",
        });
    }
};

export const refundGenrate = async (req, res) => {
    try {
        const { orderId } = req.params;

        console.log(orderId);

        const order = await Order.findOne({
            orderId,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Must be online payment
        if (order.paymentMode !== "online") {
            return res.status(400).json({
                success: false,
                message: "COD orders cannot be refunded through Stripe",
            });
        }

        // Payment must be successful
        if (order.paymentStatus !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Order payment is not eligible for refund",
            });
        }

        // Stripe PaymentIntent required
        if (!order.stripePaymentIntentId) {
            return res.status(400).json({
                success: false,
                message: "Stripe payment information not found",
            });
        }

        // Already refunded
        if (order.paymentStatus === "refunded") {
            return res.status(400).json({
                success: false,
                message: "Order is already refunded",
            });
        }

        // ==========================
        // CREATE STRIPE REFUND
        // ==========================

        const refund = await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
        });

        // ==========================
        // UPDATE ORDER
        // ==========================

        order.paymentStatus = "refunded";
        order.refundId = refund.id;
        order.refundedAt = new Date();

        // If refund means order is cancelled
        if (order.orderStatus !== "delivered") {
            order.orderStatus = "cancelled";
        }

        await order.save();

        // Create in-app notification in DB & broadcast Web Push
        await createNotification({
            userId: order.user?._id || order.user,
            type: "REFUND_COMPLETED",
            title: "Order Refunded",
            message: `Order Id ${orderId} has been refunded successfully and order is cancelled.`,
            orderId: order._id,
            url: "/order",
            metadata: {
                orderId,
                refundId: refund.id,
                refundAmount: order.orderTotal,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            refundId: refund.id,
            order,
        });

    } catch (error) {
        console.error("Refund order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to process refund",
            error: error.message,
        });
    }
};


