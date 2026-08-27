import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PromoBar.css";

import adidas from "../../assets/products/promo_logo/adidas.png";
import clothImg from "../../assets/products/promo_logo/apple.png";
// import grosImg from "../../assets/products/promo_logo/electronic.png";
import toyImg from "../../assets/products/promo_logo/gucci.png";
import iphoneImg from "../../assets/products/promo_logo/louis.png";
import luic from "../../assets/products/promo_logo/luic.png";
import nike from "../../assets/products/promo_logo/nike.png";
import oneplus from "../../assets/products/promo_logo/oneplus.png";
import realme from "../../assets/products/promo_logo/realme.png";
import samsung from "../../assets/products/promo_logo/samsung.png";
import uspolo from "../../assets/products/promo_logo/uspolo.png";

interface PromoBrand {
  id: string;
  name: string;
  query: string;
  image: string;
}

const HARDCODED_BRANDS: PromoBrand[] = [
  { id: "adidas", name: "Adidas", query: "Adidas", image: adidas },
  { id: "apple", name: "apple", query: "apple", image: clothImg },
  // { id: "electronic", name: "Electronics", query: "Electronics", image: grosImg },
  { id: "gucci", name: "gucci", query: "gucci", image: toyImg },
  { id: "louis", name: "Louis Vuitton", query: "Louis Vuitton", image: iphoneImg },
  { id: "luic", name: "Louis Philippe", query: "Louis Philippe", image: luic },
  { id: "oneplus", name: "OnePlus", query: "OnePlus", image: oneplus },
  { id: "nike", name: "Nike", query: "Nike", image: nike },
  { id: "realme", name: "Realme", query: "Realme", image: realme },
  { id: "samsung", name: "Samsung", query: "Samsung", image: samsung },
  { id: "uspolo", name: "US Polo", query: "US Polo", image: uspolo },
];

const PromoBar = () => {
  const navigate = useNavigate();
  const [promos, setPromos] = useState<PromoBrand[]>(HARDCODED_BRANDS);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchHomeTaglines = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/hometaglines`);
        const result = await res.json();

        if (res.ok && result.success) {
          const rawTaglines =
            result.data?.taglines ||
            result.data ||
            result.taglines ||
            [];

          if (Array.isArray(rawTaglines) && rawTaglines.length > 0) {
            const fetchedItems: PromoBrand[] = rawTaglines
              .map((item: any, idx: number) => {
                const img = item.image || item.logo || item.icon;
                if (!img || typeof img !== "string" || img.trim().length === 0) return null;
                const formattedImg = img.startsWith("http")
                  ? img
                  : `${API_BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`;
                const title = item.title || item.name || `Brand ${idx + 1}`;
                return {
                  id: item._id || String(idx),
                  name: title,
                  query: title,
                  image: formattedImg,
                };
              })
              .filter((item): item is PromoBrand => Boolean(item));

            if (fetchedItems.length > 0) {
              setPromos(fetchedItems);
            }
          }
        }
      } catch (err) {
        console.log("Using fallback promo logos:", err);
      }
    };

    fetchHomeTaglines();
  }, []);

  const handleBrandClick = (brandName: string) => {
    navigate(`/products?brand=${encodeURIComponent(brandName)}`);
  };

  return (
    <div className="promo-bar" title="Click any brand to view products">
      <div className="promo-track">

        <div className="promo-group">
          {promos.map((promo, index) => (
            <button
              type="button"
              className="promo-item"
              key={`first-${promo.id}-${index}`}
              onClick={() => handleBrandClick(promo.query)}
              title={`Explore ${promo.name} products`}
              aria-label={`Explore ${promo.name} products`}
            >
              <img
                src={promo.image}
                alt={promo.name}
                className="promo-image"
                onError={(e) => {
                  e.currentTarget.src = HARDCODED_BRANDS[index % HARDCODED_BRANDS.length].image;
                }}
              />
            </button>
          ))}
        </div>

        {/* Duplicate Set for Seamless Infinite Loop */}
        <div className="promo-group" aria-hidden="true">
          {promos.map((promo, index) => (
            <button
              type="button"
              className="promo-item"
              key={`second-${promo.id}-${index}`}
              onClick={() => handleBrandClick(promo.query)}
              title={`Explore ${promo.name} products`}
              aria-label={`Explore ${promo.name} products`}
            >
              <img
                src={promo.image}
                alt={promo.name}
                className="promo-image"
                onError={(e) => {
                  e.currentTarget.src = HARDCODED_BRANDS[index % HARDCODED_BRANDS.length].image;
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromoBar;