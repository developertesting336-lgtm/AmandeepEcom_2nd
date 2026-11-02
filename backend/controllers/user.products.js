
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Wishlist from "../models/Wishlist.js";
import UserViewProfile from "../models/UserViewProfile.js";
import Order from "../models/Order.js";
import fuzzysort from "fuzzysort";
import parseNaturalLanguageSearch from "../ai/nlSearch.js";



export const getProducts = async (req, res) => {
  try {
    // console.log("\n================ [GET /api/products] START ================");
    // console.log("📥 [1] Received Query Parameters:", req.query);

    let {
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

    // const filter = {
    //   isActive: true,
    // };




    // // console.log("⚙️ [2] Base Filter Initialized:", JSON.stringify(filter));

    // // =================================================
    // // 1. SEARCH FILTER
    // // =================================================
    // if (search && search.trim()) {
    //   const searchValue = search.trim().toLowerCase();
    //   const escapedSearch = searchValue.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    //   // console.log(`🔍 [3] Processing Search -> raw: "${search}", normalized: "${searchValue}", regex: "${escapedSearch}"`);

    //   const matchingCategories = await Category.find({
    //     name: { $regex: escapedSearch, $options: "i" },
    //     isActive: true,
    //   }).select("_id name");

    //   const categoryIds = matchingCategories.map((c) => c._id);
    //   // console.log(`🔍 [3.1] Search Matched Categories (${matchingCategories.length}):`, matchingCategories.map((c) => ({ id: c._id, name: c.name })));

    //   filter.$or = [
    //     {
    //       name: {
    //         $regex: escapedSearch,
    //         $options: "i",
    //       },
    //     },
    //     {
    //       brand: {
    //         $regex: `\\b${escapedSearch}`,
    //         $options: "i",
    //       },
    //     },
    //   ];

    //   if (categoryIds.length > 0) {
    //     filter.$or.push({
    //       category: { $in: categoryIds },
    //     });
    //   }

    //   // console.log("🔍 [3.2] Filter after Search:", JSON.stringify(filter.$or, null, 2));
    // }


    // Use an array of conditions joined by $and to eliminate filter collisions
    const andConditions = [{ isActive: true }];
    let resolvedCategoryId = null;

    let productScoreMap = new Map();
    let aiIntent = null;
    // =================================================
    // 1. SEARCH FILTER (AI Natural Language + Fuzzysort)
    // =================================================
    if (search && search.trim()) {
      const searchValue = search.trim();

      // Attempt AI natural language intent extraction
      aiIntent = await parseNaturalLanguageSearch(searchValue);

      let effectiveSearchValue = searchValue;

      if (aiIntent) {
        if (aiIntent.keywords) {
          effectiveSearchValue = aiIntent.keywords;
        }

        // Soft DB match for AI-inferred category
        if ((!category || category === "all") && aiIntent.category) {
          const cleanCat = aiIntent.category.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
          const matchedCat = await Category.findOne({
            name: { $regex: cleanCat, $options: "i" },
            isActive: true,
          }).select("_id");
          if (matchedCat) {
            category = String(matchedCat._id);
          }
        }

        // Soft DB match for AI-inferred subcategory
        if (!subcategory && aiIntent.subcategory) {
          const cleanSub = aiIntent.subcategory.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
          const matchedSub = await Category.findOne({
            name: { $regex: cleanSub, $options: "i" },
            parent: { $ne: null },
            isActive: true,
          }).select("_id parent");
          if (matchedSub && (!category || String(matchedSub.parent) === String(category))) {
            subcategory = String(matchedSub._id);
          }
        }

        // Soft match for AI-inferred brand
        if (!brand && aiIntent.brand) {
          brand = aiIntent.brand.trim();
        }

        // Price bounds from AI intent
        if (minPrice === undefined && aiIntent.minPrice !== null) {
          minPrice = aiIntent.minPrice;
        }
        if (maxPrice === undefined && aiIntent.maxPrice !== null) {
          maxPrice = aiIntent.maxPrice;
        }

        if (!stock && aiIntent.inStockOnly) {
          stock = "inStock";
        }
        if (sort === "newest" && aiIntent.sort) {
          sort = aiIntent.sort;
        }
      }

      // Memory-Safe Candidate Retrieval: Pre-filter with regex to avoid loading the entire database
      const searchWords = effectiveSearchValue.split(/\s+/).filter(Boolean);
      const regexTerms = searchWords.map((w) => {
        const escaped = w.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        return {
          $or: [
            { name: { $regex: escaped, $options: "i" } },
            { brand: { $regex: `\\b${escaped}`, $options: "i" } },
            { short_description: { $regex: escaped, $options: "i" } },
          ],
        };
      });

      let candidateFilter = { isActive: true };
      if (regexTerms.length > 0) {
        candidateFilter.$or = regexTerms.flatMap((term) => term.$or);
      }

      let productCandidates = await Product.find(candidateFilter, {
        name: 1,
        brand: 1,
        short_description: 1,
      })
        .limit(500)
        .lean();

      // Typo Fallback: if regex matched few items, pull a bounded pool of recent active products
      if (productCandidates.length < 20) {
        const fallbackCandidates = await Product.find(
          { isActive: true },
          { name: 1, brand: 1, short_description: 1 }
        )
          .sort({ createdAt: -1 })
          .limit(300)
          .lean();

        const candidateMap = new Map();
        [...productCandidates, ...fallbackCandidates].forEach((p) =>
          candidateMap.set(String(p._id), p)
        );
        productCandidates = Array.from(candidateMap.values());
      }

      const fuzzyProductResults = fuzzysort.go(effectiveSearchValue, productCandidates, {
        keys: ["name", "brand", "short_description"],
        threshold: -10000,
        limit: 200,
      });

      const matchedProductIds = fuzzyProductResults.map((r) => {
        productScoreMap.set(String(r.obj._id), r.score);
        return r.obj._id;
      });

      const categoryCandidates = await Category.find(
        { isActive: true },
        { name: 1 }
      ).lean();

      const fuzzyCategoryResults = fuzzysort.go(effectiveSearchValue, categoryCandidates, {
        key: "name",
        threshold: -10000,
      });

      const matchedCategoryIds = fuzzyCategoryResults.map((r) => r.obj._id);

      andConditions.push({
        $or: [
          { _id: { $in: matchedProductIds } },
          ...(matchedCategoryIds.length > 0
            ? [{ category: { $in: matchedCategoryIds } }]
            : []),
        ],
      });
    }

    // =================================================
    // 2. CATEGORY FILTER
    // =================================================
    if (category && category !== "all") {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
      const cleanCategoryName = category.replace(/[-_]/g, " ").trim();
      const escapedCategory = cleanCategoryName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

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
        resolvedCategoryId = categoryDoc._id;
        andConditions.push({ category: categoryDoc._id });
      } else {
        andConditions.push({
          $or: [
            { categoryName: { $regex: escapedCategory, $options: "i" } },
            { "category.name": { $regex: escapedCategory, $options: "i" } },
          ],
        });
      }
    }

    // =================================================
    // 3. SUBCATEGORY FILTER
    // =================================================
    if (subcategory) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(subcategory);
      const escapedSubcat = subcategory.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

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
        return res.status(400).json({
          success: false,
          message: "Subcategory not found",
        });
      }

      if (
        resolvedCategoryId &&
        String(subcategoryDoc.parent) !== String(resolvedCategoryId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected subcategory does not belong to the selected category",
        });
      }

      andConditions.push({ subcategory: subcategoryDoc._id });
    }

    // =================================================
    // 4. BRAND FILTER
    // =================================================
    if (brand && brand.trim()) {
      const escapedBrand = brand.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      andConditions.push({
        brand: {
          $regex: `\\b${escapedBrand}`,
          $options: "i",
        },
      });
    }

    // =================================================
    // 5. PRICE FILTER
    // =================================================
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter = {};

      if (minPrice !== undefined && minPrice !== "") {
        const minimum = Number(minPrice);
        if (isNaN(minimum) || minimum < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid minimum price",
          });
        }
        priceFilter.$gte = minimum;
      }

      if (maxPrice !== undefined && maxPrice !== "") {
        const maximum = Number(maxPrice);
        if (isNaN(maximum) || maximum < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid maximum price",
          });
        }
        priceFilter.$lte = maximum;
      }

      if (
        priceFilter.$gte !== undefined &&
        priceFilter.$lte !== undefined &&
        priceFilter.$gte > priceFilter.$lte
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum price cannot be greater than maximum price",
        });
      }

      andConditions.push({ price: priceFilter });
    }

    // =================================================
    // 6. STOCK FILTER
    // =================================================
    if (stock === "inStock") {
      andConditions.push({ stock: { $gt: 0 } });
    } else if (stock === "outOfStock") {
      andConditions.push({ stock: 0 });
    }

    // =================================================
    // 7. SORTING
    // =================================================
    // let sortOption = {};

    // switch (sort) {
    //   case "price_asc":
    //   case "price-low":
    //     sortOption = { price: 1 };
    //     break;

    //   case "price_desc":
    //   case "price-high":
    //     sortOption = { price: -1 };
    //     break;

    //   case "name_asc":
    //   case "name":
    //     sortOption = { name: 1 };
    //     break;

    //   case "name_desc":
    //     sortOption = { name: -1 };
    //     break;

    //   case "oldest":
    //     sortOption = { createdAt: 1 };
    //     break;

    //   case "featured":
    //   case "newest":
    //   default:
    //     sortOption = { createdAt: -1 };
    //     break;
    // }

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

    // Check if user explicitly passed a sort parameter or AI detected a specific sort intent
    const hasExplicitUserSort = Boolean(req.query.sort && req.query.sort !== "relevance");
    const hasAiSort = Boolean(aiIntent?.sort);

    // Default to relevance ranking ONLY when searching without an explicit sort preference
    let sortByRelevance = Boolean(search && search.trim() && !hasExplicitUserSort && !hasAiSort);

    // console.log(` [9] Sorting Option -> requested: "${sort}", resolved:`, sortOption);

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
    // Combine all filters using $and to avoid collision between search and category $or
    const filter =
      andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
    // console.log(`📄 [10] Pagination -> page: ${currentPage}, limit: ${perPage}, skip: ${skip}`);

    // =================================================
    // 9. FINAL QUERY EXECUTION
    // =================================================
    // console.log("🎯 [11] FINAL MONGO FILTER:", JSON.stringify(filter, null, 2));

    // const [products, totalProducts] = await Promise.all([
    //   Product.find(filter)
    //     .select(
    //       [
    //         "name",
    //         "short_description",
    //         "price",
    //         "salePrice",
    //         "images",
    //         "brand",
    //         "stock",
    //         "sku",
    //         "highlights",
    //         "category",
    //         "subcategory",
    //         "isFeatured",
    //         "createdAt",
    //       ].join(" ")
    //     )
    //     .populate("category", "name")
    //     .populate("subcategory", "name")
    //     .sort(sortOption)
    //     .skip(skip)
    //     .limit(perPage)
    //     .lean(),

    //   Product.countDocuments(filter),
    // ]);

    // const totalPages = Math.ceil(totalProducts / perPage);

    const selectFields = [
      "name", "short_description", "price", "salePrice", "images",
      "brand", "stock", "sku", "highlights", "category", "subcategory",
      "isFeatured", "createdAt", "referral"
    ].join(" ");

    let products = [];
    let totalProducts = 0;

    if (sortByRelevance) {
      // Memory-Safe Relevance Query: Retrieve IDs only, paginate in memory, and fetch ONLY the current page documents
      const matchingDocs = await Product.find(filter, { _id: 1 }).lean();
      totalProducts = matchingDocs.length;

      const matchingIdSet = new Set(matchingDocs.map((d) => String(d._id)));

      // Preserve fuzzysort score order for matched products
      const orderedIds = [];
      for (const [idStr] of productScoreMap.entries()) {
        if (matchingIdSet.has(idStr)) {
          orderedIds.push(idStr);
          matchingIdSet.delete(idStr);
        }
      }

      // Append any remaining matches (e.g. category-matched products)
      for (const remainingId of matchingIdSet) {
        orderedIds.push(remainingId);
      }

      // Slice only the IDs for the requested page
      const pageIds = orderedIds.slice(skip, skip + perPage);

      if (pageIds.length > 0) {
        const pageDocs = await Product.find({ _id: { $in: pageIds } })
          .select(selectFields)
          .populate("category", "name")
          .populate("subcategory", "name")
          .lean();

        const docMap = new Map(pageDocs.map((doc) => [String(doc._id), doc]));
        products = pageIds.map((id) => docMap.get(id)).filter(Boolean);
      }
    } else {
      // Standard DB-indexed query with pagination at the database level
      [products, totalProducts] = await Promise.all([
        Product.find(filter)
          .select(selectFields)
          .populate("category", "name")
          .populate("subcategory", "name")
          .sort(sortOption)
          .skip(skip)
          .limit(perPage)
          .lean(),
        Product.countDocuments(filter),
      ]);
    }

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
        aiIntent: aiIntent || null,
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


