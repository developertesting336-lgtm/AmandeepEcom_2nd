import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, UploadCloud, X } from "lucide-react";
import "./EditProduct.css";

interface Category {
  _id: string;
  name: string;
  parent?: string | { _id: string; name: string } | null;
  isActive?: boolean;
}

interface ManufacturerState {
  name: string;
  address: string;
  country: string;
  contact: string;
  email: string;
  website: string;
}

interface WarrantyState {
  available: boolean;
  duration: string;
  unit: "days" | "months" | "years";
  type:
  | "Manufacturer Warranty"
  | "Seller Warranty"
  | "Brand Warranty"
  | "No Warranty";
  description: string;
  terms: string;
}

interface ReturnPolicyState {
  eligible: boolean;
  returnWindow: string;
  returnWindowUnit: "days" | "months";
  replacementAvailable: boolean;
  refundAvailable: boolean;
  conditions: string;
  description: string;
}

interface AttributesState {
  color: string;
  size: string;
  material: string;
  weightValue: string;
  weightUnit: "g" | "kg" | "mg" | "lb";
  length: string;
  width: string;
  height: string;
  dimUnit: "cm" | "mm" | "m" | "inch";
}

interface ProductImageItem {
  public_id?: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formatImageUrl = (image: string | ProductImageItem | undefined): string => {
  if (!image) return "";
  const rawUrl = typeof image === "string" ? image : image.url;
  if (!rawUrl) return "";
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("data:")) {
    return rawUrl;
  }
  const cleanPath = rawUrl.replace(/\\/g, "/");
  const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${API_BASE_URL}${formattedPath}`;
};

const fetchImageAsFile = async (url: string, filename: string): Promise<File | null> => {
  if (!url) return null;

  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const type = blob.type || "image/jpeg";
      return new File([blob], filename, { type });
    }
  } catch (err) {
    console.warn("Direct image fetch failed, trying Image Canvas fallback:", err);
  }

  return new Promise<File | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 400;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(null);
            const type = blob.type || "image/jpeg";
            resolve(new File([blob], filename, { type }));
          },
          "image/jpeg",
          0.95
        );
      } catch (e) {
        console.warn("Canvas toBlob failed:", e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

const EditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("0");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Manufacturer
  const [manufacturer, setManufacturer] = useState<ManufacturerState>({
    name: "",
    address: "",
    country: "",
    contact: "",
    email: "",
    website: "",
  });

  // Warranty
  const [warranty, setWarranty] = useState<WarrantyState>({
    available: false,
    duration: "",
    unit: "months",
    type: "No Warranty",
    description: "",
    terms: "",
  });

  // Return Policy
  const [returnPolicy, setReturnPolicy] = useState<ReturnPolicyState>({
    eligible: false,
    returnWindow: "",
    returnWindowUnit: "days",
    replacementAvailable: false,
    refundAvailable: false,
    conditions: "",
    description: "",
  });

  // Attributes
  const [attributes, setAttributes] = useState<AttributesState>({
    color: "",
    size: "",
    material: "",
    weightValue: "",
    weightUnit: "g",
    length: "",
    width: "",
    height: "",
    dimUnit: "cm",
  });

  // Images
  const [existingImages, setExistingImages] = useState<ProductImageItem[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // 1. Fetch Product details from possible endpoints
        let productResponse: Response | null = null;
        const productEndpoints = [
          `${API_BASE_URL}/api/admin/product/${productId}`,
          `${API_BASE_URL}/api/products/${productId}`,
          `${API_BASE_URL}/api/product/${productId}`,
          `${API_BASE_URL}/api/admin/products/${productId}`,
        ];

        for (const endpoint of productEndpoints) {
          try {
            const res = await fetch(endpoint, { headers, credentials: "include" });
            if (res.ok) {
              productResponse = res;
              break;
            }
          } catch (err) {
            console.warn(`Failed fetching product from ${endpoint}:`, err);
          }
        }

        if (!productResponse) {
          throw new Error("Product not found or failed to fetch product data from server.");
        }

        const productData = await productResponse.json();

        // 2. Fetch Categories list
        const categoryEndpoints = [
          `${API_BASE_URL}/api/admin/categories/all`,
          `${API_BASE_URL}/api/categories`,
          `${API_BASE_URL}/api/admin/categories`,
        ];

        for (const endpoint of categoryEndpoints) {
          try {
            const res = await fetch(endpoint, { headers, credentials: "include" });
            if (res.ok) {
              const categoryData = await res.json();
              const catList =
                categoryData.data?.categories ||
                categoryData.data ||
                categoryData.categories ||
                (Array.isArray(categoryData) ? categoryData : []);
              if (Array.isArray(catList)) {
                setCategories(catList);
                break;
              }
            }
          } catch (err) {
            console.warn(`Failed fetching categories from ${endpoint}:`, err);
          }
        }

        // 3. Extract Product object safely
        const rawData = productData.data || productData.product || productData;
        const prod =
          Array.isArray(rawData)
            ? rawData[0]
            : rawData && typeof rawData === "object" && rawData.product
              ? rawData.product
              : rawData;

        if (!prod || typeof prod !== "object") {
          throw new Error("Invalid product data received from backend.");
        }

        setName(prod.name || "");
        setShortDescription(
          prod.short_description || prod.shortDescription || prod.description || ""
        );
        setFullDescription(
          prod.full_description ||
          prod.fullDescription ||
          prod.long_description ||
          prod.longDescription ||
          prod.details ||
          prod.content ||
          prod.body ||
          ""
        );

        let parsedHighlights: string[] = [""];
        if (Array.isArray(prod.highlights) && prod.highlights.length > 0) {
          parsedHighlights = prod.highlights;
        } else if (typeof prod.highlights === "string") {
          try {
            const jsonH = JSON.parse(prod.highlights);
            if (Array.isArray(jsonH) && jsonH.length > 0) {
              parsedHighlights = jsonH;
            }
          } catch {
            parsedHighlights = [prod.highlights];
          }
        }
        setHighlights(parsedHighlights);

        const catId =
          typeof prod.category === "object" && prod.category !== null
            ? prod.category._id || prod.category.id
            : String(prod.category || "");
        setCategory(catId);

        const subCatId =
          typeof prod.subcategory === "object" && prod.subcategory !== null
            ? prod.subcategory._id || prod.subcategory.id
            : String(prod.subcategory || "");
        setSubcategory(subCatId);

        setBrand(prod.brand || "");
        setPrice(
          prod.price !== undefined && prod.price !== null ? String(prod.price) : ""
        );
        setSalePrice(
          prod.salePrice !== undefined && prod.salePrice !== null
            ? String(prod.salePrice)
            : ""
        );
        setSku(prod.sku || "");
        setStock(
          prod.stock !== undefined && prod.stock !== null ? String(prod.stock) : "0"
        );

        if (prod.manufacturer) {
          const m =
            typeof prod.manufacturer === "string"
              ? (() => {
                try {
                  return JSON.parse(prod.manufacturer);
                } catch {
                  return {};
                }
              })()
              : prod.manufacturer;

          setManufacturer({
            name: m?.name || "",
            address: m?.address || "",
            country: m?.country || "",
            contact: m?.contact || "",
            email: m?.email || "",
            website: m?.website || "",
          });
        }

        if (prod.warranty) {
          const w =
            typeof prod.warranty === "string"
              ? (() => {
                try {
                  return JSON.parse(prod.warranty);
                } catch {
                  return {};
                }
              })()
              : prod.warranty;

          setWarranty({
            available: Boolean(w?.available),
            duration: w?.duration ? String(w.duration) : "",
            unit: w?.unit || "months",
            type: w?.type || "No Warranty",
            description: w?.description || "",
            terms: w?.terms || "",
          });
        }

        if (prod.returnPolicy) {
          const r =
            typeof prod.returnPolicy === "string"
              ? (() => {
                try {
                  return JSON.parse(prod.returnPolicy);
                } catch {
                  return {};
                }
              })()
              : prod.returnPolicy;

          setReturnPolicy({
            eligible: Boolean(r?.eligible),
            returnWindow: r?.returnWindow ? String(r.returnWindow) : "",
            returnWindowUnit: r?.returnWindowUnit || "days",
            replacementAvailable: Boolean(r?.replacementAvailable),
            refundAvailable: Boolean(r?.refundAvailable),
            conditions: r?.conditions || "",
            description: r?.description || "",
          });
        }

        if (prod.attributes) {
          const a =
            typeof prod.attributes === "string"
              ? (() => {
                try {
                  return JSON.parse(prod.attributes);
                } catch {
                  return {};
                }
              })()
              : prod.attributes;

          setAttributes({
            color: a?.color || "",
            size: a?.size || "",
            material: a?.material || "",
            weightValue: a?.weight?.value ? String(a.weight.value) : "",
            weightUnit: a?.weight?.unit || "g",
            length: a?.dimensions?.length ? String(a.dimensions.length) : "",
            width: a?.dimensions?.width ? String(a.dimensions.width) : "",
            height: a?.dimensions?.height ? String(a.dimensions.height) : "",
            dimUnit: a?.dimensions?.unit || "cm",
          });
        }

        setIsFeatured(Boolean(prod.isFeatured));
        setIsActive(prod.isActive !== false);

        const rawImages = prod.images || [];
        const formattedImgList: ProductImageItem[] = Array.isArray(rawImages)
          ? rawImages.map((img: any, i: number) =>
            typeof img === "string"
              ? { public_id: `img_${i}`, url: img }
              : {
                public_id: img.public_id || img._id || img.url || `img_${i}`,
                url: img.url || img.path || img.secure_url || "",
                alt: img.alt || prod.name,
                isPrimary: Boolean(img.isPrimary || i === 0),
              }
          )
          : [];
        setExistingImages(formattedImgList);
      } catch (err) {
        console.error("Load Product Edit Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);

  // Main categories (no parent)
  const mainCategories = categories.filter(
    (c) =>
      !c.parent ||
      c.parent === "" ||
      c.parent === null ||
      (typeof c.parent === "object" && !(c.parent as any)._id && !(c.parent as any).id)
  );

  // Subcategories matching selected category
  const availableSubcategories = categories.filter((c) => {
    if (!c.parent || !category) return false;
    if (typeof c.parent === "object" && c.parent !== null) {
      return (
        (c.parent as any)._id === category ||
        (c.parent as any).id === category
      );
    }
    return String(c.parent) === String(category);
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentTotal = existingImages.length + newImages.length;
    const remainingSlots = Math.max(0, 5 - currentTotal);
    if (remainingSlots <= 0) {
      setError("Maximum 5 images allowed in total.");
      e.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const newPreviews = filesToUpload.map((file) => URL.createObjectURL(file));

    setNewImages((prev) => [...prev, ...filesToUpload]);
    setNewImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleHighlightChange = (index: number, val: string) => {
    setHighlights((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const addHighlightField = () => {
    setHighlights((prev) => [...prev, ""]);
  };

  const removeHighlightField = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!shortDescription.trim()) {
      setError("Short description is required.");
      return;
    }

    if (!fullDescription.trim()) {
      setError("Full description is required.");
      return;
    }

    if (!category) {
      setError("Please select a Category.");
      return;
    }

    if (availableSubcategories.length > 0 && !subcategory) {
      setError("Please select a Subcategory.");
      return;
    }

    if (!brand.trim()) {
      setError("Brand is required.");
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Valid product price is required.");
      return;
    }

    if (salePrice && Number(salePrice) > Number(price)) {
      setError("Sale price cannot be greater than regular price.");
      return;
    }

    if (!sku.trim()) {
      setError("SKU is required.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      // Construct FormData for multipart/form-data request (req.files)
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("short_description", shortDescription.trim());
      formData.append("full_description", fullDescription.trim());
      formData.append("category", category);
      formData.append("subcategory", subcategory);
      formData.append("brand", brand.trim());
      formData.append("price", String(price));
      if (salePrice) {
        formData.append("salePrice", String(salePrice));
      }
      formData.append("sku", sku.trim().toUpperCase());
      formData.append("stock", String(stock || 0));
      formData.append("isFeatured", String(isFeatured));
      formData.append("isActive", String(isActive));

      formData.append("highlights", JSON.stringify(highlights.filter((h) => h.trim().length > 0)));
      formData.append("manufacturer", JSON.stringify({
        name: manufacturer.name.trim(),
        address: manufacturer.address.trim(),
        country: manufacturer.country.trim(),
        contact: manufacturer.contact.trim(),
        email: manufacturer.email.trim(),
        website: manufacturer.website.trim(),
      }));
      if (warranty.available) {
        formData.append("warranty", JSON.stringify({
          available: warranty.available,
          duration: warranty.duration ? Number(warranty.duration) : null,
          unit: warranty.unit,
          type: warranty.type,
          description: warranty.description.trim(),
          terms: warranty.terms.trim(),
        }));
      }

      if (returnPolicy.eligible) {
        formData.append("returnPolicy", JSON.stringify({
          eligible: returnPolicy.eligible,
          returnWindow: returnPolicy.returnWindow ? Number(returnPolicy.returnWindow) : null,
          returnWindowUnit: returnPolicy.returnWindowUnit,
          replacementAvailable: returnPolicy.replacementAvailable,
          refundAvailable: returnPolicy.refundAvailable,
          conditions: returnPolicy.conditions.trim(),
          description: returnPolicy.description.trim(),
        }));
      }
      formData.append("attributes", JSON.stringify({
        color: attributes.color.trim(),
        size: attributes.size.trim(),
        material: attributes.material.trim(),
        weight: {
          value: attributes.weightValue ? Number(attributes.weightValue) : null,
          unit: attributes.weightUnit,
        },
        dimensions: {
          length: attributes.length ? Number(attributes.length) : null,
          width: attributes.width ? Number(attributes.width) : null,
          height: attributes.height ? Number(attributes.height) : null,
          unit: attributes.dimUnit,
        },
      }));
      formData.append("existingImages", JSON.stringify(existingImages));

      // Convert existing unremoved images to binary File objects so req.files on backend receives ALL files (old + new)
      for (let i = 0; i < existingImages.length; i++) {
        const img = existingImages[i];
        const imgUrl = formatImageUrl(img);
        if (imgUrl) {
          const file = await fetchImageAsFile(imgUrl, `existing_image_${i + 1}.jpg`);
          if (file) {
            formData.append("images", file);
          }
        }
      }

      // Append newly selected binary files for multer middleware under 'images' field (populates req.files)
      newImages.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch(
        `${API_BASE_URL}/api/admin/product/${productId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update product");
      }

