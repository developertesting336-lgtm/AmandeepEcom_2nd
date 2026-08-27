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

    // =========================
    // WARRANTY
    // =========================

    warranty: {
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

    // =========================
    // RETURN POLICY
    // =========================

    returnPolicy: {
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

    // =========================
    // PRODUCT ATTRIBUTES
    // =========================

    attributes: {
      color: {
        type: String,
        trim: true,
        default: "",
      },

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