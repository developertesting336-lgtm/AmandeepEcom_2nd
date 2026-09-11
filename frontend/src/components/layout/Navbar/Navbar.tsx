import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/authContext";
import { useCart } from "../../../context/cartContext";
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  User,
  Package,
  Heart,
  LogOut,
  ChevronDown,
  Bell,
  CheckCheck,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";
import "./Navbar.css";
import logo from "../../../assets/logo.png";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "../../../services/notificationService";

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Fetch unread count on login or route changes
  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent
    }
  };

  // Fetch full notifications list from /api/notifications
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    setLoadingNotifications(true);
    try {
      const [list, count] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, location.pathname]);

  // When notification dropdown is opened, load latest notifications from /api/notifications
  useEffect(() => {
    if (notifDropdownOpen && isAuthenticated) {
      loadNotifications();
    }
  }, [notifDropdownOpen, isAuthenticated]);

  // Close dropdowns and mobile menu on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
        setNotifDropdownOpen(false);
      }
      if (navRef.current && !navRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setProfileDropdownOpen(false);
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close dropdowns and mobile menu on route changes
  useEffect(() => {
    setProfileDropdownOpen(false);
    setNotifDropdownOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Live search triggering navigate on searchQuery change
  useEffect(() => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      if (
        window.location.pathname.startsWith("/products") &&
        window.location.search.includes("search=")
      ) {
        navigate("/products");
      }
    }
  }, [searchQuery]);

  const closeMenu = () => {
    setMenuOpen(false);
    setProfileDropdownOpen(false);
    setNotifDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login");
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifDropdownOpen(false);

    const targetUrl = notif.metadata?.url || (notif.orderId ? "/order" : null);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getNotifIcon = (type?: string) => {
    const upperType = type?.toUpperCase() || "";
    if (upperType.includes("ORDER") || upperType.includes("DELIVER")) {
      return <Package size={16} />;
    }
    if (upperType.includes("PROMO") || upperType.includes("DISCOUNT")) {
      return <Sparkles size={16} />;
    }
    return <CheckCircle2 size={16} />;
  };

  if (location.pathname === "/checkout") {
    return null;
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <header className="navbar" ref={navRef}>
        <div className="navbar-container">
          {/* Logo */}
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <img src={logo} alt="Shopora Logo" className="logo" />
            <span className="brand-name">Shopora</span>
          </Link>

          {/* SEARCH BAR (Hidden for Admin) */}
          {user?.role !== "admin" && (
            <form className="search-form" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <Search size={16} strokeWidth={2} />
              </button>
            </form>
          )}

          {/* Static Right Actions (Visible on Mobile next to 3-line Menu Toggle and on Desktop) */}
          <div className="navbar-top-actions">
            {/* Notification Bell Dropdown Container */}
            {isAuthenticated && user?.role !== "admin" && (
              <div className="notif-dropdown-wrapper" ref={notifDropdownRef}>
                <button
                  type="button"
                  className={`notif-bell-trigger ${notifDropdownOpen ? "active" : ""}`}
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setProfileDropdownOpen(false);
                  }}
                  aria-expanded={notifDropdownOpen}
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <Bell size={20} strokeWidth={1.9} />
                  {unreadCount > 0 && <span className="notif-bell-indicator" />}
                </button>

                {/* Dropdown Popup Menu */}
                {notifDropdownOpen && (
                  <div className="notif-dropdown-menu">
                    <div className="notif-dropdown-header">
                      <div className="notif-header-title-wrap">
                        <span className="notif-header-title">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="notif-header-badge">{unreadCount}</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="notif-mark-read-btn"
                          onClick={handleMarkAllRead}
                        >
                          <CheckCheck size={14} />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="notif-dropdown-list">
                      {loadingNotifications ? (
                        <div className="notif-dropdown-empty">
                          <Clock size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                          <p>Loading notifications...</p>
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`notif-dropdown-item ${!n.isRead ? "unread" : ""}`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <div className="notif-item-icon">
                              {getNotifIcon(n.type)}
                            </div>
                            <div className="notif-item-body">
                              <div className="notif-item-top">
                                <p className="notif-item-title">{n.title}</p>
                                <span className="notif-item-time">{formatTimeAgo(n.createdAt)}</span>
                              </div>
                              <p className="notif-item-desc">{n.message}</p>
                            </div>
                            {!n.isRead && <span className="notif-item-dot" />}
                          </div>
                        ))
                      ) : (
                        <div className="notif-dropdown-empty">
                          <p>No notifications yet</p>
                        </div>
                      )}
                    </div>

                    <div className="notif-dropdown-footer">
                      <Link
                        to="/profile?tab=notifications"
                        className="notif-view-all-link"
                        onClick={closeMenu}
                      >
                        Notification Settings
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Toggle (Three navbar lines) */}
            <button
              type="button"
              className={`menu-toggle ${menuOpen ? "active" : ""}`}
              onClick={() => {
                setMenuOpen(!menuOpen);
                setNotifDropdownOpen(false);
                setProfileDropdownOpen(false);
              }}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Navigation Menu (Desktop links / Collapsible Mobile Menu) */}
          <nav className={`navbar-menu ${menuOpen ? "open" : ""}`}>
            {/* Common Links (Visible only for non-admin users and guests) */}
            {user?.role !== "admin" && (
              <>
                <Link to="/" className="navbar-link" onClick={closeMenu}>
                  Home
                </Link>

                <Link to="/products" className="navbar-link" onClick={closeMenu}>
                  Products
                </Link>

                <Link to="/about" className="navbar-link" onClick={closeMenu}>
                  About
                </Link>
              </>
            )}

            {/* Guest */}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="navbar-link" onClick={closeMenu}>
                  Login
                </Link>

                <Link to="/register" className="register-btn" onClick={closeMenu}>
                  Register
                </Link>
              </>
            )}

            {/* Normal User */}
            {isAuthenticated && user?.role !== "admin" && (
              <>
                <Link
                  to="/cart"
                  className="navbar-link navbar-icon-link"
                  onClick={closeMenu}
                  style={{ position: "relative" }}
                >
                  <ShoppingCart size={18} strokeWidth={1.9} />
                  <span>Cart</span>
                  {totalItems > 0 && (
                    <span className="cart-badge-count">{totalItems}</span>
                  )}
                </Link>

                {/* Profile Dropdown Container */}
                <div className="profile-dropdown-wrapper" ref={dropdownRef}>
                  <button
                    type="button"
                    className={`profile-trigger ${
                      profileDropdownOpen ? "active" : ""
                    }`}
                    onClick={() => {
                      setProfileDropdownOpen(!profileDropdownOpen);
                      setNotifDropdownOpen(false);
                    }}
                    aria-expanded={profileDropdownOpen}
                    aria-label="User account menu"
                  >
                    <div className="profile-avatar-badge">
                      {userInitial}
                    </div>
                    <span className="profile-name-label">
                      {user?.name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`dropdown-chevron ${
                        profileDropdownOpen ? "open" : ""
                      }`}
                    />
                  </button>

                  {/* Animated Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="profile-dropdown-menu">
                      <div className="dropdown-user-header">
                        <div className="dropdown-user-avatar">{userInitial}</div>
                        <div className="dropdown-user-info">
                          <p className="dropdown-user-name">
                            {user?.name || "User"}
                          </p>
                          <p className="dropdown-user-email">
                            {user?.email || "Member"}
                          </p>
                        </div>
                      </div>

                      <div className="dropdown-divider" />

                      <Link
                        to="/profile"
                        className="dropdown-item"
                        onClick={closeMenu}
                      >
                        <User size={16} className="dropdown-item-icon" />
                        <span>Your Account</span>
                      </Link>

                      <Link
                        to="/order"
                        className="dropdown-item"
                        onClick={closeMenu}
                      >
                        <Package size={16} className="dropdown-item-icon" />
                        <span>Orders</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        className="dropdown-item"
                        onClick={closeMenu}
                      >
                        <Heart size={16} className="dropdown-item-icon" />
                        <span>Wishlist</span>
                      </Link>

                      <div className="dropdown-divider" />

                      <button
                        type="button"
                        className="dropdown-item logout-item"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} className="dropdown-item-icon" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Admin */}
            {isAuthenticated && user?.role === "admin" && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="navbar-link"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>

                <Link
                  to="/admin/products"
                  className="navbar-link"
                  onClick={closeMenu}
                >
                  Manage Products
                </Link>

                <Link
                  to="/admin/categories"
                  className="navbar-link"
                  onClick={closeMenu}
                >
                  Categories
                </Link>

                <Link
                  to="/admin/orders"
                  className="navbar-link"
                  onClick={closeMenu}
                >
                  Orders
                </Link>

                <Link
                  to="/admin/users"
                  className="navbar-link"
                  onClick={closeMenu}
                >
                  Users
                </Link>

                <button
                  type="button"
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
        {/* Dimmed backdrop when mobile menu is open */}
        <div
          className={`mobile-nav-backdrop ${menuOpen ? "active" : ""}`}
          onClick={closeMenu}
          aria-hidden="true"
        />
      </header>
    </>
  );
};

export default Navbar;