      setSuccess("Product updated successfully!");
      setTimeout(() => {
        navigate("/admin/products");
      }, 1200);
    } catch (err) {
      console.error("Update Product Error:", err);
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-product-page">
        <div className="edit-product-loading">
          <Loader2 size={24} className="spin" />
          <span>Loading product details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-product-page">
      {/* Header */}
      <div className="edit-product-header">
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate("/admin/products")}
        >
          <ArrowLeft size={16} />
          Back to Products
        </button>

        <h2>Edit Product</h2>
      </div>

      {/* Alerts */}
      {error && <div className="edit-alert edit-alert-error">{error}</div>}
      {success && <div className="edit-alert edit-alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="edit-product-form">
        <div className="edit-form-main">
          {/* Basic Info */}
          <div className="edit-card">
            <h3 className="edit-card-title">Basic Information</h3>

            <div className="edit-group">
              <label htmlFor="edit-name">Product Name *</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="edit-group">
              <label htmlFor="edit-short-desc">Short Description *</label>
              <textarea
                id="edit-short-desc"
                maxLength={500}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                required
              />
            </div>

            <div className="edit-group">
              <label htmlFor="edit-full-desc">Full Description (HTML) *</label>
              <textarea
                id="edit-full-desc"
                rows={6}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Highlights */}
          <div className="edit-card">
            <h3 className="edit-card-title">Product Highlights</h3>
            {highlights.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder={`Highlight bullet #${index + 1}`}
                  value={item}
                  onChange={(e) => handleHighlightChange(index, e.target.value)}
                  style={{ flex: 1 }}
                />
                {highlights.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHighlightField(index)}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      borderRadius: 6,
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addHighlightField}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "8px 12px",
                borderRadius: 6,
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <Plus size={14} /> Add Highlight
            </button>
          </div>

          {/* Pricing & Stock */}
          <div className="edit-card">
            <h3 className="edit-card-title">Pricing & Stock</h3>

            <div className="edit-row">
              <div className="edit-group">
                <label htmlFor="edit-price">Regular Price (₹) *</label>
                <input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="edit-group">
                <label htmlFor="edit-saleprice">Sale Price (₹)</label>
                <input
                  id="edit-saleprice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
              </div>
            </div>

            <div className="edit-row">
              <div className="edit-group">
                <label htmlFor="edit-sku">SKU *</label>
                <input
                  id="edit-sku"
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="edit-group">
                <label htmlFor="edit-stock">Stock Quantity *</label>
                <input
                  id="edit-stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="edit-card">
            <h3 className="edit-card-title">Product Attributes</h3>

            <div className="edit-row-3">
              <div className="edit-group">
                <label>Color</label>
                <input
                  type="text"
                  value={attributes.color}
                  onChange={(e) =>
                    setAttributes((prev) => ({ ...prev, color: e.target.value }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Size</label>
                <input
                  type="text"
                  value={attributes.size}
                  onChange={(e) =>
                    setAttributes((prev) => ({ ...prev, size: e.target.value }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Material</label>
                <input
                  type="text"
                  value={attributes.material}
                  onChange={(e) =>
                    setAttributes((prev) => ({
                      ...prev,
                      material: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="edit-row">
              <div className="edit-group">
                <label>Weight Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={attributes.weightValue}
                  onChange={(e) =>
                    setAttributes((prev) => ({
                      ...prev,
                      weightValue: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Weight Unit</label>
                <select
                  value={attributes.weightUnit}
                  onChange={(e) =>
                    setAttributes((prev) => ({
                      ...prev,
                      weightUnit: e.target.value as any,
                    }))
                  }
                >
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="mg">Milligrams (mg)</option>
                  <option value="lb">Pounds (lb)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Warranty Details */}
          <div className="edit-card">
            <h3 className="edit-card-title">Warranty Details</h3>

            <label className="edit-toggle" style={{ marginBottom: warranty.available ? 16 : 0 }}>
              <span>Warranty Available</span>
              <input
                type="checkbox"
                checked={warranty.available}
                onChange={(e) =>
                  setWarranty((prev) => ({ ...prev, available: e.target.checked }))
                }
              />
            </label>

            {warranty.available && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                <div className="edit-row">
                  <div className="edit-group">
                    <label>Warranty Type</label>
                    <select
                      value={warranty.type}
                      onChange={(e) =>
                        setWarranty((prev) => ({
                          ...prev,
                          type: e.target.value as any,
                        }))
                      }
                    >
                      <option value="Manufacturer Warranty">Manufacturer Warranty</option>
                      <option value="Seller Warranty">Seller Warranty</option>
                      <option value="Brand Warranty">Brand Warranty</option>
                      <option value="No Warranty">No Warranty</option>
                    </select>
                  </div>

                  <div className="edit-group">
                    <label>Duration & Unit</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 12"
                        value={warranty.duration}
                        onChange={(e) =>
                          setWarranty((prev) => ({
                            ...prev,
                            duration: e.target.value,
                          }))
                        }
                      />
                      <select
                        value={warranty.unit}
                        onChange={(e) =>
                          setWarranty((prev) => ({
                            ...prev,
                            unit: e.target.value as any,
                          }))
                        }
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="edit-group">
                  <label>Warranty Description & Terms</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about what is covered under warranty..."
                    value={warranty.description}
                    onChange={(e) =>
                      setWarranty((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Return Policy */}
          <div className="edit-card">
            <h3 className="edit-card-title">Return Policy</h3>

            <label className="edit-toggle" style={{ marginBottom: returnPolicy.eligible ? 16 : 0 }}>
              <span>Eligible for Return / Replacement</span>
              <input
                type="checkbox"
                checked={returnPolicy.eligible}
                onChange={(e) =>
                  setReturnPolicy((prev) => ({ ...prev, eligible: e.target.checked }))
                }
              />
            </label>

            {returnPolicy.eligible && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                <div className="edit-row">
                  <div className="edit-group">
                    <label>Return Window</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 7 or 30"
                        value={returnPolicy.returnWindow}
                        onChange={(e) =>
                          setReturnPolicy((prev) => ({
                            ...prev,
                            returnWindow: e.target.value,
                          }))
                        }
                      />
                      <select
                        value={returnPolicy.returnWindowUnit}
                        onChange={(e) =>
                          setReturnPolicy((prev) => ({
                            ...prev,
                            returnWindowUnit: e.target.value as any,
                          }))
                        }
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </div>

                  <div className="edit-group">
                    <label>Return Options</label>
                    <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={returnPolicy.refundAvailable}
                          onChange={(e) =>
                            setReturnPolicy((prev) => ({
                              ...prev,
                              refundAvailable: e.target.checked,
                            }))
                          }
                          style={{ width: 16, height: 16, accentColor: "#2563eb" }}
                        />
                        <span>Refund Available</span>
                      </label>

                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={returnPolicy.replacementAvailable}
                          onChange={(e) =>
                            setReturnPolicy((prev) => ({
                              ...prev,
                              replacementAvailable: e.target.checked,
                            }))
                          }
                          style={{ width: 16, height: 16, accentColor: "#2563eb" }}
                        />
                        <span>Replacement Available</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="edit-group">
                  <label>Return Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Unused, in original packaging with all tags intact"
                    value={returnPolicy.conditions}
                    onChange={(e) =>
                      setReturnPolicy((prev) => ({
                        ...prev,
                        conditions: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="edit-group">
                  <label>Policy Description / Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Detailed return terms and process for customers..."
                    value={returnPolicy.description}
                    onChange={(e) =>
                      setReturnPolicy((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Manufacturer Information */}
          <div className="edit-card">
            <h3 className="edit-card-title">Manufacturer Information</h3>

            <div className="edit-row">
              <div className="edit-group">
                <label>Manufacturer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={manufacturer.name}
                  onChange={(e) =>
                    setManufacturer((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Country of Origin</label>
                <input
                  type="text"
                  placeholder="e.g. India"
                  value={manufacturer.country}
                  onChange={(e) =>
                    setManufacturer((prev) => ({ ...prev, country: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="edit-row">
              <div className="edit-group">
                <label>Contact Phone / Hotline</label>
                <input
                  type="text"
                  placeholder="Customer support number"
                  value={manufacturer.contact}
                  onChange={(e) =>
                    setManufacturer((prev) => ({ ...prev, contact: e.target.value }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Support Email</label>
                <input
                  type="email"
                  placeholder="support@company.com"
                  value={manufacturer.email}
                  onChange={(e) =>
                    setManufacturer((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="edit-group">
              <label>Address</label>
              <input
                type="text"
                placeholder="Full address of manufacturer"
                value={manufacturer.address}
                onChange={(e) =>
                  setManufacturer((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="edit-form-sidebar">
          {/* Classification */}
          <div className="edit-card">
            <h3 className="edit-card-title">Classification</h3>

            <div className="edit-group">
              <label htmlFor="edit-category">Main Category *</label>
              <select
                id="edit-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategory("");
                }}
                required
              >
                <option value="">Select Main Category</option>
                {mainCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="edit-group">
              <label htmlFor="edit-subcategory">
                Subcategory {availableSubcategories.length > 0 ? "*" : ""}
              </label>
              <select
                id="edit-subcategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={!category || availableSubcategories.length === 0}
                required={availableSubcategories.length > 0}
              >
                <option value="">
                  {category
                    ? availableSubcategories.length > 0
                      ? "Select Subcategory"
                      : "No Subcategories Available"
                    : "Select Category First"}
                </option>
                {availableSubcategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="edit-group">
              <label htmlFor="edit-brand">Brand *</label>
              <input
                id="edit-brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Product Images */}
          <div className="edit-card">
            <h3 className="edit-card-title">Product Images (Max 5)</h3>

            <label className="edit-image-dropzone">
              <UploadCloud size={24} />
              <span>Choose Device Files</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                hidden
              />
            </label>

            {/* Existing & New Image Grid */}
            <div className="edit-image-grid" style={{ marginTop: 12 }}>
              {existingImages.map((img, i) => (
                <div className="edit-image-item" key={`exist_${i}`}>
                  <img src={formatImageUrl(img)} alt={`Img ${i}`} />
                  <button
                    type="button"
                    className="edit-image-remove"
                    onClick={() => removeExistingImage(i)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {newImagePreviews.map((src, i) => (
                <div className="edit-image-item" key={`new_${i}`}>
                  <img src={src} alt={`New Img ${i}`} />
                  <button
                    type="button"
                    className="edit-image-remove"
                    onClick={() => removeNewImage(i)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="edit-card">
            <h3 className="edit-card-title">Visibility</h3>

            <label className="edit-toggle">
              <span>Active in Store</span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </label>

            <label className="edit-toggle" style={{ marginTop: 8 }}>
              <span>Featured Product</span>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
            </label>
          </div>

          <button
            type="submit"
            className="btn-save"
            disabled={saving}
            style={{ width: "100%" }}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="spin" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;