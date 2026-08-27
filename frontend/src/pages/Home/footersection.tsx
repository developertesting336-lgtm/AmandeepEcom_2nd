
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">

      {/* Main Footer */}
      <div className="footer-container">

        {/* Brand */}
        <div className="footer-brand">

          <Link to="/" className="footer-logo">
            <span className="footer-logo-mark">S</span>
            <span className="footer-logo-text">Shopora</span>
          </Link>

          <p>
            Discover quality products at great prices.
            Shop smarter, shop better, and enjoy a seamless
            shopping experience.
          </p>

          <div className="footer-socials">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">in</a>
            <a href="#" aria-label="Twitter">𝕏</a>
          </div>

        </div>


        {/* Quick Links */}
        <div className="footer-column">

          <h3>Quick Links</h3>

          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact Us</Link>

        </div>


        {/* Customer */}
        <div className="footer-column">

          <h3>Customer Care</h3>

          <Link to="/orders">My Orders</Link>
          <Link to="/cart">Shopping Cart</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/faq">FAQs</Link>

        </div>


        {/* Categories */}
        <div className="footer-column">

          <h3>Categories</h3>

          <Link to="/products?category=fashion">
            Clothing
          </Link>

          <Link to="/products?category=electronics">
            Electronics
          </Link>

          <Link to="/products?category=toys">
            Toys
          </Link>

          <Link to="/products?category=grocery">
            Grocery
          </Link>

        </div>


        {/* Newsletter */}
        <div className="footer-newsletter">

          <span className="footer-eyebrow">
            STAY CONNECTED
          </span>

          <h3>Get updates & offers</h3>

          <p>
            Subscribe to receive new product updates,
            exclusive offers and special deals.
          </p>

          <form className="newsletter-form">

            <input
              type="email"
              placeholder="Your email address"
              aria-label="Email address"
            />

            <button type="submit">
              →
            </button>

          </form>

        </div>

      </div>


      {/* Footer Bottom */}
      <div className="footer-bottom">

        <div className="footer-bottom-container">

          <p>
            © {new Date().getFullYear()} Shopora. All rights reserved.
          </p>

          <div className="footer-legal">
            <Link to="/privacy-policy">
              Privacy Policy
            </Link>

            <Link to="/terms">
              Terms & Conditions
            </Link>

            <Link to="/shipping-policy">
              Shipping Policy
            </Link>
          </div>

        </div>

      </div>

    </footer>
  );
};

export default Footer;

