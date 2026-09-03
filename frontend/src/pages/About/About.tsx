import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  Search,
  ArrowRight,
  Layers,
  CreditCard,
  SlidersHorizontal,
  CheckCircle2,
  Package,
  MapPin,
  ClipboardCheck,
  Users,
  RotateCcw,
  Sparkles,
  Award,
} from "lucide-react";
import Footer from "../Home/footersection";
import "./About.css";

// Import infrastructure & warehouse images
import warehouseImg1 from "../../assets/about section/wharehouse.png";
import warehouseImg2 from "../../assets/about section/wharehouse2.png";
import transportImg from "../../assets/about section/tansport.png";
import deliveryImg from "../../assets/about section/delivery.png";

const INFRASTRUCTURE_GALLERY = [
  {
    image: warehouseImg1,
    title: "Smart Warehousing",
  },
  {
    image: warehouseImg2,
    title: "Quality & Packing",
  },
  {
    image: transportImg,
    title: "Express Logistics",
  },
  {
    image: deliveryImg,
    title: "Last-Mile Delivery",
  },
];

const FULFILLMENT_STEPS = [
  {
    id: 1,
    title: "Placed / Order Received",
    shortTitle: "Order Received",
    desc: "Order confirmed & verified",
    icon: ClipboardCheck,
    threshold: 0,
  },
  {
    id: 2,
    title: "Packed & Processing",
    shortTitle: "Packed",
    desc: "Quality verified & sealed",
    icon: Package,
    threshold: 25,
  },
  {
    id: 3,
    title: "Shipped & In Transit",
    shortTitle: "In Transit",
    desc: "Dispatched with express tracking",
    icon: Truck,
    threshold: 50,
  },
  {
    id: 4,
    title: "Out for Delivery",
    shortTitle: "Out for Delivery",
    desc: "Courier nearby with package",
    icon: MapPin,
    threshold: 75,
  },
  {
    id: 5,
    title: "Delivered",
    shortTitle: "Delivered",
    desc: "Safely handed over to buyer",
    icon: CheckCircle2,
    threshold: 95,
  },
];

const TYPING_PHRASES = [
  "ALL IN ONE PLACE.",
  "FOR EVERY SHOPPER.",
  "CURATED WITH CARE.",
  "AT UNBEATABLE PRICES.",
];

const HOVER_THEMES = [
  {
    gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7257c2 100%)",
    glow: "rgba(37, 99, 235, 0.45)",
    bg: "rgba(37, 99, 235, 0.08)",
    cursor: "#2563eb",
  },
  {
    gradient: "linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #8b5cf6 100%)",
    glow: "rgba(244, 63, 94, 0.45)",
    bg: "rgba(244, 63, 94, 0.08)",
    cursor: "#f43f5e",
  },
  {
    gradient: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%)",
    glow: "rgba(13, 148, 136, 0.45)",
    bg: "rgba(13, 148, 136, 0.08)",
    cursor: "#0d9488",
  },
  {
    gradient: "linear-gradient(135deg, #7c3aed 0%, #d97706 50%, #ea580c 100%)",
    glow: "rgba(217, 119, 6, 0.45)",
    bg: "rgba(217, 119, 6, 0.08)",
    cursor: "#d97706",
  },
  {
    gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
    glow: "rgba(6, 182, 212, 0.45)",
    bg: "rgba(6, 182, 212, 0.08)",
    cursor: "#06b6d4",
  },
  {
    gradient: "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f43f5e 100%)",
    glow: "rgba(168, 85, 247, 0.45)",
    bg: "rgba(168, 85, 247, 0.08)",
    cursor: "#a855f7",
  },
];

const CORE_PILLARS = [
  {
    icon: ShoppingBag,
    title: "🛒 Endless Catalog",
    description:
      "From household basics to electronics and fashion—find it all under one roof.",
  },
  {
    icon: Award,
    title: "💎 100% Genuine & Verified",
    description:
      "Every item in our collection is rigorously quality-inspected to guarantee authentic value.",
  },
  {
    icon: Truck,
    title: "🚚 Fast & Secure Delivery",
    description:
      "Express tracked shipping, protective packaging, and complete buyer protection guaranteed.",
  },
];

