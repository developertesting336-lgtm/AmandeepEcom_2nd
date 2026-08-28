import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  isPushNotificationSupported,
  getNotificationPermissionState,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
} from "../services/notificationService";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial support and existing subscription
  const refreshStatus = useCallback(async () => {
    try {
      const supported = isPushNotificationSupported();
      setIsSupported(supported);

      if (supported) {
        setPermission(getNotificationPermissionState());
        const existing = await getExistingSubscription();
        setSubscription(existing);
      }
    } catch (err: any) {
      setError(err.message || "Failed to check push notification status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Subscribe action
  const subscribe = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    try {
      const sub = await subscribeToPush();
      if (sub) {
        setSubscription(sub);
        setPermission("granted");
        // toast.success("Push notifications enabled successfully! 🔔");
        return sub;
      } else {
        const currentPerm = getNotificationPermissionState();
        setPermission(currentPerm);
        if (currentPerm === "denied") {
          toast.error("Notification permission was denied in your browser settings.");
        }
        return null;
      }
    } catch (err: any) {
      const msg = err.message || "Failed to subscribe to push notifications";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Unsubscribe action
  const unsubscribe = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setSubscription(null);
        // toast.success("Push notifications disabled. 🔕");
      }
      return success;
    } catch (err: any) {
      const msg = err.message || "Failed to unsubscribe from push notifications";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Send Test Notification
  const triggerTest = useCallback(async () => {
    setTestLoading(true);
    try {
      await sendTestNotification({
        // title: "Test Push Notification 🚀",
        message: "Your Web Push notification service is working perfectly!",
        url: "/profile",
      });
      // toast.success("Test notification sent! Check your screen. 🎉");
    } catch (err: any) {
      toast.error("Failed to send test push notification.");
    } finally {
      setTestLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed: Boolean(subscription),
    subscription,
    loading,
    actionLoading,
    testLoading,
    error,
    subscribe,
    unsubscribe,
    triggerTest,
    refreshStatus,
  };
}
