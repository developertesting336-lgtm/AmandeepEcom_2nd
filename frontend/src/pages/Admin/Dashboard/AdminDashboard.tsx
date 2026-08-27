import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Users,
  Plus,
  ArrowRight,
  Layers,
  Eye,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { getAdminOrders } from "../../../services/orderService";
import type { UserOrder } from "../../../services/orderService";
import "./AdminDashboard.css";

const AdminDashboard: React.FC = () => {
  const [recentOrders, setRecentOrders] = useState<UserOrder[]>([]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const ordersRes = await getAdminOrders(token);
        if (ordersRes.success && Array.isArray(ordersRes.orders)) {
          setRecentOrders(ordersRes.orders.slice(0, 5));
        }
      } catch (error) {
        console.error("Dashboard recent orders load error:", error);
      }
    };

    fetchRecentOrders();
  }, []);

  return (
    <main className="admin-dashboard">
      {/* Store Management Modules */}
      <div className="section-title-wrap">
        <span className="admin-eyebrow">
          <ShieldCheck size={14} strokeWidth={2.5} />
          CONTROL CENTER
        </span>
        <h2>Store Management Modules</h2>
        <p>Quick shortcuts to manage different sections of your platform</p>
      </div>

      <section className="admin-content">
        {/* Products Panel */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div className="panel-badge-icon blue">
              <Package size={20} />
            </div>
            <p className="panel-tag">CATALOG</p>
          </div>
          <h2>Product Management</h2>
          <span>Add new products, edit descriptions, adjust pricing, stock levels, and upload gallery images.</span>
          <div className="panel-footer-links">
            <Link to="/admin/products" className="admin-panel-link">
              <span>View Product List</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/admin/add/product" className="panel-sub-action">
              <Plus size={13} /> Add
            </Link>
          </div>
        </div>

        {/* Categories Panel */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div className="panel-badge-icon purple">
              <Layers size={20} />
            </div>
            <p className="panel-tag">TAXONOMY</p>
          </div>
          <h2>Category Management</h2>
          <span>Create and organize categories, upload category icons, and structure the product navigation hierarchy.</span>
          <div className="panel-footer-links">
            <Link to="/admin/categories" className="admin-panel-link">
              <span>Manage Categories</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Orders Panel */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div className="panel-badge-icon emerald">
              <ShoppingBag size={20} />
            </div>
            <p className="panel-tag">FULFILLMENT</p>
          </div>
          <h2>Order Management</h2>
          <span>Inspect customer purchases, update delivery & shipping milestones, and process refunds.</span>
          <div className="panel-footer-links">
            <Link to="/admin/orders" className="admin-panel-link">
              <span>View All Orders</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Users Panel */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div className="panel-badge-icon amber">
              <Users size={20} />
            </div>
            <p className="panel-tag">ACCESS & ROLES</p>
          </div>
          <h2>User Management</h2>
          <span>View registered customer profiles, inspect authentication providers, and toggle account active status.</span>
          <div className="panel-footer-links">
            <Link to="/admin/users" className="admin-panel-link">
              <span>Manage Platform Users</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Orders Overview */}
      {recentOrders.length > 0 && (
        <section className="admin-recent-orders-section">
          <div className="recent-orders-header">
            <div>
              <span className="admin-eyebrow">ACTIVITY FEED</span>
              <h2>Recent Orders</h2>
            </div>
            <Link to="/admin/orders" className="view-all-link">
              <span>View All Orders</span>
              <ExternalLink size={14} />
            </Link>
          </div>

          <div className="recent-orders-table-wrapper">
            <table className="recent-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => {
                  const orderId = ord._id || ord.orderId || "";
                  const customerName =
                    ord.shippingAddress?.fullName ||
                    ord.address?.fullName ||
                    ord.user?.name ||
                    "Customer";
                  const dateStr = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  const status = ord.orderStatus || "Processing";

                  return (
                    <tr key={orderId}>
                      <td>
                        <span className="order-id-cell">
                          #{orderId.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong>{customerName}</strong>
                      </td>
                      <td>{dateStr}</td>
                      <td>
                        <span
                          className={`order-status-pill ${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td>
                        <Link to="/admin/orders" className="order-action-link">
                          <Eye size={14} />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
};

export default AdminDashboard;