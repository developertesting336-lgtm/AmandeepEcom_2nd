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

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface ProductVariantItem {
  price: string;
  salePrice: string;
  attributes: VariantAttribute[];
  isActive: boolean;
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

interface DetailsState {
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

interface ReferralState {
  isEnabled: boolean;
  discountAmount: string;
  rewardPoints: string;
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
  const formattedPath = cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath;
  return API_BASE_URL + formattedPath;
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

  return new Promise((resolve) => {
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

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariantItem[]>([]);

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

  // Details (Specs)
  const [details, setDetails] = useState<DetailsState>({
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

  // Referral & Rewards
  const [referral, setReferral] = useState<ReferralState>({
    isEnabled: false,
    discountAmount: "0",
    rewardPoints: "0",
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
          headers["Authorization"] = "Bearer " + token;
        }

        let productResponse: Response | null = null;
        const productEndpoints = [
          API_BASE_URL + "/api/admin/product/" + productId,
          API_BASE_URL + "/api/products/" + productId,
          API_BASE_URL + "/api/product/" + productId,
          API_BASE_URL + "/api/admin/products/" + productId,
        ];

        for (const endpoint of productEndpoints) {
          try {
            const res = await fetch(endpoint, { headers, credentials: "include" });
            if (res.ok) {
              productResponse = res;
              break;
            }
          } catch (err) {
            console.warn("Failed fetching product from " + endpoint + ":", err);
          }
        }

        if (!productResponse) {
          throw new Error("Product not found or failed to fetch product data from server.");
        }

        const productData = await productResponse.json();

        const categoryEndpoints = [
          API_BASE_URL + "/api/admin/categories/all",
          API_BASE_URL + "/api/categories",
          API_BASE_URL + "/api/admin/categories",
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
            console.warn("Failed fetching categories from " + endpoint + ":", err);
          }
        }

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

        setHasVariants(Boolean(prod.hasVariants));
        if (Array.isArray(prod.variants) && prod.variants.length > 0) {
          const loadedVariants: ProductVariantItem[] = prod.variants.map((v: any) => ({
            price: v.price !== undefined && v.price !== null ? String(v.price) : "",
            salePrice: v.salePrice !== undefined && v.salePrice !== null ? String(v.salePrice) : "",
            attributes: Array.isArray(v.attributes) && v.attributes.length > 0
              ? v.attributes.map((a: any) => ({
                name: String(a.name || ""),
                value: String(a.value || ""),
              }))
              : [{ name: "", value: "" }],
            isActive: v.isActive !== false,
          }));
          setVariants(loadedVariants);
        } else {
          setVariants([]);
        }

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

        if (prod.details) {
          const d =
            typeof prod.details === "string"
              ? (() => {
                try {
                  return JSON.parse(prod.details);
                } catch {
                  return {};
                }
              })()
              : prod.details;

          setDetails({
            color: d?.color || "",
            size: d?.size || "",
            material: d?.material || "",
            weightValue: d?.weight?.value ? String(d.weight.value) : "",
            weightUnit: d?.weight?.unit || "g",
            length: d?.dimensions?.length ? String(d.dimensions.length) : "",
            width: d?.dimensions?.width ? String(d.dimensions.width) : "",
            height: d?.dimensions?.height ? String(d.dimensions.height) : "",
            dimUnit: d?.dimensions?.unit || "cm",
          });
        }

        if (prod.referral) {
          const r =
            typeof prod.referral === "string"
              ? (() => {
                  try {
                    return JSON.parse(prod.referral);
                  } catch {
                    return {};
                  }
                })()
              : prod.referral;

          setReferral({
            isEnabled: Boolean(r?.isEnabled),
            discountAmount:
              r?.discountAmount !== undefined && r?.discountAmount !== null
                ? String(r.discountAmount)
                : "0",
            rewardPoints:
              r?.rewardPoints !== undefined && r?.rewardPoints !== null
                ? String(r.rewardPoints)
                : "0",
          });
        }

        setIsFeatured(Boolean(prod.isFeatured));
        setIsActive(prod.isActive !== false);

        const rawImages = prod.images || [];
        const formattedImgList: ProductImageItem[] = Array.isArray(rawImages)
          ? rawImages.map((img: any, i: number) =>
            typeof img === "string"
              ? { public_id: "img_" + i, url: img }
              : {
                public_id: img.public_id || img._id || img.url || "img_" + i,
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

  const mainCategories = categories.filter(
    (c) =>
      !c.parent ||
      c.parent === "" ||
      c.parent === null ||
      (typeof c.parent === "object" && !(c.parent as any)._id && !(c.parent as any).id)
  );

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
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;

    const validImageFiles = rawFiles.filter(
      (file) =>
        file.type.startsWith("image/") ||
        /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name)
    );

    if (validImageFiles.length !== rawFiles.length) {
      setError("Some selected files were skipped because they are not valid images.");
    }

    if (!validImageFiles.length) {
      e.target.value = "";
      return;
    }

    const currentTotal = existingImages.length + newImages.length;
    const remainingSlots = Math.max(0, 5 - currentTotal);
    if (remainingSlots <= 0) {
      setError("Maximum 5 images allowed in total.");
      e.target.value = "";
      return;
    }

    const filesToUpload = validImageFiles.slice(0, remainingSlots);
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

  // Variant Handlers
  const handleAddVariant = () => {
    const newVariant: ProductVariantItem = {
      price: price || "",
      salePrice: salePrice || "",
      attributes: [{ name: "", value: "" }],
      isActive: true,
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  const handleRemoveVariant = (vIdx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== vIdx));
  };

  const handleVariantPriceChange = (
    vIdx: number,
    field: "price" | "salePrice",
    val: string
  ) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[vIdx] = { ...updated[vIdx], [field]: val };
      return updated;
    });
  };

  const handleVariantActiveToggle = (vIdx: number, checked: boolean) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[vIdx] = { ...updated[vIdx], isActive: checked };
      return updated;
    });
  };

  const handleVariantAttributeChange = (
    vIdx: number,
    aIdx: number,
    field: "name" | "value",
    val: string
  ) => {
    setVariants((prev) => {
      const updatedVariants = [...prev];
      const updatedAttrs = [...updatedVariants[vIdx].attributes];
      updatedAttrs[aIdx] = { ...updatedAttrs[aIdx], [field]: val };
      updatedVariants[vIdx] = {
        ...updatedVariants[vIdx],
        attributes: updatedAttrs,
      };
      return updatedVariants;
    });
  };

  const handleAddAttributeToVariant = (vIdx: number) => {
    setVariants((prev) => {
      const updatedVariants = [...prev];
      updatedVariants[vIdx] = {
        ...updatedVariants[vIdx],
        attributes: [...updatedVariants[vIdx].attributes, { name: "", value: "" }],
      };
      return updatedVariants;
    });
  };

  const handleRemoveAttributeFromVariant = (vIdx: number, aIdx: number) => {
    setVariants((prev) => {
      const updatedVariants = [...prev];
      const updatedAttrs = updatedVariants[vIdx].attributes.filter(
        (_, i) => i !== aIdx
      );
      updatedVariants[vIdx] = {
        ...updatedVariants[vIdx],
        attributes: updatedAttrs.length > 0 ? updatedAttrs : [{ name: "", value: "" }],
      };
      return updatedVariants;
    });
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
      setError("Valid base product price is required.");
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

    let cleanedVariantsPayload: any[] = [];
    if (hasVariants) {
      if (variants.length === 0) {
        setError("Please add at least one variant or uncheck variants.");
        return;
      }

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const vPrice = Number(v.price);
        if (isNaN(vPrice) || vPrice < 0 || v.price === "") {
          setError("Variant #" + (i + 1) + " must have a valid price.");
          return;
        }

        let vSalePrice = null;
        if (v.salePrice !== "" && v.salePrice !== undefined && v.salePrice !== null) {
          vSalePrice = Number(v.salePrice);
          if (isNaN(vSalePrice) || vSalePrice < 0) {
            setError("Variant #" + (i + 1) + " has an invalid sale price.");
            return;
          }
          if (vSalePrice > vPrice) {
            setError("Variant #" + (i + 1) + " sale price cannot exceed regular price.");
            return;
          }
        }

        const validAttrs = v.attributes.filter(
          (a) => a.name.trim() && a.value.trim()
        );

        if (validAttrs.length === 0) {
          setError("Variant #" + (i + 1) + " must have at least one attribute name and value.");
          return;
        }

        cleanedVariantsPayload.push({
          price: vPrice,
          salePrice: vSalePrice,
          attributes: validAttrs.map((a) => ({
            name: a.name.trim(),
            value: a.value.trim(),
          })),
          isActive: v.isActive,
        });
      }
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");
      const formattedHighlights = highlights.filter((h) => h.trim().length > 0);

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

      formData.append("hasVariants", String(hasVariants));
      if (hasVariants) {
        formData.append("variants", JSON.stringify(cleanedVariantsPayload));
      }

      formData.append("highlights", JSON.stringify(formattedHighlights));
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
      formData.append("details", JSON.stringify({
        size: details.size.trim(),
        material: details.material.trim(),
        weight: {
          value: details.weightValue ? Number(details.weightValue) : null,
          unit: details.weightUnit,
        },
        dimensions: {
          length: details.length ? Number(details.length) : null,
          width: details.width ? Number(details.width) : null,
          height: details.height ? Number(details.height) : null,
          unit: details.dimUnit,
        },
      }));
      formData.append(
        "referral",
        JSON.stringify({
          isEnabled: referral.isEnabled,
          discountAmount: Math.max(0, Number(referral.discountAmount) || 0),
          rewardPoints: Math.max(0, Number(referral.rewardPoints) || 0),
        })
      );
      formData.append("existingImages", JSON.stringify(existingImages));

      for (let i = 0; i < existingImages.length; i++) {
        const img = existingImages[i];
        const imgUrl = formatImageUrl(img);
        if (imgUrl) {
          const file = await fetchImageAsFile(imgUrl, "existing_image_" + (i + 1) + ".jpg");
          if (file) {
            formData.append("images", file);
          }
        }
      }

      newImages.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch(
        API_BASE_URL + "/api/admin/product/" + productId,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + token,
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

      {error && <div className="edit-alert edit-alert-error">{error}</div>}
      {success && <div className="edit-alert edit-alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="edit-product-form">
        <div className="edit-main">
          {/* Basic Info */}
          <div className="edit-card">
            <h3 className="edit-card-title">Basic Information</h3>

            <div className="edit-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
                required
              />
            </div>

            <div className="edit-group">
              <label>Short Description *</label>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief summary..."
                maxLength={500}
                rows={2}
                required
              />
            </div>

            <div className="edit-group">
              <label>Full Description (Rich HTML) *</label>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Detailed specifications, features, HTML..."
                rows={6}
                required
              />
            </div>
          </div>

          {/* Highlights */}
          <div className="edit-card">
            <h3 className="edit-card-title">Product Highlights</h3>

            {highlights.map((item, index) => (
              <div key={index} className="highlight-input-row">
                <input
                  type="text"
                  placeholder={"Highlight bullet #" + (index + 1) + "..."}
                  value={item}
                  onChange={(e) => handleHighlightChange(index, e.target.value)}
                />
                {highlights.length > 1 && (
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

          {/* Base Pricing & Inventory */}
          <div className="edit-card">
            <h3 className="edit-card-title">Pricing & Inventory</h3>

            <div className="edit-row">
              <div className="edit-group">
                <label>{hasVariants ? "Base Price (₹) *" : "Price (₹) *"}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="edit-group">
                <label>{hasVariants ? "Base Sale Price (₹)" : "Sale Price (₹)"}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Leave empty if no discount"
                />
              </div>
            </div>

            <div className="edit-row">
              <div className="edit-group">
                <label>SKU *</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="e.g. ELEC-001"
                  required
                />
              </div>

              <div className="edit-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Product Variants */}
          <div className="edit-card">
            <h3 className="edit-card-title">Product Variants</h3>

            <div className="edit-group">
              <label className="edit-checkbox-label">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) =>
                    setHasVariants(e.target.checked)
                  }
                />
                This product has variants (attribute-based pricing)
              </label>
            </div>

            {hasVariants && (
              <div className="variants-container">
                {variants.map((variant, vIdx) => (
                  <div key={vIdx} className="variant-card-box">
                    <div className="variant-card-topbar">
                      <span className="variant-number-label">
                        Variant #{vIdx + 1}
                      </span>
                      <div className="variant-topbar-right">
                        <label className="edit-checkbox-label" style={{ fontSize: "13px" }}>
                          <input
                            type="checkbox"
                            checked={variant.isActive}
                            onChange={(e) =>
                              handleVariantActiveToggle(vIdx, e.target.checked)
                            }
                          />
                          Active
                        </label>
                        <button
                          type="button"
                          className="btn-clear-variant"
                          onClick={() => handleRemoveVariant(vIdx)}
                          title="Remove variant"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Variant Attributes */}
                    <div className="variant-attributes-block">
                      <label className="variant-subheading">Attributes</label>
                      {variant.attributes.map((attr, aIdx) => (
                        <div key={aIdx} className="variant-attr-input-line">
                          <input
                            type="text"
                            placeholder="Attribute (e.g. Storage, Color)"
                            value={attr.name}
                            onChange={(e) =>
                              handleVariantAttributeChange(
                                vIdx,
                                aIdx,
                                "name",
                                e.target.value
                              )
                            }
                            required
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. 256 GB, Red)"
                            value={attr.value}
                            onChange={(e) =>
                              handleVariantAttributeChange(
                                vIdx,
                                aIdx,
                                "value",
                                e.target.value
                              )
                            }
                            required
                          />
                          {variant.attributes.length > 1 && (
                            <button
                              type="button"
                              className="btn-clear-attr"
                              onClick={() =>
                                handleRemoveAttributeFromVariant(vIdx, aIdx)
                              }
                              title="Remove attribute"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        className="btn-add-attr-link"
                        onClick={() => handleAddAttributeToVariant(vIdx)}
                      >
                        <Plus size={13} /> Add another attribute to this variant
                      </button>
                    </div>

                    {/* Variant Pricing */}
                    <div className="edit-row" style={{ marginTop: 10 }}>
                      <div className="edit-group">
                        <label>Variant Price (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={variant.price}
                          onChange={(e) =>
                            handleVariantPriceChange(
                              vIdx,
                              "price",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div className="edit-group">
                        <label>Variant Sale Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Leave empty if none"
                          value={variant.salePrice}
                          onChange={(e) =>
                            handleVariantPriceChange(
                              vIdx,
                              "salePrice",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn-add-highlight"
                  onClick={handleAddVariant}
                  style={{ marginTop: 8 }}
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>
            )}
          </div>

          {/* Physical Details & Specs */}
          <div className="edit-card">
            <h3 className="edit-card-title">Product details</h3>

            <div className="edit-row-3">
              <div className="edit-group">
                <label>Size</label>
                <input
                  type="text"
                  placeholder="e.g. Medium / XL / 6.1 inch"
                  value={details.size}
                  onChange={(e) =>
                    setDetails((prev) => ({ ...prev, size: e.target.value }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Material</label>
                <input
                  type="text"
                  placeholder="e.g. Aluminum / Titanium / Leather"
                  value={details.material}
                  onChange={(e) =>
                    setDetails((prev) => ({
                      ...prev,
                      material: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="edit-section-title">Weight</div>
            <div className="edit-row">
              <div className="edit-group">
                <label>Weight Value</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 250"
                  value={details.weightValue}
                  onChange={(e) =>
                    setDetails((prev) => ({
                      ...prev,
                      weightValue: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Weight Unit</label>
                <select
                  value={details.weightUnit}
                  onChange={(e) =>
                    setDetails((prev) => ({
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

            <div className="edit-section-title">Dimensions</div>
            <div className="edit-row-3">
              <div className="edit-group">
                <label>Length</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Length"
                  value={details.length}
                  onChange={(e) =>
                    setDetails((prev) => ({
                      ...prev,
                      length: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Width</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Width"
                  value={details.width}
                  onChange={(e) =>
                    setDetails((prev) => ({
                      ...prev,
                      width: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Height</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Height"
                  value={details.height}
                  onChange={(e) =>
                    setDetails((prev) => ({
                      ...prev,
                      height: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="edit-group" style={{ marginTop: 10 }}>
              <label>Dimension Unit</label>
              <select
                value={details.dimUnit}
                onChange={(e) =>
                  setDetails((prev) => ({
                    ...prev,
                    dimUnit: e.target.value as any,
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
          <div className="edit-card">
            <h3 className="edit-card-title">Warranty & Return Policy</h3>

            <div className="edit-section-title">Warranty</div>
            <div className="edit-group">
              <label className="edit-checkbox-label">
                <input
                  type="checkbox"
                  checked={warranty.available}
                  onChange={(e) =>
                    setWarranty((prev) => ({
                      ...prev,
                      available: e.target.checked,
                    }))
                  }
                />
                Warranty Available
              </label>
            </div>

            {warranty.available && (
              <>
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
                      <option value="Manufacturer Warranty">
                        Manufacturer Warranty
                      </option>
                      <option value="Seller Warranty">Seller Warranty</option>
                      <option value="Brand Warranty">Brand Warranty</option>
                      <option value="No Warranty">No Warranty</option>
                    </select>
                  </div>

                  <div className="edit-group">
                    <label>Duration</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 12"
                      value={warranty.duration}
                      onChange={(e) =>
                        setWarranty((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="edit-group">
                    <label>Unit</label>
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

                <div className="edit-group">
                  <label>Warranty Description</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Year Official Brand Warranty"
                    value={warranty.description}
                    onChange={(e) =>
                      setWarranty((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="edit-group">
                  <label>Warranty Terms</label>
                  <textarea
                    rows={2}
                    placeholder="Covers manufacturing defects only..."
                    value={warranty.terms}
                    onChange={(e) =>
                      setWarranty((prev) => ({
                        ...prev,
                        terms: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}

            <div className="edit-section-title" style={{ marginTop: 20 }}>
              Return Policy
            </div>
            <div className="edit-group">
              <label className="edit-checkbox-label">
                <input
                  type="checkbox"
                  checked={returnPolicy.eligible}
                  onChange={(e) =>
                    setReturnPolicy((prev) => ({
                      ...prev,
                      eligible: e.target.checked,
                    }))
                  }
                />
                Eligible for Return / Replacement
              </label>
            </div>

            {returnPolicy.eligible && (
              <>
                <div className="edit-row">
                  <div className="edit-group">
                    <label>Return Window</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 7"
                      value={returnPolicy.returnWindow}
                      onChange={(e) =>
                        setReturnPolicy((prev) => ({
                          ...prev,
                          returnWindow: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="edit-group">
                    <label>Unit</label>
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

                <div className="edit-row">
                  <label className="edit-checkbox-label">
                    <input
                      type="checkbox"
                      checked={returnPolicy.replacementAvailable}
                      onChange={(e) =>
                        setReturnPolicy((prev) => ({
                          ...prev,
                          replacementAvailable: e.target.checked,
                        }))
                      }
                    />
                    Replacement Available
                  </label>

                  <label className="edit-checkbox-label">
                    <input
                      type="checkbox"
                      checked={returnPolicy.refundAvailable}
                      onChange={(e) =>
                        setReturnPolicy((prev) => ({
                          ...prev,
                          refundAvailable: e.target.checked,
                        }))
                      }
                    />
                    Refund Available
                  </label>
                </div>

                <div className="edit-group">
                  <label>Return Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Unused condition with original tags"
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
                  <label>Return Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the return policy..."
                    value={returnPolicy.description}
                    onChange={(e) =>
                      setReturnPolicy((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}
          </div>

          {/* Manufacturer Information */}
          <div className="edit-card">
            <h3 className="edit-card-title">Manufacturer Details</h3>

            <div className="edit-row">
              <div className="edit-group">
                <label>Manufacturer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sony Electronics Ltd."
                  value={manufacturer.name}
                  onChange={(e) =>
                    setManufacturer((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Country of Origin</label>
                <input
                  type="text"
                  placeholder="e.g. Japan / India / USA"
                  value={manufacturer.country}
                  onChange={(e) =>
                    setManufacturer((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="edit-row">
              <div className="edit-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+1 (800) 555-0199"
                  value={manufacturer.contact}
                  onChange={(e) =>
                    setManufacturer((prev) => ({
                      ...prev,
                      contact: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="edit-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  placeholder="support@manufacturer.com"
                  value={manufacturer.email}
                  onChange={(e) =>
                    setManufacturer((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="edit-sidebar">
          {/* Classification */}
          <div className="edit-card">
            <h3 className="edit-card-title">Classification</h3>

            <div className="edit-group">
              <label>Category *</label>
              <select
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
              <label>Subcategory {availableSubcategories.length > 0 ? "*" : ""}</label>
              <select
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
              <label>Brand *</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Sony, Apple, Nike"
                required
              />
            </div>
          </div>

          {/* Images */}
          <div className="edit-card">
            <h3 className="edit-card-title">Product Images (Max 5)</h3>

            <label className="image-dropzone">
              <UploadCloud size={24} />
              <span>Choose Device Files</span>
              <small>PNG, JPG, WebP up to 5MB each</small>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                hidden
              />
            </label>

            {(existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div className="image-preview-grid">
                {existingImages.map((img, i) => (
                  <div className="image-preview" key={"exist_" + i}>
                    <img src={formatImageUrl(img)} alt={img.alt || "Product image"} />
                    {i === 0 && <span className="primary-badge">Primary</span>}
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={() => removeExistingImage(i)}
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {newImagePreviews.map((src, i) => (
                  <div className="image-preview" key={"new_" + i}>
                    <img src={src} alt={"New upload " + (i + 1)} />
                    {existingImages.length === 0 && i === 0 && (
                      <span className="primary-badge">Primary</span>
                    )}
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={() => removeNewImage(i)}
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibility & Status */}
          <div className="edit-card">
            <h3 className="edit-card-title">Visibility & Status</h3>

            <label className="toggle-row">
              <span>Active (Visible in Store)</span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </label>

            <label className="toggle-row">
              <span>Featured Product</span>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </label>
          </div>

          {/* Referral & Rewards Program */}
          <div className="edit-card">
            <h3 className="edit-card-title">Referral & Earn Program</h3>

            <label className="toggle-row">
              <span>Enable Referral Program</span>
              <input
                type="checkbox"
                checked={referral.isEnabled}
                onChange={(e) =>
                  setReferral((prev) => ({
                    ...prev,
                    isEnabled: e.target.checked,
                  }))
                }
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </label>

            {referral.isEnabled && (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="edit-group">
                  <label>Friend Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={referral.discountAmount}
                    onChange={(e) =>
                      setReferral((prev) => ({
                        ...prev,
                        discountAmount: e.target.value,
                      }))
                    }
                  />
                  <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
                    Instant discount the friend receives when purchasing via link.
                  </small>
                </div>

                <div className="edit-group">
                  <label>Referrer Reward Points (1 pt = ₹1)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100"
                    value={referral.rewardPoints}
                    onChange={(e) =>
                      setReferral((prev) => ({
                        ...prev,
                        rewardPoints: e.target.value,
                      }))
                    }
                  />
                  <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
                    Points awarded to user once friend's order is delivered.
                  </small>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={saving}
            style={{ width: "100%" }}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="spin" />
                Saving Changes...
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
