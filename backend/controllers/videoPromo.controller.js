import VideoPromo from "../models/VideoPromo.js";

// Default promo cards to seed if collection is completely empty
const DEFAULT_PROMOS = [
  {
    title: "iPhone 15 Pro",
    subtitle: "",
    tagline: "Titanium. So strong. So light. So Pro.",
    badge: "NEW LAUNCH",
    badgeTheme: "dark",
    pricePrefix: "From",
    price: "₹1,34,900",
    linkUrl: "/products?search=iphone",
    btnText: "Shop Now",
    mediaType: "video",
    videoUrl: "preset:phone",
    posterUrl: "",
    bgGradient: "linear-gradient(135deg, #c7cbd3 0%, #b2b9c5 50%, #9ba3b2 100%)",
    order: 0,
    isActive: true,
  },
  {
    title: "AirPods Pro",
    subtitle: "2nd Generation",
    tagline: "Intelligent. Powerful. Effortless.",
    badge: "BEST SELLER",
    badgeTheme: "blue",
    pricePrefix: "From",
    price: "₹24,900",
    linkUrl: "/products?search=airpods",
    btnText: "Shop Now",
    mediaType: "video",
    videoUrl: "preset:airpods",
    posterUrl: "",
    bgGradient: "linear-gradient(135deg, #eff2fc 0%, #e1e7f9 50%, #d8e0f5 100%)",
    order: 1,
    isActive: true,
  },
];

/**
 * @desc Get all active promos for public homepage
 * @route GET /api/promos
 * @access Public
 */
export const getActivePromos = async (req, res) => {
  try {
    let promos = await VideoPromo.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();

    // If database has no promos at all, seed with default promos
    if (!promos || promos.length === 0) {
      const count = await VideoPromo.countDocuments();
      if (count === 0) {
        await VideoPromo.insertMany(DEFAULT_PROMOS);
        promos = await VideoPromo.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();
      }
    }

    return res.status(200).json({
      success: true,
      count: promos.length,
      data: promos,
    });
  } catch (error) {
    console.error("Get Active Promos Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch promo banners",
      error: error.message,
    });
  }
};

/**
 * @desc Get all promos for admin management
 * @route GET /api/admin/promos
 * @access Admin
 */
export const getAllPromosAdmin = async (req, res) => {
  try {
    let promos = await VideoPromo.find().sort({ order: 1, createdAt: -1 }).lean();

    // Auto-seed defaults if collection is empty
    if (!promos || promos.length === 0) {
      const count = await VideoPromo.countDocuments();
      if (count === 0) {
        await VideoPromo.insertMany(DEFAULT_PROMOS);
        promos = await VideoPromo.find().sort({ order: 1, createdAt: -1 }).lean();
      }
    }

    return res.status(200).json({
      success: true,
      count: promos.length,
      data: promos,
    });
  } catch (error) {
    console.error("Get All Promos Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin promo banners",
      error: error.message,
    });
  }
};

/**
 * @desc Create a new promo card
 * @route POST /api/admin/promos
 * @access Admin
 */
export const createPromoAdmin = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      tagline,
      badge,
      badgeTheme,
      pricePrefix,
      price,
      linkUrl,
      btnText,
      mediaType,
      videoUrl,
      posterUrl,
      bgGradient,
      order,
      isActive,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!videoUrl || !videoUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Video or Image media is required",
      });
    }

    const promo = await VideoPromo.create({
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : "",
      tagline: tagline ? tagline.trim() : "",
      badge: badge ? badge.trim() : "FEATURED",
      badgeTheme: badgeTheme || "dark",
      pricePrefix: pricePrefix ? pricePrefix.trim() : "From",
      price: price ? price.trim() : "",
      linkUrl: linkUrl ? linkUrl.trim() : "/products",
      btnText: btnText ? btnText.trim() : "Shop Now",
      mediaType: mediaType === "image" ? "image" : "video",
      videoUrl: videoUrl.trim(),
      posterUrl: posterUrl ? posterUrl.trim() : "",
      bgGradient: bgGradient ? bgGradient.trim() : "linear-gradient(135deg, #c7cbd3 0%, #b2b9c5 50%, #9ba3b2 100%)",
      order: typeof order === "number" ? order : 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return res.status(201).json({
      success: true,
      message: "Promo card created successfully",
      data: promo,
    });
  } catch (error) {
    console.error("Create Promo Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create promo card",
      error: error.message,
    });
  }
};

/**
 * @desc Update an existing promo card
 * @route PUT /api/admin/promos/:id
 * @access Admin
 */
export const updatePromoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      tagline,
      badge,
      badgeTheme,
      pricePrefix,
      price,
      linkUrl,
      btnText,
      mediaType,
      videoUrl,
      posterUrl,
      bgGradient,
      order,
      isActive,
    } = req.body;

    const promo = await VideoPromo.findById(id);
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo card not found",
      });
    }

    if (title !== undefined) promo.title = title.trim();
    if (subtitle !== undefined) promo.subtitle = subtitle.trim();
    if (tagline !== undefined) promo.tagline = tagline.trim();
    if (badge !== undefined) promo.badge = badge.trim();
    if (badgeTheme !== undefined) promo.badgeTheme = badgeTheme;
    if (pricePrefix !== undefined) promo.pricePrefix = pricePrefix.trim();
    if (price !== undefined) promo.price = price.trim();
    if (linkUrl !== undefined) promo.linkUrl = linkUrl.trim();
    if (btnText !== undefined) promo.btnText = btnText.trim();
    if (mediaType !== undefined) promo.mediaType = mediaType === "image" ? "image" : "video";
    if (videoUrl !== undefined) promo.videoUrl = videoUrl.trim();
    if (posterUrl !== undefined) promo.posterUrl = posterUrl.trim();
    if (bgGradient !== undefined) promo.bgGradient = bgGradient.trim();
    if (order !== undefined) promo.order = Number(order) || 0;
    if (isActive !== undefined) promo.isActive = Boolean(isActive);

    await promo.save();

    return res.status(200).json({
      success: true,
      message: "Promo card updated successfully",
      data: promo,
    });
  } catch (error) {
    console.error("Update Promo Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update promo card",
      error: error.message,
    });
  }
};

/**
 * @desc Delete a promo card
 * @route DELETE /api/admin/promos/:id
 * @access Admin
 */
export const deletePromoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await VideoPromo.findByIdAndDelete(id);

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo card not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promo card deleted successfully",
      data: { id },
    });
  } catch (error) {
    console.error("Delete Promo Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete promo card",
      error: error.message,
    });
  }
};

/**
 * @desc Toggle active status of a promo card
 * @route PATCH /api/admin/promos/:id/toggle
 * @access Admin
 */
export const togglePromoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await VideoPromo.findById(id);

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo card not found",
      });
    }

    promo.isActive = !promo.isActive;
    await promo.save();

    return res.status(200).json({
      success: true,
      message: `Promo card marked as ${promo.isActive ? "Active" : "Inactive"}`,
      data: promo,
    });
  } catch (error) {
    console.error("Toggle Promo Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle promo status",
      error: error.message,
    });
  }
};
