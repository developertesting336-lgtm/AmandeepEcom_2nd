import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import "./flyToCart.css";

export interface FlyingItem {
  id: string;
  targetX: number;
  targetY: number;
  productName?: string;
  price?: number | string;
  quantity?: number;
  imageUrl?: string;
}

export interface FlyToCartOptions {
  productName?: string;
  price?: number | string;
  quantity?: number;
  imageUrl?: string;
  startRect?: DOMRect | { x: number; y: number; width: number; height: number; left?: number; top?: number };
}

// Event bus helper to trigger the flight animation from anywhere
export const triggerFlyToCart = (options: FlyToCartOptions = {}) => {
  if (typeof window === "undefined") return;

  const targetEl =
    document.getElementById("navbar-cart-link") ||
    document.getElementById("navbar-cart-mobile-btn") ||
    document.querySelector(".navbar-icon-link[href='/cart']") ||
    document.querySelector("a[href='/cart']");

  let targetX = window.innerWidth - 60;
  let targetY = 36;

  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0 || rect.top > 0 || rect.left > 0) {
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }
  }

  const newItem: FlyingItem = {
    id: `fly_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    targetX,
    targetY,
    productName: options.productName || "Product",
    price: options.price,
    quantity: options.quantity || 1,
    imageUrl: options.imageUrl,
  };

  window.dispatchEvent(
    new CustomEvent("fly-item-to-cart", {
      detail: newItem,
    })
  );
};

interface FlyToastItemProps {
  item: FlyingItem;
  onComplete: (id: string) => void;
}

const FlyToastItem: React.FC<FlyToastItemProps> = ({ item, onComplete }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const el = cardRef.current;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const deltaX = item.targetX - centerX;
    const deltaY = item.targetY - centerY;

    const tl = gsap.timeline({
      onComplete: () => {
        // Trigger cart badge bounce right upon arrival
        window.dispatchEvent(new CustomEvent("cart-badge-bounce"));
        onComplete(item.id);
      },
    });

    // 1. Center Pop: Smooth spring entrance
    tl.fromTo(
      el,
      {
        x: 0,
        y: 35,
        scale: 0.75,
        opacity: 0,
      },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.35,
        ease: "back.out(1.4)",
      }
    );

    // 2. Brief display hold in the center
    tl.to(el, {
      duration: 0.3,
    });

    // 3. Smooth arc flight & shrink towards Navbar cart
    tl.to(el, {
      x: deltaX,
      y: deltaY,
      scale: 0.1,
      opacity: 0.2,
      borderRadius: "50%",
      duration: 0.65,
      ease: "power2.inOut",
    });

    return () => {
      tl.kill();
    };
  }, [item, onComplete]);

  return (
    <div ref={cardRef} className="center-pop-toast-card">
      {/* TOAST HEADER */}
      <div className="fly-toast-header">
        <span className="fly-toast-badge">
          <CheckCircle2 size={16} className="fly-toast-check-icon" />
          <span>Added to Cart!</span>
        </span>
        <span className="fly-toast-qty">Qty: {item.quantity}</span>
      </div>

      {/* TOAST BODY */}
      <div className="fly-toast-body">
        <div className="fly-toast-img-box">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.productName}
              className="fly-toast-img"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="fly-toast-icon-fallback">
              <ShoppingBag size={22} />
            </div>
          )}
        </div>

        <div className="fly-toast-info">
          <h4 className="fly-toast-title">{item.productName}</h4>
          {item.price !== undefined && item.price !== null && (
            <span className="fly-toast-price">
              ₹{typeof item.price === "number" ? item.price.toLocaleString("en-IN") : item.price}
            </span>
          )}
        </div>
      </div>

      {/* Glowing flight halo */}
      <div className="fly-toast-glow" />
    </div>
  );
};

export const FlyToCartOverlay: React.FC = () => {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  useEffect(() => {
    const handleFly = (e: Event) => {
      const customEvent = e as CustomEvent<FlyingItem>;
      if (customEvent.detail) {
        setFlyingItems((prev) => [...prev, customEvent.detail]);
      }
    };

    window.addEventListener("fly-item-to-cart", handleFly);
    return () => window.removeEventListener("fly-item-to-cart", handleFly);
  }, []);

  const handleComplete = (id: string) => {
    setFlyingItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="fly-to-cart-overlay" aria-hidden="true">
      {flyingItems.map((item) => (
        <FlyToastItem key={item.id} item={item} onComplete={handleComplete} />
      ))}
    </div>
  );
};

export default FlyToCartOverlay;
