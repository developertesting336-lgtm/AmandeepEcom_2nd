
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import uploadBufferToCloudinary from "../utils/uploadToCloudinary.js";
import { trackView } from "../utils/trackView.js";


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
      attributes,
      isFeatured,
      isActive,
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

    // console.log(req.files)


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
    let parsedAttributes = {};

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
        attributes &&
        attributes !== "null" &&
        attributes !== "undefined"
      ) {
        const parsed =
          typeof attributes === "string"
            ? JSON.parse(attributes)
            : attributes;

        if (parsed && typeof parsed === "object") {
          parsedAttributes = parsed;
        }
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid manufacturer, warranty, return policy or attributes data",
      });
    }




    const product = await Product.create({
      name: name.trim(),

      short_description:
        short_description.trim(),

      full_description:
        full_description.trim(),

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

      attributes: parsedAttributes,

      images,

      isFeatured:
        isFeatured === true ||
        isFeatured === "true",

      isActive:
        isActive === undefined
          ? true
          : isActive === true ||
          isActive === "true",
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




    return res.status(200).json({
      success: true,
      data: {
        product,
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
      attributes,
      isFeatured,
      isActive,
    } = req.body;


    // console.log("files", req.files)
    // console.log("body", req.body)

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }




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


      const subcategoryExists =
        await Category.findOne({
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



    if (sku !== undefined) {
      const cleanSku = sku.trim().toUpperCase();

      const existingProduct =
        await Product.findOne({
          sku: cleanSku,
          _id: {
            $ne: productId,
          },
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



    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty",
        });
      }

      product.name = name.trim();
    }


    if (short_description !== undefined) {
      product.short_description =
        short_description.trim();
    }


    if (full_description !== undefined) {
      product.full_description =
        full_description.trim();
    }




    if (highlights !== undefined) {
      if (Array.isArray(highlights)) {
        product.highlights = highlights;
      } else {
        try {
          product.highlights =
            JSON.parse(highlights);
        } catch {
          product.highlights = [highlights];
        }
      }
    }




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




    if (salePrice !== undefined) {
      if (
        salePrice === "" ||
        salePrice === null
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

        if (
          newSalePrice > product.price
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Sale price cannot be greater than regular price",
          });
        }

        product.salePrice = newSalePrice;
      }
    }


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




    if (brand !== undefined) {
      if (!brand.trim()) {
        return res.status(400).json({
          success: false,
          message: "Brand cannot be empty",
        });
      }

      product.brand = brand.trim();
    }




    try {
      if (
        !manufacturer ||
        manufacturer === "null" ||
        manufacturer === "undefined"
      ) {
        product.manufacturer = null;
      } else {
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
          product.manufacturer = parsed;
        } else {
          product.manufacturer = null;
        }
      }

      if (
        !warranty ||
        warranty === "null" ||
        warranty === "undefined"
      ) {
        product.warranty = null;
      } else {
        const parsed =
          typeof warranty === "string"
            ? JSON.parse(warranty)
            : warranty;

        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.available === true || parsed.available === "true")
        ) {
          product.warranty = parsed;
        } else {
          product.warranty = null;
        }
      }

      if (
        !returnPolicy ||
        returnPolicy === "null" ||
        returnPolicy === "undefined"
      ) {
        product.returnPolicy = null;
      } else {
        const parsed =
          typeof returnPolicy === "string"
            ? JSON.parse(returnPolicy)
            : returnPolicy;

        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.eligible === true || parsed.eligible === "true")
        ) {
          product.returnPolicy = parsed;
        } else {
          product.returnPolicy = null;
        }
      }

      if (attributes !== undefined) {
        if (
          attributes === null ||
          attributes === "" ||
          attributes === "null" ||
          attributes === "undefined"
        ) {
          product.attributes = {};
        } else {
          const parsed =
            typeof attributes === "string"
              ? JSON.parse(attributes)
              : attributes;

          if (parsed && typeof parsed === "object") {
            product.attributes = parsed;
          } else {
            product.attributes = {};
          }
        }
      }
    } catch {
      return res.status(400).json({
        success: false,
        message:
          "Invalid manufacturer, warranty, return policy or attributes data",
      });
    }




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




    if (req.files && req.files.length > 0) {
      const images = [];

      for (const file of req.files) {
        // console.log(file)
        const image =
          await uploadBufferToCloudinary(
            file.buffer,
            "ecommerce/products"
          );

        images.push(image);
      }

      product.images = images;
    }

    // console.log(images)



    await product.save();


    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: {
        product,
      },
    });

  } catch (error) {
    console.error("Update Product Error:", error);

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

