import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import {
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  Bell,
  BellOff,
  LogOut,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import { AccountDetailsTab } from "./AccountDetailsTab";
import { OrdersTab } from "./OrdersTab";
import { WishlistTab } from "./WishlistTab";
import { AddressesTab } from "./AddressesTab";
import { getUserOrders } from "../../services/orderService";
import { getWishlist } from "../../services/wishlistService";
import { fetchUserAddresses } from "../../services/addressService";
import "./profile.css";

export type ProfileTab = "account" | "orders" | "wishlist" | "addresses";

interface NavItem {
  id: ProfileTab;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string | number | null;
}

export const Profile: React.FC = () => {
  const { user, isAuthenticated, logout, token } = useAuth();
  const {
    isSupported,
    permission,
    isSubscribed,
    loading: notifLoading,
    actionLoading: notifActionLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const location = useLocation();
  const navigate = useNavigate();

  // Read active tab from URL search param ?tab=... (default to 'account')
  const queryParams = new URLSearchParams(location.search);
  const currentTabParam = (queryParams.get("tab") as ProfileTab) || "account";

  const [activeTab, setActiveTab] = useState<ProfileTab>(
    ["account", "orders", "wishlist", "addresses"].includes(currentTabParam)
      ? currentTabParam
      : "account"
  );

  // Mobile sticky dropdown menu toggle state & ref
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Dynamic counts for sidebar badges
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [wishlistCount, setWishlistCount] = useState<number | null>(null);
  const [addressCount, setAddressCount] = useState<number | null>(null);

  // Logout confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close mobile dropdown on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Sync tab with URL parameter changes
  useEffect(() => {
    const tabParam = (new URLSearchParams(location.search).get("tab") as ProfileTab) || "account";
    if (["account", "orders", "wishlist", "addresses"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Load badge counts in background
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadCounts = async () => {
      try {
        const [ordersRes, wishlistRes, addressesRes] = await Promise.allSettled([
          getUserOrders(token),
          getWishlist(token),
          fetchUserAddresses(token),
        ]);

        if (ordersRes.status === "fulfilled" && ordersRes.value.success) {
          setOrderCount(ordersRes.value.orders?.length || 0);
        }
        if (wishlistRes.status === "fulfilled" && wishlistRes.value.success) {
          setWishlistCount(wishlistRes.value.products?.length || 0);
        }
        if (addressesRes.status === "fulfilled") {
          setAddressCount(addressesRes.value.length || 0);
        }
      } catch (err) {
        console.warn("Error fetching badge counts:", err);
      }
    };

    loadCounts();
  }, [isAuthenticated, token]);

  const handleTabChange = (tabId: ProfileTab) => {
    setActiveTab(tabId);
    navigate(`/profile?tab=${tabId}`, { replace: true });
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNotificationToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/login");
  };

  if (!isAuthenticated) {
    return (
      <main className="profile-page-wrapper">
        <div className="profile-auth-prompt-card">
          <div className="auth-prompt-icon-bubble">
            <UserIcon size={38} />
          </div>
          <h2>Sign in to view your Account</h2>
          <p>
            Access your order history, manage saved addresses, track shipments, and configure notification preferences.
          </p>
          <div className="auth-prompt-actions">
            <Link to="/login" className="prompt-login-btn">
              Sign In to Account
            </Link>
            <Link to="/register" className="prompt-register-btn">
              Create New Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const navItems: NavItem[] = [
    {
      id: "account",
      label: "Account Details",
      subtitle: "Personal information & security",
      icon: <UserIcon size={18} />,
    },
    {
      id: "orders",
      label: "My Orders",
      subtitle: "Tracking, history & invoices",
      icon: <Package size={18} />,
      badge: orderCount !== null && orderCount > 0 ? orderCount : null,
    },
    {
      id: "wishlist",
      label: "Favourite Items",
      subtitle: "Your saved products",
      icon: <Heart size={18} />,
      badge: wishlistCount !== null && wishlistCount > 0 ? wishlistCount : null,
    },
    {
      id: "addresses",
      label: "Saved Addresses",
      subtitle: "Delivery locations & defaults",
      icon: <MapPin size={18} />,
      badge: addressCount !== null ? `${addressCount}/3` : null,
    },
  ];

  const activeNavItem = navItems.find((item) => item.id === activeTab) || navItems[0];

  return (
    <main className="profile-page-wrapper">
      <div className="profile-layout-container">
        {/* =========================================================
            MOBILE STICKY NAVIGATION DROPDOWN MENU
            (Always static/sticky at top when scrolling on mobile)
        ========================================================= */}
        <div className="profile-mobile-nav-container" ref={mobileNavRef}>
          <button
            type="button"
            className={`profile-mobile-dropdown-trigger ${mobileMenuOpen ? "open" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Select Account Section"
          >
            <div className="mobile-trigger-active-info">
              <div className="mobile-trigger-icon-wrap">
                {activeNavItem.icon}
              </div>
              <div className="mobile-trigger-text">
                <span className="mobile-trigger-eyebrow">Account Section</span>
                <span className="mobile-trigger-label">{activeNavItem.label}</span>
              </div>
            </div>

            <div className="mobile-trigger-right">
              {activeNavItem.badge && (
                <span className="mobile-trigger-badge">{activeNavItem.badge}</span>
              )}
              <ChevronDown
                size={18}
                className={`mobile-trigger-chevron ${mobileMenuOpen ? "rotated" : ""}`}
              />
            </div>
          </button>

          {/* Expanded Dropdown Panel */}
          {mobileMenuOpen && (
            <div className="profile-mobile-dropdown-menu">
              <div className="mobile-dropdown-user-header">
                <div className="mobile-dropdown-avatar">{userInitial}</div>
                <div className="mobile-dropdown-user-details">
                  <p className="mobile-dropdown-name">{user?.name || "Customer"}</p>
                  <p className="mobile-dropdown-email">{user?.email || "Member"}</p>
                </div>
              </div>

              <div className="mobile-dropdown-divider" />

              <div className="mobile-dropdown-list">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`mobile-dropdown-item ${isActive ? "active" : ""}`}
                      onClick={() => handleTabChange(item.id)}
                    >
                      <div className="nav-item-left">
                        <div className="nav-item-icon-wrap">{item.icon}</div>
                        <div className="nav-item-text">
                          <span className="nav-label">{item.label}</span>
                          <span className="nav-sub">{item.subtitle}</span>
                        </div>
                      </div>
                      {item.badge && <span className="nav-badge">{item.badge}</span>}
                    </button>
                  );
                })}

                {/* Inline Notifications Toggle in Mobile Dropdown */}
                <div className="mobile-dropdown-toggle-item">
                  <div className="nav-item-left">
                    <div className={`nav-item-icon-wrap notif-icon-wrap ${isSubscribed ? "active" : ""}`}>
                      {isSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
                    </div>
                    <div className="nav-item-text">
                      <span className="nav-label">Notifications</span>
                      <span className="nav-sub">
                        {notifActionLoading
                          ? "Updating..."
                          : permission === "denied"
                          ? "Blocked in browser"
                          : isSubscribed
                          ? "On"
                          : "Off"}
                      </span>
                    </div>
                  </div>
                  <div className="nav-toggle-action-wrap">
                    {notifActionLoading && <Loader2 size={14} className="notif-spinner" />}
                    <label className="nav-toggle-switch">
                      <input
                        type="checkbox"
                        checked={isSubscribed}
                        disabled={notifLoading || notifActionLoading || permission === "denied" || !isSupported}
                        onChange={handleNotificationToggle}
                        aria-label="Toggle notifications on off"
                      />
                      <span className="nav-toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  className="mobile-dropdown-item mobile-logout-item"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutModal(true);
                  }}
                >
                  <div className="nav-item-left">
                    <div className="nav-item-icon-wrap logout-icon-wrap">
                      <LogOut size={18} />
                    </div>
                    <div className="nav-item-text">
                      <span className="nav-label">Log Out</span>
                      <span className="nav-sub">End current session</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
            LEFT NAVIGATION SIDEBAR (Desktop)
        ========================================================= */}
        <aside className="profile-sidebar">
          {/* User Profile Badge Header */}
          <div className="sidebar-user-card">
            <div className="sidebar-avatar-wrap">
              <div className="sidebar-avatar">{userInitial}</div>
            </div>

            <div className="sidebar-user-info">
              <h3 className="sidebar-user-name">{user?.name || "Customer"}</h3>
              <p className="sidebar-user-email">{user?.email || "Member"}</p>
            </div>
          </div>

          {/* Navigation Menu List */}
          <nav className="sidebar-nav-menu" aria-label="Account navigation">
            <span className="sidebar-section-title">Navigation Menu</span>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => handleTabChange(item.id)}
                >
                  <div className="nav-item-left">
                    <div className="nav-item-icon-wrap">{item.icon}</div>
                    <div className="nav-item-text">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-sub">{item.subtitle}</span>
                    </div>
                  </div>

                  <div className="nav-item-right">
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                    <ChevronRight size={14} className="nav-arrow" />
                  </div>
                </button>
              );
            })}

            {/* Direct Notification Toggle in the Nav Menu */}
            <div className="sidebar-nav-toggle-row">
              <div className="nav-item-left">
                <div className={`nav-item-icon-wrap notif-icon-wrap ${isSubscribed ? "active" : ""}`}>
                  {isSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
                </div>
                <div className="nav-item-text">
                  <span className="nav-label">Notifications</span>
                  <span className="nav-sub">
                    {notifActionLoading
                      ? "Updating..."
                      : permission === "denied"
                      ? "Blocked in browser"
                      : isSubscribed
                      ? "On"
                      : "Off"}
                  </span>
                </div>
              </div>

              <div className="nav-toggle-action-wrap">
                {notifActionLoading && <Loader2 size={14} className="notif-spinner" />}
                <label className="nav-toggle-switch" title={permission === "denied" ? "Notifications blocked in browser settings" : `Turn Notifications ${isSubscribed ? "Off" : "On"}`}>
                  <input
                    type="checkbox"
                    checked={isSubscribed}
                    disabled={notifLoading || notifActionLoading || permission === "denied" || !isSupported}
                    onChange={handleNotificationToggle}
                    aria-label="Toggle Notifications On or Off"
                  />
                  <span className="nav-toggle-slider"></span>
                </label>
              </div>
            </div>
          </nav>

          {/* Sidebar Footer & Logout */}
          <div className="sidebar-footer">
            <Link to="/products" className="sidebar-browse-link">
              <ShoppingBag size={15} />
              <span>Explore Products</span>
              <ArrowRight size={13} className="browse-arrow" />
            </Link>

            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* =========================================================
            RIGHT MAIN OPENED SECTION
        ========================================================= */}
        <section className="profile-main-content">
          {activeTab === "account" && (
            <AccountDetailsTab
              onNavigateToOrders={() => handleTabChange("orders")}
              onNavigateToWishlist={() => handleTabChange("wishlist")}
            />
          )}

          {activeTab === "orders" && <OrdersTab />}

          {activeTab === "wishlist" && <WishlistTab />}

          {activeTab === "addresses" && <AddressesTab />}
        </section>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="profile-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <LogOut size={20} className="modal-warning-icon" />
                <h4>Confirm Sign Out</h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="modal-description">
              Are you sure you want to log out of your Shopora account?
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Stay Logged In
              </button>
              <button
                type="button"
                className="modal-danger-btn"
                onClick={handleLogoutConfirm}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Profile;