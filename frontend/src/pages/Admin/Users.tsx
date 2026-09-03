import { useEffect, useState } from "react";
import {
  Search,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import "./Users.css";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user" | string;
  createdAt?: string;
  isActive?: boolean;
  phone?: string;
  authProvider?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Users = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      // Primary: GET /api/users/ (fallback: /api/admin/users)
      let res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      }

      const result = await res.json();

      if (res.ok) {
        const rawList =
          result.data?.users ||
          result.data ||
          result.users ||
          (Array.isArray(result) ? result : []);
        setUsers(Array.isArray(rawList) ? rawList : []);
      } else {
        setError(result.message || "Failed to load users");
        setUsers([]);
      }
    } catch (err) {
      console.error("Unable to load live admin users:", err);
      setError("Unable to connect to server. Please try again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId: string, currentStatus: boolean = true) => {
    try {
      setTogglingId(userId);
      // const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/admin/users/toggle-active/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const result = await res.json();

      if (res.ok) {
        // Update user status in state
        setUsers((prev) =>
          prev.map((u) => {
            if (u._id === userId) {
              const updatedStatus =
                result.data?.isActive !== undefined
                  ? result.data.isActive
                  : result.user?.isActive !== undefined
                    ? result.user.isActive
                    : result.isActive !== undefined
                      ? result.isActive
                      : !currentStatus;
              return { ...u, isActive: updatedStatus };
            }
            return u;
          })
        );
      } else {
        alert(result.message || "Failed to update user status");
      }
    } catch (err) {
      console.error("Error toggling user status:", err);
      alert("Something went wrong while updating user status.");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase().trim()) ||
    u.email?.toLowerCase().includes(search.toLowerCase().trim()) ||
    u._id?.toLowerCase().includes(search.toLowerCase().trim()) ||
    u.role?.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <section className="admin-users-section">
      <div className="users-header">
        <div>
          <span className="users-eyebrow">ADMINISTRATION</span>
          <h1>User Management</h1>
          <p>View registered accounts, toggle active/inactive access, and manage permissions.</p>
        </div>

        <button
          type="button"
          className="users-refresh-btn"
          onClick={fetchUsers}
          disabled={loading}
          title="Refresh users list"
        >
          <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="users-toolbar">
        <div className="users-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email, role, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="users-count">
          {filteredUsers.length} {filteredUsers.length === 1 ? "User" : "Users"}
        </span>
      </div>

      {error && <div className="users-error">{error}</div>}

      {loading ? (
        <div className="users-loading">
          <Loader2 size={32} className="spin-icon" style={{ margin: "0 auto 12px" }} />
          <p>Loading platform users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="users-empty">
          <UsersIcon size={48} color="#2563eb" style={{ margin: "0 auto 16px" }} />
          <h3>No Users Found</h3>
          <p>Registered customer and admin accounts will be listed here.</p>
        </div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const initial = u.name ? u.name.charAt(0).toUpperCase() : "U";
                const isUserActive = u.isActive !== false; // defaults to active if undefined
                const isToggling = togglingId === u._id;
                const dateStr = u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                  : "—";

                return (
                  <tr key={u._id} className={`user-table-row ${!isUserActive ? "inactive-row" : ""}`}>
                    <td className="cell-user-main">
                      <div className="user-cell">
                        <div className="user-avatar-box">{initial}</div>
                        <div className="user-info-group">
                          <strong>{u.name || "User"}</strong>
                          <div className="user-meta-row">
                            {u.authProvider && u.authProvider !== "local" && (
                              <span className="oauth-provider-badge">
                                {u.authProvider}
                              </span>
                            )}
                            <span className="user-id-sub">#{u._id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="cell-user-email">
                      <span className="user-email-text">{u.email}</span>
                    </td>

                    <td className="cell-user-role">
                      <span className={`role-badge ${u.role === "admin" ? "admin" : "user"}`}>
                        {u.role === "admin" ? "Admin" : "Customer"}
                      </span>
                    </td>

                    <td className="cell-user-status">
                      <span
                        className={`status-pill ${isUserActive ? "status-active" : "status-inactive"
                          }`}
                      >
                        {isUserActive ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span>Inactive</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="cell-user-date">
                      <span className="user-date-text">{dateStr}</span>
                    </td>

                    <td className="cell-user-actions">
                      <div className="user-actions">
                        <button
                          type="button"
                          className={`user-toggle-btn ${isUserActive ? "active" : "inactive"
                            }`}
                          onClick={() => handleToggleActive(u._id, isUserActive)}
                          disabled={isToggling || u.role === "admin"}
                          title={
                            u.role === "admin"
                              ? "Admin status cannot be modified"
                              : isUserActive
                                ? "Deactivate user"
                                : "Activate user"
                          }
                        >
                          {isToggling ? (
                            <Loader2 size={15} className="spin-icon" />
                          ) : isUserActive ? (
                            <ToggleRight size={18} />
                          ) : (
                            <ToggleLeft size={18} />
                          )}
                          <span>{isUserActive ? "Active Access" : "Inactive Access"}</span>
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
    </section>
  );
};

export default Users;
