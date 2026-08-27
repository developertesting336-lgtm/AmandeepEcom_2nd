import User from "../models/user.js";

// =====================================================
// GET ALL USERS (ADMIN ONLY)
// =====================================================
export const getAllUsers = async (req, res) => {
  try {
    const { search, isActive, page, limit, sort = "newest" } = req.query;

    // Only return regular users, exclude admins
    const filter = {
      role: "user",
    };

    // Search by name, email, or phone
    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
        { phone: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Filter by active status
    if (isActive !== undefined && isActive !== "all") {
      filter.isActive = isActive === "true" || isActive === true;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "name_asc") sortOption = { name: 1 };
    if (sort === "name_desc") sortOption = { name: -1 };

    // Pagination
    const isPaginated = page !== undefined || limit !== undefined;
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * perPage;

    let query = User.find(filter).select("-password").sort(sortOption);

    if (isPaginated) {
      query = query.skip(skip).limit(perPage);
    }

    const [users, totalUsers] = await Promise.all([
      query.lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = isPaginated ? Math.ceil(totalUsers / perPage) : 1;

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      count: users.length,
      totalUsers,
      users,
      data: {
        users,
        pagination: {
          currentPage: isPaginated ? currentPage : 1,
          perPage: isPaginated ? perPage : totalUsers,
          totalUsers,
          totalPages,
          hasNextPage: isPaginated ? currentPage < totalPages : false,
          hasPreviousPage: isPaginated ? currentPage > 1 : false,
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// =====================================================
// TOGGLE USER ACTIVE / INACTIVE (ADMIN ONLY)
// =====================================================
export const toggleUserActive = async (req, res) => {
  try {
    const userId = req.params.userId || req.params.id || req.body.userId || req.body.id;

    console.log("inside toggle user active", userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deactivating admin accounts
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot modify status of an admin account",
      });
    }

    // Toggle active status: active -> inactive, inactive -> active
    user.isActive = !user.isActive;

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User is now ${user.isActive ? "active" : "inactive"}`,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle user active status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user active status",
      error: error.message,
    });
  }
};