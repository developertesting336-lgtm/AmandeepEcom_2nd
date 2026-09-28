import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeBannersSection.css";

import banner1 from "../../assets/home banners/1.png";
import banner2 from "../../assets/home banners/2.png";
import banner3 from "../../assets/home banners/3.png";
import banner4 from "../../assets/home banners/4.png";
import banner5 from "../../assets/home banners/5.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface BannerItem {
  id: string;
  image: string;
  alt: string;
  link: string;
}

const DEFAULT_BANNERS: BannerItem[] = [
  { id: "banner-1", image: banner1, alt: "Top Offer 1", link: "/products" },
  { id: "banner-2", image: banner2, alt: "Top Offer 2", link: "/products" },
  { id: "banner-3", image: banner3, alt: "Top Offer 3", link: "/products" },
  { id: "banner-4", image: banner4, alt: "Top Offer 4", link: "/products" },
  { id: "banner-5", image: banner5, alt: "Top Offer 5", link: "/products" },
];

export const resolveBannerImage = (imageUrl?: string): string => {
  if (!imageUrl) return banner1;
  if (imageUrl === "preset:banner-1" || imageUrl.includes("1.png")) return banner1;
  if (imageUrl === "preset:banner-2" || imageUrl.includes("2.png")) return banner2;
  if (imageUrl === "preset:banner-3" || imageUrl.includes("3.png")) return banner3;
  if (imageUrl === "preset:banner-4" || imageUrl.includes("4.png")) return banner4;
  if (imageUrl === "preset:banner-5" || imageUrl.includes("5.png")) return banner5;
  return imageUrl;
};

const HomeBannersSection: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("Top Offers");
  const [bgColor, setBgColor] = useState("#eff6ff");
  const [titleColor, setTitleColor] = useState("#0f172a");
  const [isActive, setIsActive] = useState(true);
  const [banners, setBanners] = useState<BannerItem[]>(DEFAULT_BANNERS);

  useEffect(() => {
    let isMounted = true;
    const fetchTopOffers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/top-offers`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data && isMounted) {
          const data = json.data;
          if (data.title) setTitle(data.title);
          if (data.bgColor) setBgColor(data.bgColor);
          if (data.titleColor) setTitleColor(data.titleColor);
          if (typeof data.isActive === "boolean") setIsActive(data.isActive);

          if (Array.isArray(data.banners) && data.banners.length > 0) {
            const mappedBanners: BannerItem[] = data.banners.map((b: any, idx: number) => ({
              id: b._id || `banner-${idx}`,
              image: resolveBannerImage(b.imageUrl),
              alt: b.title || `Top Offer ${idx + 1}`,
              link: b.linkUrl || "/products",
            }));
            setBanners(mappedBanners);
          }
        }
      } catch (err) {
        // Fallback gracefully to default values
        console.error("Failed to load top offers banners:", err);
      }
    };

    fetchTopOffers();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isActive || banners.length === 0) {
    return null;
  }

  const handleBannerClick = (link: string) => {
    if (!link) {
      navigate("/products");
      return;
    }
    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      navigate(link);
    }
  };

  return (
    <section className="home-banners-section" style={{ backgroundColor: bgColor }}>
      <div className="home-banners-container">
        {/* HEADER */}
        <div className="home-banners-header">
          <div className="home-banners-heading-content">
            <h2 className="home-banners-title" style={{ color: titleColor }}>
              {title}
            </h2>
          </div>
        </div>

        <div className="home-banners-grid">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="home-banner-card"
              onClick={() => handleBannerClick(banner.link)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleBannerClick(banner.link);
                }
              }}
              aria-label={banner.alt}
            >
              <div className="home-banner-img-wrap">
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className="home-banner-img"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to default banner1 on error
                    (e.target as HTMLImageElement).src = banner1;
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeBannersSection;
