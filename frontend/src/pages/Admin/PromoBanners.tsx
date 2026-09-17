import React, { useEffect, useState, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Video,
  Image as ImageIcon,
  ExternalLink,
  ArrowRight,
  Eye,
  RefreshCw,
  X,
  Layers,
  UploadCloud,
  FileVideo,
  FileImage,
} from "lucide-react";
import toast from "react-hot-toast";
import "./PromoBanners.css";

import phoneVideo from "../../assets/products/videos/phone.mp4";
import airpodsVideo from "../../assets/products/videos/airpods.mp4";
import electronicImg from "../../assets/electronic.png";
import fashionImg from "../../assets/cloth.png";

export interface PromoBanner {
  _id: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  badge: string;
  badgeTheme: "dark" | "blue" | "purple" | "rose" | "emerald" | "amber";
  pricePrefix: string;
  price: string;
  linkUrl: string;
  btnText: string;
  mediaType: "video" | "image";
  videoUrl: string;
  posterUrl?: string;
  bgGradient: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const GRADIENT_PRESETS = [
  {
    name: "Metallic Titanium",
    value: "linear-gradient(135deg, #c7cbd3 0%, #b2b9c5 50%, #9ba3b2 100%)",
  },
  {
    name: "Ice Blue / Lavender",
    value: "linear-gradient(135deg, #eff2fc 0%, #e1e7f9 50%, #d8e0f5 100%)",
  },
  {
    name: "Midnight Obsidian",
    value: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)",
  },
  {
    name: "Sunset Rose",
    value: "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 50%, #fda4af 100%)",
  },
  {
    name: "Royal Purple",
    value: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)",
  },
  {
    name: "Emerald Mint",
    value: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)",
  },
];

const VIDEO_PRESETS = [
  { label: "Built-in: iPhone Showcase Video", value: "preset:phone", localSrc: phoneVideo },
  { label: "Built-in: AirPods Showcase Video", value: "preset:airpods", localSrc: airpodsVideo },
];

const IMAGE_PRESETS = [
  { label: "Built-in: Electronics Showcase", value: "preset:electronic", localSrc: electronicImg },
  { label: "Built-in: Fashion Showcase", value: "preset:fashion", localSrc: fashionImg },
];

const resolveMediaSrc = (url: string, _mediaType?: "video" | "image"): string => {
  if (url === "preset:phone") return phoneVideo;
  if (url === "preset:airpods") return airpodsVideo;
  if (url === "preset:electronic") return electronicImg;
  if (url === "preset:fashion") return fashionImg;
  return url;
};

