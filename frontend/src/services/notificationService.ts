// Frontend Notification & Web Push Service
// Integrates with backend endpoints at /api/notifications/*

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface NotificationItem {
  _id: string;
  userId: string;
  type: "ORDER" | "SYSTEM" | "PROMOTION" | "PAYMENT" | "WISHLIST" | string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: {
    orderId?: string;
    productId?: string;
    url?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  notifications?: NotificationItem[];
  notification?: NotificationItem;
  unreadCount?: number;
}

/**
 * Helper to build auth headers including JWT token from localStorage if available
 */
function getAuthHeaders(token?: string | null): Record<string, string> {
  const activeToken = token || localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
}

/**
 * Converts a URL-safe Base64 string to a Uint8Array required for the VAPID applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if Push Notifications and Service Workers are supported in the current browser
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Gets the current notification permission state ('default' | 'granted' | 'denied')
 */
export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Registers the service worker from /sw.js
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) {
    console.warn("Service Workers or Push Notifications are not supported in this browser.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch (error) {
    console.error("Failed to register Service Worker (/sw.js):", error);
    return null;
  }
}

/**
 * Retrieves the current push subscription if one exists in the browser
 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Error checking existing push subscription:", error);
    return null;
  }
}

/**
 * Subscribes the user to Web Push notifications using the VAPID Public Key
 * and saves the subscription to POST /api/notifications/subscribe
 */
export async function subscribeToPush(token?: string | null): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported in your browser.");
  }

  const vapidPublicKey =
    import.meta.env.VITE_VAPID_PUBLIC_KEY || import.meta.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    throw new Error(
      "VAPID Public Key is missing! Please ensure VITE_VAPID_PUBLIC_KEY is set in your frontend .env file."
    );
  }

  // 1. Request Notification Permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("Notification permission was not granted:", permission);
    return null;
  }

  // 2. Ensure Service Worker is registered and active
  await registerServiceWorker();
  const registration = await navigator.serviceWorker.ready;

  // 3. Check for existing subscription or create a new one
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as BufferSource,
    });
  }

  // 4. Send subscription to your backend server (POST /api/notifications/subscribe)
  if (subscription) {
    await saveSubscriptionToBackend(subscription, token);
  }

  return subscription;
}

/**
 * Unsubscribes the user from Web Push notifications
 * and deletes the subscription via DELETE /api/notifications/subscribe
 */
export async function unsubscribeFromPush(token?: string | null): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // 1. Inform backend to delete this subscription
      await deleteSubscriptionFromBackend(subscription, token);

      // 2. Unsubscribe locally in browser
      const successful = await subscription.unsubscribe();
      return successful;
    }
    return true;
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return false;
  }
}

/**
 * Sends the push subscription object to the backend (POST /api/notifications/subscribe)
 */
export async function saveSubscriptionToBackend(
  subscription: PushSubscription,
  token?: string | null
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/subscribe`, {
      method: "POST",
      headers: getAuthHeaders(token),
      credentials: "include",
      body: JSON.stringify({
        subscription: subscription.toJSON ? subscription.toJSON() : subscription,
        endpoint: subscription.endpoint,
        keys: subscription.toJSON ? subscription.toJSON().keys : undefined,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn("Backend error saving push subscription:", data);
      return false;
    }
    console.log("Push subscription registered with backend:", data);
    return true;
  } catch (err) {
    console.error("Could not save push subscription to backend:", err);
    return false;
  }
}

/**
 * Tells backend to remove the push subscription (DELETE /api/notifications/subscribe)
 */
export async function deleteSubscriptionFromBackend(
  subscription: PushSubscription,
  token?: string | null
): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/notifications/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(token),
        credentials: "include",
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.warn("Backend error deleting push subscription:", data);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Could not delete push subscription from backend:", err);
    return false;
  }
}

/* =========================================================================
 * Notification Retrieval and Status APIs
 * ========================================================================= */

/**
 * Fetch list of in-app notifications (GET /api/notifications)
 */
export async function fetchNotifications(
  token?: string | null
): Promise<NotificationItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications`, {
      method: "GET",
      headers: getAuthHeaders(token),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.notifications || data.data || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * Fetch unread notification count (GET /api/notifications/unread-count)
 */
export async function fetchUnreadCount(token?: string | null): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      method: "GET",
      headers: getAuthHeaders(token),
      credentials: "include",
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return typeof data.count === "number"
      ? data.count
      : typeof data.unreadCount === "number"
      ? data.unreadCount
      : 0;
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }
}

/**
 * Mark all notifications as read (PATCH /api/notifications/read-all)
 */
export async function markAllNotificationsAsRead(
  token?: string | null
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
      credentials: "include",
    });

    return response.ok;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

/**
 * Mark a single notification as read (PATCH /api/notifications/:id/read)
 */
export async function markNotificationAsRead(
  notificationId: string,
  token?: string | null
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
      credentials: "include",
    });

    return response.ok;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    return false;
  }
}

/**
 * Send a test push notification (POST /api/notifications/test)
 */
export async function sendTestNotification(
  payload?: { title?: string; message?: string; url?: string },
  token?: string | null
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/test`, {
      method: "POST",
      headers: getAuthHeaders(token),
      credentials: "include",
      body: JSON.stringify(payload || {}),
    });

    return await response.json();
  } catch (error) {
    console.error("Error sending test notification:", error);
    throw error;
  }
}
