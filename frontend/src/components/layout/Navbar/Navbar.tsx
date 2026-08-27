import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/authContext";
import { useCart } from "../../../context/cartContext";
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  Settings,
  Package,
  Heart,
  LogOut,
  ChevronDown,
} from "lucide-react";
import "./Navbar.css";
import logo from "../../../assets/logo.png";

const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close mobile menu and dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    if (menuOpen || profileDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, profileDropdownOpen]);

  // Close dropdown and mobile menu on route changes
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Live search triggering navigate on searchQuery change
  useEffect(() => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // If search query is emptied (e.g. backspaced all text), reset URL to /products to show all products
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
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login");
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

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className={`menu-toggle ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Navigation Menu */}
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
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
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
                      <Settings size={16} className="dropdown-item-icon" />
                      <span>Settings</span>
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