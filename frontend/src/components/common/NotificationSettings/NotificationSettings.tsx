import React from "react";
import { Bell, BellOff, Loader2, Send, ShieldAlert, CheckCircle2 } from "lucide-react";
import { usePushNotifications } from "../../../hooks/usePushNotifications";
import "./NotificationSettings.css";

export const NotificationSettings: React.FC = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    actionLoading,
    testLoading,
    subscribe,
    unsubscribe,
    triggerTest,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="notification-settings-card">
        <div className="notification-settings-header">
          <div className="notification-header-info">
            <div className="notification-icon-badge">
              <BellOff size={22} />
            </div>
            <div>
              <h3>
                Push Notifications
                <span className="notification-badge inactive">Not Supported</span>
              </h3>
              <p>Your current browser does not support Web Push notifications.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  const isDenied = permission === "denied";

  return (
    <div className="notification-settings-card">
      <div className="notification-settings-header">
        <div className="notification-header-info">
          <div className={`notification-icon-badge ${isSubscribed ? "active" : ""}`}>
            {isSubscribed ? <Bell size={22} /> : <BellOff size={22} />}
          </div>
          <div>
            <h3>
              Push Notifications
              {loading ? (
                <span className="notification-badge inactive">Checking...</span>
              ) : isDenied ? (
                <span className="notification-badge denied">Blocked in Browser</span>
              ) : isSubscribed ? (
                <span className="notification-badge active">
                  <CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />
                  Subscribed
                </span>
              ) : (
                <span className="notification-badge inactive">Disabled</span>
              )}
            </h3>
            <p>
              Receive instant updates on your orders, shipment tracking, discounts, and alerts.
            </p>
          </div>
        </div>

        <div className="switch-container">
          {actionLoading && <Loader2 size={18} className="animate-spin text-blue-600" />}
          <label className="notification-toggle">
            <input
              type="checkbox"
              checked={isSubscribed}
              disabled={loading || actionLoading || isDenied}
              onChange={handleToggle}
              aria-label="Toggle Push Notifications"
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="notification-settings-footer">
        <div className="notification-status-text">
          {isDenied ? (
            <span className="denied-warning flex items-center gap-1.5">
              <ShieldAlert size={16} />
              Notifications are blocked. Please click the padlock icon in your browser URL bar to allow notifications.
            </span>
          ) : isSubscribed ? (
            <span>Your device is actively registered to receive push notifications.</span>
          ) : (
            <span>Enable the toggle above to start receiving notifications on this device.</span>
          )}
        </div>

        {isSubscribed && (
          <button
            type="button"
            className="notification-test-btn"
            disabled={testLoading}
            onClick={triggerTest}
          >
            {testLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending Test...
              </>
            ) : (
              <>
                <Send size={14} />
                Send Test Push
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
