import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Lock,
  Edit3,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  PackageCheck,
  ShoppingBag,
  Home,
  Briefcase,
  MapPin,
  CheckCircle2,
  CreditCard,
  Banknote,
} from "lucide-react";
import { useCart } from "../../context/cartContext";
import { useAuth } from "../../context/authContext";
import {
  fetchUserAddresses,
  saveUserAddress,
  deleteUserAddress,
  validateAddress,
  type Address,
  type AddressTag,
  type AddressFormErrors,
} from "../../services/addressService";
import {
  placeCodOrder,
  placestripeOrder,
  type PlaceCodOrderPayload,
  type PlaceStripeOrderPayload,
} from "../../services/orderService";
import product1 from "../../assets/1.jpeg";
import logo from "../../assets/logo.png";
import Footer from "../Home/footersection";
import "./Checkout.css";

const formatImageUrl = (image?: any, fallback: string = product1): string => {
  if (!image) return fallback;
  const rawUrl = typeof image === "string" ? image : image?.url;
  if (!rawUrl || typeof rawUrl !== "string") return fallback;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const cleanPath = rawUrl.replace(/\\/g, "/");
  const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  return `${API_BASE_URL}${formattedPath}`;
};

type PaymentMethodType = "ONLINE" | "COD";

const BLANK_ADDRESS_FORM: Omit<Address, "id"> = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
  tag: "Home",
  isDefault: false,
};

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { cartItems = [], totalItems = 0, subtotal = 0, loading = false, updateQuantity, fetchCart } = useCart();

  // Multi-step state: 1 = Address & Summary, 2 = Payment
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Multi-Address state (Max 3)
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // Add / Edit Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Address, "id"> & { id?: string }>(BLANK_ADDRESS_FORM);
  const [formErrors, setFormErrors] = useState<AddressFormErrors>({});
  const [isSavingAddress, setIsSavingAddress] = useState<boolean>(false);

  // Payment Selection state (Online via Stripe vs COD)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("ONLINE");

  // Order Placement state
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false);
  const [placedOrderId, setPlacedOrderId] = useState<string>("");

  // Load addresses on mount or when token changes
  useEffect(() => {
    let isMounted = true;
    const loadAddresses = async () => {
      try {
        const list = await fetchUserAddresses(token);
        if (isMounted) {
          const safeList = Array.isArray(list) ? list : [];
          setAddresses(safeList);
          if (safeList.length > 0) {
            const defaultAddr = safeList.find((a) => a.isDefault) || safeList[0];
            setSelectedAddressId(defaultAddr.id);
          } else {
            setSelectedAddressId("");
          }
        }
      } catch (err) {
        console.warn("Could not load addresses:", err);
      }
    };

    loadAddresses();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Open form for adding new address
  const handleOpenAddForm = () => {
    if (addresses.length >= 3) {
      alert("You can save a maximum of 3 addresses. Please edit or delete an existing address.");
      return;
    }
    setEditingAddressId(null);
    setFormData({
      fullName: "",
      phone: "",
      addressLine: "",
      city: "",
      state: "",
      pincode: "",
      tag: "Home",
      isDefault: addresses.length === 0,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Open form for editing existing address
  const handleOpenEditForm = (addr: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddressId(addr.id);
    setFormData({ ...addr });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Close form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAddressId(null);
    setFormData(BLANK_ADDRESS_FORM);
    setFormErrors({});
  };

  // Form input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (formErrors[name as keyof AddressFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Tag selection handler
  const handleTagSelect = (tag: AddressTag) => {
    setFormData((prev) => ({ ...prev, tag }));
  };

  // Save address (Add or Edit)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateAddress(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSavingAddress(true);
    try {
      const res = await saveUserAddress(
        {
          ...formData,
          id: editingAddressId || undefined,
        },
        token
      );

      if (res.success && res.data) {
        setAddresses(res.data);
        if (editingAddressId) {
          setSelectedAddressId(editingAddressId);
        } else {
          const newAddress = res.data[res.data.length - 1];
          if (newAddress) setSelectedAddressId(newAddress.id);
        }
        handleCloseForm();
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err) {
      console.error("Error saving address:", err);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (addrId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const res = await deleteUserAddress(addrId, token);
      if (res.success && res.data) {
        setAddresses(res.data);
        if (selectedAddressId === addrId) {
          const nextSelected = res.data.find((a) => a.isDefault) || res.data[0];
          setSelectedAddressId(nextSelected ? nextSelected.id : "");
        }
      }
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  // Helper icon for address tags
  const renderTagIcon = (tag: AddressTag) => {
    switch (tag) {
      case "Home":
        return <Home size={12} />;
      case "Work":
        return <Briefcase size={12} />;
      case "Other":
        return <MapPin size={12} />;
      default:
        return <MapPin size={12} />;
    }
  };

  // Pricing calculations
  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  const safeSubtotal = Number(subtotal) || 0;
  const isFreeShipping = safeSubtotal >= 499;
  const deliveryCharge = isFreeShipping || safeItems.length === 0 ? 0 : 99;

  // Calculate MRP vs sale price discount
  const totalMrp = safeItems.reduce((acc, item) => {
    const prod = item?.product;
    const originalPrice = Number(prod?.price) || Number(item?.price) || 0;
    const qty = Number(item?.quantity) || 1;
    return acc + originalPrice * qty;
  }, 0);

  const totalDiscount = Math.max(0, totalMrp - safeSubtotal);
  const totalPayable = safeSubtotal + deliveryCharge;
  const totalSavings = totalDiscount + (isFreeShipping && safeItems.length > 0 ? 99 : 0);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || (addresses.length > 0 ? addresses[0] : undefined);

  // Step 1 -> Step 2 Navigation
  const handleProceedToPaymentStep = () => {
    if (!selectedAddress) {
      alert("Please add a delivery address before proceeding to payment.");
      if (!isFormOpen) {
        handleOpenAddForm();
      }
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Place order or initiate Stripe payment
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert("Please select a delivery address.");
      return;
    }

    setIsPlacingOrder(true);

    if (paymentMethod === "ONLINE") {
      // Online payment via Stripe Checkout Session
      try {
        const payload: PlaceStripeOrderPayload = {
          products: safeItems.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
            price: item.price || item.product.price,
            purchasePrice: item.price || item.product.price,
          })),
          items: safeItems.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
            price: item.price || item.product.price,
          })),
          paymentMode: "ONLINE",
          address: {
            fullName: selectedAddress.fullName,
            phone: selectedAddress.phone,
            addressLine: selectedAddress.addressLine,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
            tag: selectedAddress.tag,
          },
          shippingAddress: {
            fullname: selectedAddress.fullName,
            fullName: selectedAddress.fullName,
            phone: selectedAddress.phone,
            address: selectedAddress.addressLine,
            addressLine: selectedAddress.addressLine,
            city: selectedAddress.city,
            state: selectedAddress.state,
            postalCode: selectedAddress.pincode,
            pincode: selectedAddress.pincode,
            country: "India",
            tag: selectedAddress.tag,
          },
          itemsTotal: safeSubtotal,
          deliveryCharges: deliveryCharge,
          totalAmount: totalPayable,
          orderTotal: totalPayable,
        };

        const res = await placestripeOrder(payload, token);

        if (res.success && res.url) {
          // Clear cart or prepare before redirect
          if (fetchCart) {
            fetchCart().catch(() => { });
          }
          // Redirect to Stripe Checkout Session
          window.location.href = res.url;
        } else {
          alert(res.error || "Failed to create Stripe payment checkout session. Please try again.");
          setIsPlacingOrder(false);
        }
      } catch (err: any) {
        console.error("Stripe payment error:", err);
        alert(err.message || "An unexpected error occurred while initiating payment.");
        setIsPlacingOrder(false);
      }
    } else {
      // Cash on Delivery - call /api/order/cod
      try {
        const payload: PlaceCodOrderPayload = {
          products: safeItems.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
            price: item.price || item.product.price,
          })),
          items: safeItems.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
            price: item.price || item.product.price,
          })),
          paymentMode: "COD",
          address: {
            fullName: selectedAddress.fullName,
            phone: selectedAddress.phone,
            addressLine: selectedAddress.addressLine,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
            tag: selectedAddress.tag,
          },
          totalAmount: totalPayable,
        };

        const res = await placeCodOrder(payload, token);

        if (res.success && res.orderId) {
          setPlacedOrderId(res.orderId);
          setOrderPlaced(true);
          if (fetchCart) {
            await fetchCart();
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          alert(res.error || "Failed to place COD order. Please try again.");
        }
      } catch (err: any) {
        console.error("Order placement error:", err);
        alert(err.message || "An unexpected error occurred while placing your order.");
      } finally {
        setIsPlacingOrder(false);
      }
    }
  };

  // 1. Loading State
  if (loading && safeItems.length === 0) {
    return (
      <div className="checkout-page">
        <header className="checkout-top-bar">
          <Link to="/" className="checkout-brand">
            <img src={logo} alt="Shopora" style={{ height: "30px", width: "auto" }} />
            <span className="checkout-brand-name">Shopora</span>
          </Link>
          <div className="checkout-security-badge">
            <Lock size={15} /> 100% Secure Checkout
          </div>
        </header>

        <main className="checkout-container">
          <div
            style={{
              maxWidth: "500px",
              margin: "60px auto",
              textAlign: "center",
              background: "#ffffff",
              padding: "40px 24px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <p style={{ color: "#64748b", fontSize: "16px", margin: 0 }}>Loading checkout items...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Empty Cart State (when not order placed)
  if (safeItems.length === 0 && !orderPlaced) {
    return (
      <div className="checkout-page">
        <header className="checkout-top-bar">
          <Link to="/" className="checkout-brand">
            <img src={logo} alt="Shopora" style={{ height: "30px", width: "auto" }} />
            <span className="checkout-brand-name">Shopora</span>
          </Link>
          <div className="checkout-security-badge">
            <Lock size={15} /> 100% Secure Checkout
          </div>
        </header>

        <main className="checkout-container">
          <div
            style={{
              maxWidth: "500px",
              margin: "60px auto",
              textAlign: "center",
              background: "#ffffff",
              padding: "40px 24px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            }}
          >
            <ShoppingBag size={48} color="#2563eb" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px", color: "#0f172a" }}>
              Your cart is empty
            </h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
              Add some items to your cart before proceeding to checkout.
            </p>
            <Link
              to="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                background: "#0f172a",
                color: "#ffffff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Explore Products <ArrowRight size={16} />
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // 3. Order Success State
  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <header className="checkout-top-bar">
          <Link to="/" className="checkout-brand">
            <img src={logo} alt="Shopora" style={{ height: "30px", width: "auto" }} />
            <span className="checkout-brand-name">Shopora</span>
          </Link>
          <div className="checkout-security-badge">
            <Lock size={15} /> 100% Secure Checkout
          </div>
        </header>

        <main className="checkout-container">
          <div className="order-success-card">
            <div className="success-icon-wrap">
              <CheckCircle2 size={44} />
            </div>
            <h2 className="success-title">Order Placed Successfully!</h2>
            <p className="success-desc">
              Thank you for shopping with Shopora. We have received your order.
            </p>

            <div className="success-order-details">
              <div className="success-detail-row">
                <span>Order ID:</span>
                <strong>#{placedOrderId}</strong>
              </div>
              <div className="success-detail-row">
                <span>Payment Method:</span>
                <strong>{paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment (Stripe)"}</strong>
              </div>
              <div className="success-detail-row">
                <span>Delivery Address:</span>
                <strong>
                  {selectedAddress?.fullName}, {selectedAddress?.city} ({selectedAddress?.pincode})
                </strong>
              </div>
              <div className="success-detail-row">
                <span>Total Amount:</span>
                <strong>₹{totalPayable.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link
                to="/products"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 22px",
                  background: "#0f172a",
                  color: "#ffffff",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Continue Shopping <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 4. Main Checkout View
  return (
    <div className="checkout-page">
      {/* TOP HEADER */}
      <header className="checkout-top-bar">
        <Link to="/" className="checkout-brand">
          <img src={logo} alt="Shopora" style={{ height: "30px", width: "auto" }} />
          <span className="checkout-brand-name">Shopora</span>
        </Link>
        <div className="checkout-security-badge">
          <Lock size={15} /> 100% Secure Checkout
        </div>
      </header>

      <main className="checkout-container">
        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={() => {
            if (currentStep === 2) {
              setCurrentStep(1);
            } else {
              navigate("/cart");
            }
          }}
          className="checkout-page-back-btn"
        >
          <ArrowLeft size={16} /> {currentStep === 2 ? "Back to Address & Summary" : "Back to Cart"}
        </button>

        {/* SIMPLE PROGRESS BAR (CLEAN LINE) */}
        <div className="checkout-progress-bar-container">
          <div className="checkout-progress-labels">
            <button
              type="button"
              className={`progress-label-item ${currentStep === 1 ? "active" : "completed"}`}
              onClick={() => setCurrentStep(1)}
            >
              <span className="progress-label-badge">
                {currentStep === 2 ? <Check size={13} strokeWidth={3} /> : "1"}
              </span>
              <span>1. Address & Summary</span>
            </button>

            <button
              type="button"
              className={`progress-label-item ${currentStep === 2 ? "active" : ""}`}
            // onClick={() => {
            //   if (selectedAddress) setCurrentStep(2);
            // }}
            >
              <span className="progress-label-badge">2</span>
              <span>2. Payment</span>
            </button>
          </div>

          <div className="checkout-progress-track">
            <div
              className="checkout-progress-fill"
              style={{ width: currentStep === 1 ? "50%" : "100%" }}
            ></div>
          </div>
        </div>

        {/* CHECKOUT 2-COLUMN GRID */}
        <div className="checkout-grid">
          {/* LEFT COLUMN */}
          <div className="checkout-main-content">
            {/* ================================================= */}
            {/* STEP 1: ADDRESS & ITEM DETAILS */}
            {/* ================================================= */}
            {currentStep === 1 && (
              <>
                {/* 1. SHIPPING ADDRESS SECTION */}
                <section className="checkout-section-card">
                  <div className="section-header-row">
                    <div className="section-title-wrap">
                      <h2 className="section-title">Shipping Address</h2>
                      <span className="address-count-badge">
                        {addresses.length}/3 Saved
                      </span>
                    </div>

                    {!isFormOpen && (
                      <button
                        type="button"
                        className="add-address-btn"
                        onClick={handleOpenAddForm}
                        disabled={addresses.length >= 3}
                        title={
                          addresses.length >= 3
                            ? "Maximum 3 addresses saved"
                            : "Add a new delivery address"
                        }
                      >
                        <Plus size={14} /> Add New Address
                      </button>
                    )}
                  </div>

                  {/* INLINE ADD / EDIT ADDRESS FORM */}
                  {isFormOpen && (
                    <div className="address-form-container">
                      <div className="address-form-header">
                        <h3 className="address-form-title">
                          {editingAddressId ? "Edit Address" : "Add New Address"}
                        </h3>
                      </div>

                      <form onSubmit={handleSaveAddress}>
                        {/* ADDRESS TAG SELECTOR */}
                        <div className="tag-selector-row">
                          <span className="tag-label">Address Type:</span>
                          {(["Home", "Work", "Other"] as AddressTag[]).map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              className={`tag-option-btn ${formData.tag === tag ? "active" : ""}`}
                              onClick={() => handleTagSelect(tag)}
                            >
                              {renderTagIcon(tag)} {tag}
                            </button>
                          ))}
                        </div>

                        <div className="address-grid">
                          {/* FULL NAME */}
                          <div className="address-input-group">
                            <label>Full Name *</label>
                            <input
                              type="text"
                              name="fullName"
                              className={`address-input-box ${formErrors.fullName ? "input-error" : ""}`}
                              value={formData.fullName || ""}
                              onChange={handleInputChange}
                              placeholder="Enter full name"
                            />
                            {formErrors.fullName && (
                              <span className="error-text">{formErrors.fullName}</span>
                            )}
                          </div>

                          {/* PHONE NUMBER */}
                          <div className="address-input-group">
                            <label>Phone Number * (10 Digits)</label>
                            <input
                              type="tel"
                              name="phone"
                              maxLength={13}
                              className={`address-input-box ${formErrors.phone ? "input-error" : ""}`}
                              value={formData.phone || ""}
                              onChange={handleInputChange}
                              placeholder="e.g. 9876543210"
                            />
                            {formErrors.phone && (
                              <span className="error-text">{formErrors.phone}</span>
                            )}
                          </div>

                          {/* STREET ADDRESS */}
                          <div className="address-input-group full-width">
                            <label>Address (House No, Building, Street, Area) *</label>
                            <input
                              type="text"
                              name="addressLine"
                              className={`address-input-box ${formErrors.addressLine ? "input-error" : ""}`}
                              value={formData.addressLine || ""}
                              onChange={handleInputChange}
                              placeholder="Complete Street Address"
                            />
                            {formErrors.addressLine && (
                              <span className="error-text">{formErrors.addressLine}</span>
                            )}
                          </div>

                          {/* CITY */}
                          <div className="address-input-group">
                            <label>City *</label>
                            <input
                              type="text"
                              name="city"
                              className={`address-input-box ${formErrors.city ? "input-error" : ""}`}
                              value={formData.city || ""}
                              onChange={handleInputChange}
                              placeholder="e.g. Firozpur"
                            />
                            {formErrors.city && (
                              <span className="error-text">{formErrors.city}</span>
                            )}
                          </div>

                          {/* STATE */}
                          <div className="address-input-group">
                            <label>State *</label>
                            <input
                              type="text"
                              name="state"
                              className={`address-input-box ${formErrors.state ? "input-error" : ""}`}
                              value={formData.state || ""}
                              onChange={handleInputChange}
                              placeholder="e.g. Punjab"
                            />
                            {formErrors.state && (
                              <span className="error-text">{formErrors.state}</span>
                            )}
                          </div>

                          {/* PINCODE */}
                          <div className="address-input-group">
                            <label>Pincode * (6 Digits)</label>
                            <input
                              type="text"
                              name="pincode"
                              maxLength={6}
                              className={`address-input-box ${formErrors.pincode ? "input-error" : ""}`}
                              value={formData.pincode || ""}
                              onChange={handleInputChange}
                              placeholder="e.g. 140301"
                            />
                            {formErrors.pincode && (
                              <span className="error-text">{formErrors.pincode}</span>
                            )}
                          </div>
                        </div>

                        {/* MAKE DEFAULT CHECKBOX */}
                        <label className="default-checkbox-row">
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={!!formData.isDefault}
                            onChange={handleInputChange}
                          />
                          <span>Set as default delivery address</span>
                        </label>

                        {/* FORM BUTTONS */}
                        <div className="form-action-buttons">
                          <button
                            type="submit"
                            className="save-address-btn"
                            disabled={isSavingAddress}
                          >
                            {isSavingAddress ? "Saving..." : "Save Address"}
                          </button>
                          <button
                            type="button"
                            className="cancel-address-btn"
                            onClick={handleCloseForm}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* EMPTY ADDRESS STATE */}
                  {addresses.length === 0 && !isFormOpen && (
                    <div
                      style={{
                        padding: "36px 20px",
                        textAlign: "center",
                        background: "#ffffff",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "10px",
                        margin: "12px 0",
                      }}
                    >
                      <MapPin size={32} color="#94a3b8" style={{ marginBottom: "10px" }} />
                      <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                        No Delivery Address Saved
                      </h4>
                      <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: "#64748b" }}>
                        Please add a delivery address to proceed with your order.
                      </p>
                      <button
                        type="button"
                        className="add-address-btn"
                        onClick={handleOpenAddForm}
                        style={{ padding: "8px 18px", fontSize: "13.5px" }}
                      >
                        <Plus size={15} /> Add Delivery Address
                      </button>
                    </div>
                  )}

                  {/* LIST OF SAVED ADDRESSES */}
                  <div className="addresses-list-grid">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;

                      return (
                        <div
                          key={addr.id}
                          className={`address-select-card ${isSelected ? "selected" : ""}`}
                          onClick={() => setSelectedAddressId(addr.id)}
                        >
                          <div className="address-card-header">
                            <div className="address-card-user">
                              <span className="address-card-name">{addr.fullName}</span>
                              <span className="address-card-phone">{addr.phone}</span>

                              <span className={`address-tag-pill ${addr.tag}`}>
                                {renderTagIcon(addr.tag)} {addr.tag}
                              </span>

                              {addr.isDefault && (
                                <span className="address-default-pill">Default</span>
                              )}
                            </div>

                            <div className="address-card-actions">
                              <button
                                type="button"
                                className="address-action-btn"
                                onClick={(e) => handleOpenEditForm(addr, e)}
                                title="Edit address"
                              >
                                <Edit3 size={13} /> Edit
                              </button>
                              <button
                                type="button"
                                className="address-action-btn delete"
                                onClick={(e) => handleDeleteAddress(addr.id, e)}
                                title="Delete address"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <p className="address-card-text">
                            {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>

                          <div className="address-card-footer">
                            {isSelected ? (
                              <span className="address-card-selected-badge">
                                <CheckCircle2 size={16} /> Deliver to this address
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="address-card-deliver-btn"
                                onClick={() => setSelectedAddressId(addr.id)}
                              >
                                Select for Delivery
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {addresses.length >= 3 && !isFormOpen && (
                    <div className="address-limit-info">
                      Maximum limit reached (3/3 addresses). You can edit an existing address.
                    </div>
                  )}
                </section>

                {/* 2. REVIEW ITEM DETAILS */}
                <section className="checkout-section-card">
                  <div className="section-header-row">
                    <h2 className="section-title">
                      Review Item Details ({totalItems} {totalItems === 1 ? "item" : "items"})
                    </h2>
                  </div>

                  <div className="checkout-items-list">
                    {safeItems.map((item, idx) => {
                      const prod = item?.product || ({} as any);
                      const prodPrice = Number(prod?.price) || 0;
                      const prodSalePrice = Number(prod?.salePrice) || null;
                      const itemPrice =
                        Number(item?.price) ||
                        (prodSalePrice && prodSalePrice < prodPrice ? prodSalePrice : prodPrice) ||
                        0;
                      const originalPrice = prodPrice || itemPrice;
                      const hasDiscount = originalPrice > itemPrice;
                      const discountPercent = hasDiscount
                        ? Math.round(((originalPrice - itemPrice) / originalPrice) * 100)
                        : 0;

                      const rawImg = Array.isArray(prod?.images) ? prod.images[0] : prod?.images;
                      const imgUrl = formatImageUrl(rawImg, product1);

                      const catName =
                        typeof prod?.category === "object"
                          ? prod.category?.name || "General"
                          : prod?.category || "General";

                      const productId = prod?._id || item?._id || `item-${idx}`;

                      return (
                        <div key={productId} className="checkout-item-card">
                          <div className="checkout-item-main">
                            <div className="checkout-item-image">
                              <img
                                src={imgUrl}
                                alt={prod?.name || "Product"}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = product1;
                                }}
                              />
                            </div>

                            <div className="checkout-item-details">
                              <h3 className="checkout-item-title">{prod?.name || "Product"}</h3>
                              <div className="checkout-item-sub">
                                <span>Category: {catName}</span>
                                <span>•</span>
                                <span className="checkout-delivery-tag">
                                  Express Delivery by tomorrow
                                </span>
                              </div>

                              <div className="checkout-item-pricing">
                                <span className="checkout-sale-price">
                                  ₹{itemPrice.toLocaleString("en-IN")}
                                </span>
                                {hasDiscount && (
                                  <>
                                    <span className="checkout-original-price">
                                      ₹{originalPrice.toLocaleString("en-IN")}
                                    </span>
                                    <span className="checkout-discount-pill">
                                      {discountPercent}% OFF
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* QUANTITY CONTROL */}
                          <div className="checkout-item-qty-control">
                            <div className="checkout-qty-btn-group">
                              <button
                                type="button"
                                className="checkout-mini-qty-btn"
                                onClick={() => updateQuantity && prod?._id && updateQuantity(prod._id, (item.quantity || 1) - 1)}
                                title="Decrease quantity"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="checkout-mini-qty-val">Qty: {item.quantity || 1}</span>
                              <button
                                type="button"
                                className="checkout-mini-qty-btn"
                                onClick={() => updateQuantity && prod?._id && updateQuantity(prod._id, (item.quantity || 1) + 1)}
                                title="Increase quantity"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* PROCEED TO PAYMENT CTA */}
                <button
                  type="button"
                  className="checkout-proceed-btn"
                  onClick={handleProceedToPaymentStep}
                >
                  PROCEED TO PAYMENT →
                </button>
              </>
            )}

            {/* ================================================= */}
            {/* STEP 2: PAYMENT SELECTION (STRIPE & COD) */}
            {/* ================================================= */}
            {currentStep === 2 && (
              <>
                {/* 1. SELECTED DELIVERY ADDRESS BANNER */}
                <div className="delivery-summary-banner">
                  <div className="delivery-summary-info">
                    <div className="delivery-summary-name-row">
                      <span className="delivery-summary-name">Deliver to: {selectedAddress?.fullName}</span>
                      <span className="delivery-summary-phone">{selectedAddress?.phone}</span>
                      <span className={`address-tag-pill ${selectedAddress?.tag}`}>
                        {selectedAddress?.tag}
                      </span>
                    </div>
                    <p className="delivery-summary-address">
                      {selectedAddress?.addressLine}, {selectedAddress?.city}, {selectedAddress?.state} - {selectedAddress?.pincode}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="change-step-link"
                    onClick={() => setCurrentStep(1)}
                  >
                    Change Address
                  </button>
                </div>

                {/* 2. PAYMENT METHODS CARD */}
                <section className="checkout-section-card">
                  <div className="section-header-row">
                    <h2 className="section-title">Select Payment Method</h2>
                    <span className="payment-badge green">100% Safe & Secure</span>
                  </div>

                  <div className="payment-methods-list">
                    {/* OPTION 1: ONLINE PAYMENT (STRIPE) */}
                    <div
                      className={`payment-method-card ${paymentMethod === "ONLINE" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("ONLINE")}
                    >
                      <div className="payment-method-header">
                        <div className="payment-method-radio-wrap">
                          <div className="payment-radio-circle">
                            {paymentMethod === "ONLINE" && <div className="payment-radio-inner" />}
                          </div>
                          <div className="payment-method-icon-title">
                            <div className="payment-method-icon-box">
                              <CreditCard size={22} />
                            </div>
                            <div className="payment-method-text-group">
                              <span className="payment-method-title">Pay Online (Cards, UPI, Net Banking, Wallets)</span>
                              <span className="payment-method-desc">
                                Instant & secure payment processed via Stripe Gateway
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="payment-badge blue">Powered by Stripe</span>
                      </div>

                      <div className="payment-sub-info-row">
                        <span>Accepted Methods:</span>
                        <div className="payment-supported-icons">
                          <span className="payment-pill-tag">Credit/Debit Cards</span>
                          <span className="payment-pill-tag">UPI (GPay, PhonePe, Paytm)</span>
                          <span className="payment-pill-tag">Net Banking</span>
                        </div>
                      </div>
                    </div>

                    {/* OPTION 2: CASH ON DELIVERY (COD) */}
                    <div
                      className={`payment-method-card ${paymentMethod === "COD" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("COD")}
                    >
                      <div className="payment-method-header">
                        <div className="payment-method-radio-wrap">
                          <div className="payment-radio-circle">
                            {paymentMethod === "COD" && <div className="payment-radio-inner" />}
                          </div>
                          <div className="payment-method-icon-title">
                            <div className="payment-method-icon-box cod">
                              <Banknote size={22} />
                            </div>
                            <div className="payment-method-text-group">
                              <span className="payment-method-title">Cash on Delivery (COD)</span>
                              <span className="payment-method-desc">
                                Pay with cash or UPI to the delivery courier when your order arrives
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="payment-badge green">Pay on Delivery</span>
                      </div>

                      <div className="payment-sub-info-row">
                        <span>Convenience:</span>
                        <span style={{ color: "#16a34a", fontWeight: 600 }}>
                          ✓ No extra convenience charges
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* PAY NOW / PLACE ORDER CTA */}
                <button
                  type="button"
                  className="checkout-proceed-btn"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder
                    ? "PROCESSING ORDER..."
                    : paymentMethod === "ONLINE"
                      ? `PAY WITH STRIPE (₹${totalPayable.toLocaleString("en-IN")}) →`
                      : `CONFIRM CASH ON DELIVERY ORDER (₹${totalPayable.toLocaleString("en-IN")})`}
                </button>

                <button
                  type="button"
                  className="checkout-bottom-back-link"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft size={14} /> Back to Address & Summary
                </button>
              </>
            )}
          </div>

          {/* RIGHT COLUMN - ORDER SUMMARY */}
          <aside className="checkout-summary-card">
            <h2 className="checkout-summary-title">Order Summary</h2>

            <div className="checkout-summary-row">
              <span>Item Subtotal ({totalItems} items)</span>
              <span>
                ₹{totalMrp > safeSubtotal ? safeSubtotal.toLocaleString("en-IN") : totalMrp.toLocaleString("en-IN")}
              </span>
            </div>

            <div className={`checkout-summary-row ${isFreeShipping ? "free-text" : ""}`}>
              <span>Delivery Charge</span>
              <span>{isFreeShipping ? "FREE" : `₹${deliveryCharge}`}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="checkout-summary-row discount-text">
                <span>Total Discount</span>
                <span>-₹{totalDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="checkout-summary-divider"></div>

            <div className="checkout-total-row">
              <span className="checkout-total-label">Total Payable</span>
              <span className="checkout-total-amount">
                ₹{totalPayable.toLocaleString("en-IN")}
              </span>
            </div>

            {totalSavings > 0 && (
              <div className="checkout-savings-banner">
                🎉 You save ₹{totalSavings.toLocaleString("en-IN")} on this purchase!
              </div>
            )}

            {/* TRUST BADGES */}
            <div className="checkout-trust-badges">
              <div className="trust-badge-item">
                <ShieldCheck size={18} className="trust-badge-icon" />
                <span>100% Safe & Secure Payments</span>
              </div>
              <div className="trust-badge-item">
                <PackageCheck size={18} className="trust-badge-icon" />
                <span>100% Genuine and Verified Products</span>
              </div>
              <div className="trust-badge-item">
                <RotateCcw size={18} className="trust-badge-icon" />
                <span>Easy 7-Day Replacement Policy</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
