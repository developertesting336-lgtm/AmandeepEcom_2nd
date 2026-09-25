import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Cart from '../models/Cart.js';
import User from '../models/user.js';
import mongoose from 'mongoose'
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";
import Stripe from "stripe";
import { createNotification } from "./notification.controller.js";
import RewardPointTransaction from "../models/RewardPointTransaction.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Helper to verify referral tokens against order items and Redis
 */
const verifyAndCalculateReferrals = async (referralTokens, orderProducts, currentUserId) => {
    if (!referralTokens || !Array.isArray(referralTokens) || referralTokens.length === 0) {
        return { totalReferralDiscount: 0, verifiedReferrals: [] };
    }

    const secret =
        process.env.REFERRAL_JWT_SECRET || process.env.JWT_SECRET || "referral_jwt_default_secret_key";

    let totalReferralDiscount = 0;
    const verifiedReferrals = [];
    const usedJtis = new Set();
    const processedProductIds = new Set();

    for (const rawToken of referralTokens) {
        const token = typeof rawToken === "string" ? rawToken.trim() : rawToken?.token?.trim();
        if (!token) continue;

        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (err) {
            console.warn("Invalid referral token at checkout:", err.message);
            continue;
        }

        if (
            !decoded ||
            decoded.type !== "referral_coupon" ||
            !decoded.jti ||
            !decoded.product_id
        ) {
            continue;
        }

        if (usedJtis.has(decoded.jti)) continue;

        // Prevent self-referral
        if (
            currentUserId &&
            decoded.creator_id &&
            currentUserId.toString() === decoded.creator_id.toString()
        ) {
            console.warn("Self-referral rejected at checkout for user:", currentUserId);
            continue;
        }

        // Verify JTI exists in Redis (ensuring token is active and single-use)
        const redisKey = `referral:jti:${decoded.jti}`;
        const redisData = await redis.get(redisKey);
        if (!redisData) {
            console.warn("Referral token not found in Redis or already burned:", decoded.jti);
            continue;
        }

        const matchingItems = orderProducts.filter(
            (p) => p.productId.toString() === decoded.product_id.toString()
        );

        if (matchingItems.length === 0) {
            continue;
        }

        if (processedProductIds.has(decoded.product_id.toString())) {
            continue;
        }

        processedProductIds.add(decoded.product_id.toString());
        usedJtis.add(decoded.jti);

        const unitDiscount = Number(decoded.discount_amount) || 0;
        let productTotalDiscount = 0;
        let totalQuantity = 0;

        for (const item of matchingItems) {
            const effectiveUnitDiscount = Math.min(item.purchasePrice, unitDiscount);
            const lineDiscount = effectiveUnitDiscount * item.quantity;
            productTotalDiscount += lineDiscount;
            totalQuantity += item.quantity;
        }

        totalReferralDiscount += productTotalDiscount;

        verifiedReferrals.push({
            productId: decoded.product_id,
            token,
            jti: decoded.jti,
            redisKey,
            creatorId: decoded.creator_id,
            discountAmount: unitDiscount,
            rewardPoints: Number(decoded.reward_points) || 0,
            quantity: totalQuantity,
            totalDiscount: productTotalDiscount,
        });
    }

    return { totalReferralDiscount, verifiedReferrals };
};

