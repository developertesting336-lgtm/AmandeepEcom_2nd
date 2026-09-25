import RewardPointTransaction from "../models/RewardPointTransaction.js";
import User from "../models/user.js";

/**
 * @desc    Get current user's reward points history / ledger
 * @route   GET /api/rewards/history
 * @access  Private (Logged-in User)
 */
export const getUserRewardHistory = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to view reward points history",
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const typeFilter = req.query.type; // "EARNED", "REDEEMED", or undefined

    const query = { user: userId };
    if (
      typeFilter &&
      ["EARNED", "REDEEMED", "REFUNDED"].includes(typeFilter.toUpperCase())
    ) {
      query.type = typeFilter.toUpperCase();
    }

    const [user, transactions, totalCount, stats] = await Promise.all([
      User.findById(userId).select("rewardPoints name email"),
      RewardPointTransaction.find(query)
        .populate("product", "name images price salePrice slug")
        .populate("buyer", "name email")
        .populate("order", "orderId orderStatus orderTotal createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RewardPointTransaction.countDocuments(query),
      RewardPointTransaction.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: "$type",
            totalPoints: { $sum: "$points" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statsMap = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.totalPoints;
      return acc;
    }, {});

    const totalEarned = statsMap["EARNED"] || 0;
    const totalRedeemed = statsMap["REDEEMED"] || 0;

    return res.status(200).json({
      success: true,
      message: "Reward points history fetched successfully",
      data: {
        currentBalance: user?.rewardPoints || 0,
        totalEarned,
        totalRedeemed,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
          totalCount,
        },
        transactions,
      },
    });
  } catch (error) {
    console.error("Get User Reward History Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reward history",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all reward points transactions across all users (Admin only)
 * @route   GET /api/rewards/admin/history
 * @access  Private (Admin)
 */
export const getAdminRewardHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { type, userId, orderId } = req.query;

    const query = {};
    if (type) query.type = type.toUpperCase();
    if (userId) query.user = userId;
    if (orderId) query.orderId = new RegExp(orderId, "i");

    const [transactions, totalCount] = await Promise.all([
      RewardPointTransaction.find(query)
        .populate("user", "name email")
        .populate("product", "name price")
        .populate("buyer", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RewardPointTransaction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin reward transactions fetched successfully",
      data: {
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
          totalCount,
        },
        transactions,
      },
    });
  } catch (error) {
    console.error("Get Admin Reward History Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin reward history",
      error: error.message,
    });
  }
};
