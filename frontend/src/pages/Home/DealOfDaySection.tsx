import { useEffect, useState } from "react";
import { ShoppingCart, Flame, Clock } from "lucide-react";
import { useCart } from "../../context/cartContext";
import product1 from "../../assets/1.jpeg";
import iphoneImg from "../../assets/iphone.png";
import "./DealOfDaySection.css";

const DealOfDaySection = () => {
  const { addToCart } = useCart();

  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="deal-section">
      <div className="deal-container">
        {/* IMAGE */}
        <div className="deal-image-wrapper">
          <span className="deal-badge-spotlight">
            <Flame size={14} style={{ display: "inline", marginRight: "4px" }} /> FLASH DEAL
          </span>
          <img src={iphoneImg || product1} alt="Deal of the day" className="deal-image" />
        </div>

        {/* CONTENT */}
        <div className="deal-content">
          <span className="deal-eyebrow">LIMITED TIME OFFER</span>
          <h2 className="deal-title">iPhone Special Edition (50% OFF)</h2>
          <p className="deal-desc">
            Experience ultra-smooth performance, cinematic 4K camera quality, and all-day battery life with our flagship edition.
          </p>

          <div className="deal-price-row">
            <span className="deal-price">₹49,999</span>
            <span className="deal-old-price">₹99,999</span>
            <span className="deal-save-pill">SAVE 50%</span>
          </div>

          <div className="deal-timer-wrap">
            <Clock size={18} color="#d9a256" />
            <div className="timer-box">
              <span className="timer-num">{String(timeLeft.hours).padStart(2, "0")}</span>
              <span className="timer-label">Hours</span>
            </div>
            <span className="timer-colon">:</span>
            <div className="timer-box">
              <span className="timer-num">{String(timeLeft.minutes).padStart(2, "0")}</span>
              <span className="timer-label">Mins</span>
            </div>
            <span className="timer-colon">:</span>
            <div className="timer-box">
              <span className="timer-num">{String(timeLeft.seconds).padStart(2, "0")}</span>
              <span className="timer-label">Secs</span>
            </div>
          </div>

          <button
            className="deal-cta-btn"
            onClick={() => addToCart("6a7400a3be73e77659acdbe1", 1)}
          >
            <ShoppingCart size={18} /> Claim Deal Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default DealOfDaySection;
