import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Cart from '../models/Cart.js';
import mongoose from 'mongoose'
// import stripe from '../config/stripe.js';

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const cod = async (req, res) => {
    try {
        const { products, address, paymentMode } = req.body;

        if (paymentMode !== "COD") {
            return res.status(400).json({
                success: false,
                message: "Invalid payment mode",
            });
        }

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No products found",
            });
        }

        const uniqueProductIds = [
            ...new Set(products.map((item) => item.productId).filter(Boolean)),
        ];

        const dbProducts = await Product.find({
            _id: { $in: uniqueProductIds },
            isActive: true,
        });

        const isEveryProductFound = products.every((item) =>
            dbProducts.some((p) => p._id.toString() === item.productId?.toString())
        );

        if (!isEveryProductFound) {
            return res.status(400).json({
                success: false,
                message: "One or more products not found or inactive",
            });
        }

        let itemsTotal = 0;

        const orderProducts = products.map((item) => {
            const product = dbProducts.find(
                (p) => p._id.toString() === item.productId.toString()
            );

            const quantity = Number(item.quantity) || 1;
            let purchasePrice =
                product.salePrice && product.salePrice > 0
                    ? product.salePrice
                    : product.price;
            let variantId = null;
            let variantAttributes = [];

            // If variant product
            if (product.hasVariants && item.variantId && Array.isArray(product.variants)) {
                const variant = product.variants.find(
                    (v) => v._id.toString() === item.variantId.toString()
                );
                if (variant) {
                    variantId = variant._id;
                    variantAttributes = variant.attributes || [];
                    purchasePrice =
                        variant.salePrice && variant.salePrice > 0
                            ? variant.salePrice
                            : variant.price;
                }
            }

            const itemTotal = purchasePrice * quantity;
            itemsTotal += itemTotal;

            return {
                productId: product._id,
                variantId,
                variantAttributes,
                purchasePrice,
                quantity,
            };
        });

        let deliveryCharges = 0;
        if (itemsTotal < 499) {
            deliveryCharges = 99;
        }

        const orderTotal = itemsTotal + deliveryCharges;

        const order = await Order.create({
            orderId: `ORD-${Date.now()}`,
            user: req.user?._id,
            products: orderProducts,
            itemsTotal,
            deliveryCharges,
            orderTotal,
            shippingAddress: {
                fullname: address?.fullName || address?.fullname,
                phone: address?.phone,
                address: address?.addressLine || address?.address,
                city: address?.city,
                state: address?.state,
                postalCode: address?.pincode || address?.postalCode,
                country: address?.country || "India",
            },
            paymentStatus: "pending",
            paymentMode: "cod",
            stripeCheckoutSessionId: null,
            stripePaymentIntentId: null,
        });

        // Clear cart for ordered items
        await Cart.updateOne(
            { user: req.user._id },
            {
                $pull: {
                    items: {
                        product: {
                            $in: uniqueProductIds,
                        },
                    },
                },
            }
        );

        return res.status(201).json({
            success: true,
            message: "COD order created successfully",
            order,
        });
    } catch (error) {
        console.error("Create COD order error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create COD order",
            error: error.message,
        });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({
            user: userId,
        })
            .populate({
                path: "products.productId",
                select: "name images price salePrice brand category variants",
            })
            .sort({ createdAt: -1 });

        // console.log("orders", orders.products)

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error("Get user orders error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message,
        });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.user._id,
        }).populate({
            path: "products.productId",
            select: "name images price salePrice brand category variants",
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        return res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Get order by id error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch order",
            error: error.message,
        });
    }
};

