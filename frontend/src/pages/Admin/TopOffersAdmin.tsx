import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  X,
  Layers,
  UploadCloud,
  CheckCircle2,
  Palette,
  Sparkles,
  Save,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import "./TopOffersAdmin.css";

import banner1 from "../../assets/home banners/1.png";
import banner2 from "../../assets/home banners/2.png";
import banner3 from "../../assets/home banners/3.png";
import banner4 from "../../assets/home banners/4.png";
import banner5 from "../../assets/home banners/5.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface TopOfferBanner {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TopOfferSectionData {
  title: string;
  subtitle: string;
  bgColor: string;
  titleColor: string;
  isActive: boolean;
  banners: TopOfferBanner[];
}

const PRESET_BANNERS = [
  { label: "Built-in Banner 1", value: "preset:banner-1", src: banner1 },
  { label: "Built-in Banner 2", value: "preset:banner-2", src: banner2 },
  { label: "Built-in Banner 3", value: "preset:banner-3", src: banner3 },
  { label: "Built-in Banner 4", value: "preset:banner-4", src: banner4 },
  { label: "Built-in Banner 5", value: "preset:banner-5", src: banner5 },
];

const COLOR_SWATCHES = [
  { name: "Ice Blue (Default)", value: "#eff6ff" },
  { name: "Light Cyan", value: "#e0f2fe" },
  { name: "Soft Slate", value: "#f8fafc" },
  { name: "Pure White", value: "#ffffff" },
  { name: "Warm Peach", value: "#fff7ed" },
  { name: "Soft Rose", value: "#fff1f2" },
  { name: "Mint Fresh", value: "#f0fdf4" },
  { name: "Pale Indigo", value: "#eef2ff" },
  { name: "Deep Navy", value: "#0f172a" },
  { name: "Midnight Purple", value: "#1e1b4b" },
];

const TITLE_COLOR_SWATCHES = [
  { name: "Deep Charcoal", value: "#0f172a" },
  { name: "Indigo", value: "#1e1b4b" },
  { name: "Vibrant Violet", value: "#7257c2" },
  { name: "Pure White", value: "#ffffff" },
  { name: "Slate Gray", value: "#475569" },
];

export const getBannerImageSrc = (url: string) => {
  if (!url) return banner1;
  if (url === "preset:banner-1" || url.includes("1.png")) return banner1;
  if (url === "preset:banner-2" || url.includes("2.png")) return banner2;
  if (url === "preset:banner-3" || url.includes("3.png")) return banner3;
  if (url === "preset:banner-4" || url.includes("4.png")) return banner4;
  if (url === "preset:banner-5" || url.includes("5.png")) return banner5;
  return url;
};

