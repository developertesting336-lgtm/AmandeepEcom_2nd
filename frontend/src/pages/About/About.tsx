import { Sparkles, Award, Globe, HeartHandshake, CheckCircle2, Leaf } from "lucide-react";
import Footer from "../Home/footersection";
import "./About.css";

const STATS = [
  { number: "50K+", label: "Happy Customers", sub: "Worldwide shoppers" },
  { number: "1,200+", label: "Curated Products", sub: "Across 10+ categories" },
  { number: "99.4%", label: "Satisfaction Rate", sub: "Verified reviews" },
  { number: "24/7", label: "Dedicated Support", sub: "Always here for you" },
];

const VALUES = [
  {
    icon: Award,
    title: "Uncompromising Quality",
    desc: "Every item in our collection is handpicked and rigorously inspected to ensure superior craftsmanship.",
  },
  {
    icon: HeartHandshake,
    title: "Customer First Philosophy",
    desc: "Your satisfaction is our priority. From instant checkout to hassle-free returns, we put you first.",
  },
  {
    icon: Leaf,
    title: "Sustainable & Ethical",
    desc: "We partner with responsible suppliers committed to eco-friendly practices and ethical manufacturing.",
  },
  {
    icon: Globe,
    title: "Global Express Delivery",
    desc: "Fast, reliable, and trackable shipping right to your doorstep, no matter where you are.",
  },
];

const HIGHLIGHTS = [
  "Direct partnership with top verified suppliers",
  "100% genuine & authentic product guarantee",
  "Encrypted & secure checkout process",
  "30-day money-back return policy",
];

const About = () => {
  return (
    <div className="about-page">
      <main className="about-container">
        {/* HERO SECTION */}
        <section className="about-hero">
          <span className="about-eyebrow">
            <Sparkles size={14} strokeWidth={2.5} />
            OUR STORY & MISSION
          </span>

          <h1 className="about-title">
            Redefining online shopping with
            <span className="about-title-accent"> quality & trust.</span>
          </h1>

          <p className="about-subtitle">
            We are built on a simple belief: premium products shouldn't come with a premium mark-up.
            We bring together the best of electronics, fashion, and lifestyle under one curated roof.
          </p>
        </section>

        {/* STATS BAR */}
        <section className="about-stats">
          {STATS.map((stat) => (
            <div className="about-stat-card" key={stat.label}>
              <div className="about-stat-number">{stat.number}</div>
              <div className="about-stat-label">{stat.label}</div>
              <div className="about-stat-sub">{stat.sub}</div>
            </div>
          ))}
        </section>

        {/* STORY SECTION */}
        <section className="about-story">
          <div className="about-story-content">
            <h2>Crafted with Passion & Precision</h2>
            <p>
              Founded with the goal of eliminating compromises in online retail, our store brings together
              curated quality, competitive prices, and lightning-fast delivery.
            </p>
            <p>
              Whether you are discovering the latest electronics, upgrading your wardrobe, or styling your home,
              every single product is chosen with care and backed by our quality promise.
            </p>

            <div className="about-story-highlights">
              {HIGHLIGHTS.map((text) => (
                <div className="about-highlight-item" key={text}>
                  <div className="about-highlight-icon">
                    <CheckCircle2 size={16} strokeWidth={2.5} />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="about-story-visual">
            <div className="about-story-badge">
              <strong>Quality Guaranteed</strong>
              <span>Checked & Verified Daily</span>
            </div>
          </div>
        </section>

        {/* VALUES SECTION */}
        <section className="about-values">
          <div className="about-values-header">
            <h2>What Drives Us Every Day</h2>
            <p>The core principles behind everything we build and deliver.</p>
          </div>

          <div className="about-values-grid">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div className="about-value-card" key={title}>
                <div className="about-value-icon">
                  <Icon size={24} strokeWidth={1.8} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default About;
