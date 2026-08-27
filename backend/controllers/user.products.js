
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Wishlist from "../models/Wishlist.js";



export const getProducts = async (req, res) => {
  try {
    // console.log("\n================ [GET /api/products] START ================");
    // console.log("📥 [1] Received Query Parameters:", req.query);

    const {
      search,
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      stock,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      isActive: true,
    };

    // console.log("⚙️ [2] Base Filter Initialized:", JSON.stringify(filter));

    // =================================================
    // 1. SEARCH FILTER
    // =================================================
    if (search && search.trim()) {
      const searchValue = search.trim().toLowerCase();
      const escapedSearch = searchValue.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

      // console.log(`🔍 [3] Processing Search -> raw: "${search}", normalized: "${searchValue}", regex: "${escapedSearch}"`);

      const matchingCategories = await Category.find({
        name: { $regex: escapedSearch, $options: "i" },
        isActive: true,
      }).select("_id name");

      const categoryIds = matchingCategories.map((c) => c._id);
      // console.log(`🔍 [3.1] Search Matched Categories (${matchingCategories.length}):`, matchingCategories.map((c) => ({ id: c._id, name: c.name })));

      filter.$or = [
        {
          name: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          brand: {
            $regex: `\\b${escapedSearch}`,
            $options: "i",
          },
        },
      ];

      if (categoryIds.length > 0) {
        filter.$or.push({
          category: { $in: categoryIds },
        });
      }

      // console.log("🔍 [3.2] Filter after Search:", JSON.stringify(filter.$or, null, 2));
    }

    // =================================================
    // 2. CATEGORY FILTER
    // =================================================
    if (category && category !== "all") {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
      const cleanCategoryName = category.replace(/[-_]/g, " ").trim();
      const escapedCategory = cleanCategoryName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

      // console.log(`📁 [4] Processing Category Filter -> raw: "${category}", isObjectId: ${isObjectId}, cleanName: "${cleanCategoryName}"`);

      const categoryDoc = await Category.findOne({
        $or: [
          ...(isObjectId ? [{ _id: category }] : []),
          { name: { $regex: escapedCategory, $options: "i" } },
          { slug: category.toLowerCase() },
          { slug: cleanCategoryName.toLowerCase().replace(/\s+/g, "-") },
        ],
        isActive: true,
      }).select("_id name");

      if (categoryDoc) {
        // console.log(`📁 [4.1] Category Found in DB -> ID: ${categoryDoc._id}, Name: "${categoryDoc.name}"`);
        filter.category = categoryDoc._id;
      } else {
        // console.warn(`⚠️ [4.2] Category NOT Found in DB for query "${category}". Setting fallback regex on category fields.`);
        filter.$or = [
          { categoryName: { $regex: escapedCategory, $options: "i" } },
          { "category.name": { $regex: escapedCategory, $options: "i" } },
        ];
      }
    }

    // =================================================
    // 3. SUBCATEGORY FILTER
    // =================================================
    if (subcategory) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(subcategory);
      const escapedSubcat = subcategory.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

      // console.log(`📂 [5] Processing Subcategory Filter -> raw: "${subcategory}", isObjectId: ${isObjectId}`);

      const subcategoryDoc = await Category.findOne({
        $or: [
          ...(isObjectId ? [{ _id: subcategory }] : []),
          { name: { $regex: `^${escapedSubcat}$`, $options: "i" } },
          { slug: subcategory.toLowerCase() },
        ],
        parent: { $ne: null },
        isActive: true,
      }).select("_id name parent");

      if (!subcategoryDoc) {
        // console.warn(`❌ [5.1] Subcategory NOT Found in DB: "${subcategory}"`);
        return res.status(400).json({
          success: false,
          message: "Subcategory not found",
        });
      }

      // console.log(`📂 [5.2] Subcategory Found in DB -> ID: ${subcategoryDoc._id}, Name: "${subcategoryDoc.name}", Parent: ${subcategoryDoc.parent}`);

      if (
        filter.category &&
        String(subcategoryDoc.parent) !==
        String(filter.category)
      ) {
        // console.warn(`⚠️ [5.3] Subcategory parent mismatch: Subcat parent (${subcategoryDoc.parent}) !== Filter category (${filter.category})`);
        return res.status(400).json({
          success: false,
          message:
            "Selected subcategory does not belong to the selected category",
        });
      }

      filter.subcategory = subcategoryDoc._id;
    }

    // =================================================
    // 4. BRAND FILTER
    // =================================================
    if (brand && brand.trim()) {
      const escapedBrand = brand.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      // console.log(`🏷️ [6] Processing Brand Filter -> raw: "${brand}", regex: "\\b${escapedBrand}"`);
      filter.brand = {
        $regex: `\\b${escapedBrand}`,
        $options: "i",
      };
    }

    // =================================================
    // 5. PRICE FILTER
    // =================================================
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined && minPrice !== "") {
        const minimum = Number(minPrice);
        if (isNaN(minimum) || minimum < 0) {
          // console.warn(`❌ [7.1] Invalid minPrice: "${minPrice}"`);
          return res.status(400).json({
            success: false,
            message: "Invalid minimum price",
          });
        }
        filter.price.$gte = minimum;
      }

      if (maxPrice !== undefined && maxPrice !== "") {
        const maximum = Number(maxPrice);
        if (isNaN(maximum) || maximum < 0) {
          // console.warn(`❌ [7.2] Invalid maxPrice: "${maxPrice}"`);
          return res.status(400).json({
            success: false,
            message: "Invalid maximum price",
          });
        }
        filter.price.$lte = maximum;
      }

      if (
        filter.price.$gte !== undefined &&
        filter.price.$lte !== undefined &&
        filter.price.$gte > filter.price.$lte
      ) {
        // console.warn(`❌ [7.3] Price range inverted: min (${filter.price.$gte}) > max (${filter.price.$lte})`);
        return res.status(400).json({
          success: false,
          message:
            "Minimum price cannot be greater than maximum price",
        });
      }

      // console.log(`💰 [7] Price Filter Applied:`, filter.price);
    }

    // =================================================
    // 6. STOCK FILTER
    // =================================================
    if (stock === "inStock") {
      filter.stock = { $gt: 0 };
      // console.log(`📦 [8] Stock Filter -> inStock ($gt: 0)`);
    } else if (stock === "outOfStock") {
      filter.stock = 0;
      // console.log(`📦 [8] Stock Filter -> outOfStock (0)`);
    }

    // =================================================
    // 7. SORTING
    // =================================================
    let sortOption = {};

    switch (sort) {
      case "price_asc":
      case "price-low":
        sortOption = { price: 1 };
        break;

      case "price_desc":
      case "price-high":
        sortOption = { price: -1 };
        break;

      case "name_asc":
      case "name":
        sortOption = { name: 1 };
        break;

      case "name_desc":
        sortOption = { name: -1 };
        break;

      case "oldest":
        sortOption = { createdAt: 1 };
        break;

      case "featured":
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // console.log(`🔃 [9] Sorting Option -> requested: "${sort}", resolved:`, sortOption);

    // =================================================
    // 8. PAGINATION
    // =================================================
    let currentPage = Number(page);
    let perPage = Number(limit);

    if (!Number.isInteger(currentPage) || currentPage < 1) {
      currentPage = 1;
    }

    if (!Number.isInteger(perPage) || perPage < 1) {
      perPage = 12;
    }

    if (perPage > 100) {
      perPage = 100;
    }

    const skip = (currentPage - 1) * perPage;
    // console.log(`📄 [10] Pagination -> page: ${currentPage}, limit: ${perPage}, skip: ${skip}`);

    // =================================================
    // 9. FINAL QUERY EXECUTION
    // =================================================
    // console.log("🎯 [11] FINAL MONGO FILTER:", JSON.stringify(filter, null, 2));

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .select(
          [
            "name",
            "short_description",
            "price",
            "salePrice",
            "images",
            "brand",
            "stock",
            "sku",
            "highlights",
            "category",
            "subcategory",
            "isFeatured",
            "createdAt",
          ].join(" ")
        )
        .populate("category", "name")
        .populate("subcategory", "name")
        .sort(sortOption)
        .skip(skip)
        .limit(perPage)
        .lean(),

      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalProducts / perPage);

    // console.log(`📊 [12] Query Results -> Total Matching Products in DB: ${totalProducts}, Products in this Page: ${products.length}, Total Pages: ${totalPages}`);
    // if (products.length > 0) {
    //   console.log("📋 [12.1] Returned Product Samples (first 3):", products.slice(0, 3).map((p) => ({
    //     id: p._id,
    //     name: p.name,
    //     brand: p.brand,
    //     category: p.category,
    //     subcategory: p.subcategory,
    //     price: p.price,
    //   })));
    // } else {
    //   console.log("⚠️ [12.1] Returned 0 Products for this filter.");
    // }
    // console.log("================ [GET /api/products] END ================\n");

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage,
          perPage,
          totalProducts,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      },
    });

  } catch (error) {
    console.error("❌ Get Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};


export const wishListManage = async (req, res) => {
  try {
    // console.log("POST wishlist hitted")

    const userId = req.user.id;
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({
      user: userId,
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        products: [productId],
      });

      return res.status(200).json({
        success: true,
        action: "added",
        message: "Product added to wishlist",
        wishlist,
      });
    }

    const productIndex = wishlist.products.findIndex(
      (id) => id.toString() === productId
    );

    if (productIndex !== -1) {
      wishlist.products.splice(productIndex, 1);

      await wishlist.save();

      return res.status(200).json({
        success: true,
        action: "removed",
        message: "Product removed from wishlist",
        wishlist,
      });
    }

    wishlist.products.push(productId);

    await wishlist.save();

    return res.status(200).json({
      success: true,
      action: "added",
      message: "Product added to wishlist",
      wishlist,
    });

  } catch (error) {
    console.error("Wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};



export const getWishlist = async (req, res) => {
  try {

    // console.log("get wishlist hitted")
    const userId = req.user._id;
    // console.log(req.user)

    const wishlist = await Wishlist.findOne({
      user: userId,
    }).populate("products");

    // User doesn't have a wishlist yet
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        products: [],
      });
    }

    return res.status(200).json({
      success: true,
      products: wishlist.products,
    });

  } catch (error) {
    console.error("Get wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get wishlist",
    });
  }
};




