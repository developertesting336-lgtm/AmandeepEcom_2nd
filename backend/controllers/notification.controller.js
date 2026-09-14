import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import PushSubscription from "../models/PushSubscription.js";
import webpush from "../config/webpush.js";

// ==========================================
// 1. SAVE / UPDATE PUSH SUBSCRIPTION
// ==========================================
export const subscribePush = async (req, res) => {
  console.log("👉 [Push Subscription] POST /api/notifications/subscribe called");
  console.log("User:", req.user?._id, "| Body:", JSON.stringify(req.body, null, 2));

  try {
    // Support direct { endpoint, keys } or nested { subscription: { endpoint, keys } }
    const subscriptionData = req.body?.subscription || req.body;
    const { endpoint, keys } = subscriptionData || {};
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      console.warn("⚠️ Invalid subscription payload received:", subscriptionData);
      return res.status(400).json({
        success: false,
        message: "Invalid push subscription. 'endpoint' and 'keys' (p256dh, auth) are required.",
      });
    }

    // Upsert subscription: update if endpoint exists, otherwise insert
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("✅ Push subscription saved/updated successfully for user:", userId);
    return res.status(200).json({
      success: true,
      message: "Push subscription saved successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("❌ Error in subscribePush:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save push subscription",
      error: error.message,
    });
  }
};

// ==========================================
// 2. REMOVE PUSH SUBSCRIPTION
// ==========================================
export const unsubscribePush = async (req, res) => {
  console.log("👉 [Push Unsubscribe] DELETE /api/notifications/subscribe called");
  console.log("User:", req.user?._id, "| Query:", req.query, "| Body:", req.body);

  try {
    const userId = req.user?._id;
    const subscriptionData = req.body?.subscription || req.body;
    const endpoint = subscriptionData?.endpoint || req.query?.endpoint;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    let deleteResult;
    if (endpoint) {
      deleteResult = await PushSubscription.findOneAndDelete({ endpoint, userId });
      console.log(`✅ Push subscription deleted for endpoint: ${endpoint.substring(0, 45)}...`);
    } else {
      deleteResult = await PushSubscription.deleteMany({ userId });
      console.log(`✅ All push subscriptions deleted for user: ${userId}`);
    }

    return res.status(200).json({
      success: true,
      message: "Push subscription removed successfully",
      deleted: Boolean(deleteResult),
    });
  } catch (error) {
    console.error("❌ Error in unsubscribePush:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove push subscription",
      error: error.message,
    });
  }
};

