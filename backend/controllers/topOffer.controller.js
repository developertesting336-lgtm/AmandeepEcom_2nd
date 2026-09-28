import mongoose from "mongoose";
import TopOfferSection from "../models/TopOffer.js";
import uploadBufferToCloudinary from "../utils/uploadToCloudinary.js";

const DEFAULT_TOP_OFFERS = {
  title: "Top Offers",
  subtitle: "Exclusive deals on trending items and top brands",
  bgColor: "#eff6ff",
  titleColor: "#0f172a",
  isActive: true,
  banners: [
    {
      title: "Top Offer 1",
      imageUrl: "preset:banner-1",
      linkUrl: "/products",
      order: 1,
      isActive: true,
    },
    {
      title: "Top Offer 2",
      imageUrl: "preset:banner-2",
      linkUrl: "/products",
      order: 2,
      isActive: true,
    },
    {
      title: "Top Offer 3",
      imageUrl: "preset:banner-3",
      linkUrl: "/products",
      order: 3,
      isActive: true,
    },
    {
      title: "Top Offer 4",
      imageUrl: "preset:banner-4",
      linkUrl: "/products",
      order: 4,
      isActive: true,
    },
    {
      title: "Top Offer 5",
      imageUrl: "preset:banner-5",
      linkUrl: "/products",
      order: 5,
      isActive: true,
    },
  ],
};

/**
 * Helper to retrieve or initialize the top offer section document
 */
const getOrCreateSectionDoc = async () => {
  let section = await TopOfferSection.findOne();
  if (!section) {
    section = await TopOfferSection.create(DEFAULT_TOP_OFFERS);
  }
  return section;
};

/**
 * @desc Get public Top Offers section for homepage
 * @route GET /api/top-offers
 * @access Public
 */
export const getPublicTopOffers = async (req, res) => {
  try {
    const section = await getOrCreateSectionDoc();
    const sectionObj = section.toObject();

    // If section is globally disabled, return empty banners
    if (!sectionObj.isActive) {
      return res.status(200).json({
        success: true,
        data: {
          ...sectionObj,
          banners: [],
        },
      });
    }

    // Filter only active banners and sort by order ascending
    const activeBanners = (sectionObj.banners || [])
      .filter((b) => b.isActive !== false)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    return res.status(200).json({
      success: true,
      data: {
        ...sectionObj,
        banners: activeBanners,
      },
    });
  } catch (error) {
    console.error("Get Public Top Offers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch top offers",
      error: error.message,
    });
  }
};

/**
 * @desc Get Top Offers section data for Admin
 * @route GET /api/admin/top-offers
 * @access Admin
 */
export const getAdminTopOffers = async (req, res) => {
  try {
    const section = await getOrCreateSectionDoc();
    const sectionObj = section.toObject();

    // Sort all banners by order ascending
    sectionObj.banners = (sectionObj.banners || []).sort(
      (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)
    );

    return res.status(200).json({
      success: true,
      data: sectionObj,
    });
  } catch (error) {
    console.error("Get Admin Top Offers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin top offers",
      error: error.message,
    });
  }
};

/**
 * @desc Update section settings (title, bgColor, titleColor, isActive)
 * @route PUT /api/admin/top-offers/settings
 * @access Admin
 */
export const updateTopOfferSettings = async (req, res) => {
  try {
    const { title, subtitle, bgColor, titleColor, isActive } = req.body;
    const section = await getOrCreateSectionDoc();

    if (title !== undefined) section.title = String(title).trim() || "Top Offers";
    if (subtitle !== undefined) section.subtitle = String(subtitle).trim();
    if (bgColor !== undefined) section.bgColor = String(bgColor).trim() || "#eff6ff";
    if (titleColor !== undefined) section.titleColor = String(titleColor).trim() || "#0f172a";
    if (isActive !== undefined) section.isActive = Boolean(isActive);

    await section.save();

    return res.status(200).json({
      success: true,
      message: "Top Offers section settings updated successfully",
      data: {
        title: section.title,
        subtitle: section.subtitle,
        bgColor: section.bgColor,
        titleColor: section.titleColor,
        isActive: section.isActive,
      },
    });
  } catch (error) {
    console.error("Update Top Offer Settings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update top offer settings",
      error: error.message,
    });
  }
};

/**
 * @desc Add a new banner to the section
 * @route POST /api/admin/top-offers/banners
 * @access Admin
 */