const SHOPPING_STEPS = [
  {
    step: "1",
    title: "Search & Discover",
    desc: "Explore millions of trending fashion items, electronics, home essentials, and lifestyle products.",
    icon: Search,
  },
  {
    step: "2",
    title: "Compare & Choose",
    desc: "Check transparent pricing, authentic buyer reviews, and detailed specifications with confidence.",
    icon: SlidersHorizontal,
  },
  {
    step: "3",
    title: "1-Click Secure Checkout",
    desc: "Complete your purchase with encrypted multi-gateway payment options and instant confirmation.",
    icon: CreditCard,
  },
];

const ASSURANCE_STEPS = [
  {
    step: "1",
    title: "Quality Check & Packing",
    desc: "Each product undergoes rigorous inspection and is sealed in tamper-proof protective packaging.",
    icon: Package,
  },
  {
    step: "2",
    title: "Real-Time Parcel Tracking",
    desc: "Follow your order journey live from regional hubs right to your local neighborhood hub.",
    icon: MapPin,
  },
  {
    step: "3",
    title: "Easy Returns & Support",
    desc: "Enjoy hassle-free returns, fast replacement support, and 24/7 dedicated customer assistance.",
    icon: RotateCcw,
  },
];

const METRICS = [
  {
    value: "1M+",
    label: "Curated Products",
    subtext: "Across 50+ categories curated for you",
    icon: Layers,
  },
  {
    value: "100k+",
    label: "Happy Shoppers",
    subtext: "Delivering smiles nationwide",
    icon: Users,
  },
  {
    value: "99.8%",
    label: "Secure Deliveries",
    subtext: "Tracked shipping & buyer protection",
    icon: ShieldCheck,
  },
];