// ==========================================
// 3. GET NOTIFICATION HISTORY (WITH PAGINATION & FILTERS)
// ==========================================
export const getNotifications = async (req, res) => {
  console.log("👉 [Get Notifications] GET /api/notifications called for user:", req.user?._id);
  try {
    const userId = req.user?._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Filter options
    const query = { userId };
    if (req.query.isRead !== undefined) {
      query.isRead = req.query.isRead === "true";
    }
    if (req.query.type) {
      query.type = req.query.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate("orderId", "orderStatus totalPrice orderItems createdAt")
        .populate("productId", "name images price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    console.log(`✅ Fetched ${notifications.length} notifications (total: ${total}, unread: ${unreadCount}) for user:`, userId);

    return res.status(200).json({
      success: true,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      notifications,
    });
  } catch (error) {
    console.error("❌ Error in getNotifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// ==========================================
// 4. GET UNREAD NOTIFICATION COUNT
// ==========================================
export const getUnreadCount = async (req, res) => {
  console.log("👉 [Unread Count] GET /api/notifications/unread-count called for user:", req.user?._id);
  try {
    const userId = req.user?._id;
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    // console.log(`✅ Unread count for user ${userId}:`, unreadCount);
    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Error in getUnreadCount:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};

// ==========================================
// 5. MARK SINGLE NOTIFICATION AS READ
// ==========================================
export const markAsRead = async (req, res) => {
  console.log("👉 [Mark As Read] PATCH /api/notifications/:id/read called with id:", req.params.id);
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID format",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    console.log("✅ Notification marked as read:", notification._id);
    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("❌ Error in markAsRead:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// ==========================================
// 6. MARK ALL NOTIFICATIONS AS READ
// ==========================================
export const markAllAsRead = async (req, res) => {
  console.log("👉 [Mark All As Read] PATCH /api/notifications/read-all called for user:", req.user?._id);
  try {
    const userId = req.user?._id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    console.log(`✅ All notifications marked as read for user ${userId}. Modified count:`, result.modifiedCount);
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error in markAllAsRead:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

// ==========================================
// 7. DELETE SINGLE NOTIFICATION
// ==========================================
export const deleteNotification = async (req, res) => {
  console.log("👉 [Delete Notification] DELETE /api/notifications/:id called with id:", req.params.id);
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID format",
      });
    }

    const deleted = await Notification.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    console.log("✅ Notification deleted:", id);
    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error in deleteNotification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

// ==========================================
// 8. CLEAR ALL NOTIFICATIONS
// ==========================================
export const clearAllNotifications = async (req, res) => {
  console.log("👉 [Clear All] DELETE /api/notifications/clear-all called for user:", req.user?._id);
  try {
    const userId = req.user?._id;
    const result = await Notification.deleteMany({ userId });

    console.log(`✅ Deleted ${result.deletedCount} notifications for user:`, userId);
    return res.status(200).json({
      success: true,
      message: "All notifications cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Error in clearAllNotifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
      error: error.message,
    });
  }
};

// ==========================================
// 9. REUSABLE FUNCTION: CREATE NOTIFICATION IN DB & BROADCAST PUSH
// Can be imported and used in any controller, service, or webhook
// ==========================================
export const createNotification = async ({
  userId,
  type = "SYSTEM",
  title,
  message,
  orderId = null,
  productId = null,
  url = "/order",
  metadata = {},
  sendPush = true,
}) => {
  try {
    // 1. Extract and sanitize User ID (handles ObjectId, string, or populated user object)
    const targetUserId = userId?._id || userId;

    if (!targetUserId) {
      console.warn("⚠️ [createNotification] No valid userId provided, skipping notification creation");
      return null;
    }

    if (!title || !message) {
      console.warn("⚠️ [createNotification] 'title' and 'message' are required");
      return null;
    }

    // 2. Format Mongoose ObjectIds for orderId and productId if provided
    let formattedOrderId = null;
    if (orderId) {
      const rawOrderId = orderId?._id || orderId;
      if (mongoose.Types.ObjectId.isValid(rawOrderId)) {
        formattedOrderId = new mongoose.Types.ObjectId(rawOrderId);
      }
    }

    let formattedProductId = null;
    if (productId) {
      const rawProductId = productId?._id || productId;
      if (mongoose.Types.ObjectId.isValid(rawProductId)) {
        formattedProductId = new mongoose.Types.ObjectId(rawProductId);
      }
    }

    // 3. Save Notification Document in MongoDB
    const notification = await Notification.create({
      userId: targetUserId,
      type,
      title: title.trim(),
      message: message.trim(),
      orderId: formattedOrderId,
      productId: formattedProductId,
      metadata: {
        ...metadata,
        url,
        ...(orderId && !formattedOrderId ? { customOrderId: orderId } : {}),
      },
    });

    console.log(`✅ [createNotification] Notification saved in DB (ID: ${notification._id}, User: ${targetUserId})`);

    // 4. Optionally broadcast Web Push Notification to user's registered devices
    if (sendPush) {
      const subscriptions = await PushSubscription.find({ userId: targetUserId });

      if (subscriptions.length > 0) {
        const pushPayload = JSON.stringify({
          title: title.trim(),
          body: message.trim(),
          icon: "/favicon.png",
          data: {
            url,
            notificationId: notification._id,
            orderId: formattedOrderId || orderId,
            productId: formattedProductId || productId,
          },
        });

        const pushResults = await Promise.allSettled(
          subscriptions.map(async (sub) => {
            try {
              return await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: sub.keys,
                },
                pushPayload
              );
            } catch (pushErr) {
              // Clean up stale or revoked subscriptions (410 Gone / 404 Not Found)
              if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                console.log("🧹 Removing expired push subscription:", sub.endpoint);
                await PushSubscription.findByIdAndDelete(sub._id);
              }
              throw pushErr;
            }
          })
        );

        const successful = pushResults.filter((r) => r.status === "fulfilled").length;
        console.log(`🚀 [createNotification] Push notifications sent: ${successful}/${subscriptions.length} successful`);
      }
    }

    return notification;
  } catch (error) {
    console.error("❌ [createNotification] Error saving notification:", error);
    return null;
  }
};

// Backward-compatible alias
export const sendNotificationHelper = createNotification;

// ==========================================
// 10. API CONTROLLER: CREATE NOTIFICATION VIA HTTP ROUTE
// ==========================================
export const createNotificationController = async (req, res) => {
  console.log("👉 [Create Notification Controller] POST /api/notifications called with body:", req.body);
  try {
    const {
      userId: targetUserId,
      type = "SYSTEM",
      title,
      message,
      orderId = null,
      productId = null,
      metadata = {},
      sendPush = true,
      url = "/order",
    } = req.body || {};

    const userId = targetUserId || req.user?._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required to create a notification",
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "'title' and 'message' are required fields",
      });
    }

    const notification = await createNotification({
      userId,
      type,
      title,
      message,
      orderId,
      productId,
      metadata,
      sendPush,
      url,
    });

    if (!notification) {
      return res.status(500).json({
        success: false,
        message: "Failed to create notification",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Notification created successfully in database",
      notification,
    });
  } catch (error) {
    console.error("❌ Error in createNotificationController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
};

// ==========================================
// 11. SEND TEST NOTIFICATION (TESTING ENDPOINT)
// ==========================================
export const sendTestNotification = async (req, res) => {
  console.log("👉 [Send Test Notification] POST /api/notifications/test called with body:", req.body, "for user:", req.user?._id);
  try {
    const userId = req.user?._id;
    const {
      title = "Test Notification 🔔",
      message = "This is a test push notification from the server!",
      type = "SYSTEM",
      metadata = {},
      url = "/orders",
    } = req.body || {};

    // 1. Create DB notification
    // const notification = await Notification.create({
    //   userId,
    //   type,
    //   title,
    //   message,
    //   metadata: { ...metadata, url },
    // });

    // console.log("✅ Test notification saved in DB:", notification._id);

    // 2. Fetch push subscriptions and broadcast Web Push
    const subscriptions = await PushSubscription.find({ userId });
    console.log(`Found ${subscriptions.length} push subscription(s) for user:`, userId);

    const pushPayload = JSON.stringify({
      title,
      body: message,
      icon: "/favicon.png",
      data: {
        url
        // notificationId: notification._id,
      },
    });

    const pushResults = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          return await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            pushPayload
          );
        } catch (pushErr) {
          // If subscription is expired/invalid (410 Gone / 404 Not Found), clean it up
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            console.log("🧹 Removing expired push subscription:", sub.endpoint);
            await PushSubscription.findByIdAndDelete(sub._id);
          }
          throw pushErr;
        }
      })
    );

    const successfulPushes = pushResults.filter((r) => r.status === "fulfilled").length;
    console.log(`🚀 Push notifications sent: ${successfulPushes}/${subscriptions.length} successful`);

    return res.status(200).json({
      success: true,
      message: "Test notification created and sent successfully",
      // notification,
      pushSummary: {
        totalSubscriptions: subscriptions.length,
        sent: successfulPushes,
      },
    });
  } catch (error) {
    console.error("❌ Error in sendTestNotification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send test notification",
      error: error.message,
    });
  }
};

// ==========================================
// 12. CHECK VAPID CONFIGURATION STATUS
// ==========================================
export const checkVapidConfig = async (req, res) => {
  const hasEmail = Boolean(process.env.VAPID_EMAIL && process.env.VAPID_EMAIL.trim());
  const hasPublicKey = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PUBLIC_KEY.trim());
  const hasPrivateKey = Boolean(process.env.VAPID_PRIVATE_KEY && process.env.VAPID_PRIVATE_KEY.trim());

  const isConfigured = hasEmail && hasPublicKey && hasPrivateKey;

  return res.status(200).json({
    success: true,
    isConfigured,
    details: {
      hasEmail,
      hasPublicKey,
      hasPrivateKey,
      vapidEmail: process.env.VAPID_EMAIL || null,
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
    },
    message: isConfigured
      ? "WebPush VAPID is fully configured"
      : "WebPush VAPID configuration is missing one or more required environment variables (VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)",
  });
};
