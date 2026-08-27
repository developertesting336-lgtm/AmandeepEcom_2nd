import mongoose from "mongoose";
import Tagline from "../models/Tagline.js";
export const addTagline = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tagline is required",
      });
    }

    const existing = await Tagline.findOne({
      title: title.trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Tagline already exists",
      });
    }

    const tagline = await Tagline.create({
      title: title.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Tagline created successfully",
      data: {
        tagline,
      },
    });
  } catch (error) {
    console.error("Add Tagline Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create tagline",
      error: error.message,
    });
  }
};

export const getTaglines = async (req, res) => {
  try {
    const taglines = await Tagline.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: taglines.length,
      data: {
        taglines,
      },
    });
  } catch (error) {
    console.error("Get Taglines Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch taglines",
      error: error.message,
    });
  }
};

export const updateTagline = async (req, res) => {
  try {
    const { taglineId } = req.params;
    const { title, isUsed } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taglineId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tagline id",
      });
    }

    const tagline = await Tagline.findById(taglineId);

    if (!tagline) {
      return res.status(404).json({
        success: false,
        message: "Tagline not found",
      });
    }

    if (title !== undefined) {
      tagline.title = title.trim();
    }

    if (isUsed !== undefined) {
      tagline.isUsed = isUsed;
    }

    await tagline.save();

    return res.status(200).json({
      success: true,
      message: "Tagline updated successfully",
      data: {
        tagline,
      },
    });
  } catch (error) {
    console.error("Update Tagline Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update tagline",
      error: error.message,
    });
  }
};

export const deleteTagline = async (req, res) => {
  try {
    const { taglineId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taglineId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tagline id",
      });
    }

    const tagline = await Tagline.findByIdAndDelete(taglineId);

    if (!tagline) {
      return res.status(404).json({
        success: false,
        message: "Tagline not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tagline deleted successfully",
    });
  } catch (error) {
    console.error("Delete Tagline Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete tagline",
      error: error.message,
    });
  }
};

export const getHomeTaglines = async (req, res) => {
  try {
    const taglines = await Tagline.find({
      isUsed: true,
    })
      .select("title")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: taglines.length,
      data: {
        taglines,
      },
    });
  } catch (error) {
    console.error("Get Home Taglines Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch taglines",
      error: error.message,
    });
  }
};