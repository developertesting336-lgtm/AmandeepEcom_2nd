import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  subscribePush,
  unsubscribePush,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
  sendTestNotification,
  checkVapidConfig,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Testing / Status routes
// router.get("/vapid-status", checkVapidConfig);
// router.get("/vapid-public-key", checkVapidConfig);
router.post("/test", protect, sendTestNotification);

// Push Subscription routes
router.post("/subscribe", protect, subscribePush);
router.delete("/subscribe", protect, unsubscribePush);

// Notification retrieval routes
router.get("/unread-count", protect, getUnreadCount);
router.get("/", protect, getNotifications);

// Notification status update routes (note: read-all must come before :id/read)
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);

// Notification delete routes (note: clear-all must come before :id)
router.delete("/clear-all", protect, clearAllNotifications);
router.delete("/:id", protect, deleteNotification);

export default router;
