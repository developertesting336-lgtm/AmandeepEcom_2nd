import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/authContext";
import "./Navbar.css";
import logo from "../../../assets/logo.png";

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();

    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        closeMenu();
        navigate("/login");
    };

    return (
        <header className="navbar">
            <div className="navbar-container">

                {/* Logo */}
                <Link
                    to="/"
                    className="navbar-logo"
                    onClick={closeMenu}
                >
                    <img
                        src={logo}
                        alt="Logo"
                        className="logo"
                    />
                </Link>

                {/* Hamburger */}
                <button
                    type="button"
                    className={`menu-toggle ${menuOpen ? "active" : ""}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation"
                    aria-expanded={menuOpen}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {/* Navigation */}
                <nav className={`navbar-menu ${menuOpen ? "open" : ""}`}>

                    {/* Common Links */}

                    <Link
                        to="/"
                        className="navbar-link"
                        onClick={closeMenu}
                    >
                        Home
                    </Link>

                    <Link
                        to="/about"
                        className="navbar-link"
                        onClick={closeMenu}
                    >
                        About
                    </Link>


                    {/* Guest */}

                    {!isAuthenticated && (
                        <>
                            <Link
                                to="/login"
                                className="navbar-link"
                                onClick={closeMenu}
                            >
                                Login
                            </Link>

                            <Link
                                to="/register"
                                className="register-btn"
                                onClick={closeMenu}
                            >
                                Register
                            </Link>
                        </>
                    )}


                    {/* Normal User */}

                    {isAuthenticated && user?.role !== "admin" && (
                        <>
                            <Link
                                to="/cart"
                                className="navbar-link"
                                onClick={closeMenu}
                            >
                                Cart
                            </Link>

                            <Link
                                to="/profile"
                                className="navbar-link"
                                onClick={closeMenu}
                            >
                                Profile
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
                                Products
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
        </header>
    );
};

export default Navbar;