export const addTopOfferBanner = async (req, res) => {
  try {
    const section = await getOrCreateSectionDoc();
    let { title, imageUrl, linkUrl, order, isActive } = req.body;

    // Handle file upload if present
    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await uploadBufferToCloudinary(
          req.file.buffer,
          "ecommerce/top_offers"
        );
        imageUrl = uploadResult.url;
      } catch (uploadErr) {
        console.error("Cloudinary Upload Error:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload banner image to Cloudinary",
          error: uploadErr.message,
        });
      }
    }

    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Banner image (file or URL) is required",
      });
    }

    const calculatedOrder =
      order !== undefined && !isNaN(Number(order))
        ? Number(order)
        : section.banners.length + 1;

    const newBanner = {
      title: title && title.trim() ? title.trim() : "Promotional Banner",
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl && linkUrl.trim() ? linkUrl.trim() : "/products",
      order: calculatedOrder,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    };

    section.banners.push(newBanner);
    await section.save();

    const createdBanner = section.banners[section.banners.length - 1];

    return res.status(201).json({
      success: true,
      message: "Banner added successfully",
      data: createdBanner,
    });
  } catch (error) {
    console.error("Add Top Offer Banner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add banner",
      error: error.message,
    });
  }
};

/**
 * @desc Update an existing banner
 * @route PUT /api/admin/top-offers/banners/:bannerId
 * @access Admin
 */
export const updateTopOfferBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const section = await getOrCreateSectionDoc();

    const banner = section.banners.id(bannerId);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    let { title, imageUrl, linkUrl, order, isActive } = req.body;

    // Handle image file if uploaded
    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await uploadBufferToCloudinary(
          req.file.buffer,
          "ecommerce/top_offers"
        );
        imageUrl = uploadResult.url;
      } catch (uploadErr) {
        console.error("Cloudinary Banner Update Upload Error:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload banner image to Cloudinary",
          error: uploadErr.message,
        });
      }
    }

    if (title !== undefined) banner.title = title.trim();
    if (imageUrl !== undefined && imageUrl.trim()) banner.imageUrl = imageUrl.trim();
    if (linkUrl !== undefined) banner.linkUrl = linkUrl.trim();
    if (order !== undefined && !isNaN(Number(order))) banner.order = Number(order);
    if (isActive !== undefined) banner.isActive = Boolean(isActive);

    await section.save();

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Update Top Offer Banner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update banner",
      error: error.message,
    });
  }
};

/**
 * @desc Delete a banner
 * @route DELETE /api/admin/top-offers/banners/:bannerId
 * @access Admin
 */
export const deleteTopOfferBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const section = await getOrCreateSectionDoc();

    const bannerIndex = section.banners.findIndex(
      (b) => b._id.toString() === bannerId
    );

    if (bannerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    section.banners.splice(bannerIndex, 1);
    await section.save();

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
      data: { bannerId },
    });
  } catch (error) {
    console.error("Delete Top Offer Banner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete banner",
      error: error.message,
    });
  }
};

/**
 * @desc Toggle a banner's active status (Show / Hide)
 * @route PATCH /api/admin/top-offers/banners/:bannerId/toggle
 * @access Admin
 */
export const toggleTopOfferBannerStatus = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const section = await getOrCreateSectionDoc();

    const banner = section.banners.id(bannerId);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    banner.isActive = !banner.isActive;
    await section.save();

    return res.status(200).json({
      success: true,
      message: `Banner ${banner.isActive ? "activated" : "hidden"} successfully`,
      data: banner,
    });
  } catch (error) {
    console.error("Toggle Top Offer Banner Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle banner status",
      error: error.message,
    });
  }
};

/**
 * @desc Reorder banners positions
 * @route PUT /api/admin/top-offers/reorder
 * @access Admin
 */
export const reorderTopOfferBanners = async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, order }

    if (!Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: "Orders array of { id, order } is required",
      });
    }

    const section = await getOrCreateSectionDoc();

    orders.forEach(({ id, order }) => {
      const banner = section.banners.id(id);
      if (banner && typeof order === "number") {
        banner.order = order;
      }
    });

    await section.save();

    // Sort before returning
    const sortedBanners = section.banners.sort(
      (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)
    );

    return res.status(200).json({
      success: true,
      message: "Banners reordered successfully",
      data: sortedBanners,
    });
  } catch (error) {
    console.error("Reorder Top Offer Banners Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reorder banners",
      error: error.message,
    });
  }
};

/**
 * @desc Standalone image upload for banner creation
 * @route POST /api/admin/top-offers/upload
 * @access Admin
 */
export const uploadTopOfferImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "ecommerce/top_offers"
    );

    return res.status(200).json({
      success: true,
      imageUrl: result.url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Upload Top Offer Image Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    });
  }
};