export const stripePayments = async (req, res) => {
    try {
        const { products, address } = req.body;

        // console.log(products, "products from stripe");
        // console.log(address, "address from stripe");
        console.log(req.body, "req body");

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No products found",
            });
        }

        const uniqueProductIds = [
            ...new Set(products.map((item) => item.productId).filter(Boolean)),
        ];

        const dbProducts = await Product.find({
            _id: { $in: uniqueProductIds },
            isActive: true,
        });

        const isEveryProductFound = products.every((item) =>
            dbProducts.some((p) => p._id.toString() === item.productId?.toString())
        );

        if (!isEveryProductFound) {
            return res.status(400).json({
                success: false,
                message: "One or more products not found or inactive",
            });
        }

        let itemsTotal = 0;

        const orderProducts = products.map((item) => {
            const product = dbProducts.find(
                (p) => p._id.toString() === item.productId.toString()
            );

            const quantity = Number(item.quantity) || 1;
            let purchasePrice =
                product.salePrice && product.salePrice > 0
                    ? product.salePrice
                    : product.price;
            let variantId = null;
            let variantAttributes = [];

            // If variant product
            if (product.hasVariants && item.variantId && Array.isArray(product.variants)) {
                const variant = product.variants.find(
                    (v) => v._id.toString() === item.variantId.toString()
                );
                if (variant) {
                    variantId = variant._id;
                    variantAttributes = variant.attributes || [];
                    purchasePrice =
                        variant.salePrice && variant.salePrice > 0
                            ? variant.salePrice
                            : variant.price;
                }
            }

            const itemTotal = purchasePrice * quantity;
            itemsTotal += itemTotal;

            return {
                productId: product._id,
                variantId,
                variantAttributes,
                purchasePrice,
                quantity,
            };
        });

        let deliveryCharges = 0;
        if (itemsTotal < 499) {
            deliveryCharges = 99;
        }

        const orderTotal = itemsTotal + deliveryCharges;

        const order = await Order.create({
            orderId: `ORD-${Date.now()}`,
            user: req.user?._id,
            products: orderProducts,
            itemsTotal,
            deliveryCharges,
            orderTotal,
            shippingAddress: {
                fullname: address?.fullName || address?.fullname,
                phone: address?.phone,
                address: address?.addressLine || address?.address,
                city: address?.city,
                state: address?.state,
                postalCode: address?.pincode || address?.postalCode,
                country: address?.country || "India",
            },
            paymentStatus: "pending",
            paymentMode: "online",
            stripeCheckoutSessionId: null,
            stripePaymentIntentId: null,
        });

        // =========================
        // CREATE STRIPE LINE ITEMS
        // =========================
        const lineItems = orderProducts.map((item) => {
            const product = dbProducts.find(
                (p) => p._id.toString() === item.productId.toString()
            );

            let itemName = product.name;
            if (item.variantAttributes && item.variantAttributes.length > 0) {
                const attrText = item.variantAttributes.map((a) => a.value).join(" / ");
                itemName = `${product.name} (${attrText})`;
            }

            return {
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: itemName,
                    },
                    unit_amount: Math.round(item.purchasePrice * 100),
                },
                quantity: item.quantity,
            };
        });

        // Add delivery charge if required
        if (deliveryCharges > 0) {
            lineItems.push({
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: "Delivery Charges",
                    },
                    unit_amount: Math.round(deliveryCharges * 100),
                },
                quantity: 1,
            });
        }

        // =========================
        // CREATE STRIPE SESSION
        // =========================
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["upi", "card"],
            line_items: lineItems,
            success_url: `${frontendUrl}/payment-success`,
            cancel_url: `${frontendUrl}/payment-cancelled`,
            metadata: {
                orderId: order.orderId,
                orderMongoId: order._id.toString(),
                userId: req.user._id.toString(),
            },
        });

        order.stripeCheckoutSessionId = session.id;
        await order.save();

        return res.status(201).json({
            success: true,
            message: "Stripe checkout session created",
            orderId: order.orderId,
            sessionId: session.id,
            checkoutUrl: session.url,
        });
    } catch (error) {
        console.error("Stripe Payments Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create Stripe payment session",
            error: error.message,
        });
    }
};


