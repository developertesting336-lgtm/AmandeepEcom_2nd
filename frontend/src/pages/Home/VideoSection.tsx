import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./VideoSection.css";

import phoneVideo from "../../assets/products/videos/phone.mp4";
import airpodsVideo from "../../assets/products/videos/airpods.mp4";

const VideoSection: React.FC = () => {
  return (
    <section className="promo-video-section">
      <div className="promo-video-grid">
        
        {/* CARD 1: iPhone 15 Pro */}
        <div className="promo-card promo-card-iphone">
          <div className="promo-card-info">
            <span className="promo-badge badge-dark">NEW LAUNCH</span>
            <h2 className="promo-card-title">iPhone 15 Pro</h2>
            <p className="promo-card-tagline">Titanium. So strong. So light. So Pro.</p>
            <p className="promo-card-price">
              From <strong>₹1,34,900</strong>
            </p>
            <Link to="/products?search=iphone" className="promo-card-btn">
              <span>Shop Now</span>
              <ArrowRight size={14} className="promo-btn-arrow" />
            </Link>
          </div>

          <div className="promo-card-media">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="promo-video"
            >
              <source src={phoneVideo} type="video/mp4" />
            </video>
          </div>
        </div>

        {/* CARD 2: AirPods Pro */}
        <div className="promo-card promo-card-airpods">
          <div className="promo-card-info">
            <span className="promo-badge badge-blue">BEST SELLER</span>
            <h2 className="promo-card-title">AirPods Pro</h2>
            <p className="promo-card-generation">2nd Generation</p>
            <p className="promo-card-tagline">Intelligent. Powerful. Effortless.</p>
            <p className="promo-card-price">
              From <strong>₹24,900</strong>
            </p>
            <Link to="/products?search=airpods" className="promo-card-btn">
              <span>Shop Now</span>
              <ArrowRight size={14} className="promo-btn-arrow" />
            </Link>
          </div>

          <div className="promo-card-media">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="promo-video"
            >
              <source src={airpodsVideo} type="video/mp4" />
            </video>
          </div>
        </div>

      </div>
    </section>
  );
};

export default VideoSection;