const PromoBanners: React.FC = () => {
  const [promos, setPromos] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    tagline: "",
    badge: "NEW LAUNCH",
    badgeTheme: "dark" as "dark" | "blue" | "purple" | "rose" | "emerald" | "amber",
    pricePrefix: "From",
    price: "",
    linkUrl: "/products",
    btnText: "Shop Now",
    mediaType: "video" as "video" | "image",
    mediaSourceType: "preset" as "preset" | "upload" | "custom",
    videoPreset: "preset:phone",
    imagePreset: "preset:electronic",
    uploadedDataUrl: "",
    customVideoUrl: "",
    fileName: "",
    bgGradient: GRADIENT_PRESETS[0].value,
    order: 0,
    isActive: true,
  });

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/promos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setPromos(Array.isArray(result.data) ? result.data : []);
      } else {
        toast.error(result.message || "Failed to load promo banners");
      }
    } catch (err: any) {
      console.error("Fetch promos error:", err);
      toast.error(err.message || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      title: "",
      subtitle: "",
      tagline: "",
      badge: "NEW LAUNCH",
      badgeTheme: "dark",
      pricePrefix: "From",
      price: "",
      linkUrl: "/products",
      btnText: "Shop Now",
      mediaType: "video",
      mediaSourceType: "preset",
      videoPreset: "preset:phone",
      imagePreset: "preset:electronic",
      uploadedDataUrl: "",
      customVideoUrl: "",
      fileName: "",
      bgGradient: GRADIENT_PRESETS[0].value,
      order: promos.length,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (promo: PromoBanner) => {
    setEditingId(promo._id);
    const isPreset = promo.videoUrl.startsWith("preset:");
    const isDataUrl = promo.videoUrl.startsWith("data:");
    const currentMediaType = promo.mediaType || "video";

    setFormData({
      title: promo.title,
      subtitle: promo.subtitle || "",
      tagline: promo.tagline || "",
      badge: promo.badge || "FEATURED",
      badgeTheme: promo.badgeTheme || "dark",
      pricePrefix: promo.pricePrefix || "From",
      price: promo.price || "",
      linkUrl: promo.linkUrl || "/products",
      btnText: promo.btnText || "Shop Now",
      mediaType: currentMediaType,
      mediaSourceType: isPreset ? "preset" : isDataUrl ? "upload" : "custom",
      videoPreset: isPreset ? promo.videoUrl : "preset:phone",
      imagePreset: isPreset ? promo.videoUrl : "preset:electronic",
      uploadedDataUrl: isDataUrl ? promo.videoUrl : "",
      customVideoUrl: !isPreset && !isDataUrl ? promo.videoUrl : "",
      fileName: isDataUrl ? "Uploaded File" : "",
      bgGradient: promo.bgGradient || GRADIENT_PRESETS[0].value,
      order: promo.order || 0,
      isActive: promo.isActive !== false,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  // Handle local file upload (via FileReader to Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("Please upload an image (JPG, PNG, WebP) or video (MP4, WebM)");
      return;
    }

    // Limit check (e.g. 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File is too large! Maximum file size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        mediaType: isVideo ? "video" : "image",
        uploadedDataUrl: resultStr,
        fileName: file.name,
      }));
      toast.success(`${isVideo ? "Video" : "Image"} loaded successfully!`);
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    let finalMediaUrl = "";
    if (formData.mediaSourceType === "preset") {
      finalMediaUrl =
        formData.mediaType === "video"
          ? formData.videoPreset
          : formData.imagePreset;
    } else if (formData.mediaSourceType === "upload") {
      finalMediaUrl = formData.uploadedDataUrl;
    } else {
      finalMediaUrl = formData.customVideoUrl.trim();
    }

    if (!finalMediaUrl) {
      toast.error("Please select a preset, upload a file from your device, or enter a custom URL");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const url = editingId
        ? `${API_BASE_URL}/api/admin/promos/${editingId}`
        : `${API_BASE_URL}/api/admin/promos`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          subtitle: formData.subtitle,
          tagline: formData.tagline,
          badge: formData.badge,
          badgeTheme: formData.badgeTheme,
          pricePrefix: formData.pricePrefix,
          price: formData.price,
          linkUrl: formData.linkUrl,
          btnText: formData.btnText,
          mediaType: formData.mediaType,
          videoUrl: finalMediaUrl,
          bgGradient: formData.bgGradient,
          order: Number(formData.order) || 0,
          isActive: formData.isActive,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(
          editingId
            ? "Promo card updated successfully!"
            : "Promo card created successfully!"
        );
        handleCloseModal();
        fetchPromos();
      } else {
        toast.error(result.message || "Failed to save promo card");
      }
    } catch (err: any) {
      console.error("Save promo error:", err);
      toast.error(err.message || "Error saving promo card");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token");
      // Optimistic update
      setPromos((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isActive: !currentStatus } : p))
      );

      const res = await fetch(`${API_BASE_URL}/api/admin/promos/${id}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(`Promo banner ${result.data.isActive ? "Activated" : "Deactivated"}`);
      } else {
        // Rollback
        setPromos((prev) =>
          prev.map((p) => (p._id === id ? { ...p, isActive: currentStatus } : p))
        );
        toast.error(result.message || "Failed to update status");
      }
    } catch (err: any) {
      console.error("Toggle status error:", err);
      fetchPromos();
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/promos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Promo card deleted successfully");
        setPromos((prev) => prev.filter((p) => p._id !== id));
      } else {
        toast.error(result.message || "Failed to delete promo card");
      }
    } catch (err: any) {
      console.error("Delete promo error:", err);
      toast.error(err.message || "Failed to delete promo card");
    }
  };

  // Preview media resolution
  let previewMediaSrc = "";
  if (formData.mediaSourceType === "preset") {
    previewMediaSrc =
      formData.mediaType === "video"
        ? resolveMediaSrc(formData.videoPreset, "video")
        : resolveMediaSrc(formData.imagePreset, "image");
  } else if (formData.mediaSourceType === "upload") {
    previewMediaSrc = formData.uploadedDataUrl;
  } else {
    previewMediaSrc = formData.customVideoUrl;
  }

  const isDarkMode =
    formData.bgGradient.includes("#020617") ||
    formData.bgGradient.includes("#0f172a") ||
    formData.bgGradient.includes("#1e293b");

  return (
    <section className="promos-admin-section">
      {/* HEADER */}
      <div className="promos-admin-header">
        <div className="promos-heading-wrap">
          <span className="promos-eyebrow">ADMINISTRATION</span>
          <h1>Video & Image Promo Banners</h1>
          <p>
            Manage dynamic video or image showcase cards displayed on the homepage promotional section.
          </p>
        </div>

        <div className="promos-header-actions">
          <button
            className="promos-refresh-btn"
            onClick={fetchPromos}
            title="Refresh list"
          >
            <RefreshCw size={16} />
          </button>
          <button className="promos-add-btn" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Add New Promo</span>
          </button>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="promos-stats-strip">
        <div className="promo-stat-item">
          <span className="stat-label">Total Promos</span>
          <span className="stat-value">{promos.length}</span>
        </div>
        <div className="promo-stat-item">
          <span className="stat-label">Active on Home</span>
          <span className="stat-value active-val">
            {promos.filter((p) => p.isActive).length}
          </span>
        </div>
        <div className="promo-stat-item">
          <span className="stat-label">Hidden / Draft</span>
          <span className="stat-value inactive-val">
            {promos.filter((p) => !p.isActive).length}
          </span>
        </div>
      </div>

      {/* CONTENT LIST */}
      {loading ? (
        <div className="promos-loading-state">
          <RefreshCw size={28} className="spinner-icon" />
          <p>Loading promo banners...</p>
        </div>
      ) : promos.length === 0 ? (
        <div className="promos-empty-state">
          <Layers size={48} />
          <h3>No Promo Banners Found</h3>
          <p>Get started by adding your first promotional video or image showcase card.</p>
          <button className="promos-add-btn" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Add Promo Banner</span>
          </button>
        </div>
      ) : (
        <div className="promos-cards-grid">
          {promos.map((promo) => {
            const isDark =
              promo.bgGradient.includes("#020617") ||
              promo.bgGradient.includes("#0f172a") ||
              promo.bgGradient.includes("#1e293b");

            const currentMediaType = promo.mediaType || "video";
            const mediaSrc = resolveMediaSrc(promo.videoUrl, currentMediaType);

            return (
              <div
                key={promo._id}
                className={`promo-admin-card ${!promo.isActive ? "is-disabled" : ""}`}
                style={{ background: promo.bgGradient }}
              >
                {/* CARD CONTENT */}
                <div className={`admin-card-body ${isDark ? "dark-theme" : ""}`}>
                  <div className="admin-card-top">
                    <div className="promo-badge-type-wrap">
                      <span className={`promo-badge badge-${promo.badgeTheme || "dark"}`}>
                        {promo.badge}
                      </span>
                      <span className="media-type-tag">
                        {currentMediaType === "image" ? <FileImage size={11} /> : <FileVideo size={11} />}
                        {currentMediaType.toUpperCase()}
                      </span>
                    </div>

                    <button
                      className={`status-pill ${promo.isActive ? "active" : "inactive"}`}
                      onClick={() => handleToggleStatus(promo._id, promo.isActive)}
                      title="Click to toggle status"
                    >
                      {promo.isActive ? (
                        <>
                          <CheckCircle2 size={13} /> Active
                        </>
                      ) : (
                        <>
                          <XCircle size={13} /> Hidden
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="admin-card-title">{promo.title}</h3>
                  {promo.subtitle && (
                    <span className="admin-card-subtitle">{promo.subtitle}</span>
                  )}
                  {promo.tagline && (
                    <p className="admin-card-tagline">{promo.tagline}</p>
                  )}

                  {promo.price && (
                    <p className="admin-card-price">
                      {promo.pricePrefix || "From"} <strong>{promo.price}</strong>
                    </p>
                  )}

                  <div className="admin-card-footer">
                    <span className="admin-card-link" title={promo.linkUrl}>
                      <ExternalLink size={13} /> {promo.linkUrl}
                    </span>
                    <div className="admin-card-actions">
                      <button
                        className="admin-action-btn edit-btn"
                        onClick={() => handleOpenEditModal(promo)}
                        title="Edit Promo"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="admin-action-btn delete-btn"
                        onClick={() => handleDelete(promo._id, promo.title)}
                        title="Delete Promo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CARD MEDIA PREVIEW */}
                <div className="admin-card-video-wrap">
                  {currentMediaType === "image" ? (
                    <img
                      src={mediaSrc}
                      alt={promo.title}
                      className="admin-card-img"
                    />
                  ) : (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="admin-card-video"
                      src={mediaSrc}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="promo-modal-overlay" onClick={handleCloseModal}>
          <div
            className="promo-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="promo-modal-header">
              <div className="modal-title-wrap">
                {formData.mediaType === "image" ? (
                  <ImageIcon size={20} className="modal-icon" />
                ) : (
                  <Video size={20} className="modal-icon" />
                )}
                <h2>{editingId ? "Edit Promo Banner" : "Add Promo Banner"}</h2>
              </div>
              <button
                className="modal-close-btn"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="promo-modal-body">
              {/* FORM */}
              <form className="promo-form" onSubmit={handleSubmit}>
                <div className="form-group-row">
                  <div className="form-group">
                    <label>
                      Product Title <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. iPhone 15 Pro"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Subtitle / Generation</label>
                    <input
                      type="text"
                      placeholder="e.g. 2nd Generation"
                      value={formData.subtitle}
                      onChange={(e) =>
                        setFormData({ ...formData, subtitle: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Marketing Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Titanium. So strong. So light. So Pro."
                    value={formData.tagline}
                    onChange={(e) =>
                      setFormData({ ...formData, tagline: e.target.value })
                    }
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Badge Label</label>
                    <input
                      type="text"
                      placeholder="e.g. NEW LAUNCH"
                      value={formData.badge}
                      onChange={(e) =>
                        setFormData({ ...formData, badge: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Badge Color Theme</label>
                    <select
                      value={formData.badgeTheme}
                      onChange={(e: any) =>
                        setFormData({ ...formData, badgeTheme: e.target.value })
                      }
                    >
                      <option value="dark">Dark Black</option>
                      <option value="blue">Electric Blue</option>
                      <option value="purple">Royal Purple</option>
                      <option value="rose">Sunset Rose</option>
                      <option value="emerald">Emerald Green</option>
                      <option value="amber">Amber Gold</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Price Display</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹1,34,900"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Button Action Text</label>
                    <input
                      type="text"
                      placeholder="Shop Now"
                      value={formData.btnText}
                      onChange={(e) =>
                        setFormData({ ...formData, btnText: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Target Redirect Link / Search</label>
                  <input
                    type="text"
                    placeholder="e.g. /products?search=iphone"
                    value={formData.linkUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, linkUrl: e.target.value })
                    }
                  />
                </div>

                {/* MEDIA TYPE & SOURCE SELECTOR */}
                <div className="form-group media-section-box">
                  <div className="media-section-head">
                    <label>Media Type</label>
                    <div className="media-type-pills">
                      <button
                        type="button"
                        className={`type-pill ${formData.mediaType === "video" ? "active" : ""}`}
                        onClick={() =>
                          setFormData({ ...formData, mediaType: "video" })
                        }
                      >
                        <Video size={13} /> Video
                      </button>
                      <button
                        type="button"
                        className={`type-pill ${formData.mediaType === "image" ? "active" : ""}`}
                        onClick={() =>
                          setFormData({ ...formData, mediaType: "image" })
                        }
                      >
                        <ImageIcon size={13} /> Image
                      </button>
                    </div>
                  </div>

                  <label className="sub-label">Media Source</label>
                  <div className="video-type-selector">
                    <button
                      type="button"
                      className={`type-btn ${formData.mediaSourceType === "upload" ? "active" : ""}`}
                      onClick={() =>
                        setFormData({ ...formData, mediaSourceType: "upload" })
                      }
                    >
                      <UploadCloud size={13} /> Upload from Device
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${formData.mediaSourceType === "preset" ? "active" : ""}`}
                      onClick={() =>
                        setFormData({ ...formData, mediaSourceType: "preset" })
                      }
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${formData.mediaSourceType === "custom" ? "active" : ""}`}
                      onClick={() =>
                        setFormData({ ...formData, mediaSourceType: "custom" })
                      }
                    >
                      URL Link
                    </button>
                  </div>

                  {formData.mediaSourceType === "upload" && (
                    <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept={formData.mediaType === "video" ? "video/*" : "image/*"}
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                      />
                      <UploadCloud size={24} className="upload-icon" />
                      <div className="upload-text">
                        <strong>Click to select {formData.mediaType === "video" ? "a video" : "an image"}</strong>
                        <span>Supports MP4, WebM, PNG, JPG, WebP (Max 10MB)</span>
                      </div>
                      {formData.fileName && (
                        <div className="selected-file-badge">
                          ✓ {formData.fileName}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.mediaSourceType === "preset" && (
                    <select
                      className="preset-select"
                      value={
                        formData.mediaType === "video"
                          ? formData.videoPreset
                          : formData.imagePreset
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [formData.mediaType === "video" ? "videoPreset" : "imagePreset"]:
                            e.target.value,
                        })
                      }
                    >
                      {(formData.mediaType === "video" ? VIDEO_PRESETS : IMAGE_PRESETS).map(
                        (p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        )
                      )}
                    </select>
                  )}

                  {formData.mediaSourceType === "custom" && (
                    <input
                      type="text"
                      placeholder={
                        formData.mediaType === "video"
                          ? "https://your-domain.com/video.mp4"
                          : "https://your-domain.com/image.jpg"
                      }
                      value={formData.customVideoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, customVideoUrl: e.target.value })
                      }
                    />
                  )}
                </div>

                {/* GRADIENT THEME SELECTION */}
                <div className="form-group">
                  <label>Background Gradient Theme</label>
                  <div className="gradient-palette">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        className={`gradient-swatch ${formData.bgGradient === preset.value ? "active" : ""}`}
                        style={{ background: preset.value }}
                        onClick={() =>
                          setFormData({ ...formData, bgGradient: preset.value })
                        }
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Sort Order Index</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                      />
                      <span>Active on Homepage</span>
                    </label>
                  </div>
                </div>

                {/* MODAL ACTIONS */}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Saving..."
                      : editingId
                      ? "Update Promo Banner"
                      : "Create Promo Banner"}
                  </button>
                </div>
              </form>

              {/* LIVE PREVIEW COLUMN */}
              <div className="promo-live-preview-col">
                <div className="preview-header">
                  <Eye size={15} />
                  <span>Live Card Preview</span>
                </div>

                <div
                  className="promo-preview-card"
                  style={{ background: formData.bgGradient }}
                >
                  <div className={`promo-preview-info ${isDarkMode ? "dark-theme" : ""}`}>
                    <span className={`promo-badge badge-${formData.badgeTheme}`}>
                      {formData.badge || "PROMO"}
                    </span>
                    <h3 className="preview-title">
                      {formData.title || "Product Title"}
                    </h3>
                    {formData.subtitle && (
                      <p className="preview-subtitle">{formData.subtitle}</p>
                    )}
                    <p className="preview-tagline">
                      {formData.tagline || "Your marketing tagline description here."}
                    </p>
                    {formData.price && (
                      <p className="preview-price">
                        {formData.pricePrefix || "From"} <strong>{formData.price}</strong>
                      </p>
                    )}
                    <div className="preview-btn">
                      <span>{formData.btnText || "Shop Now"}</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>

                  <div className="promo-preview-media">
                    {previewMediaSrc ? (
                      formData.mediaType === "image" ? (
                        <img
                          key={previewMediaSrc}
                          src={previewMediaSrc}
                          alt={formData.title || "Preview"}
                          className="preview-image"
                        />
                      ) : (
                        <video
                          key={previewMediaSrc}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="preview-video"
                          src={previewMediaSrc}
                        />
                      )
                    ) : (
                      <div className="preview-no-video">
                        No {formData.mediaType === "image" ? "Image" : "Video"} Selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PromoBanners;
