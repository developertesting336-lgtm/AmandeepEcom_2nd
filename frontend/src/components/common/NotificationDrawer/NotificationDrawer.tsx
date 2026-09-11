import React, { useEffect, useState } from "react";
import {
  Bell,
  X,
  Package,
  Sparkles,
  CheckCircle2,
  Clock,
  Trash2,
  CheckCheck,
} from "lucide-react";
import "./NotificationDrawer.css";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "order" | "promo" | "system";
  isUnread: boolean;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Order Shipped! 🚚",
    description: "Your order #ORD-17258902 has been shipped and is on its way to your address.",
    time: "10 mins ago",
    type: "order",
    isUnread: true,
  },
  {
    id: "2",
    title: "Special Weekend Offer 🎉",
    description: "Enjoy up to 30% off on all premium clothing and accessories this weekend only.",
    time: "2 hours ago",
    type: "promo",
    isUnread: true,
  },
  {
    id: "3",
    title: "Payment Confirmed 💳",
    description: "Your payment of ₹1,499 for order #ORD-17258120 was successfully received.",
    time: "Yesterday",
    type: "order",
    isUnread: false,
  },
  {
    id: "4",
    title: "Account Security Update 🔒",
    description: "Your profile password and security settings were successfully updated.",
    time: "2 days ago",
    type: "system",
    isUnread: false,
  },
];

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "orders">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: !n.isUnread } : n))
    );
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "unread") return item.isUnread;
    if (activeTab === "orders") return item.type === "order";
    return true;
  });

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "order":
        return <Package size={18} />;
      case "promo":
        return <Sparkles size={18} />;
      case "system":
      default:
        return <CheckCircle2 size={18} />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`notif-drawer-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`notif-drawer ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications Drawer"
      >
        {/* Header */}
        <div className="notif-drawer-header">
          <div className="notif-drawer-title-area">
            <div className="notif-drawer-title-icon">
              <Bell size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 className="notif-drawer-title">
                Notifications
                {unreadCount > 0 && (
                  <span className="notif-drawer-badge">{unreadCount}</span>
                )}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="notif-drawer-close-btn"
            onClick={onClose}
            aria-label="Close notification drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="notif-drawer-tabs">
          <button
            type="button"
            className={`notif-drawer-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            className={`notif-drawer-tab ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            className={`notif-drawer-tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>
        </div>

        {/* Content Area */}
        <div className="notif-drawer-content">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-card ${notif.isUnread ? "unread" : ""}`}
                onClick={() => toggleRead(notif.id)}
              >
                <div className={`notif-card-icon ${notif.type}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="notif-card-body">
                  <div className="notif-card-header">
                    <h3 className="notif-card-title">{notif.title}</h3>
                    {notif.isUnread && <span className="notif-card-unread-dot" />}
                  </div>
                  <p className="notif-card-desc">{notif.description}</p>
                  <span className="notif-card-time">{notif.time}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="notif-empty-state">
              <div className="notif-empty-icon">
                <Clock size={28} />
              </div>
              <h4 className="notif-empty-title">No notifications</h4>
              <p className="notif-empty-desc">
                {activeTab === "unread"
                  ? "You have caught up with all your notifications."
                  : "We'll let you know when there's an update on your orders or promos."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notif-drawer-footer">
            <button
              type="button"
              className="notif-footer-btn secondary"
              onClick={clearAll}
            >
              <Trash2 size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Clear all
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-footer-btn"
                onClick={markAllRead}
              >
                <CheckCheck size={15} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Mark all as read
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default NotificationDrawer;
