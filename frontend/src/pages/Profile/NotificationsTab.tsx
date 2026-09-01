import React from "react";
import NotificationSettings from "../../components/common/NotificationSettings/NotificationSettings";

export const NotificationsTab: React.FC = () => {
  return (
    <div className="notifications-tab-container">
      {/* Header */}
      <div className="notifications-tab-header">
        <div className="orders-header-text">
          <h3>Notifications</h3>
          <p>
            Enable or disable instant notifications for order tracking, updates, and alerts.
          </p>
        </div>
      </div>

      {/* Direct Push Notification Toggle On/Off */}
      <div className="notifications-push-wrapper">
        <NotificationSettings />
      </div>
    </div>
  );
};

export default NotificationsTab;