const About = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Cycle to a different hover color theme each time the user points/hovers
  const handlePointerEnter = () => {
    setIsHovered(true);
    setThemeIndex((prev) => (prev + 1) % HOVER_THEMES.length);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
  };

  const currentTheme = HOVER_THEMES[themeIndex];

  useEffect(() => {
    const currentPhrase = TYPING_PHRASES[phraseIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      // Typing forward
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, 75);
      } else {
        // Finished typing phrase, pause before deleting
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      // Deleting characters
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        }, 35);
      } else {
        // Move to next phrase
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % TYPING_PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  const [scrollProgress, setScrollProgress] = useState(0);

  // Calculate live scroll progress across the About page
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) {
        setScrollProgress(0);
        return;
      }
      const currentScroll = window.scrollY;
      const progress = Math.min(
        100,
        Math.max(0, (currentScroll / totalScroll) * 100)
      );
      console.log(progress)
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="about-page">
      {/* =====================================================
          ALWAYS STICKY ORDER & FULFILLMENT LIFECYCLE PROGRESS BAR
      ====================================================== */}
      <section className="about-tracker-sticky-wrapper" aria-label="Order Fulfillment Progress Tracker">
        <div className="about-tracker-container">
          <div className="about-tracker-top-meta">
            <div className="about-tracker-tag">
              <span className="live-pulse-dot" aria-hidden="true" />
              <span>LIVE ORDER & FULFILLMENT JOURNEY</span>
            </div>
            <div className="about-tracker-stats">
              <span className="tracker-status-text">
                {scrollProgress >= 95
                  ? "Delivered & Verified"
                  : scrollProgress >= 75
                    ? "Out for Delivery"
                    : scrollProgress >= 50
                      ? "Shipped & In Transit"
                      : scrollProgress >= 25
                        ? "Packed & Processing"
                        : "Placed / Order Received"}
              </span>
            </div>
          </div>

          {/* Stepper Track */}
          <div className="about-stepper-track-wrap">
            <div className="about-stepper-rail">
              <div
                className="about-stepper-fill"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* Stepper Nodes */}
            <div className="about-stepper-steps">
              {FULFILLMENT_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = scrollProgress >= step.threshold;
                const isCurrent =
                  isCompleted &&
                  (idx === FULFILLMENT_STEPS.length - 1 ||
                    scrollProgress < FULFILLMENT_STEPS[idx + 1].threshold);

                return (
                  <div
                    key={step.id}
                    className={`about-step-node ${isCompleted ? "is-completed" : ""
                      } ${isCurrent ? "is-current" : ""}`}
                  >
                    <div className="about-step-node-bubble">
                      <StepIcon size={12} />
                    </div>
                    <div className="about-step-node-info">
                      <span className="about-step-node-title">{step.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SECTION 1: HERO BANNER
      ====================================================== */}
      <section
        className="about-hero-section"
        style={
          {
            "--active-gradient": currentTheme.gradient,
            "--active-glow": currentTheme.glow,
            "--active-bg": currentTheme.bg,
            "--active-cursor": currentTheme.cursor,
          } as React.CSSProperties
        }
      >
        <div className="about-hero-glow" aria-hidden="true" />
        <div className="about-hero-container">
          <h1
            className={`about-hero-title ${isHovered ? "is-pointed" : ""}`}
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
          >
            <span className="about-hero-static">EVERYTHING YOU NEED.</span>
            <br className="hidden-mobile" />
            <span
              className="about-hero-typing-wrapper"
              title="Hover to change theme palette"
            >
              <span className="about-hero-gradient">{displayText}</span>
              <span className="about-hero-cursor" aria-hidden="true">|</span>
            </span>
          </h1>

          <p className="about-hero-subtitle">
            Connecting shoppers with curated lifestyle essentials, trending fashion,
            smart electronics, and daily favorites at unbeatable value.
          </p>

          <div className="about-hero-actions">
            <Link to="/products" className="about-btn-primary">
              <span>Explore Marketplace</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/products" className="about-btn-secondary">
              <Sparkles size={18} />
              <span>Discover Categories</span>
            </Link>
          </div>
        </div>
      </section>

      <main className="about-main-content">
        {/* =====================================================
            SECTION 2: CORE MARKETPLACE PILLARS
        ====================================================== */}
        <section className="about-pillars-section">
          <div className="about-section-header">
            <h2 className="about-section-title">Core Marketplace Pillars</h2>
            <p className="about-section-description">
              Engineered to deliver exceptional quality, verified authenticity, and rapid doorstep fulfillment.
            </p>
          </div>

          <div className="about-pillars-grid">
            {CORE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div className="about-pillar-card" key={pillar.title}>
                  <div className="about-pillar-icon-box">
                    <Icon size={20} />
                  </div>
                  <h3 className="about-pillar-title">{pillar.title}</h3>
                  <p className="about-pillar-desc">{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            SECTION 3: HOW THE PLATFORM WORKS
        ====================================================== */}
        <section className="about-how-section">
          <div className="about-section-header">
            <h2 className="about-section-title">How The Platform Delivers Excellence</h2>
            <p className="about-section-description">
              From seamless product discovery to secure payments, fast express shipping, and post-purchase care.
            </p>
          </div>

          <div className="about-how-grid">
            {/* Shopper Journey Card */}
            <div className="about-how-card shopper-card">
              <div className="about-how-card-header">
                <div className="about-how-pill shopper-pill">
                  <ShoppingBag size={16} />
                  <span>SMART SHOPPING</span>
                </div>
                <h3>Seamless Shopping Journey</h3>
                <p>Everything you need from smart discovery to instant 1-click checkout.</p>
              </div>

              <div className="about-steps-list">
                {SHOPPING_STEPS.map((item) => {
                  const StepIcon = item.icon;
                  return (
                    <div className="about-step-item" key={item.step}>
                      <div className="about-step-number shopper-num">{item.step}</div>
                      <div className="about-step-content">
                        <div className="about-step-header">
                          <h4>{item.title}</h4>
                          <StepIcon size={16} className="step-icon-muted" />
                        </div>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="about-how-card-footer">
                <Link to="/products" className="about-card-link shopper-link">
                  <span>Start Exploring Products</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Assurance & Post-Purchase Card */}
            <div className="about-how-card seller-card">
              <div className="about-how-card-header">
                <div className="about-how-pill seller-pill">
                  <ShieldCheck size={16} />
                  <span>BUYER ASSURANCE</span>
                </div>
                <h3>Fulfillment & Care</h3>
                <p>Guaranteed genuine items, real-time parcel updates, and 24/7 support.</p>
              </div>

              <div className="about-steps-list">
                {ASSURANCE_STEPS.map((item) => {
                  const StepIcon = item.icon;
                  return (
                    <div className="about-step-item" key={item.step}>
                      <div className="about-step-number seller-num">{item.step}</div>
                      <div className="about-step-content">
                        <div className="about-step-header">
                          <h4>{item.title}</h4>
                          <StepIcon size={16} className="step-icon-muted" />
                        </div>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="about-how-card-footer">
                <Link to="/products" className="about-card-link seller-link">
                  <span>Browse Guaranteed Deals</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            SECTION: OUR INFRASTRUCTURE & LOGISTICS NETWORK (4 IMAGES IN A ROW)
        ====================================================== */}
        <section className="about-gallery-section">
          <div className="about-section-header">
            <h2 className="about-section-title">Our Fulfillment & Logistics Network</h2>
            <p className="about-section-description">
              From advanced automated warehouses to rapid last-mile delivery, see how our network delivers excellence.
            </p>
          </div>

          <div className="about-gallery-row">
            {INFRASTRUCTURE_GALLERY.map((item, index) => (
              <div className="about-gallery-card" key={index}>
                <div className="about-gallery-image-wrapper">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="about-gallery-image"
                    loading="lazy"
                  />
                </div>
                <div className="about-gallery-card-body">
                  <strong className="about-gallery-card-title">{item.title}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
            SECTION 4: TRUST & SCALE METRICS
        ====================================================== */}
        <section className="about-metrics-section">
          <div className="about-metrics-glow" aria-hidden="true" />
          <div className="about-metrics-container">
            <div className="about-metrics-grid">
              {METRICS.map((metric) => {
                const MetricIcon = metric.icon;
                return (
                  <div className="about-metric-card" key={metric.label}>
                    <div className="about-metric-icon-wrap">
                      <MetricIcon size={22} />
                    </div>
                    <div className="about-metric-value">{metric.value}</div>
                    <div className="about-metric-label">{metric.label}</div>
                    <p className="about-metric-subtext">{metric.subtext}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================
            SECTION 5: DUAL CALL-TO-ACTION (CTA)
        ====================================================== */}
        <section className="about-dual-cta-section">
          <div className="about-dual-cta-grid">
            {/* Shopper CTA */}
            <div className="about-cta-card cta-shopper">
              <div className="about-cta-content">
                <div className="about-cta-badge">DAILY DEALS</div>
                <h3 className="about-cta-title">Ready to Shop?</h3>
                <p className="about-cta-desc">
                  Browse daily deals & discounts across hundreds of curated premium categories.
                </p>
                <Link to="/products" className="about-cta-btn shopper-cta-btn">
                  <span>Shop All Products</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
              <div className="about-cta-decoration" aria-hidden="true">
                <ShoppingBag size={120} />
              </div>
            </div>

            {/* Customer Account CTA */}
            <div className="about-cta-card cta-seller">
              <div className="about-cta-content">
                <div className="about-cta-badge">JOIN THE COMMUNITY</div>
                <h3 className="about-cta-title">Unlock Exclusive Perks</h3>
                <p className="about-cta-desc">
                  Create an account to save your favorite items, track shipments live, and enjoy member rewards.
                </p>
                <Link to="/register" className="about-cta-btn seller-cta-btn">
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
              <div className="about-cta-decoration" aria-hidden="true">
                <Sparkles size={120} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default About;
