import { useEffect, useState } from "react";
import "./Hero1.css";

import banner1 from "../../assets/hero1.png";
import banner2 from "../../assets/hero2.png";
import banner3 from "../../assets/hero3.png";

const banners = [banner1, banner2, banner3];

const Hero = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrent((prev) =>
      prev === 0 ? banners.length - 1 : prev - 1
    );
  };

  return (
    <section className="hero">
      <div className="hero-slider">
        <div
          className="hero-track"
          style={{
            transform: `translateX(-${current * 100}%)`,
          }}
        >
          {banners.map((banner, index) => (
            <div className="hero-slide" key={index}>
              <img src={banner} alt={`Banner ${index + 1}`} />
            </div>
          ))}
        </div>

        <button className="hero-btn prev" onClick={prevSlide}>
          &#10094;
        </button>

        <button className="hero-btn next" onClick={nextSlide}>
          &#10095;
        </button>

        <div className="hero-dots">
          {banners.map((_, index) => (
            <span
              key={index}
              className={`dot ${current === index ? "active" : ""}`}
              onClick={() => setCurrent(index)}
            ></span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;