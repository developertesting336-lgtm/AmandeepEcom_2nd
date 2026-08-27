import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { UploadCloud, X, Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import "./Product.css";

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

interface ProductFormState {
  name: string;
  short_description: string;
  full_description: string;
  highlights: string[];
  category: string;
  subcategory: string;
  brand: string;
  price: string;
  salePrice: string;
  sku: string;
  stock: string;
  manufacturer: ManufacturerState;
  warranty: WarrantyState;
  returnPolicy: ReturnPolicyState;
  attributes: AttributesState;
  isFeatured: boolean;
  isActive: boolean;
}

const INITIAL_STATE: ProductFormState = {
  name: "",
  short_description: "",
  full_description: "",
  highlights: [""],
  category: "",
  subcategory: "",
  brand: "",
  price: "",
  salePrice: "",
  sku: "",
  stock: "0",
  manufacturer: {
    name: "",
    address: "",
    country: "",
    contact: "",
    email: "",
    website: "",
  },
  warranty: {
    available: false,
    duration: "",
    unit: "months",
    type: "No Warranty",
    description: "",
    terms: "",
  },
  returnPolicy: {
    eligible: false,
    returnWindow: "",
    returnWindowUnit: "days",
    replacementAvailable: false,
    refundAvailable: false,
    conditions: "",
    description: "",
  },
  attributes: {
    color: "",
    size: "",
    material: "",
    weightValue: "",
    weightUnit: "g",
    length: "",
    width: "",
    height: "",
    dimUnit: "cm",
  },
  isFeatured: false,
  isActive: true,
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AddProduct = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProductFormState>(INITIAL_STATE);

  // Images state
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setError("");

        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const categoryEndpoints = [
          `${API_BASE}/api/admin/categories/all`,
          `${API_BASE}/api/categories`,
          `${API_BASE}/api/admin/categories`,
        ];

        let fetchedList: Category[] = [];

        for (const endpoint of categoryEndpoints) {
          try {
            const res = await fetch(endpoint, {
              headers,
              credentials: "include",
            });
            if (res.ok) {
              const categoryData = await res.json();
              const catList =
                categoryData.data?.categories ||
                categoryData.data ||
                categoryData.categories ||
                (Array.isArray(categoryData) ? categoryData : []);
              if (Array.isArray(catList) && catList.length > 0) {
                fetchedList = catList;
                break;
              }
            }
          } catch (err) {
            console.warn(`Failed fetching categories from ${endpoint}:`, err);
          }
        }

        setCategories(fetchedList);
      } catch (err) {
        console.error("Fetch Categories Error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load categories."
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const mainCategories = categories.filter(
    (c) =>
      !c.parent ||
      c.parent === "" ||
      c.parent === null ||
      (typeof c.parent === "object" && !(c.parent as any)._id && !(c.parent as any).id)
  );

  const availableSubcategories = categories.filter((c) => {
    if (!c.parent || !form.category) return false;
    if (typeof c.parent === "object" && c.parent !== null) {
      return (
        (c.parent as any)._id === form.category ||
        (c.parent as any).id === form.category
      );
    }
    return String(c.parent) === String(form.category);
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = Math.max(0, 5 - images.length);
    if (remainingSlots <= 0) {
      setError("Maximum 5 images allowed in total.");
      e.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const newPreviews = filesToUpload.map((file) => URL.createObjectURL(file));

    setImages((prev) => [...prev, ...filesToUpload]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleHighlightChange = (index: number, val: string) => {
    setForm((prev) => {
      const updated = [...prev.highlights];
      updated[index] = val;
      return { ...prev, highlights: updated };
    });
  };

  const addHighlightField = () => {
    setForm((prev) => ({ ...prev, highlights: [...prev.highlights, ""] }));
  };

  const removeHighlightField = (index: number) => {
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.short_description.trim()) {
      setError("Short description is required.");
      return;
    }

    if (!form.full_description.trim()) {
      setError("Full description is required.");
      return;
    }

    if (!form.category) {
      setError("Please select a main Category.");
      return;
    }

    if (availableSubcategories.length > 0 && !form.subcategory) {
      setError("Please select a Subcategory.");
      return;
    }

    if (!form.brand.trim()) {
      setError("Brand name is required.");
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      setError("Valid product price is required.");
      return;
    }

    if (
      form.salePrice &&
      Number(form.salePrice) > Number(form.price)
    ) {
      setError("Sale price cannot be greater than regular price.");
      return;
    }

    if (!form.sku.trim()) {
      setError("SKU is required.");
      return;
    }

    try {
      setSubmitting(true);

      const formattedHighlights = form.highlights.filter(
        (h) => h.trim().length > 0
      );


      const productPayload = {
        name: form.name.trim(),
        short_description: form.short_description.trim(),
        full_description: form.full_description.trim(),
        highlights: formattedHighlights,
        category: form.category,
        subcategory: form.subcategory,
        brand: form.brand.trim(),
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        sku: form.sku.trim().toUpperCase(),
        stock: Number(form.stock || 0),
        manufacturer: {
          name: form.manufacturer.name.trim(),
          address: form.manufacturer.address.trim(),
          country: form.manufacturer.country.trim(),
          contact: form.manufacturer.contact.trim(),
          email: form.manufacturer.email.trim(),
          website: form.manufacturer.website.trim(),
        },
        warranty: {
          available: form.warranty.available,
          duration: form.warranty.duration
            ? Number(form.warranty.duration)
            : null,
          unit: form.warranty.unit,
          type: form.warranty.type,
          description: form.warranty.description.trim(),
          terms: form.warranty.terms.trim(),
        },
        returnPolicy: {
          eligible: form.returnPolicy.eligible,
          returnWindow: form.returnPolicy.returnWindow
            ? Number(form.returnPolicy.returnWindow)
            : null,
          returnWindowUnit: form.returnPolicy.returnWindowUnit,
          replacementAvailable: form.returnPolicy.replacementAvailable,
          refundAvailable: form.returnPolicy.refundAvailable,
          conditions: form.returnPolicy.conditions.trim(),
          description: form.returnPolicy.description.trim(),
        },
        attributes: {
          color: form.attributes.color.trim(),
          size: form.attributes.size.trim(),
          material: form.attributes.material.trim(),
          weight: {
            value: form.attributes.weightValue
              ? Number(form.attributes.weightValue)
              : null,
            unit: form.attributes.weightUnit,
          },
          dimensions: {
            length: form.attributes.length
              ? Number(form.attributes.length)
              : null,
            width: form.attributes.width ? Number(form.attributes.width) : null,
            height: form.attributes.height
              ? Number(form.attributes.height)
              : null,
            unit: form.attributes.dimUnit,
          },
        },
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      };

      // Construct FormData for multipart/form-data request (req.files)
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("short_description", form.short_description.trim());
      formData.append("full_description", form.full_description.trim());
      formData.append("category", form.category);
      formData.append("subcategory", form.subcategory);
      formData.append("brand", form.brand.trim());
      formData.append("price", String(form.price));
      if (form.salePrice) {
        formData.append("salePrice", String(form.salePrice));
      }
      formData.append("sku", form.sku.trim().toUpperCase());
      formData.append("stock", String(form.stock || 0));
      formData.append("isFeatured", String(form.isFeatured));
      formData.append("isActive", String(form.isActive));

      formData.append("highlights", JSON.stringify(formattedHighlights));
      formData.append("manufacturer", JSON.stringify(productPayload.manufacturer));
      if (form.warranty.available) {
        formData.append("warranty", JSON.stringify(productPayload.warranty));
      }
      if (form.returnPolicy.eligible) {
        formData.append("returnPolicy", JSON.stringify(productPayload.returnPolicy));
      }
      formData.append("attributes", JSON.stringify(productPayload.attributes));

      // Append each raw file to "images" field so Express multer parses req.files
      images.forEach((file) => {
        formData.append("images", file);
      });

      let res = await fetch(`${API_BASE}/api/admin/add/product`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
      });

      // Fallback try to /api/admin/add/products
      if (!res.ok) {
        res = await fetch(`${API_BASE}/api/admin/add/product`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: formData,
        });
      }

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to create product.");
      }

      setSuccess("Product created successfully!");
      setForm(INITIAL_STATE);
      setImages([]);
      setPreviews([]);

      setTimeout(() => {
        navigate("/admin/products");
      }, 1500);
    } catch (err) {
      console.error("Create Product Error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create product."
      );
    } finally {
      setSubmitting(false);
    }

    console.log(images)
  };

  return (
    <div className="add-product-page">
      {/* Header */}
      <div className="add-product-header">
        <div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate("/admin/products")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12 }}
          >
            <ArrowLeft size={16} />
            Back to Products
          </button>
          <h1 className="add-product-title">Add New Product</h1>
          <p className="add-product-subtitle">
            Fill in complete details according to the official product catalog structure.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="form-alert form-alert-error">{error}</div>}
      {success && <div className="form-alert form-alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="add-product-form">
        <div className="form-main">
          {/* Basic Info */}
          <div className="form-card">
            <h2 className="form-card-title">Basic Information</h2>

            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Wireless Noise-Canceling Headphones"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="short_description">Short Description *</label>
              <textarea
                id="short_description"
                name="short_description"
                placeholder="Brief summary of the product (max 500 characters)..."
                maxLength={500}
                value={form.short_description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    short_description: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="full_description">Full Description (Rich HTML) *</label>
              <textarea
                id="full_description"
                name="full_description"
                placeholder="Detailed description, specifications, HTML content..."
                rows={6}
                value={form.full_description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    full_description: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          {/* Highlights */}
          <div className="form-card">
            <h2 className="form-card-title">Product Highlights</h2>
            {form.highlights.map((item, index) => (
              <div key={index} className="highlight-input-row">
                <input
                  type="text"
                  placeholder={`Highlight bullet #${index + 1}...`}
                  value={item}
                  onChange={(e) =>
                    handleHighlightChange(index, e.target.value)
                  }
                />
                {form.highlights.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-highlight"
                    onClick={() => removeHighlightField(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn-add-highlight"
              onClick={addHighlightField}
            >
              <Plus size={14} /> Add Highlight Bullet
            </button>
          </div>

          {/* Pricing & Inventory */}
          <div className="form-card">
            <h2 className="form-card-title">Pricing & Inventory</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Regular Price (₹) *</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="salePrice">Sale Price (₹)</label>
                <input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Leave empty if no discount"
                  value={form.salePrice}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, salePrice: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sku">SKU *</label>
                <input
                  id="sku"
                  type="text"
                  placeholder="e.g. ELEC-HP-001"
                  value={form.sku}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sku: e.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock Quantity *</label>
                <input
                  id="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, stock: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Product Attributes */}
          <div className="form-card">
            <h2 className="form-card-title">Product Attributes</h2>

            <div className="form-row-3">
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  placeholder="e.g. Matte Black"
                  value={form.attributes.color}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: {
                        ...prev.attributes,
                        color: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Size</label>
                <input
                  type="text"
                  placeholder="e.g. Medium / XL / 10"
                  value={form.attributes.size}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: {
                        ...prev.attributes,
                        size: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Material</label>
                <input
                  type="text"
                  placeholder="e.g. Aluminum / Leather"
                  value={form.attributes.material}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: {
                        ...prev.attributes,
                        material: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-section-title">Weight</div>
            <div className="form-row">
              <div className="form-group">
                <label>Weight Value</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 250"
                  value={form.attributes.weightValue}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: {
                        ...prev.attributes,
                        weightValue: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Weight Unit</label>
                <select
                  value={form.attributes.weightUnit}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: {
                        ...prev.attributes,
                        weightUnit: e.target.value as any,
                      },
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

            <div className="form-section-title">Dimensions</div>
            <div className="form-row-3">
              <div className="form-group">
                <label>Length</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Length"
                  value={form.attributes.length}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: {
                        ...prev.attributes,
                        length: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Width</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Width"
                  value={form.attributes.width}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: {
                        ...prev.attributes,
                        width: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Height</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Height"
                  value={form.attributes.height}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: {
                        ...prev.attributes,
                        height: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 10 }}>
              <label>Dimension Unit</label>
              <select
                value={form.attributes.dimUnit}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    attributes: {
                      ...prev.attributes,
                      dimUnit: e.target.value as any,
                    },
                  }))
                }
              >
                <option value="cm">Centimeters (cm)</option>
                <option value="mm">Millimeters (mm)</option>
                <option value="m">Meters (m)</option>
                <option value="inch">Inches (inch)</option>
              </select>
            </div>
          </div>

          {/* Warranty & Return Policy */}
          <div className="form-card">
            <h2 className="form-card-title">Warranty & Return Policy</h2>

            <div className="form-section-title">Warranty</div>
            <div className="form-group">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.warranty.available}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      warranty: {
                        ...prev.warranty,
                        available: e.target.checked,
                      },
                    }))
                  }
                />
                Warranty Available
              </label>
            </div>

            {form.warranty.available && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Warranty Type</label>
                    <select
                      value={form.warranty.type}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          warranty: {
                            ...prev.warranty,
                            type: e.target.value as any,
                          },
                        }))
                      }
                    >
                      <option value="Manufacturer Warranty">
                        Manufacturer Warranty
                      </option>
                      <option value="Seller Warranty">Seller Warranty</option>
                      <option value="Brand Warranty">Brand Warranty</option>
                      <option value="No Warranty">No Warranty</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 12"
                        value={form.warranty.duration}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            warranty: {
                              ...prev.warranty,
                              duration: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Unit</label>
                      <select
                        value={form.warranty.unit}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            warranty: {
                              ...prev.warranty,
                              unit: e.target.value as any,
                            },
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

                <div className="form-group">
                  <label>Warranty Description & Terms</label>
                  <input
                    type="text"
                    placeholder="Short summary of what warranty covers..."
                    value={form.warranty.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        warranty: {
                          ...prev.warranty,
                          description: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </>
            )}

            <div className="form-section-title" style={{ marginTop: 20 }}>
              Return Policy
            </div>
            <div className="form-group">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.returnPolicy.eligible}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      returnPolicy: {
                        ...prev.returnPolicy,
                        eligible: e.target.checked,
                      },
                    }))
                  }
                />
                Eligible for Returns
              </label>
            </div>

            {form.returnPolicy.eligible && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Return Window</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 7 or 14"
                      value={form.returnPolicy.returnWindow}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          returnPolicy: {
                            ...prev.returnPolicy,
                            returnWindow: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Return Unit</label>
                    <select
                      value={form.returnPolicy.returnWindowUnit}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          returnPolicy: {
                            ...prev.returnPolicy,
                            returnWindowUnit: e.target.value as any,
                          },
                        }))
                      }
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.returnPolicy.replacementAvailable}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          returnPolicy: {
                            ...prev.returnPolicy,
                            replacementAvailable: e.target.checked,
                          },
                        }))
                      }
                    />
                    Replacement Available
                  </label>

                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.returnPolicy.refundAvailable}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          returnPolicy: {
                            ...prev.returnPolicy,
                            refundAvailable: e.target.checked,
                          },
                        }))
                      }
                    />
                    Refund Available
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Manufacturer Details */}
          <div className="form-card">
            <h2 className="form-card-title">Manufacturer Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Manufacturer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sony Corporation"
                  value={form.manufacturer.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      manufacturer: {
                        ...prev.manufacturer,
                        name: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Country of Origin</label>
                <input
                  type="text"
                  placeholder="e.g. Japan"
                  value={form.manufacturer.country}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      manufacturer: {
                        ...prev.manufacturer,
                        country: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+1 (800) 555-0199"
                  value={form.manufacturer.contact}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      manufacturer: {
                        ...prev.manufacturer,
                        contact: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  placeholder="support@manufacturer.com"
                  value={form.manufacturer.email}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      manufacturer: {
                        ...prev.manufacturer,
                        email: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="form-sidebar">
          {/* Category, Subcategory & Brand */}
          <div className="form-card">
            <h2 className="form-card-title">Classification</h2>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                    subcategory: "",
                  }))
                }
                disabled={loadingCategories}
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

            <div className="form-group">
              <label htmlFor="subcategory">
                Subcategory {availableSubcategories.length > 0 ? "*" : ""}
              </label>
              <select
                id="subcategory"
                name="subcategory"
                value={form.subcategory}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    subcategory: e.target.value,
                  }))
                }
                disabled={!form.category || availableSubcategories.length === 0}
                required={availableSubcategories.length > 0}
              >
                <option value="">
                  {form.category
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

            <div className="form-group">
              <label htmlFor="brand">Brand *</label>
              <input
                id="brand"
                name="brand"
                type="text"
                placeholder="e.g. Sony, Apple, Nike..."
                value={form.brand}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, brand: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {/* Product Images */}
          <div className="form-card">
            <h2 className="form-card-title">Product Images (Max 5)</h2>

            <label className="image-dropzone">
              <UploadCloud size={24} />
              <span>Choose Device Files</span>
              <small>PNG, JPG up to 5MB each</small>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                hidden
              />
            </label>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="image-preview-grid">
                {previews.map((src, i) => (
                  <div className="image-preview" key={`file_${i}`}>
                    <img src={src} alt={`File ${i}`} />
                    {i === 0 && <span className="primary-badge">Primary</span>}
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={() => removeImage(i)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status & Options */}
          <div className="form-card">
            <h2 className="form-card-title">Visibility & Status</h2>

            <label className="toggle-row">
              <span>Active (Visible in Store)</span>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </label>

            <label className="toggle-row">
              <span>Featured Product</span>
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isFeatured: e.target.checked,
                  }))
                }
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={submitting}
            style={{ width: "100%" }}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="spin" />
                Saving Product...
              </>
            ) : (
              "Publish Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;