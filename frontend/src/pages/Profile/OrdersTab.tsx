import React from "react";
import UserOrders from "../Orders/UserOrders";

export const OrdersTab: React.FC = () => {
  return <UserOrders hideFooter={true} isEmbedded={true} />;
};

export default OrdersTab;
