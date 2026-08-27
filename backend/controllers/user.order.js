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



        // console.log("userID", req.user._id)
        // console.log('produsts', products)
        // console.log('address', address.fullName)
        // console.log('paymentmode', paymentMode)

        if (paymentMode !== "COD") {
            return res.status(400).json({
                success: false,
                message: "Invalid payment mode",
            });
        }


        if (!products || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No products found",
            });
        }


        const productIds = products.map((item) => item.productId);


        const dbProducts = await Product.find({
            _id: { $in: productIds },
        });


        if (dbProducts.length !== products.length) {
            return res.status(400).json({
                success: false,
                message: "One or more products not found",
            });
        }


        let itemsTotal = 0;
        let purchasePrice = 0

        const orderProducts = products.map((item) => {
            const product = dbProducts.find(
                (p) => p._id.toString() === item.productId
            );



            const quantity = Number(item.quantity);

            const price = product.salePrice ?? product.price;

            purchasePrice = price

            const itemTotal = price * quantity;

            itemsTotal += itemTotal;

            return {
                productId: product._id,
                purchasePrice,
                quantity,
            };
        });

        // console.log("purchasePrice", purchasePrice)
        // console.log("itemsTotal", itemsTotal)

        let deliveryCharges = 0

        if (itemsTotal < 499) {

            deliveryCharges = 99;
        }

        // console.log("deliveryCharges", deliveryCharges)






        const orderTotal = itemsTotal + deliveryCharges;

        // console.log("orderTotal", orderTotal)

        // console.log(Date.now())


        const order = await Order.create({
            orderId: `ORD-${Date.now()}`,


            user: req.user?._id,

            products: orderProducts,

            itemsTotal,
            deliveryCharges,
            orderTotal,

            shippingAddress: {
                fullname: address.fullName,
                phone: address.phone,
                address: address.addressLine,
                city: address.city,
                state: address.state,
                postalCode: address.pincode,
                country: "India",
            },

            paymentStatus: "pending",
            paymentMode: "cod",
            stripeCheckoutSessionId: null,
            stripePaymentIntentId: null,
        });

        const clearcart = await Cart.updateOne(
            { user: req.user._id },
            {
                $pull: {
                    items: {
                        product: {
                            $in: products.map((item) => item.productId),
                        },
                    },
                },
            }
        );

        console.log(order)

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
}

