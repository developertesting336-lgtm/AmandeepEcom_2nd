import { useNavigate } from "react-router-dom";
import { Truck, ShieldCheck, RotateCcw, Headset } from "lucide-react";
import "./OffersTrustSection.css";

const OFFERS = [
  {
    tag: "Up to 50% OFF",
    title: "Electronics",
    desc: "Headphones, smartwatches & more",
    category: "electronics",
    accent: "purple",
  },
  {
    tag: "Buy 1 Get 1",
    title: "Fashion",
    desc: "Selected apparel & accessories",
    category: "fashion",
    accent: "pink",
  },
  {
    tag: "Free Shipping",
    title: "Orders over ₹499",
    desc: "No code needed, applied at checkout",
    category: "",
    accent: "blue",
  },
  {
    tag: "New In",
    title: "Beauty & Health",
    desc: "Fresh arrivals, up to 30% off",
    category: "beauty-health",
    accent: "green",
  },
];

const TRUST_ITEMS = [
  { icon: Truck, label: "Free Shipping", sub: "On orders over ₹499" },
  { icon: ShieldCheck, label: "Secure Payment", sub: "100% protected checkout" },
  { icon: RotateCcw, label: "Easy Returns", sub: "30-day return policy" },
  { icon: Headset, label: "24/7 Support", sub: "Dedicated support team" },
];

const OffersTrustSection = () => {
  const navigate = useNavigate();

  const goToOffer = (category: string) => {
    navigate(category ? `/products?category=${category}` : "/products");
  };

  return (
    <section className="offers-trust-section" id="offers">
      <div className="offers-trust-container">
        {/* Section Header */}
        <div className="offers-trust-header">
          <span className="offers-trust-eyebrow">LIMITED TIME PROMOTIONS</span>
          <h2 className="offers-trust-title">Exclusive Deals & Guarantee</h2>
        </div>

        {/* Offers Strip */}
        <div className="offers-strip">
          {OFFERS.map((offer) => (
            <button
              key={offer.title}
              className={`offer-card offer-${offer.accent}`}
              onClick={() => goToOffer(offer.category)}
            >
              <span className="offer-tag">{offer.tag}</span>
              <span className="offer-title">{offer.title}</span>
              <span className="offer-desc">{offer.desc}</span>
            </button>
          ))}
        </div>

        {/* Trust Bar */}
        <div className="trust-bar">
          {TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
            <div className="trust-item" key={label}>
              <div className="trust-icon">
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <div>
                <p className="trust-label">{label}</p>
                <p className="trust-sub">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OffersTrustSection;