export const getRecommendedProducts = async (req, res) => {
  try {
    const userId = req.user?._id;

    let products = [];

    if (userId) {
      const recommendations = await UserViewProfile.aggregate([
        // 1. Get current user's profile
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId)
          }
        },

        // 2. Get IDs of products already viewed
        {
          $set: {
            viewedProductIds: "$viewedProducts.product"
          }
        },

        // 3. Get strongest category
        {
          $set: {
            topCategory: {
              $arrayElemAt: [
                {
                  $sortArray: {
                    input: "$categoryPreferences",
                    sortBy: { viewCount: -1 }
                  }
                },
                0
              ]
            }
          }
        },

        // 4. Get strongest price range
        {
          $set: {
            topPriceRange: {
              $arrayElemAt: [
                {
                  $sortArray: {
                    input: "$priceRangePreferences",
                    sortBy: { viewCount: -1 }
                  }
                },
                0
              ]
            }
          }
        },

        // 5. Find recommended products
        {
          $lookup: {
            from: "products",
            let: {
              categoryId: "$topCategory.category",
              priceMin: "$topPriceRange.min",
              priceMax: "$topPriceRange.max",
              viewedIds: "$viewedProductIds"
            },
            pipeline: [
              {
                $match: {
                  isActive: true,
                  $expr: {
                    $and: [
                      // Same category
                      {
                        $eq: ["$category", "$$categoryId"]
                      },

                      // Don't recommend already viewed products
                      {
                        $not: {
                          $in: ["$_id", "$$viewedIds"]
                        }
                      },

                      // Price range
                      {
                        $gte: [
                          { $ifNull: ["$salePrice", "$price"] },
                          "$$priceMin"
                        ]
                      },
                      {
                        $lt: [
                          { $ifNull: ["$salePrice", "$price"] },
                          "$$priceMax"
                        ]
                      }
                    ]
                  }
                }
              },

              // Only return required fields
              {
                $project: {
                  name: 1,
                  price: 1,
                  salePrice: 1,
                  images: 1,
                  category: 1,
                  subcategory: 1,
                  brand: 1,
                  stock: 1
                }
              },

              {
                $limit: 10
              }
            ],
            as: "recommendations"
          }
        },

        // 6. Return only recommendations
        {
          $project: {
            _id: 0,
            recommendations: 1
          }
        }
      ]);

      products = recommendations[0]?.recommendations || [];
    }

    // Fallback if guest or no recommendations found
    if (products.length === 0) {
      products = await Product.find({ isActive: true, isFeatured: true })
        .select("name price salePrice images category subcategory brand stock")
        .limit(10)
        .lean();

      if (products.length < 10) {
        const remainingLimit = 10 - products.length;
        const additional = await Product.find({
          isActive: true,
          _id: { $nin: products.map((p) => p._id) },
        })
          .select("name price salePrice images category subcategory brand stock")
          .limit(remainingLimit)
          .lean();

        products.push(...additional);
      }
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      data: {
        products,
      },
    });
  } catch (error) {
    console.error("Get Recommended Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommended products",
      error: error.message,
    });
  }
};


