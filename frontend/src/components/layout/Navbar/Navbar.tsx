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
  HelpCircle,
  Mic,
  MicOff,
  Coins,
  ArrowRight,
} from "lucide-react";
import "./Navbar.css";
import logo from "../../../assets/logo.png";
import { useVoiceSearch } from "../../../hooks/useVoiceSearch";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "../../../services/notificationService";
import { getWishlist } from "../../../services/wishlistService";

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
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [pointsTooltipOpen, setPointsTooltipOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number | null>(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const prevTotalRef = useRef(totalItems);
  const pointsRef = useRef<HTMLDivElement>(null);

  // Voice Search integration with console testing logs
  const { isListening, startListening, isSupported } = useVoiceSearch({
    onResult: (transcriptText) => {
      console.log("🛒 [Navbar Voice Search] Recognized text applied to search:", transcriptText);
      setSearchQuery(transcriptText);
    },
  });

  // Trigger bounce on flight arrival event or when totalItems increases
  useEffect(() => {
    const handleCartBounce = () => {
      setIsCartBouncing(true);
      const timer = setTimeout(() => setIsCartBouncing(false), 750);
      return () => clearTimeout(timer);
    };

    window.addEventListener("cart-badge-bounce", handleCartBounce);
    return () => window.removeEventListener("cart-badge-bounce", handleCartBounce);
  }, []);

  useEffect(() => {
    if (totalItems > prevTotalRef.current) {
      setIsCartBouncing(true);
      const timer = setTimeout(() => setIsCartBouncing(false), 750);
      return () => clearTimeout(timer);
    }
    prevTotalRef.current = totalItems;
  }, [totalItems]);

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

  // Fetch wishlist count
  const loadWishlistCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getWishlist();
      if (res.success) {
        setWishlistCount(res.products?.length || 0);
      }
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
      loadWishlistCount();
      refreshUser?.();

      const handleWishlistUpdate = () => {
        loadWishlistCount();
      };
      const handlePointsUpdate = () => {
        refreshUser?.();
      };

      window.addEventListener("wishlist-updated", handleWishlistUpdate);
      window.addEventListener("reward-points-updated", handlePointsUpdate);
      return () => {
        window.removeEventListener("wishlist-updated", handleWishlistUpdate);
        window.removeEventListener("reward-points-updated", handlePointsUpdate);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setWishlistCount(null);
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
      if (pointsRef.current && !pointsRef.current.contains(target)) {
        setPointsTooltipOpen(false);
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
        setPointsTooltipOpen(false);
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
    setPointsTooltipOpen(false);
  }, [location.pathname]);

  // Sync search input state with URL search param on page load or external URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get("search") || "";
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [location.pathname, location.search]);

  // Debounced search navigation on searchQuery changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentUrlSearch = params.get("search") || "";
    const trimmed = searchQuery.trim();

    // Avoid navigation loop if query already matches the active URL search parameter
    if (trimmed === currentUrlSearch) {
      return;
    }

    const timer = setTimeout(() => {
      if (trimmed) {
        navigate(`/products?search=${encodeURIComponent(trimmed)}`);
      } else if (
        location.pathname.startsWith("/products") &&
        currentUrlSearch
      ) {
        navigate("/products");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, location.pathname, location.search, navigate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    } else if (
      location.pathname.startsWith("/products") &&
      location.search.includes("search=")
    ) {
      navigate("/products");
    }
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setProfileDropdownOpen(false);
    setNotifDropdownOpen(false);
    setPointsTooltipOpen(false);
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
    if (
      upperType.includes("PROMO") ||
      upperType.includes("DISCOUNT") ||
      upperType.includes("REFERRAL") ||
      upperType.includes("REWARD")
    ) {
      return <Sparkles size={16} />;
    }
    return <CheckCircle2 size={16} />;
  };

  if (location.pathname === "/checkout") {
    return null;
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const rewardPoints = Number(user?.rewardPoints) || 0;

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
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                className="search-input"
                placeholder={isListening ? "Listening... Speak now 🎙️" : "Search products..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className={`voice-search-btn ${isListening ? "listening" : ""}`}
                onClick={startListening}
                title={
                  !isSupported
                    ? "Voice search not supported in this browser"
                    : isListening
                    ? "Listening... Click to stop"
                    : "Search by voice"
                }
                aria-label={isListening ? "Stop voice search" : "Start voice search"}
              >
                {isListening ? (
                  <MicOff size={16} className="voice-mic-icon active" />
                ) : (
                  <Mic size={16} className="voice-mic-icon" />
                )}
              </button>
              <button type="submit" className="search-btn" aria-label="Search">
                <Search size={16} strokeWidth={2} />
              </button>
            </form>
          )}

          {/* Static Right Actions (Visible on Mobile next to 3-line Menu Toggle and on Desktop) */}
          <div className="navbar-top-actions">
            {/* Reward Points Badge with Hover / Pointing Tooltip */}
            {isAuthenticated && user?.role !== "admin" && (
              <div
                className="reward-points-wrapper"
                ref={pointsRef}
                onMouseEnter={() => setPointsTooltipOpen(true)}
                onMouseLeave={() => setPointsTooltipOpen(false)}
              >
                <button
                  type="button"
                  id="navbar-reward-points-badge"
                  className={`reward-points-badge ${pointsTooltipOpen ? "active" : ""}`}
                  onClick={() => {
                    setPointsTooltipOpen((prev) => !prev);
                    setNotifDropdownOpen(false);
                    setProfileDropdownOpen(false);
                  }}
                  aria-expanded={pointsTooltipOpen}
                  aria-label={`Reward Points: ${rewardPoints} points. 1 point = 1 rupee discount.`}
                  title="Reward Points: 1 Point = 1 Rupee (₹1) Discount"
                >
                  <span className="reward-coin-circle">
                    <Coins size={15} className="reward-coin-icon" />
                  </span>
                  <span className="reward-points-num">
                    {rewardPoints.toLocaleString("en-IN")}
                  </span>
                  <span className="reward-points-unit">Pts</span>
                </button>

                {/* Dropdown Tooltip on pointing/hovering */}
                {pointsTooltipOpen && (
                  <div className="reward-points-tooltip" role="tooltip">
                    <div className="reward-tooltip-arrow" />

                    <div className="reward-tooltip-header">
                      <div className="reward-tooltip-badge-pill">
                        <Coins size={14} className="gold-coin-svg" />
                        <span>Reward Points</span>
                      </div>
                      <span className="reward-rate-badge">1 Pt = ₹1 Off</span>
                    </div>

                    <div className="reward-tooltip-balance-card">
                      <div className="reward-balance-row">
                        <span className="reward-balance-label">Available Points</span>
                        <span className="reward-balance-value">
                          <Coins size={14} className="inline-coin" />
                          {rewardPoints.toLocaleString("en-IN")} Pts
                        </span>
                      </div>
                      <div className="reward-discount-row">
                        <span className="reward-discount-label">Discount Value</span>
                        <span className="reward-discount-amount">₹{rewardPoints.toLocaleString("en-IN")} Discount</span>
                      </div>
                    </div>

                    <div className="reward-tooltip-rule">
                      <Sparkles size={13} className="rule-sparkle" />
                      <span>
                        <strong>1 Point = 1 Rupee (₹1) Discount</strong> on your orders!
                      </span>
                    </div>

                    <p className="reward-tooltip-hint">
                      Earn more points every time friends purchase using your referral link.
                    </p>

                    <div className="reward-tooltip-footer">
                      <Link
                        to="/profile?tab=referrals"
                        className="reward-view-link"
                        onClick={closeMenu}
                      >
                        <span>View Referral Dashboard</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Bell Dropdown Container */}
            {isAuthenticated && user?.role !== "admin" && (
              <div className="notif-dropdown-wrapper" ref={notifDropdownRef}>
                <button
                  type="button"
                  className={`notif-bell-trigger ${notifDropdownOpen ? "active" : ""}`}
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setProfileDropdownOpen(false);
                    setPointsTooltipOpen(false);
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

            {/* Mobile / Top Bar Quick Cart Icon */}
            {isAuthenticated && user?.role !== "admin" && (
              <Link
                to="/cart"
                id="navbar-cart-mobile-btn"
                className={`notif-bell-trigger mobile-cart-top-btn ${
                  isCartBouncing ? "cart-icon-bouncing" : ""
                }`}
                onClick={closeMenu}
                aria-label="View Cart"
                title="View Cart"
              >
                <ShoppingCart size={19} strokeWidth={1.9} />
                {totalItems > 0 && (
                  <span
                    className={`cart-badge-count ${
                      isCartBouncing ? "cart-badge-bouncing" : ""
                    }`}
                  >
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile Hamburger Toggle (Three navbar lines) */}
            <button
              type="button"
              className={`menu-toggle ${menuOpen ? "active" : ""}`}
              onClick={() => {
                setMenuOpen(!menuOpen);
                setNotifDropdownOpen(false);
                setProfileDropdownOpen(false);
                setPointsTooltipOpen(false);
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
                {/* Mobile Drawer Points Banner (Visible only in mobile slideout) */}
                <div className="mobile-points-banner">
                  <div className="mobile-points-top">
                    <div className="mobile-points-coin-box">
                      <Coins size={20} className="reward-coin-icon" />
                    </div>
                    <div className="mobile-points-info">
                      <span className="mobile-points-title">Reward Balance</span>
                      <span className="mobile-points-amount">
                        {rewardPoints.toLocaleString("en-IN")} Points
                      </span>
                    </div>
                    <span className="mobile-points-rate">1 Pt = ₹1 Off</span>
                  </div>
                  <div className="mobile-points-benefit">
                    <span>1 Point = 1 Rupee discount on your next order</span>
                  </div>
                </div>

                <Link
                  to="/cart"
                  id="navbar-cart-link"
                  className="navbar-link navbar-icon-link"
                  onClick={closeMenu}
                  style={{ position: "relative" }}
                >
                  <span
                    style={{ display: "inline-flex" }}
                    className={isCartBouncing ? "cart-icon-bouncing" : ""}
                  >
                    <ShoppingCart size={18} strokeWidth={1.9} />
                  </span>
                  <span>Cart</span>
                  {totalItems > 0 && (
                    <span
                      className={`cart-badge-count ${
                        isCartBouncing ? "cart-badge-bouncing" : ""
                      }`}
                    >
                      {totalItems}
                    </span>
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
                      setPointsTooltipOpen(false);
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
                        <div className="dropdown-item-left">
                          <User size={16} className="dropdown-item-icon" />
                          <span>Your Account</span>
                        </div>
                      </Link>

                      <Link
                        to="/order"
                        className="dropdown-item"
                        onClick={closeMenu}
                      >
                        <div className="dropdown-item-left">
                          <Package size={16} className="dropdown-item-icon" />
                          <span>Orders</span>
                        </div>
                      </Link>

                      <Link
                        to="/wishlist"
                        className="dropdown-item"
                        onClick={closeMenu}
                      >
                        <div className="dropdown-item-left">
                          <Heart size={16} className="dropdown-item-icon" />
                          <span>Wishlist</span>
                        </div>
                        {wishlistCount !== null && wishlistCount > 0 && (
                          <span className="dropdown-count-badge wishlist-badge">{wishlistCount}</span>
                        )}
                      </Link>

                      <Link
                        to="/profile?tab=referrals"
                        className="dropdown-item reward-dropdown-item"
                        onClick={closeMenu}
                      >
                        <div className="dropdown-item-left">
                          <Coins size={16} className="dropdown-item-icon reward-dropdown-coin-icon" />
                          <span>Reward Points</span>
                        </div>
                        <span className="dropdown-count-badge reward-pts-badge">
                          {rewardPoints.toLocaleString("en-IN")} Pts
                        </span>
                      </Link>

                      <Link
                        to="/contact-help"
                        className="dropdown-item"
                        onClick={closeMenu}
                      >
                        <div className="dropdown-item-left">
                          <HelpCircle size={16} className="dropdown-item-icon" />
                          <span>Help & Support</span>
                        </div>
                      </Link>

                      <div className="dropdown-divider" />

                      <button
                        type="button"
                        className="dropdown-item logout-item"
                        onClick={handleLogout}
                      >
                        <div className="dropdown-item-left">
                          <LogOut size={16} className="dropdown-item-icon" />
                          <span>Logout</span>
                        </div>
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

                <Link
                  to="/admin/inquiries"
                  className="navbar-link"
                  onClick={closeMenu}
                >
                  Inquiries
                </Link>

                <Link
                  to="/admin/promos"
                  className="navbar-link"
                  onClick={closeMenu}
                >
                  Video Promos
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