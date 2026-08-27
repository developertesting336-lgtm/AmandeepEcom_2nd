import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  ShoppingBag,
  Eye,
  X,
  MapPin,
  CreditCard,
  User as UserIcon,
  Phone,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import {
  getAdminOrders,
  updateAdminOrderStatus,
  refundAdminOrder,
  type UserOrder,
  type UserOrderItem,
} from "../../services/orderService";
import productFallback from "../../assets/1.jpeg";
import "./Orders.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const normalizeOrderStatus = (rawStatus?: string): string => {
  if (!rawStatus) return "pending";
  const s = rawStatus.toLowerCase().trim();
  if (s === "confirm" || s === "confirmed") return "confirmed";
  if (s === "process" || s === "processing") return "processing";
  if (s === "ship" || s === "shipped") return "shipped";
  if (s === "deliver" || s === "delivered") return "delivered";
  if (s === "cancel" || s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "pending") return "pending";
  return s;
};

const formatFullAddress = (addr?: any): string => {
  if (!addr) return "No address provided";
  if (typeof addr === "string") return addr;

  const parts = [
    addr.address || addr.addressLine || addr.street || addr.line1,
    addr.city,
    addr.state,
    addr.postalCode || addr.pincode || addr.pinCode || addr.zipCode,
    addr.country,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "No address details";
};

const formatImageUrl = (image?: any): string => {
  if (!image) return productFallback;
  const rawUrl =
    typeof image === "string"
      ? image
      : image?.url ||
        (Array.isArray(image) && image[0]?.url) ||
        (Array.isArray(image) && typeof image[0] === "string" ? image[0] : null);

  if (!rawUrl || typeof rawUrl !== "string") return productFallback;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const cleanPath = rawUrl.replace(/\\/g, "/");
  const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${API_BASE_URL}${formattedPath}`;
};

const formatCurrency = (amount?: number): string => {
  if (typeof amount !== "number" || isNaN(amount)) return "₹ 0.00";
  return `₹ ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const Orders: React.FC = () => {
  const { token } = useAuth();

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAdminOrders(token);
      if (res.success) {
        setOrders(res.orders || []);
      } else {
        setError(res.error || "Failed to load admin orders.");
      }
    } catch (err: any) {
      console.error("Error loading admin orders:", err);
      setError(err?.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleStatusChange = async (order: UserOrder, newStatus: string) => {
    const orderIdentifier = order.orderId || order._id;
    try {
      setUpdatingOrderId(order._id);
      const res = await updateAdminOrderStatus(
        orderIdentifier,
        { orderStatus: newStatus, status: newStatus },
        token
      );

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === order._id ? { ...o, orderStatus: newStatus, status: newStatus } : o
          )
        );
        if (selectedOrder && selectedOrder._id === order._id) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, orderStatus: newStatus, status: newStatus } : prev
          );
        }
        setToastMessage(`Order status updated to ${newStatus.toUpperCase()}`);
        setTimeout(() => setToastMessage(""), 2500);
      } else {
        alert(res.error || "Failed to update order status.");
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle Admin Issue Refund for Online Payments
  const handleIssueRefund = async (order: UserOrder, orderTotal: number) => {
    const orderIdentifier = order.orderId || order._id;
    const confirmed = window.confirm(
      `Are you sure you want to issue a refund of ${formatCurrency(orderTotal)} for Order #${orderIdentifier}?`
    );
    if (!confirmed) return;

    try {
      setUpdatingOrderId(order._id);
      const res = await refundAdminOrder(orderIdentifier, token);

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === order._id ? { ...o, paymentStatus: "refunded" } : o
          )
        );
        if (selectedOrder && selectedOrder._id === order._id) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, paymentStatus: "refunded" } : prev
          );
        }
        setToastMessage(`Refund of ${formatCurrency(orderTotal)} issued successfully!`);
        setTimeout(() => setToastMessage(""), 2500);
      } else {
        alert(res.error || "Failed to issue refund.");
      }
    } catch (err) {
      console.error("Refund error:", err);
      alert("Failed to process refund. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filtered & Searched Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderId = (order.orderId || order._id || "").toLowerCase();
      const addr = order.shippingAddress || order.address;
      const custName = (addr?.fullname || addr?.fullName || addr?.name || "").toLowerCase();
      const phone = (addr?.phone || "").toLowerCase();
      const fullAddr = formatFullAddress(addr).toLowerCase();
      const s = search.toLowerCase().trim();

      const matchesSearch =
        !s ||
        orderId.includes(s) ||
        custName.includes(s) ||
        phone.includes(s) ||
        fullAddr.includes(s);

      const rawOrdStatus = order.orderStatus || order.status || (order as any).deliveryStatus || (order as any).fulfillmentStatus;
      const ordStatus = normalizeOrderStatus(rawOrdStatus);
      const matchesStatus =
        statusFilter === "all" || ordStatus === statusFilter.toLowerCase();

      const payStatus = (order.paymentStatus || (order.paymentMode === "cod" ? "pending" : "paid")).toLowerCase();
      const matchesPayment =
        paymentFilter === "all" || payStatus === paymentFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  return (
    <section className="admin-orders-section">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-orders-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="admin-orders-header">
        <div className="header-left-col">
          <span className="admin-eyebrow">ADMINISTRATION</span>
          <h1>Orders Management</h1>
          <p>Track orders, manage customer shipping details, update fulfillment statuses and issue refunds.</p>
        </div>

        <div className="header-actions">
          <button onClick={fetchOrders} className="refresh-btn" title="Refresh order list">
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="admin-orders-toolbar">
        <div className="orders-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by Order ID, customer, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="orders-toolbar-filters">
          <select
            className="orders-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="orders-filter-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="admin-orders-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={fetchOrders} className="error-retry-link">Retry</button>
        </div>
      )}

      {/* TABLE / EMPTY STATE */}
      {loading ? (
        <div className="admin-orders-loading-card">
          <div className="loader-spinner"></div>
          <p>Fetching orders from /api/admin/order...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-orders-empty-card">
          <div className="empty-icon-wrap">
            <ShoppingBag size={42} />
          </div>
          <h3>No Orders Found</h3>
          <p>
            {orders.length === 0
              ? "No customer orders have been placed in the store yet."
              : "No orders match the selected search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="admin-orders-table-card">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th style={{ width: "16%" }}>Order & Date</th>
                <th style={{ width: "26%" }}>Customer & Shipping Address</th>
                <th style={{ width: "18%" }}>Products</th>
                <th style={{ width: "12%" }}>Order Total</th>
                <th style={{ width: "12%" }}>Payment</th>
                <th style={{ width: "11%" }}>Fulfillment</th>
                <th style={{ width: "5%", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const orderId = order.orderId || order._id;
                const productsList: UserOrderItem[] = order.products || order.items || [];
                const address = order.shippingAddress || order.address;
                const fullAddressString = formatFullAddress(address);
                const paymentMode = (order.paymentMode || order.paymentMethod || "COD").toUpperCase();
                const isOnline = paymentMode !== "COD";
                const payStatus = (order.paymentStatus || (paymentMode === "COD" ? "pending" : "paid")).toLowerCase();
                
                // Robust normalization for fulfillment status
                const rawOrdStatus = order.orderStatus || order.status || (order as any).deliveryStatus || (order as any).fulfillmentStatus;
                const ordStatus = normalizeOrderStatus(rawOrdStatus);
                const isCancelled = ordStatus === "cancelled";

                // Total calculation
                const itemsTotal =
                  typeof order.itemsTotal === "number"
                    ? order.itemsTotal
                    : productsList.reduce((sum, item) => {
                        const price =
                          item.purchasePrice ??
                          item.price ??
                          (typeof item.productId === "object" ? item.productId?.price : 0) ??
                          0;
                        return sum + price * (item.quantity || 1);
                      }, 0);

                const deliveryCharges = typeof order.deliveryCharges === "number" ? order.deliveryCharges : 0;
                const orderTotal =
                  typeof order.orderTotal === "number"
                    ? order.orderTotal
                    : typeof order.totalAmount === "number"
                    ? order.totalAmount
                    : itemsTotal + deliveryCharges;

                const canRefund = isOnline && payStatus === "paid";

                return (
                  <tr key={order._id} className={isCancelled ? "row-cancelled" : ""}>
                    {/* Order ID & Date */}
                    <td>
                      <div className="order-id-date-cell">
                        <span className="order-id-code">#{orderId}</span>
                        <span className="date-sub-text">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                    </td>

                    {/* Customer & Full Shipping Address */}
                    <td>
                      <div className="customer-full-address-cell">
                        <div className="cust-title-row">
                          <strong>
                            {address?.fullname || address?.fullName || address?.name || "Guest Customer"}
                          </strong>
                          {address?.phone && (
                            <span className="customer-phone-txt">📞 {address.phone}</span>
                          )}
                        </div>
                        <div className="full-address-row" title={fullAddressString}>
                          <MapPin size={12} className="address-pin-icon" />
                          <span className="address-full-text">{fullAddressString}</span>
                        </div>
                      </div>
                    </td>

                    {/* Products */}
                    <td>
                      <div className="items-summary-cell">
                        <div className="items-thumb-stack">
                          {productsList.slice(0, 3).map((item, idx) => {
                            const firstImage =
                              (Array.isArray(item.images) && item.images[0]) ||
                              item.image ||
                              (item.productId as any)?.images?.[0] ||
                              (item.productId as any)?.image;
                            const imgUrl = typeof firstImage === "string" ? firstImage : firstImage?.url;
                            return (
                              <img
                                key={idx}
                                src={formatImageUrl(imgUrl)}
                                alt=""
                                className="item-mini-thumb"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = productFallback;
                                }}
                              />
                            );
                          })}
                        </div>
                        <div className="items-text-group">
                          <span className="items-count-text">
                            {productsList.length} item{productsList.length !== 1 ? "s" : ""}
                          </span>
                          {productsList[0] && (
                            <span className="items-preview-name">
                              {productsList[0].name || productsList[0].productName || (productsList[0].productId as any)?.name || ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Order Total */}
                    <td>
                      <div className="total-cell">
                        <strong className="total-highlight-txt">{formatCurrency(orderTotal)}</strong>
                        {deliveryCharges > 0 ? (
                          <span className="delivery-note">incl. ₹{deliveryCharges} delivery</span>
                        ) : (
                          <span className="delivery-note free">Free Delivery</span>
                        )}
                      </div>
                    </td>

                    {/* Payment Mode & Status Badge */}
                    <td>
                      <div className="payment-cell">
                        <div className="pay-mode-row">
                          <span className={`pay-mode-badge ${isOnline ? "mode-online" : "mode-cod"}`}>
                            {paymentMode}
                          </span>
                          <span className={`admin-pay-status-pill pay-status-${payStatus}`}>
                            {payStatus.toUpperCase()}
                          </span>
                        </div>

                        {/* Refund Button for Online Paid Orders */}
                        {canRefund && (
                          <button
                            className="admin-refund-btn"
                            disabled={updatingOrderId === order._id}
                            onClick={() => handleIssueRefund(order, orderTotal)}
                            title="Issue online refund to customer"
                          >
                            <RotateCcw size={11} className={updatingOrderId === order._id ? "spin" : ""} />
                            <span>{updatingOrderId === order._id ? "Refunding..." : "Refund"}</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Order Fulfillment Status */}
                    <td>
                      <select
                        className={`admin-order-status-select status-${ordStatus}`}
                        value={ordStatus}
                        disabled={updatingOrderId === order._id}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="view-order-btn"
                        onClick={() => setSelectedOrder(order)}
                        title="View complete order details"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Complete Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="admin-order-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-order-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Order #{selectedOrder.orderId || selectedOrder._id}</h3>
                <span className="modal-date-badge">
                  {selectedOrder.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleString("en-IN")
                    : ""}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-scroll-body">
              {/* If Order is Cancelled, show reason */}
              {normalizeOrderStatus(selectedOrder.orderStatus || selectedOrder.status) === "cancelled" && (
                <div className="modal-cancel-alert">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Order Cancelled</strong>
                    {(selectedOrder.reason || selectedOrder.cancellationReason) && (
                      <p>Reason: {selectedOrder.reason || selectedOrder.cancellationReason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Customer & Full Address Details */}
              <div className="modal-section-box">
                <div className="section-title">
                  <MapPin size={15} />
                  <span>Customer & Shipping Address</span>
                </div>
                {selectedOrder.shippingAddress || selectedOrder.address ? (
                  <div className="address-details-grid">
                    <div className="detail-item">
                      <UserIcon size={14} className="detail-icon" />
                      <span>
                        <strong>Recipient:</strong>{" "}
                        {selectedOrder.shippingAddress?.fullname ||
                          selectedOrder.shippingAddress?.fullName ||
                          selectedOrder.shippingAddress?.name ||
                          "Customer"}
                      </span>
                    </div>
                    {selectedOrder.shippingAddress?.phone && (
                      <div className="detail-item">
                        <Phone size={14} className="detail-icon" />
                        <span>
                          <strong>Phone Number:</strong> {selectedOrder.shippingAddress.phone}
                        </span>
                      </div>
                    )}
                    <div className="detail-item">
                      <MapPin size={14} className="detail-icon" />
                      <div className="full-addr-block">
                        <strong>Complete Delivery Address:</strong>
                        <p className="full-addr-display">
                          {formatFullAddress(selectedOrder.shippingAddress || selectedOrder.address)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="no-address-note">No shipping address recorded for this order.</p>
                )}
              </div>

              {/* Products List */}
              <div className="modal-section-box">
                <div className="section-title">
                  <ShoppingBag size={15} />
                  <span>Ordered Products ({selectedOrder.products?.length || selectedOrder.items?.length || 0})</span>
                </div>

                <div className="modal-products-list">
                  {(selectedOrder.products || selectedOrder.items || []).map((item, idx) => {
                    const productObj =
                      typeof item.productId === "object"
                        ? item.productId
                        : typeof item.product === "object"
                        ? item.product
                        : null;

                    const prodName =
                      item.name || item.productName || productObj?.name || `Product Item #${idx + 1}`;

                    const firstImage =
                      (Array.isArray(item.images) && item.images[0]) ||
                      item.image ||
                      productObj?.images?.[0] ||
                      productObj?.image;

                    const imgUrl = typeof firstImage === "string" ? firstImage : firstImage?.url;
                    const price = item.purchasePrice ?? item.price ?? productObj?.price ?? 0;
                    const qty = item.quantity || 1;

                    return (
                      <div key={idx} className="modal-product-row">
                        <img
                          src={formatImageUrl(imgUrl)}
                          alt={prodName}
                          className="modal-prod-thumb"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = productFallback;
                          }}
                        />
                        <div className="modal-prod-info">
                          <h5>{prodName}</h5>
                          <span className="modal-prod-qty">Qty: {qty} × {formatCurrency(price)}</span>
                        </div>
                        <strong className="modal-prod-subtotal">{formatCurrency(price * qty)}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="modal-section-box">
                <div className="section-title">
                  <CreditCard size={15} />
                  <span>Payment & Financial Summary</span>
                </div>

                <div className="modal-financial-grid">
                  <div className="fin-row">
                    <span>Payment Mode:</span>
                    <strong className="capitalize">
                      {(selectedOrder.paymentMode || selectedOrder.paymentMethod || "COD").toUpperCase()}
                    </strong>
                  </div>
                  <div className="fin-row">
                    <span>Payment Status:</span>
                    <span className={`admin-pay-status-pill pay-status-${(selectedOrder.paymentStatus || "pending").toLowerCase()}`}>
                      {(selectedOrder.paymentStatus || "pending").toUpperCase()}
                    </span>
                  </div>
                  <div className="fin-row">
                    <span>Items Total:</span>
                    <span>{formatCurrency(selectedOrder.itemsTotal)}</span>
                  </div>
                  <div className="fin-row">
                    <span>Delivery Charges:</span>
                    <span>
                      {selectedOrder.deliveryCharges === 0
                        ? "FREE"
                        : `+ ${formatCurrency(selectedOrder.deliveryCharges)}`}
                    </span>
                  </div>
                  <div className="fin-row grand-total">
                    <span>Grand Order Total:</span>
                    <strong>{formatCurrency(selectedOrder.orderTotal || selectedOrder.totalAmount)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {(selectedOrder.paymentMode || selectedOrder.paymentMethod || "").toLowerCase() !== "cod" &&
                (selectedOrder.paymentStatus || "").toLowerCase() === "paid" && (
                  <button
                    className="modal-refund-action-btn"
                    disabled={updatingOrderId === selectedOrder._id}
                    onClick={() =>
                      handleIssueRefund(
                        selectedOrder,
                        selectedOrder.orderTotal || selectedOrder.totalAmount || 0
                      )
                    }
                  >
                    <RotateCcw size={14} className={updatingOrderId === selectedOrder._id ? "spin" : ""} />
                    <span>{updatingOrderId === selectedOrder._id ? "Refunding..." : "Issue Full Refund"}</span>
                  </button>
                )}

              <button className="modal-close-action-btn" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Orders;
