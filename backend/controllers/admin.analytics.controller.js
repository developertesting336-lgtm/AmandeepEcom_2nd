import Order from "../models/Order.js";

// ==========================================================
// 1. GET ANALYTICS OVERVIEW (TODAY, THIS WEEK, THIS MONTH VS PREVIOUS)
// ==========================================================
export const getAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // 1. Date boundaries for Today & Yesterday (Last Day)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);

    // 2. Date boundaries for This Week & Last Week
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday ...
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfThisWeek.getTime() - 1);

    // 3. Date boundaries for This Month & Last Month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1);

    // Reusable match & count pipeline builder
    const buildCountPipeline = (startDate, endDate) => [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$orderTotal", 0],
            },
          },
        },
      },
    ];

    // Single aggregation pipeline with $facet
    const [result] = await Order.aggregate([
      {
        $facet: {
          // Current periods
          todayOrders: buildCountPipeline(startOfToday, endOfToday),
          thisWeekOrders: buildCountPipeline(startOfThisWeek, now),
          thisMonthOrders: buildCountPipeline(startOfThisMonth, now),

          // Previous periods
          yesterdayOrders: buildCountPipeline(startOfYesterday, endOfYesterday),
          lastWeekOrders: buildCountPipeline(startOfLastWeek, endOfLastWeek),
          lastMonthOrders: buildCountPipeline(startOfLastMonth, endOfLastMonth),

          // Total all-time
          allTimeOrders: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: {
                  $sum: {
                    $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$orderTotal", 0],
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    // Extract numbers safely
    const extractData = (facetArray) => {
      if (!facetArray || facetArray.length === 0) {
        return { totalOrders: 0, totalRevenue: 0 };
      }
      return {
        totalOrders: facetArray[0].totalOrders || 0,
        totalRevenue: facetArray[0].totalRevenue || 0,
      };
    };

    const today = extractData(result?.todayOrders);
    const yesterday = extractData(result?.yesterdayOrders);

    const thisWeek = extractData(result?.thisWeekOrders);
    const lastWeek = extractData(result?.lastWeekOrders);

    const thisMonth = extractData(result?.thisMonthOrders);
    const lastMonth = extractData(result?.lastMonthOrders);

    const allTime = extractData(result?.allTimeOrders);

    return res.status(200).json({
      success: true,
      data: {
        // Today vs Yesterday
        todayOrders: today.totalOrders,
        todayRevenue: today.totalRevenue,
        yesterdayOrders: yesterday.totalOrders,
        yesterdayRevenue: yesterday.totalRevenue,

        // This Week vs Last Week
        thisWeekOrders: thisWeek.totalOrders,
        thisWeekRevenue: thisWeek.totalRevenue,
        lastWeekOrders: lastWeek.totalOrders,
        lastWeekRevenue: lastWeek.totalRevenue,

        // This Month vs Last Month
        thisMonthOrders: thisMonth.totalOrders,
        thisMonthRevenue: thisMonth.totalRevenue,
        lastMonthOrders: lastMonth.totalOrders,
        lastMonthRevenue: lastMonth.totalRevenue,

        // All Time
        allTimeOrders: allTime.totalOrders,
        allTimeRevenue: allTime.totalRevenue,
      },
    });
  } catch (error) {
    console.error("Error in getAnalytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};

// ==========================================================
// 2. GET LAST 30 DAYS ANALYTICS (DAILY TRENDS & 30-DAY SUMMARY)
// ==========================================================
export const getLast30DaysAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startDate30d = new Date(now);
    startDate30d.setDate(now.getDate() - 29);
    startDate30d.setHours(0, 0, 0, 0);

    // 1. Aggregation pipeline for last 30 days
    const [analyticsResult] = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate30d, $lte: now },
        },
      },
      {
        $facet: {
          // A. 30-day overall summary totals
          summary: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: {
                  $sum: {
                    $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$orderTotal", 0],
                  },
                },
                validOrders: {
                  $sum: {
                    $cond: [{ $ne: ["$orderStatus", "cancelled"] }, 1, 0],
                  },
                },
                deliveredOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0],
                  },
                },
                cancelledOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0],
                  },
                },
              },
            },
          ],

          // B. Daily breakdown grouped by date (YYYY-MM-DD)
          dailyBreakdown: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                orders: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$orderTotal", 0],
                  },
                },
                delivered: {
                  $sum: {
                    $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0],
                  },
                },
                cancelled: {
                  $sum: {
                    $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],

          // C. Payment mode distribution (COD vs Online)
          paymentModes: [
            {
              $group: {
                _id: "$paymentMode",
                orders: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$orderTotal", 0],
                  },
                },
              },
            },
          ],

          // D. Order status breakdown
          orderStatuses: [
            {
              $group: {
                _id: "$orderStatus",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // Format summary numbers
    const summaryData = analyticsResult?.summary?.[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      validOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
    };

    const averageOrderValue =
      summaryData.validOrders > 0
        ? Math.round(summaryData.totalRevenue / summaryData.validOrders)
        : 0;

    // Build map for quick O(1) lookup of daily aggregation
    const dailyMap = {};
    (analyticsResult?.dailyBreakdown || []).forEach((item) => {
      dailyMap[item._id] = {
        orders: item.orders || 0,
        revenue: item.revenue || 0,
        delivered: item.delivered || 0,
        cancelled: item.cancelled || 0,
      };
    });

    // Helper to format date key YYYY-MM-DD
    const formatDateKey = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    // Ensure all 30 days are filled without gaps
    const dailyTrends = [];
    for (let i = 29; i >= 0; i--) {
      const current = new Date(now);
      current.setDate(now.getDate() - i);
      const key = formatDateKey(current);

      dailyTrends.push({
        date: key,
        orders: dailyMap[key]?.orders || 0,
        revenue: dailyMap[key]?.revenue || 0,
        delivered: dailyMap[key]?.delivered || 0,
        cancelled: dailyMap[key]?.cancelled || 0,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders: summaryData.totalOrders,
          totalRevenue: summaryData.totalRevenue,
          validOrders: summaryData.validOrders,
          deliveredOrders: summaryData.deliveredOrders,
          cancelledOrders: summaryData.cancelledOrders,
          averageOrderValue,
          startDate: formatDateKey(startDate30d),
          endDate: formatDateKey(now),
        },
        dailyTrends,
        paymentModes: (analyticsResult?.paymentModes || []).map((p) => ({
          mode: p._id || "unknown",
          orders: p.orders,
          revenue: p.revenue,
        })),
        orderStatuses: (analyticsResult?.orderStatuses || []).map((s) => ({
          status: s._id || "unknown",
          count: s.count,
        })),
      },
    });
  } catch (error) {
    console.error("Error in getLast30DaysAnalytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch last 30 days analytics",
      error: error.message,
    });
  }
};