const TopOffersAdmin: React.FC = () => {
  const [sectionData, setSectionData] = useState<TopOfferSectionData>({
    title: "Top Offers",
    subtitle: "Exclusive deals on trending items and top brands",
    bgColor: "#eff6ff",
    titleColor: "#0f172a",
    isActive: true,
    banners: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Settings form state
  const [sectionTitle, setSectionTitle] = useState("Top Offers");
  const [sectionSubtitle, setSectionSubtitle] = useState("");
  const [sectionBgColor, setSectionBgColor] = useState("#eff6ff");
  const [sectionTitleColor, setSectionTitleColor] = useState("#0f172a");
  const [sectionIsActive, setSectionIsActive] = useState(true);

  // Modal State for Add / Edit Banner
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "Top Offer",
    imageType: "preset" as "preset" | "upload" | "url",
    presetValue: "preset:banner-1",
    customUrl: "",
    linkUrl: "/products",
    order: 1,
    isActive: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [submittingBanner, setSubmittingBanner] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch admin section and banners
  const fetchTopOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/top-offers`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setSectionData(json.data);
        setSectionTitle(json.data.title || "Top Offers");
        setSectionSubtitle(json.data.subtitle || "");
        setSectionBgColor(json.data.bgColor || "#eff6ff");
        setSectionTitleColor(json.data.titleColor || "#0f172a");
        setSectionIsActive(json.data.isActive !== false);
      } else {
        toast.error(json.message || "Failed to load top offers data");
      }
    } catch (err: any) {
      console.error("Error fetching top offers:", err);
      toast.error("Failed to connect to backend server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopOffers();
  }, []);

  // Save Section Settings (Title, BG Color, Title Color, Active)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/top-offers/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionTitle.trim(),
          subtitle: sectionSubtitle.trim(),
          bgColor: sectionBgColor.trim(),
          titleColor: sectionTitleColor.trim(),
          isActive: sectionIsActive,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Section settings saved successfully!");
        setSectionData((prev) => ({
          ...prev,
          title: sectionTitle,
          subtitle: sectionSubtitle,
          bgColor: sectionBgColor,
          titleColor: sectionTitleColor,
          isActive: sectionIsActive,
        }));
      } else {
        toast.error(json.message || "Failed to save settings");
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save section settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Open Modal to Add
  const handleOpenAddModal = () => {
    setEditingBannerId(null);
    setSelectedFile(null);
    setFilePreview("");
    setBannerForm({
      title: `Top Offer ${sectionData.banners.length + 1}`,
      imageType: "preset",
      presetValue: "preset:banner-1",
      customUrl: "",
      linkUrl: "/products",
      order: sectionData.banners.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEditModal = (banner: TopOfferBanner) => {
    setEditingBannerId(banner._id);
    setSelectedFile(null);
    setFilePreview("");

    const isPreset = banner.imageUrl.startsWith("preset:");
    setBannerForm({
      title: banner.title || "",
      imageType: isPreset ? "preset" : "url",
      presetValue: isPreset ? banner.imageUrl : "preset:banner-1",
      customUrl: !isPreset ? banner.imageUrl : "",
      linkUrl: banner.linkUrl || "/products",
      order: banner.order || 1,
      isActive: banner.isActive !== false,
    });
    setIsModalOpen(true);
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file (PNG, JPG, WEBP)");
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setBannerForm((prev) => ({ ...prev, imageType: "upload" }));
    }
  };

  // Submit Banner (Create or Update)
  const handleSubmitBanner = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalImageUrl = "";
    if (bannerForm.imageType === "preset") {
      finalImageUrl = bannerForm.presetValue;
    } else if (bannerForm.imageType === "url") {
      if (!bannerForm.customUrl.trim()) {
        toast.error("Please provide an image URL");
        return;
      }
      finalImageUrl = bannerForm.customUrl.trim();
    } else if (bannerForm.imageType === "upload") {
      if (!selectedFile && !editingBannerId) {
        toast.error("Please select an image file to upload");
        return;
      }
    }

    setSubmittingBanner(true);
    try {
      const formData = new FormData();
      formData.append("title", bannerForm.title.trim());
      formData.append("linkUrl", bannerForm.linkUrl.trim() || "/products");
      formData.append("order", String(bannerForm.order));
      formData.append("isActive", String(bannerForm.isActive));

      if (selectedFile) {
        formData.append("image", selectedFile);
      } else if (finalImageUrl) {
        formData.append("imageUrl", finalImageUrl);
      }

      const endpoint = editingBannerId
        ? `${API_BASE_URL}/api/admin/top-offers/banners/${editingBannerId}`
        : `${API_BASE_URL}/api/admin/top-offers/banners`;

      const method = editingBannerId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        credentials: "include",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          editingBannerId
            ? "Banner updated successfully!"
            : "Banner created successfully!"
        );
        setIsModalOpen(false);
        fetchTopOffers();
      } else {
        toast.error(json.message || "Failed to save banner");
      }
    } catch (err: any) {
      console.error("Error submitting banner:", err);
      toast.error("Failed to submit banner");
    } finally {
      setSubmittingBanner(false);
    }
  };

  // Toggle Banner Active Status
  const handleToggleBanner = async (bannerId: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/top-offers/banners/${bannerId}/toggle`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Status updated");
        setSectionData((prev) => ({
          ...prev,
          banners: prev.banners.map((b) =>
            b._id === bannerId ? { ...b, isActive: !b.isActive } : b
          ),
        }));
      } else {
        toast.error(json.message || "Failed to toggle status");
      }
    } catch (err: any) {
      console.error("Error toggling banner status:", err);
      toast.error("Failed to toggle status");
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (bannerId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete banner "${title}"?`)) {
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/top-offers/banners/${bannerId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Banner deleted successfully");
        setSectionData((prev) => ({
          ...prev,
          banners: prev.banners.filter((b) => b._id !== bannerId),
        }));
      } else {
        toast.error(json.message || "Failed to delete banner");
      }
    } catch (err: any) {
      console.error("Error deleting banner:", err);
      toast.error("Failed to delete banner");
    }
  };

  // Move Banner Up/Down
  const handleMoveOrder = async (bannerId: string, direction: "up" | "down") => {
    const banners = [...sectionData.banners].sort((a, b) => a.order - b.order);
    const index = banners.findIndex((b) => b._id === bannerId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    // Swap orders
    const currentBanner = banners[index];
    const targetBanner = banners[targetIndex];

    const tempOrder = currentBanner.order;
    currentBanner.order = targetBanner.order;
    targetBanner.order = tempOrder;

    // If both orders happen to be equal, space them out
    if (currentBanner.order === targetBanner.order) {
      currentBanner.order = direction === "up" ? targetIndex + 1 : targetIndex + 2;
      targetBanner.order = direction === "up" ? targetIndex + 2 : targetIndex + 1;
    }

    const updatedOrders = banners.map((b, idx) => ({
      id: b._id,
      order: idx + 1,
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/top-offers/reorder`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: updatedOrders }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Position updated!");
        fetchTopOffers();
      } else {
        toast.error(json.message || "Failed to update order");
      }
    } catch (err: any) {
      console.error("Error reordering banners:", err);
      toast.error("Failed to reorder banners");
    }
  };

  // Compute live preview image for modal
  const getModalPreviewSrc = () => {
    if (bannerForm.imageType === "upload" && filePreview) return filePreview;
    if (bannerForm.imageType === "preset") {
      const p = PRESET_BANNERS.find((item) => item.value === bannerForm.presetValue);
      return p ? p.src : banner1;
    }
    if (bannerForm.imageType === "url" && bannerForm.customUrl) {
      return bannerForm.customUrl;
    }
    return banner1;
  };

  const activeBannersCount = sectionData.banners.filter((b) => b.isActive).length;

  return (
    <div className="top-offers-admin-page">
      <div className="top-offers-admin-container">
        {/* Back Link */}
        <div className="top-offers-back-wrap">
          <Link to="/admin/dashboard" className="top-offers-back-link">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <header className="top-offers-admin-header">
          <div>
            <div className="top-offers-badge">HOMEPAGE MERCHANDISING</div>
            <h1>Top Offers Banner Management</h1>
            <p>
              Configure section appearance, background color, dynamic title, banner positioning, and visibility on the storefront.
            </p>
          </div>
          <div className="top-offers-header-actions">
            <button
              onClick={fetchTopOffers}
              className="top-offers-refresh-btn"
              title="Refresh Top Offers"
              disabled={loading}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
            </button>
            <button onClick={handleOpenAddModal} className="top-offers-add-btn">
              <Plus size={18} />
              <span>Add Banner</span>
            </button>
          </div>
        </header>

        {/* Stats Strip */}
        <div className="top-offers-stats-strip">
          <div className="stat-card">
            <span className="stat-label">TOTAL BANNERS</span>
            <span className="stat-value">{sectionData.banners.length}</span>
          </div>
          <div className="stat-card highlight">
            <span className="stat-label">ACTIVE ON HOME</span>
            <span className="stat-value">{activeBannersCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">HIDDEN BANNERS</span>
            <span className="stat-value">
              {sectionData.banners.length - activeBannersCount}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">SECTION STATUS</span>
            <span
              className={`stat-status-badge ${
                sectionIsActive ? "active" : "disabled"
              }`}
            >
              {sectionIsActive ? "Visible on Home" : "Section Hidden"}
            </span>
          </div>
        </div>

        {/* =========================================================
            SECTION SETTINGS FORM (TITLE, BG COLOR, VISIBILITY)
        ========================================================= */}
        <section className="top-offers-settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title-wrap">
              <div className="settings-icon-badge">
                <Palette size={20} />
              </div>
              <div>
                <h2>Section Design & Appearance</h2>
                <p>Customize the section title, background color, and storefront visibility.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="settings-save-btn"
              disabled={savingSettings}
            >
              <Save size={16} />
              <span>{savingSettings ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="settings-form-grid">
            {/* Title Input */}
            <div className="form-group">
              <label htmlFor="sectionTitle">
                Section Title <span className="req">*</span>
              </label>
              <input
                id="sectionTitle"
                type="text"
                className="admin-text-input"
                placeholder="e.g. Top Offers"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                maxLength={80}
                required
              />
              <span className="form-hint">Displayed at the top of the section on the home page.</span>
            </div>

            {/* Subtitle / Description (Optional) */}
            <div className="form-group">
              <label htmlFor="sectionSubtitle">Subtitle (Optional)</label>
              <input
                id="sectionSubtitle"
                type="text"
                className="admin-text-input"
                placeholder="e.g. Exclusive deals on trending products"
                value={sectionSubtitle}
                onChange={(e) => setSectionSubtitle(e.target.value)}
                maxLength={150}
              />
              <span className="form-hint">Additional descriptive text or promotional tagline.</span>
            </div>

            {/* Background Color Customizer */}
            <div className="form-group">
              <label>Section Background Color</label>
              <div className="color-picker-input-group">
                <input
                  type="color"
                  className="native-color-picker"
                  value={sectionBgColor}
                  onChange={(e) => setSectionBgColor(e.target.value)}
                  title="Pick custom color"
                />
                <input
                  type="text"
                  className="admin-text-input hex-input"
                  value={sectionBgColor}
                  onChange={(e) => setSectionBgColor(e.target.value)}
                  placeholder="#eff6ff"
                  maxLength={10}
                />
              </div>
              <div className="swatch-list">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.value}
                    type="button"
                    className={`color-swatch-chip ${
                      sectionBgColor.toLowerCase() === swatch.value.toLowerCase() ? "selected" : ""
                    }`}
                    style={{ backgroundColor: swatch.value }}
                    onClick={() => setSectionBgColor(swatch.value)}
                    title={swatch.name}
                  >
                    {sectionBgColor.toLowerCase() === swatch.value.toLowerCase() && (
                      <CheckCircle2 size={13} className="swatch-check" />
                    )}
                  </button>
                ))}
              </div>
              <span className="form-hint">Light blue (#eff6ff) is the recommended default.</span>
            </div>

            {/* Title Text Color Customizer */}
            <div className="form-group">
              <label>Title Text Color</label>
              <div className="color-picker-input-group">
                <input
                  type="color"
                  className="native-color-picker"
                  value={sectionTitleColor}
                  onChange={(e) => setSectionTitleColor(e.target.value)}
                  title="Pick title color"
                />
                <input
                  type="text"
                  className="admin-text-input hex-input"
                  value={sectionTitleColor}
                  onChange={(e) => setSectionTitleColor(e.target.value)}
                  placeholder="#0f172a"
                  maxLength={10}
                />
              </div>
              <div className="swatch-list">
                {TITLE_COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.value}
                    type="button"
                    className={`color-swatch-chip ${
                      sectionTitleColor.toLowerCase() === swatch.value.toLowerCase() ? "selected" : ""
                    }`}
                    style={{ backgroundColor: swatch.value }}
                    onClick={() => setSectionTitleColor(swatch.value)}
                    title={swatch.name}
                  >
                    {sectionTitleColor.toLowerCase() === swatch.value.toLowerCase() && (
                      <CheckCircle2 size={13} className="swatch-check" />
                    )}
                  </button>
                ))}
              </div>
              <span className="form-hint">Adjust contrast according to the background.</span>
            </div>

            {/* Section Visibility Switch */}
            <div className="form-group full-width">
              <label className="toggle-label-wrap">
                <input
                  type="checkbox"
                  checked={sectionIsActive}
                  onChange={(e) => setSectionIsActive(e.target.checked)}
                  className="native-toggle-checkbox"
                />
                <span className="custom-toggle-slider" />
                <span className="toggle-text">
                  <strong>Enable Section on Homepage</strong> (Turn off to temporarily hide the entire Top Offers section)
                </span>
              </label>
            </div>

            {/* LIVE PREVIEW OF SECTION HEADER */}
            <div className="form-group full-width">
              <label>Live Header & Color Preview</label>
              <div
                className="section-live-preview-box"
                style={{ backgroundColor: sectionBgColor }}
              >
                <div className="preview-header-bar">
                  <h3 style={{ color: sectionTitleColor }}>
                    {sectionTitle || "Top Offers"}
                  </h3>
                  {sectionSubtitle && (
                    <p style={{ color: sectionTitleColor, opacity: 0.8 }}>
                      {sectionSubtitle}
                    </p>
                  )}
                </div>
                <div className="preview-cards-mockup">
                  <div className="mockup-card">410 × 250 Banner Card 1</div>
                  <div className="mockup-card">410 × 250 Banner Card 2</div>
                  <div className="mockup-card">410 × 250 Banner Card 3</div>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* =========================================================
            BANNERS LIST & ORDERING MANAGEMENT
        ========================================================= */}
        <section className="top-offers-banners-section">
          <div className="banners-section-header">
            <div>
              <h2>Banners & Positions ({sectionData.banners.length})</h2>
              <p>
                Set which banners are shown, adjust their position sequence (1, 2, 3...), and change banner targets.
              </p>
            </div>
            <button onClick={handleOpenAddModal} className="top-offers-add-btn-secondary">
              <Plus size={16} />
              <span>Add Banner</span>
            </button>
          </div>

          {loading ? (
            <div className="banners-loading-state">
              <RefreshCw size={28} className="spin" />
              <p>Loading banners...</p>
            </div>
          ) : sectionData.banners.length === 0 ? (
            <div className="banners-empty-state">
              <Layers size={48} />
              <h3>No banners configured yet</h3>
              <p>Add your first banner to display promotional deals on the homepage.</p>
              <button onClick={handleOpenAddModal} className="top-offers-add-btn">
                <Plus size={16} /> Add First Banner
              </button>
            </div>
          ) : (
            <div className="admin-banners-grid">
              {sectionData.banners
                .sort((a, b) => a.order - b.order)
                .map((banner, index) => {
                  const imageSrc = getBannerImageSrc(banner.imageUrl);
                  const isFirst = index === 0;
                  const isLast = index === sectionData.banners.length - 1;

                  return (
                    <div
                      key={banner._id}
                      className={`admin-banner-card ${!banner.isActive ? "inactive-card" : ""}`}
                    >
                      {/* Top Badges & Position Controls */}
                      <div className="admin-banner-top-bar">
                        <div className="position-indicator">
                          <span className="position-badge">Position #{banner.order}</span>
                          <div className="order-nav-buttons">
                            <button
                              type="button"
                              className="order-btn"
                              disabled={isFirst}
                              onClick={() => handleMoveOrder(banner._id, "up")}
                              title="Move Left / Earlier"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              className="order-btn"
                              disabled={isLast}
                              onClick={() => handleMoveOrder(banner._id, "down")}
                              title="Move Right / Later"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Active / Hidden Switch */}
                        <button
                          type="button"
                          className={`status-toggle-pill ${banner.isActive ? "active" : "hidden"}`}
                          onClick={() => handleToggleBanner(banner._id)}
                          title={banner.isActive ? "Click to hide from store" : "Click to show on store"}
                        >
                          {banner.isActive ? (
                            <>
                              <Eye size={13} />
                              <span>Showing</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={13} />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Banner Image Preview in 410x250 aspect ratio */}
                      <div className="admin-banner-media-wrap">
                        <img
                          src={imageSrc}
                          alt={banner.title}
                          className="admin-banner-preview-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = banner1;
                          }}
                        />
                        <span className="aspect-ratio-tag">410 × 250</span>
                      </div>

                      {/* Banner Info */}
                      <div className="admin-banner-info">
                        <h4 className="banner-title">{banner.title}</h4>
                        <div className="banner-link-row">
                          <ExternalLink size={13} />
                          <span className="banner-link-text">{banner.linkUrl || "/products"}</span>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="admin-banner-actions">
                        <button
                          type="button"
                          className="card-action-btn edit"
                          onClick={() => handleOpenEditModal(banner)}
                          title="Edit Banner"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="card-action-btn delete"
                          onClick={() => handleDeleteBanner(banner._id, banner.title)}
                          title="Delete Banner"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* =========================================================
            ADD / EDIT BANNER MODAL
        ========================================================= */}
        {isModalOpen && (
          <div className="top-offers-modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <div
              className="top-offers-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="modal-header">
                <div>
                  <h3>{editingBannerId ? "Edit Banner" : "Add New Banner"}</h3>
                  <p>Configure banner image, position, link destination, and visibility.</p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmitBanner} className="modal-form">
                {/* Title */}
                <div className="modal-field">
                  <label htmlFor="bannerTitle">
                    Banner Title / Label <span className="req">*</span>
                  </label>
                  <input
                    id="bannerTitle"
                    type="text"
                    className="admin-text-input"
                    placeholder="e.g. Mega Electronics Sale"
                    value={bannerForm.title}
                    onChange={(e) =>
                      setBannerForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* Image Source Selection Tabs */}
                <div className="modal-field">
                  <label>Banner Image (410 × 250 recommended)</label>
                  <div className="image-mode-tabs">
                    <button
                      type="button"
                      className={`tab-btn ${bannerForm.imageType === "preset" ? "active" : ""}`}
                      onClick={() =>
                        setBannerForm((prev) => ({ ...prev, imageType: "preset" }))
                      }
                    >
                      <Sparkles size={14} />
                      <span>Built-in Presets</span>
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${bannerForm.imageType === "upload" ? "active" : ""}`}
                      onClick={() =>
                        setBannerForm((prev) => ({ ...prev, imageType: "upload" }))
                      }
                    >
                      <UploadCloud size={14} />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${bannerForm.imageType === "url" ? "active" : ""}`}
                      onClick={() =>
                        setBannerForm((prev) => ({ ...prev, imageType: "url" }))
                      }
                    >
                      <ImageIcon size={14} />
                      <span>Image URL</span>
                    </button>
                  </div>

                  {/* Mode 1: Presets */}
                  {bannerForm.imageType === "preset" && (
                    <div className="presets-picker-grid">
                      {PRESET_BANNERS.map((preset) => (
                        <div
                          key={preset.value}
                          className={`preset-option-card ${
                            bannerForm.presetValue === preset.value ? "selected" : ""
                          }`}
                          onClick={() =>
                            setBannerForm((prev) => ({
                              ...prev,
                              presetValue: preset.value,
                            }))
                          }
                        >
                          <img src={preset.src} alt={preset.label} />
                          <span className="preset-name">{preset.label}</span>
                          {bannerForm.presetValue === preset.value && (
                            <CheckCircle2 size={16} className="preset-checked-icon" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mode 2: File Upload */}
                  {bannerForm.imageType === "upload" && (
                    <div className="upload-dropzone">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        style={{ display: "none" }}
                      />
                      <div
                        className="dropzone-box"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadCloud size={32} />
                        <p>
                          <strong>Click to select image file</strong>
                        </p>
                        <span>Supports PNG, JPG, WEBP (Max 5MB)</span>
                        {selectedFile && (
                          <div className="file-selected-badge">
                            Selected: {selectedFile.name}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Custom URL */}
                  {bannerForm.imageType === "url" && (
                    <div className="url-input-wrap">
                      <input
                        type="url"
                        className="admin-text-input"
                        placeholder="https://example.com/banner-410x250.png"
                        value={bannerForm.customUrl}
                        onChange={(e) =>
                          setBannerForm((prev) => ({ ...prev, customUrl: e.target.value }))
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Target Link */}
                <div className="modal-field">
                  <label htmlFor="bannerLink">
                    Target Link URL <span className="req">*</span>
                  </label>
                  <input
                    id="bannerLink"
                    type="text"
                    className="admin-text-input"
                    placeholder="/products or https://..."
                    value={bannerForm.linkUrl}
                    onChange={(e) =>
                      setBannerForm((prev) => ({ ...prev, linkUrl: e.target.value }))
                    }
                    required
                  />
                  <div className="quick-links-chips">
                    <button
                      type="button"
                      className="chip"
                      onClick={() =>
                        setBannerForm((prev) => ({ ...prev, linkUrl: "/products" }))
                      }
                    >
                      /products
                    </button>
                    <button
                      type="button"
                      className="chip"
                      onClick={() =>
                        setBannerForm((prev) => ({
                          ...prev,
                          linkUrl: "/products?search=shoes",
                        }))
                      }
                    >
                      Search: shoes
                    </button>
                    <button
                      type="button"
                      className="chip"
                      onClick={() =>
                        setBannerForm((prev) => ({
                          ...prev,
                          linkUrl: "/products?search=electronics",
                        }))
                      }
                    >
                      Search: electronics
                    </button>
                  </div>
                </div>

                {/* Position / Order & Active Toggle */}
                <div className="modal-row-fields">
                  <div className="modal-field">
                    <label htmlFor="bannerOrder">Display Position / Order</label>
                    <input
                      id="bannerOrder"
                      type="number"
                      min={1}
                      max={99}
                      className="admin-text-input"
                      value={bannerForm.order}
                      onChange={(e) =>
                        setBannerForm((prev) => ({
                          ...prev,
                          order: Number(e.target.value) || 1,
                        }))
                      }
                    />
                    <span className="form-hint">Position 1 is displayed first.</span>
                  </div>

                  <div className="modal-field toggle-field">
                    <label>Visibility Status</label>
                    <label className="toggle-label-wrap">
                      <input
                        type="checkbox"
                        checked={bannerForm.isActive}
                        onChange={(e) =>
                          setBannerForm((prev) => ({
                            ...prev,
                            isActive: e.target.checked,
                          }))
                        }
                        className="native-toggle-checkbox"
                      />
                      <span className="custom-toggle-slider" />
                      <span className="toggle-text">
                        {bannerForm.isActive ? "Show on Homepage" : "Hide from Homepage"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Live Modal Card Preview */}
                <div className="modal-field">
                  <label>Card Preview (410 × 250 ratio)</label>
                  <div className="modal-card-preview-box">
                    <div className="modal-preview-banner-card">
                      <img
                        src={getModalPreviewSrc()}
                        alt="Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = banner1;
                        }}
                      />
                      <div className="preview-hover-tag">Preview Mode</div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="modal-actions-footer">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submittingBanner}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={submittingBanner}
                  >
                    {submittingBanner
                      ? "Saving Banner..."
                      : editingBannerId
                      ? "Update Banner"
                      : "Create Banner"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopOffersAdmin;