export const getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "A valid Product ID is required",
      });
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const effectivePrice = product.salePrice ?? product.price;
    const minPrice = Math.max(0, effectivePrice * 0.7);
    const maxPrice = effectivePrice * 1.3;

    // Find similar products matching category, subcategory, brand, and price range
    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { subcategory: product.subcategory },
        {
          category: product.category,
          $or: [
            { salePrice: { $gte: minPrice, $lte: maxPrice } },
            { price: { $gte: minPrice, $lte: maxPrice } },
          ],
        },
        { category: product.category },
        { brand: product.brand },
      ],
    })
      .select(
        "name short_description price salePrice images brand stock sku highlights category subcategory isFeatured createdAt"
      )
      .populate("category", "name")
      .populate("subcategory", "name")
      .limit(limit)
      .lean();

    // Fallback/backfill if we haven't reached the limit
    if (similarProducts.length < limit) {
      const remaining = limit - similarProducts.length;
      const existingIds = [product._id, ...similarProducts.map((p) => p._id)];

      const additional = await Product.find({
        _id: { $nin: existingIds },
        isActive: true,
        $or: [{ category: product.category }, { isFeatured: true }],
      })
        .select(
          "name short_description price salePrice images brand stock sku highlights category subcategory isFeatured createdAt"
        )
        .populate("category", "name")
        .populate("subcategory", "name")
        .limit(remaining)
        .lean();

      similarProducts.push(...additional);
    }

    return res.status(200).json({
      success: true,
      count: similarProducts.length,
      data: {
        products: similarProducts,
      },
    });
  } catch (error) {
    console.error("Get Similar Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch similar products",
      error: error.message,
    });
  }
};


