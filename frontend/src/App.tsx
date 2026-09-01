import Navbar from "./components/layout/Navbar/Navbar";
import Home from "./pages/Home/Home";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import About from "./pages/About/About";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Profile from "./pages/Profile/Profile";
import AdminDashboard from "./pages/Admin/Dashboard/AdminDashboard";
import AddProduct from "./pages/Admin/Products";
import ProductList from "./pages/Admin/ProductList";
import EditProduct from "./pages/Admin/EditProduct";
import Categories from "./pages/Admin/Categories";
import Orders from "./pages/Admin/Orders";
import Users from "./pages/Admin/Users";
import UserProducts from "./pages/Products/UserProducts";
import ProductDetails from "./pages/Products/ProductDetails";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import UserOrders from "./pages/Orders/UserOrders";
import PaymentSuccess from "./pages/Payment/PaymentSuccess";
import PaymentCancelled from "./pages/Payment/PaymentCancelled";
import Wishlist from "./pages/Wishlist/Wishlist";
import PrivacyPolicy from "./pages/Legal/PrivacyPolicy";
import TermsConditions from "./pages/Legal/TermsConditions";
import ShippingPolicy from "./pages/Legal/ShippingPolicy";
import OAuthSuccess from "./pages/Auth/OAuthSuccess";
import ResetPasswordEmail from "./pages/Auth/ResetPasswordEmail";
import VerifyOtpResetPassword from "./pages/Auth/VerifyOtpResetPassword";
import VerifyRegisterOtp from "./pages/Auth/VerifyRegisterOtp";

// ScrollToTop component to reset scroll position on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

function App() {

  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) {
        console.log("Service Workers are not supported");
        return;
      }

      try {
        const registration =
          await navigator.serviceWorker.register("/sw.js");

        console.log("Service Worker registered:", registration);
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    registerServiceWorker();
  }, []);
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 1500,
          style: {
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 500,
            padding: "12px 18px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          },
          success: {
            iconTheme: {
              primary: "#9d3ccaff",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<UserProducts />} />
        <Route path="/product/:productId" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order" element={<UserOrders />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancelled" element={<PaymentCancelled />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-register-otp" element={<VerifyRegisterOtp />} />
        <Route path="/reset-password" element={<ResetPasswordEmail />} />
        <Route path="/forgot-password" element={<ResetPasswordEmail />} />
        <Route path="/verify-otp" element={<VerifyOtpResetPassword />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/admin/products" element={<ProductList />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/add/product" element={<AddProduct />} />
        <Route path="/admin/products/edit/:productId" element={<EditProduct />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;