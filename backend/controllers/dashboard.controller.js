export const getUserDashboard = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "User dashboard accessed successfully",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("User Dashboard Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load user dashboard",
    });
  }
};

export const getAdminDashboard = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Admin dashboard accessed successfully",
      data: {
        admin: req.user,
      },
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
};
export const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

   
    const existingCategory = await Category.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existingSlug = await Category.findOne({ slug });

    if (existingSlug) {
      return res.status(409).json({
        success: false,
        message: "Category slug already exists",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description || "",
    });

    return res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: {
        category,
      },
    });
  } catch (error) {
    console.error("Add Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add category",
      error: error.message,
    });
  }
};