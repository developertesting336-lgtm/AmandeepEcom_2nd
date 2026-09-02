// import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./CategorySection.css";

import electronicsImg from "../../assets/categories_products/electronic.png";
import clothImg from "../../assets/categories_products/fashion.png";
import toyImg from "../../assets/categories_products/toys.png";
import grosaryImg from "../../assets/categories_products/groccery.png";

interface Category {
  _id: string;
  name: string;
  search: string;
  slug?: string;
  description?: string;
  image?: string;
}

const FALLBACK_CATEGORIES: Category[] = [
  { _id: "c1", name: "Electronics", search: "Electronics", slug: "electronics", image: electronicsImg },
  { _id: "c2", name: "Fashion & Apparel", search: "Fashion", slug: "fashion", image: clothImg },
  { _id: "c3", name: "Grocery & Essentials", search: "Grocery", slug: "grocery", image: grosaryImg },
  { _id: "c4", name: "Toys & Games", search: "toys & Games", slug: "toys", image: toyImg },
];

const getFallbackImage = (name: string, index: number) => {
  const nameLower = (name || "").toLowerCase();
  if (nameLower.includes("electr") || nameLower.includes("phone") || nameLower.includes("gadget")) {
    return electronicsImg;
  }
  if (nameLower.includes("cloth") || nameLower.includes("fash") || nameLower.includes("shirt") || nameLower.includes("wear")) {
    return clothImg;
  }
  if (nameLower.includes("gros") || nameLower.includes("food") || nameLower.includes("groc") || nameLower.includes("living") || nameLower.includes("home")) {
    return grosaryImg;
  }
  if (nameLower.includes("toy") || nameLower.includes("game") || nameLower.includes("kid")) {
    return toyImg;
  }
  const fallbacks = [electronicsImg, clothImg, grosaryImg, toyImg];
  return fallbacks[index % fallbacks.length];
};

const CategorySection = () => {
  const navigate = useNavigate();
  // const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);

  const categories = FALLBACK_CATEGORIES

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // useEffect(() => {
  //   const fetchCategories = async () => {
  //     try {
  //       const res = await fetch(`${API_BASE_URL}/api/categories`);
  //       console.log("res" , res)
  //       const result = await res.json();
  //       const rawList = result.data || result.categories || (Array.isArray(result) ? result : []);
  //       console.log(rawList)

  //       if (res.ok && Array.isArray(rawList) && rawList.length > 0) {
  //         setCategories(rawList);
  //       }
  //     } catch (err) {
  //       console.log("Using fallback categories:", err);
  //     }
  //   };

  //   fetchCategories();

  // }, []);

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const getCategoryImage = (cat: Category, index: number) => {
    if (cat.image && typeof cat.image === "string" && cat.image.trim().length > 0) {
      const imgStr = cat.image.trim();
      if (
        imgStr.startsWith("http://") ||
        imgStr.startsWith("https://") ||
        imgStr.startsWith("data:") ||
        imgStr.startsWith("blob:") ||
        imgStr.startsWith("/") ||
        imgStr.includes("/assets/")
      ) {
        return imgStr;
      }
      const cleanPath = imgStr.replace(/\\/g, "/");
      return `${API_BASE_URL}/${cleanPath.replace(/^\//, "")}`;
    }

    return getFallbackImage(cat.name, index);
  };

  return (
    <section className="category-section">
      <div className="category-container">
        <div className="category-section-header">
          <div>
            <h2 className="category-title">Shop by Category</h2>
          </div>
        </div>

        <div className="category-grid">
          {categories.map((cat, index) => {
            const img = getCategoryImage(cat, index);

            return (
              <div
                key={cat._id || index}
                className="category-card"
                onClick={() => handleCategoryClick(cat.search)}
              >
                {/* IMAGE BANNER CONTAINER */}
                <div className="category-img-wrap">
                  <img
                    src={img}
                    alt={cat.name}
                    className="category-img"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = getFallbackImage(cat.name, index);
                    }}
                  />
                </div>

                {/* TEXT DETAILS BELOW CONTAINER */}
                <div className="category-info">
                  <h3 className="category-name">{cat.name}</h3>
                  <span className="category-action-link">
                    Explore Collection <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