export const cod = async (req, res) => {
    try {
        const { products, address, paymentMode, referralTokens, referrals } = req.body;

        if (paymentMode !== "COD" && paymentMode !== "points" && paymentMode !== "POINTS") {
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

        const tokensToVerify = Array.isArray(referralTokens)
            ? referralTokens
            : Array.isArray(referrals)
                ? referrals.map((r) => r.token || r)
                : typeof referralTokens === "string"
                    ? [referralTokens]
                    : [];

        const { totalReferralDiscount, verifiedReferrals } = await verifyAndCalculateReferrals(
            tokensToVerify,
            orderProducts,
            req.user?._id
        );

        let deliveryCharges = 0;
        if (itemsTotal < 499) {
            deliveryCharges = 99;
        }

        const grossTotal = Math.max(0, itemsTotal - totalReferralDiscount) + deliveryCharges;

        // Calculate optional reward points redemption (1 point = 1 rupee discount)
        const requestedPoints = Math.max(0, Math.floor(Number(req.body.pointsToRedeem || req.body.usedPoints || req.body.pointsDiscount || 0)));
        let actualPointsUsed = 0;
        let pointsDiscount = 0;

        if (requestedPoints > 0 && req.user?._id) {
            const freshBuyer = await User.findById(req.user._id);
            const userAvailablePoints = freshBuyer?.rewardPoints || 0;
            const maxPointsCanUse = Math.min(
                requestedPoints,
                userAvailablePoints,
                grossTotal
            );
            if (maxPointsCanUse > 0) {
                actualPointsUsed = maxPointsCanUse;
                pointsDiscount = maxPointsCanUse;
            }
        }

        const orderTotal = Math.max(0, grossTotal - pointsDiscount);
        const isFullyCoveredByPoints = orderTotal === 0 && actualPointsUsed > 0;
        const finalPaymentMode = isFullyCoveredByPoints ? "points" : "cod";
        const finalPaymentStatus = isFullyCoveredByPoints ? "paid" : "pending";

        const order = await Order.create({
            orderId: `ORD-${Date.now()}`,
            user: req.user?._id,
            products: orderProducts,
            itemsTotal,
            referralDiscount: totalReferralDiscount,
            pointsUsed: actualPointsUsed,
            pointsDiscount,
            appliedReferrals: verifiedReferrals,
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
            paymentStatus: finalPaymentStatus,
            paymentMode: finalPaymentMode,
            orderStatus: "confirmed",
            stripeCheckoutSessionId: null,
            stripePaymentIntentId: null,
        });

        // If buyer redeemed reward points, deduct from buyer and record REDEEMED transaction
        if (actualPointsUsed > 0 && req.user?._id) {
            try {
                const updatedBuyer = await User.findByIdAndUpdate(
                    req.user._id,
                    { $inc: { rewardPoints: -actualPointsUsed } },
                    { new: true }
                );

                await RewardPointTransaction.create({
                    user: req.user._id,
                    type: "REDEEMED",
                    points: actualPointsUsed,
                    discountAmount: pointsDiscount,
                    balanceAfter: updatedBuyer?.rewardPoints || 0,
                    order: order._id,
                    orderId: order.orderId,
                    description: `Redeemed ${actualPointsUsed} points for ₹${pointsDiscount} discount`,
                    status: "COMPLETED",
                });
            } catch (redeemErr) {
                console.error("❌ Failed to record redeemed reward points transaction (COD):", redeemErr);
            }
        }

        // Burn single-use referral tokens in Redis and award reward points to creator(s)
        for (const ref of verifiedReferrals) {
            if (ref.redisKey) {
                await redis.del(ref.redisKey);
            }
            if (ref.creatorId && ref.rewardPoints > 0) {
                const pointsEarned = ref.rewardPoints * (ref.quantity || 1);
                const updatedCreator = await User.findByIdAndUpdate(
                    ref.creatorId,
                    { $inc: { rewardPoints: pointsEarned } },
                    { new: true }
                );

                // Find product name for personalized notification and ledger
                const product = dbProducts.find((p) => p._id.toString() === ref.productId.toString());
                const productName = product?.name || "Product";

                const buyerName = req.user?.name || order.shippingAddress?.fullname || "Customer";
                const buyerEmail = req.user?.email || "";

                // Record reward point transaction in RewardPointTransaction collection
                try {
                    await RewardPointTransaction.create({
                        user: ref.creatorId,
                        type: "EARNED",
                        points: pointsEarned,
                        balanceAfter: updatedCreator?.rewardPoints || pointsEarned,
                        order: order._id,
                        orderId: order.orderId,
                        product: ref.productId,
                        productName,
                        buyer: order.user,
                        buyerName,
                        buyerEmail,
                        quantity: ref.quantity || 1,
                        referralToken: ref.token || "",
                        description: `Earned ${pointsEarned} points: ${buyerName} purchased ${ref.quantity || 1}x ${productName}`,
                        status: "COMPLETED",
                    });
                } catch (txErr) {
                    console.error("❌ Failed to record earned reward points transaction (COD):", txErr);
                }

                try {
                    await createNotification({
                        userId: ref.creatorId,
                        type: "REFERRAL_REWARD",
                        title: "Referral Reward Earned! 🎉",
                        message: `Congratulations! A customer purchased ${ref.quantity || 1}x ${productName} using your referral link. You earned ${pointsEarned} reward points!`,
                        orderId: order._id,
                        productId: ref.productId,
                        url: "/profile",
                        metadata: {
                            pointsEarned,
                            quantity: ref.quantity || 1,
                            orderId: order.orderId,
                            productId: ref.productId,
                            productName,
                        },
                        sendPush: true,
                    });
                } catch (notifErr) {
                    console.error("❌ Failed to send referral reward notification to creator (COD):", notifErr);
                }
            }
        }

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
            message: isFullyCoveredByPoints
                ? "Order placed successfully using reward points"
                : "COD order created successfully",
            order,
            orderId: order.orderId,
            orderTotal,
            paymentMode: finalPaymentMode,
            isFullyCoveredByPoints,
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
        const { products, address, referralTokens, referrals } = req.body;

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

        const tokensToVerify = Array.isArray(referralTokens)
            ? referralTokens
            : Array.isArray(referrals)
                ? referrals.map((r) => r.token || r)
                : typeof referralTokens === "string"
                    ? [referralTokens]
                    : [];

        const { totalReferralDiscount, verifiedReferrals } = await verifyAndCalculateReferrals(
            tokensToVerify,
            orderProducts,
            req.user?._id
        );

        let deliveryCharges = 0;
        if (itemsTotal < 499) {
            deliveryCharges = 99;
        }

        const grossTotal = Math.max(0, itemsTotal - totalReferralDiscount) + deliveryCharges;

        // Calculate optional reward points redemption (1 point = 1 rupee discount)
        const requestedPoints = Math.max(0, Math.floor(Number(req.body.pointsToRedeem || req.body.usedPoints || req.body.pointsDiscount || 0)));
        let actualPointsUsed = 0;
        let pointsDiscount = 0;

        if (requestedPoints > 0 && req.user?._id) {
            const freshBuyer = await User.findById(req.user._id);
            const userAvailablePoints = freshBuyer?.rewardPoints || 0;
            const maxPointsCanUse = Math.min(
                requestedPoints,
                userAvailablePoints,
                grossTotal
            );
            if (maxPointsCanUse > 0) {
                actualPointsUsed = maxPointsCanUse;
                pointsDiscount = maxPointsCanUse;
            }
        }

        const orderTotal = Math.max(0, grossTotal - pointsDiscount);
        const isFullyCoveredByPoints = orderTotal === 0 && actualPointsUsed > 0;

        // ========================================================
        // IF FULLY COVERED BY POINTS (NO REMAINING PAYMENT)
        // Bypass Stripe completely and immediately create the order
        // ========================================================
        if (orderTotal === 0) {
            const order = await Order.create({
                orderId: `ORD-${Date.now()}`,
                user: req.user?._id,
                products: orderProducts,
                itemsTotal,
                referralDiscount: totalReferralDiscount,
                pointsUsed: actualPointsUsed,
                pointsDiscount,
                appliedReferrals: verifiedReferrals,
                deliveryCharges,
                orderTotal: 0,
                shippingAddress: {
                    fullname: address?.fullName || address?.fullname,
                    phone: address?.phone,
                    address: address?.addressLine || address?.address,
                    city: address?.city,
                    state: address?.state,
                    postalCode: address?.pincode || address?.postalCode,
                    country: address?.country || "India",
                },
                paymentStatus: "paid",
                paymentMode: "points",
                orderStatus: "confirmed",
                stripeCheckoutSessionId: null,
                stripePaymentIntentId: null,
            });

            // If buyer redeemed reward points, deduct from buyer and record REDEEMED transaction
            if (actualPointsUsed > 0 && req.user?._id) {
                try {
                    const updatedBuyer = await User.findByIdAndUpdate(
                        req.user._id,
                        { $inc: { rewardPoints: -actualPointsUsed } },
                        { new: true }
                    );

                    await RewardPointTransaction.create({
                        user: req.user._id,
                        type: "REDEEMED",
                        points: actualPointsUsed,
                        discountAmount: pointsDiscount,
                        balanceAfter: updatedBuyer?.rewardPoints || 0,
                        order: order._id,
                        orderId: order.orderId,
                        description: `Redeemed ${actualPointsUsed} points for ₹${pointsDiscount} discount`,
                        status: "COMPLETED",
                    });
                } catch (redeemErr) {
                    console.error("❌ Failed to record redeemed reward points transaction (Points):", redeemErr);
                }
            }

            // Burn single-use referral tokens in Redis and award reward points to creator(s)
            for (const ref of verifiedReferrals) {
                if (ref.redisKey) {
                    await redis.del(ref.redisKey);
                }
                if (ref.creatorId && ref.rewardPoints > 0) {
                    const pointsEarned = ref.rewardPoints * (ref.quantity || 1);
                    const updatedCreator = await User.findByIdAndUpdate(
                        ref.creatorId,
                        { $inc: { rewardPoints: pointsEarned } },
                        { new: true }
                    );

                    const product = dbProducts.find((p) => p._id.toString() === ref.productId.toString());
                    const productName = product?.name || "Product";

                    const buyerName = req.user?.name || order.shippingAddress?.fullname || "Customer";
                    const buyerEmail = req.user?.email || "";

                    try {
                        await RewardPointTransaction.create({
                            user: ref.creatorId,
                            type: "EARNED",
                            points: pointsEarned,
                            balanceAfter: updatedCreator?.rewardPoints || pointsEarned,
                            order: order._id,
                            orderId: order.orderId,
                            product: ref.productId,
                            productName,
                            buyer: order.user,
                            buyerName,
                            buyerEmail,
                            quantity: ref.quantity || 1,
                            referralToken: ref.token || "",
                            description: `Earned ${pointsEarned} points: ${buyerName} purchased ${ref.quantity || 1}x ${productName}`,
                            status: "COMPLETED",
                        });
                    } catch (txErr) {
                        console.error("❌ Failed to record earned reward points transaction (Points):", txErr);
                    }

                    try {
                        await createNotification({
                            userId: ref.creatorId,
                            type: "REFERRAL_REWARD",
                            title: "Referral Reward Earned! 🎉",
                            message: `Congratulations! A customer purchased ${ref.quantity || 1}x ${productName} using your referral link. You earned ${pointsEarned} reward points!`,
                            orderId: order._id,
                            productId: ref.productId,
                            url: "/profile",
                            metadata: {
                                pointsEarned,
                                quantity: ref.quantity || 1,
                                orderId: order.orderId,
                                productId: ref.productId,
                                productName,
                            },
                            sendPush: true,
                        });
                    } catch (notifErr) {
                        console.error("❌ Failed to send referral reward notification to creator (Points):", notifErr);
                    }
                }
            }

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
                message: "Order placed successfully using reward points",
                order,
                orderId: order.orderId,
                orderTotal: 0,
                paymentMode: "points",
                isFullyCoveredByPoints: true,
            });
        }

        // ========================================================
        // IF REMAINING PAYMENT EXISTS (orderTotal > 0)
        // Ask for payment via Stripe checkout session
        // ========================================================
        const order = await Order.create({
            orderId: `ORD-${Date.now()}`,
            user: req.user?._id,
            products: orderProducts,
            itemsTotal,
            referralDiscount: totalReferralDiscount,
            pointsUsed: actualPointsUsed,
            pointsDiscount,
            appliedReferrals: verifiedReferrals,
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
        let remainingPointsDiscount = pointsDiscount;
        const lineItems = [];

        for (const item of orderProducts) {
            const product = dbProducts.find(
                (p) => p._id.toString() === item.productId.toString()
            );

            let itemName = product?.name || "Product";
            if (item.variantAttributes && item.variantAttributes.length > 0) {
                const attrText = item.variantAttributes.map((a) => a.value).join(" / ");
                itemName = `${itemName} (${attrText})`;
            }

            const matchingRef = verifiedReferrals.find(
                (r) => r.productId.toString() === item.productId.toString()
            );
            const unitDiscount = matchingRef
                ? Math.min(item.purchasePrice, Number(matchingRef.discountAmount || 0))
                : 0;
            const priceAfterRef = Math.max(0, item.purchasePrice - unitDiscount);

            let pointsDeductedPerUnit = 0;
            if (remainingPointsDiscount > 0) {
                const totalItemAmount = priceAfterRef * item.quantity;
                const pointsToApplyThisItem = Math.min(totalItemAmount, remainingPointsDiscount);
                remainingPointsDiscount -= pointsToApplyThisItem;
                pointsDeductedPerUnit = pointsToApplyThisItem / item.quantity;
            }
            const finalUnitPrice = Math.max(0, priceAfterRef - pointsDeductedPerUnit);

            if (Math.round(finalUnitPrice * 100) > 0) {
                const discountTags = [];
                if (unitDiscount > 0) discountTags.push(`₹${unitDiscount} Referral Discount`);
                if (pointsDeductedPerUnit > 0) discountTags.push(`₹${Math.round(pointsDeductedPerUnit)} Points Discount`);

                lineItems.push({
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: itemName + (discountTags.length > 0 ? ` (${discountTags.join(", ")})` : ""),
                        },
                        unit_amount: Math.round(finalUnitPrice * 100),
                    },
                    quantity: item.quantity,
                });
            }
        }

        // Add delivery charge if required and not fully discounted
        let remainingDeliveryCharges = deliveryCharges;
        if (remainingPointsDiscount > 0 && remainingDeliveryCharges > 0) {
            const deliveryCovered = Math.min(remainingDeliveryCharges, remainingPointsDiscount);
            remainingDeliveryCharges -= deliveryCovered;
            remainingPointsDiscount -= deliveryCovered;
        }

        if (Math.round(remainingDeliveryCharges * 100) > 0) {
            lineItems.push({
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: "Delivery Charges",
                    },
                    unit_amount: Math.round(remainingDeliveryCharges * 100),
                },
                quantity: 1,
            });
        }

        // Fallback safety: If lineItems is empty but orderTotal > 0, provide single order total line item
        if (lineItems.length === 0 && orderTotal > 0) {
            lineItems.push({
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: `Order Total (${order.orderId})`,
                    },
                    unit_amount: Math.round(orderTotal * 100),
                },
                quantity: 1,
            });
        }

        // Reconcile exact paise difference to ensure sum of line items matches orderTotal * 100
        const lineItemsSum = lineItems.reduce((acc, li) => acc + (li.price_data.unit_amount * li.quantity), 0);
        const targetSum = Math.round(orderTotal * 100);
        const diff = targetSum - lineItemsSum;
        if (diff !== 0 && lineItems.length > 0) {
            lineItems[lineItems.length - 1].price_data.unit_amount += diff;
        }

        // =========================
        // CREATE STRIPE SESSION
        // =========================
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["upi", "card"],
            line_items: lineItems,
            success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&orderId=${order.orderId}&paymentMode=ONLINE&orderTotal=${orderTotal}`,
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
            orderTotal,
            paymentMode: "online",
            isFullyCoveredByPoints: false,
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

                // If buyer redeemed reward points, deduct points from buyer and record REDEEMED transaction
                if (order.pointsUsed && order.pointsUsed > 0) {
                    try {
                        const updatedBuyer = await User.findByIdAndUpdate(
                            order.user,
                            { $inc: { rewardPoints: -order.pointsUsed } },
                            { new: true }
                        );

                        await RewardPointTransaction.create({
                            user: order.user,
                            type: "REDEEMED",
                            points: order.pointsUsed,
                            discountAmount: order.pointsDiscount || order.pointsUsed,
                            balanceAfter: updatedBuyer?.rewardPoints || 0,
                            order: order._id,
                            orderId: order.orderId,
                            description: `Redeemed ${order.pointsUsed} points for ₹${order.pointsDiscount || order.pointsUsed} discount`,
                            status: "COMPLETED",
                        });
                    } catch (redeemErr) {
                        console.error("❌ Failed to record redeemed reward points transaction (Stripe):", redeemErr);
                    }
                }

                // Burn the single-use referral tokens in Redis and award reward points to creators
                if (Array.isArray(order.appliedReferrals) && order.appliedReferrals.length > 0) {
                    for (const ref of order.appliedReferrals) {
                        if (ref.jti) {
                            await redis.del(`referral:jti:${ref.jti}`);
                        }
                        if (ref.creatorId && ref.rewardPoints > 0) {
                            const pointsEarned = ref.rewardPoints * (ref.quantity || 1);
                            const updatedCreator = await User.findByIdAndUpdate(
                                ref.creatorId,
                                { $inc: { rewardPoints: pointsEarned } },
                                { new: true }
                            );

                            let productName = "Product";
                            try {
                                const product = await Product.findById(ref.productId).select("name");
                                if (product?.name) productName = product.name;
                            } catch (pErr) {
                                console.warn("Could not fetch product name for notification:", pErr);
                            }

                            // Fetch buyer details
                            let buyerName = order.shippingAddress?.fullname || "Customer";
                            let buyerEmail = "";
                            try {
                                const buyer = await User.findById(order.user).select("name email");
                                if (buyer?.name) buyerName = buyer.name;
                                if (buyer?.email) buyerEmail = buyer.email;
                            } catch (bErr) {
                                console.warn("Could not fetch buyer details:", bErr);
                            }

                            // Record reward point transaction in RewardPointTransaction collection
                            try {
                                await RewardPointTransaction.create({
                                    user: ref.creatorId,
                                    type: "EARNED",
                                    points: pointsEarned,
                                    balanceAfter: updatedCreator?.rewardPoints || pointsEarned,
                                    order: order._id,
                                    orderId: order.orderId,
                                    product: ref.productId,
                                    productName,
                                    buyer: order.user,
                                    buyerName,
                                    buyerEmail,
                                    quantity: ref.quantity || 1,
                                    referralToken: ref.token || "",
                                    description: `Earned ${pointsEarned} points: ${buyerName} purchased ${ref.quantity || 1}x ${productName}`,
                                    status: "COMPLETED",
                                });
                            } catch (txErr) {
                                console.error("❌ Failed to record earned reward points transaction (Stripe):", txErr);
                            }

                            try {
                                await createNotification({
                                    userId: ref.creatorId,
                                    type: "REFERRAL_REWARD",
                                    title: "Referral Reward Earned! 🎉",
                                    message: `Congratulations! A customer purchased ${ref.quantity || 1}x ${productName} using your referral link. You earned ${pointsEarned} reward points!`,
                                    orderId: order._id,
                                    productId: ref.productId,
                                    url: "/profile",
                                    metadata: {
                                        pointsEarned,
                                        quantity: ref.quantity || 1,
                                        orderId: order.orderId,
                                        productId: ref.productId,
                                        productName,
                                    },
                                    sendPush: true,
                                });
                            } catch (notifErr) {
                                console.error("❌ Failed to send referral reward notification to creator (Stripe):", notifErr);
                            }
                        }
                    }
                }

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

        if (order.paymentMode === "points" || (order.paymentMode === "cod" && order.orderTotal === 0)) {
            order.orderStatus = "cancelled";
            order.cancellationReason = reason.trim();
            order.cancelledAt = new Date();

            await order.save();

            // Refund points to user if points were redeemed
            if (order.pointsUsed && order.pointsUsed > 0) {
                try {
                    const updatedBuyer = await User.findByIdAndUpdate(
                        order.user,
                        { $inc: { rewardPoints: order.pointsUsed } },
                        { new: true }
                    );

                    await RewardPointTransaction.create({
                        user: order.user,
                        type: "REFUNDED",
                        points: order.pointsUsed,
                        balanceAfter: updatedBuyer?.rewardPoints || 0,
                        order: order._id,
                        orderId: order.orderId,
                        description: `Refunded ${order.pointsUsed} points from cancelled order ${order.orderId}`,
                        status: "COMPLETED",
                    });
                } catch (rfErr) {
                    console.error("❌ Failed to refund points on cancellation:", rfErr);
                }
            }

            return res.status(200).json({
                success: true,
                message: "Order cancelled and points refunded successfully",
                order,
            });
        }

        if (order.paymentMode === "cod") {

            order.orderStatus = "cancelled";
            order.cancellationReason = reason.trim();
            order.cancelledAt = new Date();

            await order.save();

            // Refund points to user if points were redeemed
            if (order.pointsUsed && order.pointsUsed > 0) {
                try {
                    const updatedBuyer = await User.findByIdAndUpdate(
                        order.user,
                        { $inc: { rewardPoints: order.pointsUsed } },
                        { new: true }
                    );

                    await RewardPointTransaction.create({
                        user: order.user,
                        type: "REFUNDED",
                        points: order.pointsUsed,
                        balanceAfter: updatedBuyer?.rewardPoints || 0,
                        order: order._id,
                        orderId: order.orderId,
                        description: `Refunded ${order.pointsUsed} points from cancelled COD order ${order.orderId}`,
                        status: "COMPLETED",
                    });
                } catch (rfErr) {
                    console.error("❌ Failed to refund points on COD cancellation:", rfErr);
                }
            }

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