/**
 * @desc    Get most popular products based on order frequency in the last X days (default 30)
 * @route   GET /api/popular or GET /api/products/popular
 * @access  Public
 */
export const getPopularProducts = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Aggregate orders in the last `days` days excluding cancelled orders
    const orderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: "cancelled" },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.productId": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: { $ifNull: ["$products.quantity", 1] } },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalSold: -1, orderCount: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    const productIds = orderStats.map((item) => item._id);

    let products = [];

    // 2. Fetch full product details for the top ordered products
    if (productIds.length > 0) {
      const fetchedProducts = await Product.find({
        _id: { $in: productIds },
        isActive: true,
      })
        .select(
          "name short_description price salePrice images category subcategory brand stock rating numReviews isFeatured hasVariants variants sku createdAt"
        )
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .lean();

      const productMap = new Map(
        fetchedProducts.map((p) => [p._id.toString(), p])
      );

      for (const stat of orderStats) {
        const prod = productMap.get(stat._id.toString());
        if (prod) {
          products.push({
            ...prod,
            totalSold: stat.totalSold,
            orderCount: stat.orderCount,
          });
        }
      }
    }

    // 3. Fallback / backfill if fewer than `limit` products have been ordered
    if (products.length < limit) {
      const existingIds = products.map((p) => p._id);
      const remainingLimit = limit - products.length;

      // Try backfilling with active featured products
      const featured = await Product.find({
        isActive: true,
        isFeatured: true,
        _id: { $nin: existingIds },
      })
        .select(
          "name short_description price salePrice images category subcategory brand stock rating numReviews isFeatured hasVariants variants sku createdAt"
        )
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .limit(remainingLimit)
        .lean();

      products.push(
        ...featured.map((p) => ({ ...p, totalSold: 0, orderCount: 0 }))
      );

      // If still not reached limit, backfill with newest active products
      if (products.length < limit) {
        const allExistingIds = products.map((p) => p._id);
        const finalRemaining = limit - products.length;

        const additional = await Product.find({
          isActive: true,
          _id: { $nin: allExistingIds },
        })
          .select(
            "name short_description price salePrice images category subcategory brand stock rating numReviews isFeatured hasVariants variants sku createdAt"
          )
          .populate("category", "name slug")
          .populate("subcategory", "name slug")
          .sort({ createdAt: -1 })
          .limit(finalRemaining)
          .lean();

        products.push(
          ...additional.map((p) => ({ ...p, totalSold: 0, orderCount: 0 }))
        );
      }
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      timeframeDays: days,
      data: {
        products,
      },
    });
  } catch (error) {
    console.error("Get Popular Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch popular products",
      error: error.message,
    });
  }
};







