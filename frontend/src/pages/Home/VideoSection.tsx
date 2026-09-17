import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./VideoSection.css";

import phoneVideo from "../../assets/products/videos/phone.mp4";
import airpodsVideo from "../../assets/products/videos/airpods.mp4";
import electronicImg from "../../assets/electronic.png";
import fashionImg from "../../assets/cloth.png";

interface PromoItem {
  _id?: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  badge: string;
  badgeTheme: "dark" | "blue" | "purple" | "rose" | "emerald" | "amber";
  pricePrefix?: string;
  price?: string;
  linkUrl: string;
  btnText?: string;
  mediaType?: "video" | "image";
  videoUrl: string;
  posterUrl?: string;
  bgGradient: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const resolveMediaSrc = (url: string, _mediaType?: "video" | "image"): string => {
  if (!url) return phoneVideo;
  if (url === "preset:phone" || url.includes("phone.mp4")) return phoneVideo;
  if (url === "preset:airpods" || url.includes("airpods.mp4")) return airpodsVideo;
  if (url === "preset:electronic") return electronicImg;
  if (url === "preset:fashion") return fashionImg;
  return url;
};

const VideoSection: React.FC = () => {
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPromos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/promos`);
        if (!res.ok) return;
        const result = await res.json();

        if (isMounted && result.success && Array.isArray(result.data)) {
          setPromos(result.data);
        }
      } catch (err) {
        console.warn("Failed to fetch dynamic promos:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPromos();
    return () => {
      isMounted = false;
    };
  }, []);

  // SKELETON SHIMMER STATE WHILE LOADING
  if (loading) {
    return (
      <section className="promo-video-section">
        <div className="promo-video-grid">
          {[1, 2].map((key) => (
            <div key={key} className="promo-skeleton-card">
              <div className="promo-skeleton-info">
                <div className="skeleton-line skeleton-badge-pill" />
                <div className="skeleton-line skeleton-promo-title" />
                <div className="skeleton-line skeleton-promo-subtitle" />
                <div className="skeleton-line skeleton-promo-tagline" />
                <div className="skeleton-line skeleton-promo-price" />
                <div className="skeleton-line skeleton-promo-btn" />
              </div>
              <div className="promo-skeleton-media" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (promos.length === 0) {
    return null;
  }

  return (
    <section className="promo-video-section">
      <div
        className="promo-video-grid"
        style={{
          gridTemplateColumns:
            promos.length === 1 ? "1fr" : undefined,
        }}
      >
        {promos.map((promo, index) => {
          const isDark =
            promo.bgGradient?.includes("#020617") ||
            promo.bgGradient?.includes("#0f172a") ||
            promo.bgGradient?.includes("#1e293b");

          return (
            <div
              key={promo._id || index}
              className="promo-card"
              style={{ background: promo.bgGradient }}
            >
              <div className={`promo-card-info ${isDark ? "dark-theme" : ""}`}>
                {promo.badge && (
                  <span className={`promo-badge badge-${promo.badgeTheme || "dark"}`}>
                    {promo.badge}
                  </span>
                )}
                <h2 className="promo-card-title">{promo.title}</h2>
                {promo.subtitle && (
                  <p className="promo-card-generation">{promo.subtitle}</p>
                )}
                {promo.tagline && (
                  <p className="promo-card-tagline">{promo.tagline}</p>
                )}
                {promo.price && (
                  <p className="promo-card-price">
                    {promo.pricePrefix || "From"}{" "}
                    <strong>{promo.price}</strong>
                  </p>
                )}
                <Link to={promo.linkUrl || "/products"} className="promo-card-btn">
                  <span>{promo.btnText || "Shop Now"}</span>
                  <ArrowRight size={14} className="promo-btn-arrow" />
                </Link>
              </div>

              <div className="promo-card-media">
                {promo.mediaType === "image" ||
                promo.videoUrl?.startsWith("preset:electronic") ||
                promo.videoUrl?.startsWith("preset:fashion") ||
                promo.videoUrl?.startsWith("data:image/") ? (
                  <img
                    src={resolveMediaSrc(promo.videoUrl, "image")}
                    alt={promo.title}
                    className="promo-image-media"
                  />
                ) : (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="promo-video"
                    src={resolveMediaSrc(promo.videoUrl, "video")}
                    poster={promo.posterUrl}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default VideoSection;