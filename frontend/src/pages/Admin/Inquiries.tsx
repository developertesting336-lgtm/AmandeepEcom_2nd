import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAdminInquiries,
  updateInquiryStatusApi,
  deleteInquiryApi,
  type InquiryItem,
} from "../../services/contactService";
import "./Inquiries.css";

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  order: "Order Status",
  shipping: "Shipping",
  refund: "Returns & Refund",
  payment: "Payment & Billing",
  product: "Product Query",
  account: "Account",
  other: "Other",
};

const AdminInquiries: React.FC = () => {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Active modal inquiry
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(
    null
  );
  const [editingNotes, setEditingNotes] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState<boolean>(false);

  const loadInquiries = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchAdminInquiries({
        status: statusFilter,
        category: categoryFilter,
        search: searchQuery,
      });
      setInquiries(data.inquiries || []);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load inquiries.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, [statusFilter, categoryFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadInquiries();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle status update
  const handleStatusChange = async (
    id: string,
    newStatus: InquiryItem["status"]
  ) => {
    try {
      await updateInquiryStatusApi(id, { status: newStatus });
      setInquiries((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, status: newStatus } : item
        )
      );
      if (selectedInquiry && selectedInquiry._id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      toast.success(`Inquiry marked as ${newStatus}`);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update status.";
      toast.error(errorMsg);
    }
  };

  // Handle saving notes in modal
  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setSavingNotes(true);
    try {
      await updateInquiryStatusApi(selectedInquiry._id, {
        notes: editingNotes,
      });
      setInquiries((prev) =>
        prev.map((item) =>
          item._id === selectedInquiry._id
            ? { ...item, notes: editingNotes }
            : item
        )
      );
      setSelectedInquiry((prev) =>
        prev ? { ...prev, notes: editingNotes } : null
      );
      toast.success("Internal notes saved successfully.");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save notes.";
      toast.error(errorMsg);
    } finally {
      setSavingNotes(false);
    }
  };

  // Handle delete inquiry
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer inquiry?")) {
      return;
    }

    try {
      await deleteInquiryApi(id);
      setInquiries((prev) => prev.filter((item) => item._id !== id));
      if (selectedInquiry && selectedInquiry._id === id) {
        setSelectedInquiry(null);
      }
      toast.success("Inquiry deleted.");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete inquiry.";
      toast.error(errorMsg);
    }
  };

  // Open modal
  const handleOpenDetails = (inquiry: InquiryItem) => {
    setSelectedInquiry(inquiry);
    setEditingNotes(inquiry.notes || "");
  };

  // KPI stats calculation
  const stats = useMemo(() => {
    const total = inquiries.length;
    const unread = inquiries.filter((i) => i.status === "unread").length;
    const inProgress = inquiries.filter((i) => i.status === "in-progress").length;
    const resolved = inquiries.filter(
      (i) => i.status === "resolved" || i.status === "closed"
    ).length;
    return { total, unread, inProgress, resolved };
  }, [inquiries]);

  return (
    <div className="admin-inquiries-section">
      <div className="inquiries-container">
        {/* ==========================================
            1. HEADER
            ========================================== */}
        <div className="inquiries-header">
          <div>
            <span className="inquiries-eyebrow">Customer Support</span>
            <h1>Customer Inquiries</h1>
            <p>
              View, manage, and respond to inquiries submitted by customers via
              the Contact & Help Center.
            </p>
          </div>

          <div className="inquiries-header-actions">
            <button
              type="button"
              className="inquiries-refresh-btn"
              onClick={() => loadInquiries(true)}
              disabled={refreshing || loading}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ==========================================
            2. KPI STATS
            ========================================== */}
        <div className="inquiries-stats-grid">
          <div className="inquiries-stat-card">
            <div className="inquiries-stat-icon total">
              <MessageSquare size={22} />
            </div>
            <div>
              <div className="inquiries-stat-num">{stats.total}</div>
              <div className="inquiries-stat-label">Total Inquiries</div>
            </div>
          </div>

          <div className="inquiries-stat-card">
            <div className="inquiries-stat-icon unread">
              <AlertCircle size={22} />
            </div>
            <div>
              <div className="inquiries-stat-num">{stats.unread}</div>
              <div className="inquiries-stat-label">Pending / Unread</div>
            </div>
          </div>

          <div className="inquiries-stat-card">
            <div className="inquiries-stat-icon inprogress">
              <Clock size={22} />
            </div>
            <div>
              <div className="inquiries-stat-num">{stats.inProgress}</div>
              <div className="inquiries-stat-label">In Progress</div>
            </div>
          </div>

          <div className="inquiries-stat-card">
            <div className="inquiries-stat-icon resolved">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="inquiries-stat-num">{stats.resolved}</div>
              <div className="inquiries-stat-label">Resolved / Closed</div>
            </div>
          </div>
        </div>

        {/* ==========================================
            3. FILTERS & SEARCH TOOLBAR
            ========================================== */}
        <div className="inquiries-toolbar">
          <div className="inquiries-search-box">
            <Search size={16} className="inquiries-search-icon" />
            <input
              type="text"
              className="inquiries-search-input"
              placeholder="Search by customer name, email, subject, order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="inquiries-search-clear"
                onClick={() => setSearchQuery("")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="inquiries-filters-group">
            <select
              className="inquiries-select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="unread">Unread / Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              className="inquiries-select-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="order">Order Status</option>
              <option value="shipping">Shipping</option>
              <option value="refund">Returns & Refunds</option>
              <option value="payment">Payment</option>
              <option value="product">Product Query</option>
              <option value="account">Account</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* ==========================================
            4. INQUIRIES TABLE
            ========================================== */}
        <div className="inquiries-table-card">
          {loading ? (
            <div className="inquiries-empty-state">
              <Loader2
                size={32}
                className="animate-spin"
                style={{ margin: "0 auto 12px", color: "#7257c2" }}
              />
              <p>Loading inquiries...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="inquiries-empty-state">
              <div className="inquiries-empty-icon">
                <MessageSquare size={24} />
              </div>
              <h3 style={{ margin: "0 0 4px 0", color: "#0f172a", fontSize: "16px" }}>
                No Inquiries Found
              </h3>
              <p style={{ margin: 0, fontSize: "13.5px" }}>
                {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                  ? "No results match the current filters."
                  : "Customer inquiries will appear here when submitted."}
              </p>
            </div>
          ) : (
            <div className="inquiries-table-wrapper">
              <table className="inquiries-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Subject & Category</th>
                    <th>Order ID</th>
                    <th>Received At</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inquiry) => {
                    const formattedDate = new Date(
                      inquiry.createdAt
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr
                        key={inquiry._id}
                        className={inquiry.status === "unread" ? "unread" : ""}
                      >
                        <td>
                          <div className="inquiries-customer-cell">
                            <span className="inquiries-customer-name">
                              {inquiry.name}
                            </span>
                            <a
                              href={`mailto:${inquiry.email}`}
                              className="inquiries-customer-email"
                            >
                              {inquiry.email}
                            </a>
                            {inquiry.phone && (
                              <span
                                style={{ fontSize: "11.5px", color: "#94a3b8" }}
                              >
                                {inquiry.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="inquiries-subject-cell">
                            <div
                              className="inquiries-subject-title"
                              title={inquiry.subject}
                            >
                              {inquiry.subject}
                            </div>
                            <span className="inquiries-category-badge">
                              {CATEGORY_LABELS[inquiry.category] ||
                                inquiry.category}
                            </span>
                          </div>
                        </td>

                        <td>
                          {inquiry.orderId ? (
                            <span className="inquiries-order-tag">
                              {inquiry.orderId}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                              —
                            </span>
                          )}
                        </td>

                        <td style={{ fontSize: "12.5px", color: "#64748b" }}>
                          {formattedDate}
                        </td>

                        <td>
                          <select
                            className={`inquiries-status-select ${inquiry.status}`}
                            value={inquiry.status}
                            onChange={(e) =>
                              handleStatusChange(
                                inquiry._id,
                                e.target.value as InquiryItem["status"]
                              )
                            }
                          >
                            <option value="unread">Unread</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>

                        <td>
                          <div
                            className="inquiries-actions-wrap"
                            style={{ justifyContent: "flex-end" }}
                          >
                            <button
                              type="button"
                              className="inquiries-action-btn"
                              title="View full inquiry"
                              onClick={() => handleOpenDetails(inquiry)}
                            >
                              <Eye size={15} />
                            </button>

                            <a
                              href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(
                                inquiry.subject
                              )}&body=Hi ${encodeURIComponent(
                                inquiry.name
                              )},%0D%0A%0D%0AThank you for contacting Shopora support.`}
                              className="inquiries-action-btn"
                              title="Reply by email"
                            >
                              <Mail size={15} />
                            </a>

                            <button
                              type="button"
                              className="inquiries-action-btn delete"
                              title="Delete inquiry"
                              onClick={() => handleDelete(inquiry._id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          5. DETAILS / NOTES MODAL
          ========================================== */}
      {selectedInquiry && (
        <div
          className="inquiry-modal-backdrop"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="inquiry-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="inquiry-modal-header">
              <h3 className="inquiry-modal-title">Inquiry Details</h3>
              <button
                type="button"
                className="inquiry-modal-close"
                onClick={() => setSelectedInquiry(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="inquiry-modal-body">
              <div className="inquiry-meta-grid">
                <div className="inquiry-meta-item">
                  <label>Customer Name</label>
                  <span>{selectedInquiry.name}</span>
                </div>
                <div className="inquiry-meta-item">
                  <label>Email Address</label>
                  <a href={`mailto:${selectedInquiry.email}`}>
                    {selectedInquiry.email}
                  </a>
                </div>
                <div className="inquiry-meta-item">
                  <label>Phone Number</label>
                  <span>{selectedInquiry.phone || "Not provided"}</span>
                </div>
                <div className="inquiry-meta-item">
                  <label>Category</label>
                  <span>
                    {CATEGORY_LABELS[selectedInquiry.category] ||
                      selectedInquiry.category}
                  </span>
                </div>
                <div className="inquiry-meta-item">
                  <label>Order ID</label>
                  <span>{selectedInquiry.orderId || "None"}</span>
                </div>
                <div className="inquiry-meta-item">
                  <label>Submitted Date</label>
                  <span>
                    {new Date(selectedInquiry.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="inquiry-message-box">
                <label>Customer Message</label>
                <div className="inquiry-message-content">
                  {selectedInquiry.message}
                </div>
              </div>

              <div className="inquiry-notes-box">
                <label>Admin Internal Notes</label>
                <textarea
                  className="inquiry-notes-textarea"
                  placeholder="Add internal resolution notes or remarks here..."
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                />
                <button
                  type="button"
                  className="inquiries-refresh-btn"
                  style={{ marginTop: "6px", fontSize: "12px", padding: "6px 12px" }}
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </div>

            <div className="inquiry-modal-footer">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                  Status:
                </span>
                <select
                  className={`inquiries-status-select ${selectedInquiry.status}`}
                  value={selectedInquiry.status}
                  onChange={(e) =>
                    handleStatusChange(
                      selectedInquiry._id,
                      e.target.value as InquiryItem["status"]
                    )
                  }
                >
                  <option value="unread">Unread</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <a
                href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(
                  selectedInquiry.subject
                )}&body=Hi ${encodeURIComponent(
                  selectedInquiry.name
                )},%0D%0A%0D%0AThank you for reaching out to Shopora.`}
                className="inquiry-reply-btn"
              >
                <Mail size={14} />
                <span>Reply by Email</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;