export const stripeWebhook = async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;

    // Verify Stripe webhook
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Webhook signature verification failed:");
        console.error(error.message);

        return res.status(400).send(
            `Webhook Error: ${error.message}`
        );
    }

    console.log("Stripe event:", event.type);

    try {

        switch (event.type) {

            // ==========================================
            // PAYMENT SUCCESSFUL
            // ==========================================

            case "checkout.session.completed": {

                const session = event.data.object;

                console.log(
                    "Payment successful:",
                    session.id
                );

                const order = await Order.findOne({
                    stripeCheckoutSessionId: session.id
                });

                if (!order) {
                    console.error(
                        "Order not found for session:",
                        session.id
                    );

                    break;
                }

                // Prevent duplicate webhook processing
                if (order.paymentStatus === "paid") {
                    console.log(
                        "Order already paid:",
                        order.orderId
                    );

                    break;
                }

                // Update order
                order.paymentStatus = "paid";

                order.stripePaymentIntentId =
                    session.payment_intent || null;

                await order.save();

                console.log(
                    "Order marked as PAID:",
                    order.orderId
                );

                // Remove purchased products from cart
                await Cart.updateOne(
                    {
                        user: order.user
                    },
                    {
                        $pull: {
                            items: {
                                product: {
                                    $in: order.products.map(
                                        item => item.productId
                                    )
                                }
                            }
                        }
                    }
                );

                console.log(
                    "Products removed from cart"
                );

                break;
            }


            // ==========================================
            // PAYMENT FAILED
            // ==========================================

            case "payment_intent.payment_failed": {

                const paymentIntent = event.data.object;

                console.log(
                    "Payment failed:",
                    paymentIntent.id
                );

                const order = await Order.findOne({
                    stripePaymentIntentId: paymentIntent.id
                });

                if (!order) {
                    console.error(
                        "Order not found for payment intent:",
                        paymentIntent.id
                    );

                    break;
                }

                // Delete failed order
                await Order.deleteOne({
                    _id: order._id
                });

                console.log(
                    "Failed order deleted:",
                    order.orderId
                );

                break;
            }


            // ==========================================
            // OTHER EVENTS
            // ==========================================

            default:

                console.log(
                    "Unhandled Stripe event:",
                    event.type
                );
        }

        return res.json({
            received: true
        });

    } catch (error) {

        console.error(
            "Webhook processing error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Webhook processing failed"
        });
    }
};

export const cancelOrderForUser = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log(orderId)
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "Cancellation reason is required",
            });
        }

        // Find only the user's own order
        const order = await Order.findOne({
            orderId,
            user: req.user._id,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Already cancelled
        if (order.orderStatus === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled",
            });
        }

        // Cannot cancel delivered order
        if (order.orderStatus === "delivered") {
            return res.status(400).json({
                success: false,
                message: "Delivered order cannot be cancelled",
            });
        }

        // Cannot cancel shipped order
        if (order.orderStatus === "shipped") {
            return res.status(400).json({
                success: false,
                message: "Shipped order cannot be cancelled",
            });
        }

        if (order.paymentMode === "cod") {

            order.orderStatus = "cancelled";
            order.cancellationReason = reason.trim();
            order.cancelledAt = new Date();

            await order.save();

            return res.status(200).json({
                success: true,
                message: "COD order cancelled successfully",
                order,
            });
        }


        // ==========================================
        // STRIPE PAID ORDER
        // ==========================================

        if (
            order.paymentMode === "online" &&
            order.paymentStatus === "paid"
        ) {

            if (!order.stripePaymentIntentId) {
                return res.status(400).json({
                    success: false,
                    message: "Stripe payment information not found",
                });
            }

            // Create Stripe refund
            // const refund = await stripe.refunds.create({
            //     payment_intent: order.stripePaymentIntentId,
            // });

            // console.log("refund", refund)

            order.orderStatus = "cancelled";
            // order.paymentStatus = "refunded";
            // order.refundId = refund.id;
            // order.refundedAt = new Date();

            order.cancellationReason = reason.trim();
            order.cancelledAt = new Date();

            await order.save();

            return res.status(200).json({
                success: true,
                message: "Order cancelled and refund initiated successfully",
                order,
            });
        }


        // ==========================================
        // COD ORDER
        // ==========================================


        // ==========================================
        // STRIPE PAYMENT STILL PENDING
        // ==========================================

        if (
            order.paymentMode === "online" &&
            order.paymentStatus === "pending"
        ) {

            order.orderStatus = "cancelled";

            await order.save();

            return res.status(200).json({
                success: true,
                message: "Pending order cancelled successfully",
                order,
            });
        }


        // ==========================================
        // PAYMENT FAILED
        // ==========================================

        if (order.paymentStatus === "failed") {

            order.orderStatus = "cancelled";

            await order.save();

            return res.status(200).json({
                success: true,
                message: "Order cancelled successfully",
                order,
            });
        }


        return res.status(400).json({
            success: false,
            message: "This order cannot be cancelled",
        });

    } catch (error) {

        console.error("Cancel order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel order",
        });
    }
};