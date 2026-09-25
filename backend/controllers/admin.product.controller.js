
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import uploadBufferToCloudinary from "../utils/uploadToCloudinary.js";
import { trackView } from "../utils/trackView.js";
import mongoose from "mongoose";


export const toggleProductActive = async (req, res) => {
  try {
    const { productID } = req.params;

    const product = await Product.findById(productID);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isActive = !product.isActive;

    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product is now ${product.isActive ? "active" : "inactive"}`,
      data: {
        productId: product._id,
        isActive: product.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle product active status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product active status",
      error: error.message,
    });
  }
};

export const toggleProductFeatured = async (req, res) => {
  try {
    const { productID } = req.params;

    console.log("/toggle/featured hitted", "prodctID", productID)
    // console.log(productID)

    const product = await Product.findById(productID);

    // console.log(product)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isFeatured = !product.isFeatured;

    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product is now ${product.isFeatured ? "featured" : "not featured"
        }`,
      data: {
        productId: product._id,
        isFeatured: product.isFeatured,
      },
    });
  } catch (error) {
    console.error("Toggle product featured status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product featured status",
      error: error.message,
    });
  }
};



export const addProduct = async (req, res) => {
  try {
    const {
      name,
      short_description,
      full_description,
      highlights,
      price,
      salePrice,
      sku,
      stock,
      category,
      subcategory,
      brand,
      manufacturer,
      warranty,
      returnPolicy,
      details,
      hasVariants,
      variants,
      isFeatured,
      isActive,
      referral,
    } = req.body;

    if (
      !name ||
      !short_description ||
      !full_description ||
      price === undefined ||
      !sku ||
      !category ||
      !subcategory ||
      !brand
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, short description, full description, price, SKU, category, subcategory and brand are required",
      });
    }

    const categoryExists = await Category.findOne({
      _id: category,
      parent: null,
      isActive: true,
    });

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive",
      });
    }

    const subcategoryExists = await Category.findOne({
      _id: subcategory,
      parent: category,
      isActive: true,
    });

    if (!subcategoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategory for the selected category",
      });
    }

    const productPrice = Number(price);

    if (isNaN(productPrice) || productPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price",
      });
    }

    let productSalePrice = null;

    if (salePrice !== undefined && salePrice !== "") {
      productSalePrice = Number(salePrice);

      if (isNaN(productSalePrice) || productSalePrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid sale price",
        });
      }

      if (productSalePrice > productPrice) {
        return res.status(400).json({
          success: false,
          message: "Sale price cannot be greater than regular price",
        });
      }
    }

    const productStock =
      stock !== undefined && stock !== ""
        ? Number(stock)
        : 0;

    if (isNaN(productStock) || productStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock value",
      });
    }

    const cleanSku = sku.trim().toUpperCase();

    const existingProduct = await Product.findOne({
      sku: cleanSku,
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product with this SKU already exists",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    const images = [];

    for (const file of req.files) {
      const image = await uploadBufferToCloudinary(
        file.buffer,
        "ecommerce/products"
      );

      images.push(image);
    }

    let parsedHighlights = [];

    if (highlights) {
      if (Array.isArray(highlights)) {
        parsedHighlights = highlights;
      } else {
        try {
          parsedHighlights = JSON.parse(highlights);
        } catch {
          parsedHighlights = [highlights];
        }
      }
    }

    let parsedManufacturer = null;
    let parsedWarranty = null;
    let parsedReturnPolicy = null;
    let parsedDetails = {};
    let parsedVariants = [];
    let parsedReferral = {
      isEnabled: false,
      discountAmount: 0,
      rewardPoints: 0,
    };
    const isVariantProduct = hasVariants === true || hasVariants === "true";

    try {
      if (
        manufacturer &&
        manufacturer !== "null" &&
        manufacturer !== "undefined"
      ) {
        const parsed =
          typeof manufacturer === "string"
            ? JSON.parse(manufacturer)
            : manufacturer;

        if (
          parsed &&
          typeof parsed === "object" &&
          Object.values(parsed).some(
            (v) => v !== null && v !== undefined && String(v).trim() !== ""
          )
        ) {
          parsedManufacturer = parsed;
        }
      }

      if (
        warranty &&
        warranty !== "null" &&
        warranty !== "undefined"
      ) {
        const parsed =
          typeof warranty === "string"
            ? JSON.parse(warranty)
            : warranty;

        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.available === true || parsed.available === "true")
        ) {
          parsedWarranty = parsed;
        }
      }

      if (
        returnPolicy &&
        returnPolicy !== "null" &&
        returnPolicy !== "undefined"
      ) {
        const parsed =
          typeof returnPolicy === "string"
            ? JSON.parse(returnPolicy)
            : returnPolicy;

        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.eligible === true || parsed.eligible === "true")
        ) {
          parsedReturnPolicy = parsed;
        }
      }

      if (
        details &&
        details !== "null" &&
        details !== "undefined"
      ) {
        const parsed =
          typeof details === "string"
            ? JSON.parse(details)
            : details;

        if (parsed && typeof parsed === "object") {
          parsedDetails = parsed;
        }
      }

      if (
        referral &&
        referral !== "null" &&
        referral !== "undefined"
      ) {
        const parsed =
          typeof referral === "string"
            ? JSON.parse(referral)
            : referral;

        if (parsed && typeof parsed === "object") {
          parsedReferral = {
            isEnabled:
              parsed.isEnabled === true || parsed.isEnabled === "true",
            discountAmount: Math.max(
              0,
              Number(parsed.discountAmount) || 0
            ),
            rewardPoints: Math.max(
              0,
              Number(parsed.rewardPoints) || 0
            ),
          };
        }
      }

      if (isVariantProduct && variants) {
        const rawVariants =
          typeof variants === "string"
            ? JSON.parse(variants)
            : variants;

        if (!Array.isArray(rawVariants) || rawVariants.length === 0) {
          return res.status(400).json({
            success: false,
            message: "At least one variant is required when variants are enabled",
          });
        }

        for (let i = 0; i < rawVariants.length; i++) {
          const v = rawVariants[i];

          if (!v || typeof v !== "object") {
            return res.status(400).json({
              success: false,
              message: `Variant #${i + 1} must be an object`,
            });
          }

          const vPrice = Number(v.price);
          if (isNaN(vPrice) || vPrice < 0) {
            return res.status(400).json({
              success: false,
              message: `Variant #${i + 1} price must be a non-negative number`,
            });
          }

          let vSalePrice = null;
          if (v.salePrice !== undefined && v.salePrice !== null && v.salePrice !== "") {
            vSalePrice = Number(v.salePrice);
            if (isNaN(vSalePrice) || vSalePrice < 0) {
              return res.status(400).json({
                success: false,
                message: `Variant #${i + 1} sale price must be a non-negative number`,
              });
            }
            if (vSalePrice > vPrice) {
              return res.status(400).json({
                success: false,
                message: `Variant #${i + 1} sale price cannot be greater than regular price`,
              });
            }
          }

          if (!Array.isArray(v.attributes) || v.attributes.length === 0) {
            return res.status(400).json({
              success: false,
              message: `Variant #${i + 1} must have at least one attribute`,
            });
          }

          const cleanedAttributes = v.attributes.map((attr, aIdx) => {
            if (!attr || typeof attr !== "object") {
              throw new Error(`Variant #${i + 1}, attribute #${aIdx + 1} is invalid`);
            }
            const attrName = String(attr.name || "").trim();
            const attrVal = String(attr.value || "").trim();

            if (!attrName || !attrVal) {
              throw new Error(`Variant #${i + 1} attribute name and value cannot be empty`);
            }

            return {
              name: attrName,
              value: attrVal,
            };
          });

          parsedVariants.push({
            price: vPrice,
            salePrice: vSalePrice,
            attributes: cleanedAttributes,
            isActive: v.isActive !== false && v.isActive !== "false",
          });
        }
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Invalid manufacturer, warranty, return policy, details or variants data",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      short_description: short_description.trim(),
      full_description: full_description.trim(),
      highlights: parsedHighlights,
      category,
      subcategory,
      brand: brand.trim(),
      price: productPrice,
      salePrice: productSalePrice,
      sku: cleanSku,
      stock: productStock,
      manufacturer: parsedManufacturer,
      warranty: parsedWarranty,
      returnPolicy: parsedReturnPolicy,
      details: parsedDetails,
      hasVariants: isVariantProduct,
      variants: parsedVariants,
      images,
      isFeatured: isFeatured === true || isFeatured === "true",
      isActive:
        isActive === undefined
          ? true
          : isActive === true || isActive === "true",
      referral: parsedReferral,
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    console.error("Add Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
};



export const getProducts = async (req, res) => {
  try {
    const {
      search,
      name,
      sku,
      category,
      subcategory,
      brand,
      stock,
      minPrice,
      maxPrice,
      isActive,
      isFeatured,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;



    const filter = {};



    // console.log("url hitted", "/all/products", Date.now())
    // Search by name
    if (name) {
      filter.name = {
        $regex: name,
        $options: "i",
      };
    }


    // General search
    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          sku: {
            $regex: search,
            $options: "i",
          },
        },
        {
          brand: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }


    // Search by SKU
    if (sku) {
      filter.sku = {
        $regex: sku,
        $options: "i",
      };
    }


    // Category
    if (category) {
      filter.category = category;
    }


    // Subcategory
    if (subcategory) {
      filter.subcategory = subcategory;
    }


    // Brand
    if (brand) {
      filter.brand = {
        $regex: brand,
        $options: "i",
      };
    }


    // Stock
    if (stock === "inStock") {
      filter.stock = {
        $gt: 0,
      };
    }

    if (stock === "outOfStock") {
      filter.stock = 0;
    }

    if (stock === "lowStock") {
      filter.stock = {
        $gt: 0,
        $lte: 10,
      };
    }


    // Price
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }


    // Active
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }


    // Featured
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === "true";
    }




    const currentPage = Math.max(Number(page), 1);

    const perPage = Math.min(
      Math.max(Number(limit), 1),
      200
    );

    const skip = (currentPage - 1) * perPage;




    const allowedSortFields = [
      "name",
      "price",
      "stock",
      "createdAt",
      "updatedAt",
    ];

    const safeSortBy =
      allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";

    const safeSortOrder =
      sortOrder === "asc" ? 1 : -1;

    const sort = {
      [safeSortBy]: safeSortOrder,
    };


    const [products, totalProducts] =
      await Promise.all([
        Product.find(filter)
          .populate("category", "name parent")
          .populate("subcategory", "name parent")
          .sort(sort)
          .skip(skip)
          .limit(perPage)
          .lean(),

        Product.countDocuments(filter),
      ]);


    const totalPages = Math.ceil(
      totalProducts / perPage
    );


    return res.status(200).json({
      success: true,
      data: {
        products,

        pagination: {
          currentPage,
          perPage,
          totalProducts,
          totalPages,
          hasNextPage:
            currentPage < totalPages,
          hasPreviousPage:
            currentPage > 1,
        },
      },
    });

  } catch (error) {
    console.error("Get Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};


export const getProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId)
      .populate("category", "name parent")
      .populate("subcategory", "name parent");


    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }


    if (req.user) {
      trackView(req.user._id, product._id).catch((err) =>
        console.error("trackView failed:", err)
      );
    }

    const productData = product.toObject ? product.toObject() : product;
    productData.referral = {
      isEnabled: Boolean(productData.referral?.isEnabled),
      discountAmount: Number(productData.referral?.discountAmount || 0),
      rewardPoints: Number(productData.referral?.rewardPoints || 0),
    };

    return res.status(200).json({
      success: true,
      data: {
        product: productData,
      },
    });

  } catch (error) {
    console.error("Get Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};




export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const {
      name,
      short_description,
      full_description,
      highlights,
      price,
      salePrice,
      sku,
      stock,
      category,
      subcategory,
      brand,
      manufacturer,
      warranty,
      returnPolicy,
      details,
      hasVariants,
      variants,
      isFeatured,
      isActive,
      referral,
    } = req.body;

    // --------------------------------------------------
    // PRODUCT ID VALIDATION
    // --------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // --------------------------------------------------
    // FIND PRODUCT
    // --------------------------------------------------

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // --------------------------------------------------
    // CATEGORY / SUBCATEGORY
    // --------------------------------------------------

    const finalCategory =
      category !== undefined
        ? category
        : product.category;

    const finalSubcategory =
      subcategory !== undefined
        ? subcategory
        : product.subcategory;

    if (
      category !== undefined ||
      subcategory !== undefined
    ) {
      if (!mongoose.Types.ObjectId.isValid(finalCategory)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(finalSubcategory)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subcategory ID",
        });
      }

      const categoryExists = await Category.findOne({
        _id: finalCategory,
        parent: null,
        isActive: true,
      });

      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "Category not found or inactive",
        });
      }

      const subcategoryExists = await Category.findOne({
        _id: finalSubcategory,
        parent: finalCategory,
        isActive: true,
      });

      if (!subcategoryExists) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid subcategory for the selected category",
        });
      }

      product.category = finalCategory;
      product.subcategory = finalSubcategory;
    }

    // --------------------------------------------------
    // SKU
    // --------------------------------------------------

    if (sku !== undefined) {
      const cleanSku = String(sku).trim().toUpperCase();

      if (!cleanSku) {
        return res.status(400).json({
          success: false,
          message: "SKU cannot be empty",
        });
      }

      const existingProduct = await Product.findOne({
        sku: cleanSku,
        _id: { $ne: productId },
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message:
            "Another product already uses this SKU",
        });
      }

      product.sku = cleanSku;
    }

    // --------------------------------------------------
    // BASIC INFORMATION
    // --------------------------------------------------

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty",
        });
      }

      product.name = String(name).trim();
    }

    if (short_description !== undefined) {
      if (!String(short_description).trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Product short description cannot be empty",
        });
      }

      product.short_description =
        String(short_description).trim();
    }

    if (full_description !== undefined) {
      if (!String(full_description).trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Product full description cannot be empty",
        });
      }

      product.full_description =
        String(full_description).trim();
    }

    // --------------------------------------------------
    // HIGHLIGHTS
    // --------------------------------------------------

    if (highlights !== undefined) {
      let parsedHighlights;

      try {
        parsedHighlights =
          typeof highlights === "string"
            ? JSON.parse(highlights)
            : highlights;
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid highlights data",
        });
      }

      if (!Array.isArray(parsedHighlights)) {
        return res.status(400).json({
          success: false,
          message: "Highlights must be an array",
        });
      }

      product.highlights = parsedHighlights
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    // --------------------------------------------------
    // PRICE
    // --------------------------------------------------

    if (price !== undefined) {
      const newPrice = Number(price);

      if (isNaN(newPrice) || newPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price",
        });
      }

      product.price = newPrice;
    }

    // --------------------------------------------------
    // SALE PRICE
    // --------------------------------------------------

    if (salePrice !== undefined) {
      if (
        salePrice === "" ||
        salePrice === null ||
        salePrice === "null"
      ) {
        product.salePrice = null;
      } else {
        const newSalePrice = Number(salePrice);

        if (
          isNaN(newSalePrice) ||
          newSalePrice < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid sale price",
          });
        }

        if (newSalePrice > product.price) {
          return res.status(400).json({
            success: false,
            message:
              "Sale price cannot be greater than regular price",
          });
        }

        product.salePrice = newSalePrice;
      }
    }

    // --------------------------------------------------
    // STOCK
    // --------------------------------------------------

    if (stock !== undefined) {
      const newStock = Number(stock);

      if (
        isNaN(newStock) ||
        newStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid stock value",
        });
      }

      product.stock = newStock;
    }

    // --------------------------------------------------
    // BRAND
    // --------------------------------------------------

    if (brand !== undefined) {
      if (!String(brand).trim()) {
        return res.status(400).json({
          success: false,
          message: "Brand cannot be empty",
        });
      }

      product.brand = String(brand).trim();
    }

    // --------------------------------------------------
    // MANUFACTURER
    // --------------------------------------------------

    if (manufacturer !== undefined) {
      try {
        if (
          manufacturer === null ||
          manufacturer === "" ||
          manufacturer === "null" ||
          manufacturer === "undefined"
        ) {
          product.manufacturer = null;
        } else {
          const parsedManufacturer =
            typeof manufacturer === "string"
              ? JSON.parse(manufacturer)
              : manufacturer;

          if (
            parsedManufacturer &&
            typeof parsedManufacturer === "object" &&
            !Array.isArray(parsedManufacturer)
          ) {
            product.manufacturer =
              parsedManufacturer;
          } else {
            product.manufacturer = null;
          }
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid manufacturer data",
        });
      }
    }

    // --------------------------------------------------
    // WARRANTY
    // --------------------------------------------------

    if (warranty !== undefined) {
      try {
        if (
          warranty === null ||
          warranty === "" ||
          warranty === "null" ||
          warranty === "undefined"
        ) {
          product.warranty = null;
        } else {
          const parsedWarranty =
            typeof warranty === "string"
              ? JSON.parse(warranty)
              : warranty;

          if (
            parsedWarranty &&
            typeof parsedWarranty === "object" &&
            !Array.isArray(parsedWarranty)
          ) {
            const isAvailable =
              parsedWarranty.available === true ||
              parsedWarranty.available === "true";

            product.warranty = isAvailable
              ? parsedWarranty
              : null;
          } else {
            product.warranty = null;
          }
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid warranty data",
        });
      }
    }

    // --------------------------------------------------
    // RETURN POLICY
    // --------------------------------------------------

    if (returnPolicy !== undefined) {
      try {
        if (
          returnPolicy === null ||
          returnPolicy === "" ||
          returnPolicy === "null" ||
          returnPolicy === "undefined"
        ) {
          product.returnPolicy = null;
        } else {
          const parsedReturnPolicy =
            typeof returnPolicy === "string"
              ? JSON.parse(returnPolicy)
              : returnPolicy;

          if (
            parsedReturnPolicy &&
            typeof parsedReturnPolicy === "object" &&
            !Array.isArray(parsedReturnPolicy)
          ) {
            const isEligible =
              parsedReturnPolicy.eligible === true ||
              parsedReturnPolicy.eligible === "true";

            product.returnPolicy = isEligible
              ? parsedReturnPolicy
              : null;
          } else {
            product.returnPolicy = null;
          }
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid return policy data",
        });
      }
    }

    // --------------------------------------------------
    // FIXED PRODUCT DETAILS
    //
    // details:
    // {
    //   size,
    //   material,
    //   weight,
    //   dimensions
    // }
    // --------------------------------------------------

    if (details !== undefined) {
      try {
        if (
          details === null ||
          details === "" ||
          details === "null" ||
          details === "undefined"
        ) {
          product.details = {};
        } else {
          const parsedDetails =
            typeof details === "string"
              ? JSON.parse(details)
              : details;

          if (
            !parsedDetails ||
            typeof parsedDetails !== "object" ||
            Array.isArray(parsedDetails)
          ) {
            return res.status(400).json({
              success: false,
              message: "Details must be an object",
            });
          }

          product.details = parsedDetails;
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid details data",
        });
      }
    }

    // --------------------------------------------------
    // VARIANTS & ATTRIBUTE PRICING
    // --------------------------------------------------

    if (hasVariants !== undefined) {
      product.hasVariants =
        hasVariants === true || hasVariants === "true";
    }

    if (variants !== undefined) {
      try {
        if (
          variants === null ||
          variants === "" ||
          variants === "null" ||
          variants === "undefined"
        ) {
          product.variants = [];
        } else {
          const parsedVariants =
            typeof variants === "string"
              ? JSON.parse(variants)
              : variants;

          if (!Array.isArray(parsedVariants)) {
            return res.status(400).json({
              success: false,
              message: "Variants must be an array",
            });
          }

          if (product.hasVariants && parsedVariants.length === 0) {
            return res.status(400).json({
              success: false,
              message:
                "At least one variant is required when variants are enabled",
            });
          }

          const cleanedVariants = [];

          for (let i = 0; i < parsedVariants.length; i++) {
            const v = parsedVariants[i];

            if (!v || typeof v !== "object") {
              return res.status(400).json({
                success: false,
                message: `Variant #${i + 1} must be an object`,
              });
            }

            const vPrice = Number(v.price);
            if (isNaN(vPrice) || vPrice < 0) {
              return res.status(400).json({
                success: false,
                message: `Variant #${i + 1} price must be a non-negative number`,
              });
            }

            let vSalePrice = null;
            if (
              v.salePrice !== undefined &&
              v.salePrice !== null &&
              v.salePrice !== ""
            ) {
              vSalePrice = Number(v.salePrice);
              if (isNaN(vSalePrice) || vSalePrice < 0) {
                return res.status(400).json({
                  success: false,
                  message: `Variant #${i + 1} sale price must be a non-negative number`,
                });
              }
              if (vSalePrice > vPrice) {
                return res.status(400).json({
                  success: false,
                  message: `Variant #${i + 1} sale price cannot be greater than regular price`,
                });
              }
            }

            if (!Array.isArray(v.attributes) || v.attributes.length === 0) {
              return res.status(400).json({
                success: false,
                message: `Variant #${i + 1} must have at least one attribute`,
              });
            }

            const cleanedAttributes = v.attributes.map((attr, aIdx) => {
              if (!attr || typeof attr !== "object") {
                throw new Error(
                  `Variant #${i + 1}, attribute #${aIdx + 1} is invalid`
                );
              }
              const attrName = String(attr.name || "").trim();
              const attrVal = String(attr.value || "").trim();

              if (!attrName || !attrVal) {
                throw new Error(
                  `Variant #${i + 1} attribute name and value cannot be empty`
                );
              }

              return {
                name: attrName,
                value: attrVal,
              };
            });

            cleanedVariants.push({
              price: vPrice,
              salePrice: vSalePrice,
              attributes: cleanedAttributes,
              isActive: v.isActive !== false && v.isActive !== "false",
            });
          }

          product.variants = cleanedVariants;
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Invalid variants data",
        });
      }
    }

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (isFeatured !== undefined) {
      product.isFeatured =
        isFeatured === true ||
        isFeatured === "true";
    }

    if (isActive !== undefined) {
      product.isActive =
        isActive === true ||
        isActive === "true";
    }

    // --------------------------------------------------
    // REFERRAL & REWARDS
    // --------------------------------------------------

    if (referral !== undefined) {
      try {
        if (
          referral === null ||
          referral === "" ||
          referral === "null" ||
          referral === "undefined"
        ) {
          product.referral = {
            isEnabled: false,
            discountAmount: 0,
            rewardPoints: 0,
          };
        } else {
          const parsedReferral =
            typeof referral === "string"
              ? JSON.parse(referral)
              : referral;

          if (
            parsedReferral &&
            typeof parsedReferral === "object"
          ) {
            product.referral = {
              isEnabled:
                parsedReferral.isEnabled === true ||
                parsedReferral.isEnabled === "true",
              discountAmount: Math.max(
                0,
                Number(parsedReferral.discountAmount) || 0
              ),
              rewardPoints: Math.max(
                0,
                Number(parsedReferral.rewardPoints) || 0
              ),
            };
          }
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid referral configuration data",
        });
      }
    }

    // --------------------------------------------------
    // IMAGES
    // --------------------------------------------------

    if (
      req.files &&
      req.files.length > 0
    ) {
      const images = [];

      for (const file of req.files) {
        const image =
          await uploadBufferToCloudinary(
            file.buffer,
            "ecommerce/products"
          );

        images.push(image);
      }

      product.images = images;
    }

    // --------------------------------------------------
    // SAVE
    // --------------------------------------------------

    await product.save();

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: {
        product,
      },
    });
  } catch (error) {
    console.error(
      "Update Product Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};




export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product =
      await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }


    // Delete product from database
    await Product.findByIdAndDelete(productId);


    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {
    console.error("Delete Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

