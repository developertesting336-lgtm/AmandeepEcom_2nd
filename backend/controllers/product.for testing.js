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
        let parsedDetails = {};
        let parsedAttributes = []

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
                attributes &&
                attributes !== "null" &&
                attributes !== "undefined"
            ) {
                const parsed =
                    typeof attributes === "string"
                        ? JSON.parse(attributes)
                        : attributes;

                if (!Array.isArray(parsed)) {
                    return res.status(400).json({
                        success: false,
                        message: "Attributes must be an array",
                    });
                }
            }
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid manufacturer, warranty, return policy or details data",
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

            details: parsedDetails,

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
            attributes,
            isFeatured,
            isActive,
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
        // DYNAMIC ATTRIBUTES
        //
        // attributes:
        // [
        //   {
        //     name: "Color",
        //     values: ["Black", "Red"]
        //   },
        //   {
        //     name: "RAM",
        //     values: ["8 GB", "16 GB"]
        //   }
        // ]
        // --------------------------------------------------

        if (attributes !== undefined) {
            try {
                if (
                    attributes === null ||
                    attributes === "" ||
                    attributes === "null" ||
                    attributes === "undefined"
                ) {
                    product.attributes = [];
                } else {
                    const parsedAttributes =
                        typeof attributes === "string"
                            ? JSON.parse(attributes)
                            : attributes;

                    if (!Array.isArray(parsedAttributes)) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "Attributes must be an array",
                        });
                    }

                    const cleanedAttributes =
                        parsedAttributes.map((attribute, index) => {
                            if (
                                !attribute ||
                                typeof attribute !== "object" ||
                                Array.isArray(attribute)
                            ) {
                                throw new Error(
                                    `Attribute #${index + 1} must be an object`
                                );
                            }

                            if (
                                typeof attribute.name !== "string" ||
                                !attribute.name.trim()
                            ) {
                                throw new Error(
                                    `Attribute #${index + 1} must have a valid name`
                                );
                            }

                            if (!Array.isArray(attribute.values)) {
                                throw new Error(
                                    `Values for attribute "${attribute.name}" must be an array`
                                );
                            }

                            const cleanedValues =
                                attribute.values
                                    .map((value) =>
                                        String(value).trim()
                                    )
                                    .filter(Boolean);

                            if (
                                cleanedValues.length === 0
                            ) {
                                throw new Error(
                                    `Attribute "${attribute.name}" must have at least one value`
                                );
                            }

                            return {
                                name: attribute.name.trim(),
                                values: cleanedValues,
                            };
                        });

                    product.attributes = cleanedAttributes;
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message:
                        error.message ||
                        "Invalid attributes data",
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

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        // =========================
        // BASIC PRODUCT INFORMATION
        // =========================

        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            minlength: [2, "Product name must be at least 2 characters"],
            maxlength: [200, "Product name cannot exceed 200 characters"],
        },

        short_description: {
            type: String,
            required: [true, "Product short description is required"],
            trim: true,
            maxlength: [500, "Short description cannot exceed 500 characters"],
        },

        // Rich HTML content from CKEditor
        full_description: {
            type: String,
            required: [true, "Product full description is required"],
            trim: true,
        },

        // =========================
        // PRODUCT HIGHLIGHTS
        // =========================

        highlights: {
            type: [String],
            default: [],
        },

        // =========================
        // CATEGORY & SUBCATEGORY
        // =========================

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Category is required"],
        },

        subcategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Subcategory is required"],
        },

        // =========================
        // BRAND
        // =========================

        // Brand is entered while creating the product.
        // It is NOT a separate collection.
        brand: {
            type: String,
            required: [true, "Brand is required"],
            trim: true,
            maxlength: [100, "Brand cannot exceed 100 characters"],
        },

        // =========================
        // PRICING
        // =========================

        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price cannot be negative"],
        },

        salePrice: {
            type: Number,
            default: null,
            min: [0, "Sale price cannot be negative"],
        },

        // =========================
        // INVENTORY
        // =========================

        sku: {
            type: String,
            required: [true, "SKU is required"],
            unique: true,
            uppercase: true,
            trim: true,
        },

        stock: {
            type: Number,
            required: [true, "Stock is required"],
            min: [0, "Stock cannot be negative"],
            default: 0,
        },

        // =========================
        // MANUFACTURER DETAILS
        // =========================

        manufacturer: {
            type: new mongoose.Schema(
                {
                    name: {
                        type: String,
                        trim: true,
                        default: "",
                    },

                    address: {
                        type: String,
                        trim: true,
                        default: "",
                    },

                    country: {
                        type: String,
                        trim: true,
                        default: "",
                    },

                    contact: {
                        type: String,
                        trim: true,
                        default: "",
                    },

                    email: {
                        type: String,
                        trim: true,
                        lowercase: true,
                        default: "",
                    },

                    website: {
                        type: String,
                        trim: true,
                        default: "",
                    },
                },
                { _id: false }
            ),
            default: null,
        },

        // =========================
        // WARRANTY
        // =========================

        warranty: {
            type: new mongoose.Schema(
                {
                    available: {
                        type: Boolean,
                        default: false,
                    },

                    duration: {
                        type: Number,
                        default: null,
                        min: [0, "Warranty duration cannot be negative"],
                    },

                    unit: {
                        type: String,
                        enum: ["days", "months", "years"],
                        default: "months",
                    },

                    type: {
                        type: String,
                        enum: [
                            "Manufacturer Warranty",
                            "Seller Warranty",
                            "Brand Warranty",
                            "No Warranty",
                        ],
                        default: "No Warranty",
                    },

                    description: {
                        type: String,
                        trim: true,
                        default: "",
                    },

                    terms: {
                        type: String,
                        trim: true,
                        default: "",
                    },
                },
                { _id: false }
            ),
            default: null,
        },

        // =========================
        // RETURN POLICY
        // =========================

        returnPolicy: {
            type: new mongoose.Schema(
                {
                    eligible: {
                        type: Boolean,
                        default: false,
                    },

                    returnWindow: {
                        type: Number,
                        default: null,
                        min: [0, "Return window cannot be negative"],
                    },

                    returnWindowUnit: {
                        type: String,
                        enum: ["days", "months"],
                        default: "days",
                    },

                    replacementAvailable: {
                        type: Boolean,
                        default: false,
                    },

                    refundAvailable: {
                        type: Boolean,
                        default: false,
                    },

                    conditions: {
                        type: String,
                        trim: true,
                        default: "",
                    },

                    description: {
                        type: String,
                        trim: true,
                        default: "",
                    },
                },
                { _id: false }
            ),
            default: null,
        },

        // =========================
        // PRODUCT ATTRIBUTES
        // =========================

        details: {

            size: {
                type: String,
                trim: true,
                default: "",
            },

            material: {
                type: String,
                trim: true,
                default: "",
            },

            weight: {
                value: {
                    type: Number,
                    default: null,
                    min: [0, "Weight cannot be negative"],
                },

                unit: {
                    type: String,
                    enum: ["g", "kg", "mg", "lb"],
                    default: "g",
                },
            },


            dimensions: {
                length: {
                    type: Number,
                    default: null,
                    min: [0, "Length cannot be negative"],
                },

                width: {
                    type: Number,
                    default: null,
                    min: [0, "Width cannot be negative"],
                },

                height: {
                    type: Number,
                    default: null,
                    min: [0, "Height cannot be negative"],
                },

                unit: {
                    type: String,
                    enum: ["cm", "mm", "m", "inch"],
                    default: "cm",
                },
            },
        },

        attributes: {
            type: [
                {
                    name: {
                        type: String,
                        required: true,
                        trim: true,
                    },

                    values: {
                        type: [String],
                        required: true,
                        default: [],
                    },
                },
            ],
            default: [],
        },

        // =========================
        // PRODUCT IMAGES
        // =========================

        images: [
            {
                public_id: {
                    type: String,
                    required: true,
                    trim: true,
                },

                url: {
                    type: String,
                    required: true,
                    trim: true,
                },

                alt: {
                    type: String,
                    trim: true,
                    default: "",
                },

                isPrimary: {
                    type: Boolean,
                    default: false,
                },
            },
        ],

        // =========================
        // PRODUCT STATUS
        // =========================

        isFeatured: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);


// ==========================================
// SALE PRICE VALIDATION
// ==========================================

// productSchema.pre("validate", function (next) {
//   if (
//     this.salePrice !== null &&
//     this.salePrice !== undefined &&
//     this.salePrice > this.price
//   ) {
//     this.invalidate(
//       "salePrice",
//       "Sale price cannot be greater than regular price"
//     );
//   }

//   next();
// });


// ==========================================
// INDEXES
// ==========================================

productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });


const Product = mongoose.model("Product", productSchema);

export default Product;
