import { useNavigate } from "react-router-dom";
import { ArrowRight, Smartphone, Footprints, ShoppingBasket, Shirt, Home as HomeIcon, Sparkles } from "lucide-react";
import "./Hero2.css";

const CATEGORIES = [
  { name: "Electronics", icon: Smartphone, bg: "#eff6ff", color: "#4d7c0f" },
  { name: "Fashion", icon: Shirt, bg: "#fdf2f8", color: "#db2777" },
  { name: "Groceries", icon: ShoppingBasket, bg: "#f0fdf4", color: "#16a34a" },
  { name: "Toys & Games", icon: Sparkles, bg: "#fff7ed", color: "#ea580c" },
  { name: "Footwear", icon: Footprints, bg: "#f3e8ff", color: "#9333ea" },
  { name: "Home & Living", icon: HomeIcon, bg: "#fef3c7", color: "#d97706" },
];

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero-glow" />

      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-heading">
            Deals worth
            <span className="hero-heading-accent"> stopping the scroll </span>
            for.
          </h1>

          <p className="hero-subtext">
            Thousands of products across electronics, fashion, home and
            beauty — discounted for a limited time only. New drops every
            week, prices that don't wait around.
          </p>

          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={() => navigate("/products")}>
              Shop Now
              <ArrowRight size={17} strokeWidth={2.25} />
            </button>
            <a href="#offers" className="hero-btn-secondary">
              View Offers
            </a>
          </div>
        </div>

        {/* Category Badges Showcase Grid */}
        <div className="hero-category-showcase">
          <h3 className="hero-category-heading">Explore Top Categories</h3>
          <div className="hero-category-grid">
            {CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.name}
                  className="hero-category-badge-card"
                  style={{ backgroundColor: cat.bg }}
                  onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                >
                  <div className="badge-icon-wrap" style={{ color: cat.color }}>
                    <IconComponent size={20} strokeWidth={2} />
                  </div>
                  <span className="badge-name">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;