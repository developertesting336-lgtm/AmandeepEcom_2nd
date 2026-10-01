import { useEffect, useState } from "react";
import "./home.css";
import PromoBar from "./PromoBar";
// import Hero2 from "./hero2";
import ProductSection from "./product";
import HomeBannersSection from "./HomeBannersSection";
import RecommendedSection from "./RecommendedSection";
import PopularProductsSection from "./PopularProductsSection";
import HomeProductsGrid from "./HomeProductsGrid";
import OffersTrustSection from "./OffersTrustSection";
import Footer from "./footersection";
import Hero1 from './hero1';
import { useAuth } from "../../context/authContext";
import VideoSection from "./VideoSection";
import CategorySection from "./CategorySection";
import AiChatModal from "../../components/AiChat/AiChatModal";
import CookieBanner from "../../components/common/CookieBanner/CookieBanner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Home = () => {
  const { user } = useAuth();
  const [isCookiesAccepted, setIsCookiesAccepted] = useState<boolean>(Boolean(user?.isCookiesAccepted));
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const checkCookieConsent = async () => {
      try {
        // 1. Call API on the home page to check if user has accepted cookies or not
        const res = await fetch(`${API_BASE_URL}/api/profile/user/cookies`, {
          credentials: "include",
        });

        const data = await res.json();
        console.log("Cookie consent check from API:", data);

        // Accepted if database record says true (for logged in users) or localStorage consent (for guests)
        const isDbAccepted = Boolean(data?.isCookiesAccepted ?? data?.data?.isCookiesAccepted ?? user?.isCookiesAccepted);
        const isGuestAccepted = !data?.isAuthenticated && localStorage.getItem("cookie_consent") === "accepted";
        const accepted = isDbAccepted || isGuestAccepted;

        if (isMounted) {
          setIsCookiesAccepted(accepted);
          console.log("isCookiesAccepted status:", accepted);

          // 2. If NOT accepted: pop up banner on everyday first visit
          if (!accepted) {
            const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const lastSeenDate = localStorage.getItem("cookie_banner_last_seen_date");

            if (lastSeenDate !== today) {
              console.log(`First visit today (${today}) and cookies not accepted -> popping up cookie banner.`);
              // Smooth entrance after page content renders
              setTimeout(() => {
                if (isMounted) {
                  setShowCookieBanner(true);
                }
              }, 800);
              localStorage.setItem("cookie_banner_last_seen_date", today);
            } else {
              console.log(`Cookie banner already displayed earlier today (${today}).`);
            }
          } else {
            console.log("Cookies are already accepted. Banner will not be shown.");
            setShowCookieBanner(false);
          }
        }
      } catch (error) {
        console.error("Failed to check cookie consent status:", error);
      }
    };

    checkCookieConsent();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <main className="home-page">
      <Hero1 />
      <CategorySection />
      <ProductSection />
      <HomeBannersSection />
      {/* <FeaturedProducts /> */}
      <VideoSection />

      <PopularProductsSection />
      {isCookiesAccepted && <RecommendedSection />}
      <PromoBar />
      <HomeProductsGrid />
      {/* <Hero2 /> */}
      <OffersTrustSection />
      <Footer />
      <AiChatModal />
      <CookieBanner
        isOpen={showCookieBanner}
        onClose={() => setShowCookieBanner(false)}
        onConsentChange={(accepted) => {
          setIsCookiesAccepted(accepted);
          setShowCookieBanner(false);
        }}
      />
    </main>
  );
};

export default Home;
