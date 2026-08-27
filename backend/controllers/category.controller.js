import Category from "../models/Category.js";
import uploadBufferToCloudinary from "../utils/uploadToCloudinary.js";

// =====================================================
// GET ALL CATEGORIES
// =====================================================

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate("parent", "name")
      .sort({ createdAt: -1 });

    // console.log(categories)

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};


// =====================================================
// GET MAIN CATEGORIES
// =====================================================

export const getMainCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      parent: null,
      isActive: true,
    }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Main categories fetched successfully",
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get Main Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch main categories",
      error: error.message,
    });
  }
};


// =====================================================
// GET SUBCATEGORIES OF A CATEGORY
// =====================================================

export const getSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Check if parent category exists
    const parentCategory = await Category.findOne({
      _id: categoryId,
      parent: null,
    });

    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: "Parent category not found",
      });
    }

    const subcategories = await Category.find({
      parent: categoryId,
      isActive: true,
    }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Subcategories fetched successfully",
      count: subcategories.length,
      data: subcategories,
    });
  } catch (error) {
    console.error("Get Subcategories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subcategories",
      error: error.message,
    });
  }
};


// =====================================================
// ADD CATEGORY / SUBCATEGORY
// =====================================================

export const addCategory = async (req, res) => {
  try {
    const { name, description, parent } = req.body;

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const cleanName = name.trim();

    // =================================================
    // If parent is provided, validate parent category
    // =================================================

    if (parent) {
      const parentCategory = await Category.findOne({
        _id: parent,
        parent: null,
      });

      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: "Invalid parent category",
        });
      }
    }

    // =================================================
    // Check duplicate name under same parent
    // =================================================

    const existingCategory = await Category.findOne({
      name: cleanName,
      parent: parent || null,
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: parent
          ? "Subcategory with this name already exists in this category"
          : "Category with this name already exists",
      });
    }



    let imageUrl = "";

    if (req.file && req.file.buffer) {
      const image = await uploadBufferToCloudinary(
        req.file.buffer,
        "ecommerce/products"
      );
      imageUrl = image.url;
    } else if (req.body.image && typeof req.body.image === "string" && req.body.image.trim()) {
      imageUrl = req.body.image.trim();
    } else {
      return res.status(400).json({
        success: false,
        message: "Category image file (field 'image') is required",
      });
    }

    const category = await Category.create({
      name: cleanName,
      description: description?.trim() || "",
      image: imageUrl,
      parent: parent || null,
    });

    return res.status(201).json({
      success: true,
      message: parent
        ? "Subcategory added successfully"
        : "Category added successfully",
      data: {
        category,
        // image: image.url
      },
    });
  } catch (error) {
    console.error("Add Category Error:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add category",
      error: error.message,
    });
  }
};


export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, isActive, parent } = req.body;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }



    if (name !== undefined) {
      const cleanName = name.trim();

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty",
        });
      }

      category.name = cleanName;
    }



    if (parent !== undefined) {
      // Cannot make a category its own parent
      if (
        parent &&
        String(parent) === String(categoryId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be its own parent",
        });
      }

      if (parent) {
        const parentCategory = await Category.findOne({
          _id: parent,
          parent: null,
        });

        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            message: "Invalid parent category",
          });
        }

        category.parent = parent;
      } else {
        // Convert subcategory into main category
        category.parent = null;
      }
    }


    const duplicateCategory = await Category.findOne({
      name: category.name,
      parent: category.parent || null,
      _id: { $ne: categoryId },
    });

    if (duplicateCategory) {
      return res.status(409).json({
        success: false,
        message: category.parent
          ? "Subcategory with this name already exists in this category"
          : "Category with this name already exists",
      });
    }


    if (description !== undefined) {
      category.description = description.trim();
    }

    if (req.file && req.file.buffer) {
      const uploadedImage = await uploadBufferToCloudinary(
        req.file.buffer,
        "ecommerce/products"
      );
      category.image = uploadedImage.url;
    } else if (req.body.image && typeof req.body.image === "string" && req.body.image.trim()) {
      category.image = req.body.image.trim();
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: category.parent
        ? "Subcategory updated successfully"
        : "Category updated successfully",
      data: {
        category,
      },
    });
  } catch (error) {
    console.error("Update Category Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};


// =====================================================
// DELETE CATEGORY / SUBCATEGORY
// =====================================================

export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // =================================================
    // Do not delete category if it has subcategories
    // =================================================

    const childCategories = await Category.countDocuments({
      parent: categoryId,
    });

    if (childCategories > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete this category because it has subcategories. Delete or move the subcategories first.",
      });
    }

    await Category.findByIdAndDelete(categoryId);

    return res.status(200).json({
      success: true,
      message: category.parent
        ? "Subcategory deleted successfully"
        : "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};