export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.aggregate([
            // 1. Get orders for the user
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                },
            },

            // 2. Get product details
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },

            // 3. Combine order product data with current product data
            {
                $addFields: {
                    products: {
                        $map: {
                            input: "$products",
                            as: "orderProduct",

                            in: {
                                productId: "$$orderProduct.productId",

                                // From Order
                                quantity: "$$orderProduct.quantity",
                                purchasePrice: "$$orderProduct.purchasePrice",
                                itemTotal: "$$orderProduct.itemTotal",

                                // From Product collection
                                name: {
                                    $let: {
                                        vars: {
                                            product: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$productDetails",
                                                            as: "product",
                                                            cond: {
                                                                $eq: [
                                                                    "$$product._id",
                                                                    "$$orderProduct.productId",
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },

                                        in: "$$product.name",
                                    },
                                },

                                images: {
                                    $let: {
                                        vars: {
                                            product: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$productDetails",
                                                            as: "product",
                                                            cond: {
                                                                $eq: [
                                                                    "$$product._id",
                                                                    "$$orderProduct.productId",
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },

                                        in: "$$product.images",
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // 4. Remove temporary productDetails
            {
                $project: {
                    productDetails: 0,
                },
            },

            // 5. Latest orders first
            {
                $sort: {
                    createdAt: -1,
                },
            },
        ]);

        // console.log(orders[1].products)

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

    const order = await Order.aggregate([
        {
            $match: {
                orderId: req.params.orderId,
                user: new mongoose.Types.ObjectId(req.user._id),
            },
        },

        {
            $lookup: {
                from: "products",
                localField: "products.productId",
                foreignField: "_id",
                as: "productDetails",
            },
        },

        {
            $addFields: {
                products: {
                    $map: {
                        input: "$products",
                        as: "orderProduct",

                        in: {
                            $let: {
                                vars: {
                                    product: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$productDetails",
                                                    as: "p",
                                                    cond: {
                                                        $eq: [
                                                            "$$p._id",
                                                            "$$orderProduct.productId",
                                                        ],
                                                    },
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                },

                                in: {
                                    productId: "$$orderProduct.productId",
                                    quantity: "$$orderProduct.quantity",
                                    name: "$$product.name",
                                    price: "$$product.price",
                                    salePrice: "$$product.salePrice",
                                    image: "$$product.image",
                                },
                            },
                        },
                    },
                },
            },
        },

        {
            $project: {
                productDetails: 0,
            },
        },
    ]);
}

export const stripePayments = async (req, res) => {
    try {

        const { products, address, paymentMode } = req.body;

        // console.log(req.body.paymentMode)



        if (!products || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No products found",
            });
        }


        const productIds = products.map((item) => item.productId);


        const dbProducts = await Product.find({
            _id: { $in: productIds },
        });

        // console.log(dbProducts)


        if (dbProducts.length !== products.length) {
            return res.status(400).json({
                success: false,
                message: "One or more products not found",
            });
        }


        let itemsTotal = 0;
        let purchasePrice = 0

        const orderProducts = products.map((item) => {
            const product = dbProducts.find(
                (p) => p._id.toString() === item.productId
            );



            const quantity = Number(item.quantity);

            const price = product.salePrice ?? product.price;

            purchasePrice = price

            const itemTotal = price * quantity;

            itemsTotal += itemTotal;

            return {
                productId: product._id,
                purchasePrice,
                quantity,
            };
        });

        // console.log("purchasePrice", purchasePrice)
        // console.log("itemsTotal", itemsTotal)

        let deliveryCharges = 0

        if (itemsTotal < 499) {

            deliveryCharges = 99;
        }

        // console.log("deliveryCharges", deliveryCharges)

        const orderTotal = itemsTotal + deliveryCharges;



        const order = await Order.create({
            orderId: `ORD-${Date.now()}`,


            user: req.user?._id,

            products: orderProducts,

            itemsTotal,
            deliveryCharges,
            orderTotal,

            shippingAddress: {
                fullname: address.fullName,
                phone: address.phone,
                address: address.addressLine,
                city: address.city,
                state: address.state,
                postalCode: address.pincode,
                country: "India",
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

            return {
                price_data: {
                    currency: "inr",

                    product_data: {
                        name: product.name,
                    },

                    unit_amount: Math.round(
                        item.purchasePrice * 100
                    ),
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

                    unit_amount: Math.round(
                        deliveryCharges * 100
                    ),
                },

                quantity: 1,
            });
        }

        // console.log(lineItems)

        // =========================
        // CREATE STRIPE SESSION
        // =========================


        //         const session = await stripe.checkout.sessions.create({
        //     mode: "payment",

        //     line_items: [
        //         {
        //             price_data: {
        //                 currency: "inr",
        //                 product_data: {
        //                     name: "Test Payment",
        //                 },
        //                 unit_amount: 56400,
        //             },
        //             quantity: 1,
        //         },
        //     ],

        //     success_url: "http://localhost:5173/payment-success",
        //     cancel_url: "http://localhost:5173/payment-cancelled",
        // });

        const session = await stripe.checkout.sessions.create({
            mode: "payment",

            payment_method_types: ["upi", "card"],

            line_items: lineItems,

            success_url:
                `${process.env.FRONTEND_URL}/payment-success`,

            cancel_url:
                `${process.env.FRONTEND_URL}/payment-cancelled`,

            metadata: {
                orderId: order.orderId,
                orderMongoId: order._id.toString(),
                userId: req.user._id.toString(),
            },
        });
        // console.log(session)

        // =========================
        // UPDATE ORDER
        // =========================

        order.stripeCheckoutSessionId = session.id;

        await order.save();

        // return res.json({ "orderProdcuts": orderProducts, "lineItems": lineItems })

        return res.status(201).json({
            success: true,
            message: "Stripe checkout session created",

            orderId: order.orderId,

            sessionId: session.id,

            checkoutUrl: session.url,
        });
    }
    catch (error) {

    }
}


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