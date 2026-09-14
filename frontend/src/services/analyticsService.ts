import { API_BASE_URL } from "../config/api";

export interface AnalyticsOverview {
  todayOrders: number;
  todayRevenue: number;
  yesterdayOrders: number;
  yesterdayRevenue: number;
  thisWeekOrders: number;
  thisWeekRevenue: number;
  lastWeekOrders: number;
  lastWeekRevenue: number;
  thisMonthOrders: number;
  thisMonthRevenue: number;
  lastMonthOrders: number;
  lastMonthRevenue: number;
  allTimeOrders: number;
  allTimeRevenue: number;
}

export interface DailyTrendItem {
  date: string;
  orders: number;
  revenue: number;
  delivered: number;
  cancelled: number;
}

export interface PaymentModeAnalytics {
  mode: string;
  orders: number;
  revenue: number;
}

export interface OrderStatusAnalytics {
  status: string;
  count: number;
}

export interface Last30DaysSummary {
  totalOrders: number;
  totalRevenue: number;
  validOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  startDate: string;
  endDate: string;
}

export interface Last30DaysAnalytics {
  summary: Last30DaysSummary;
  dailyTrends: DailyTrendItem[];
  paymentModes: PaymentModeAnalytics[];
  orderStatuses: OrderStatusAnalytics[];
}

export interface AnalyticsOverviewResponse {
  success: boolean;
  data?: AnalyticsOverview;
  message?: string;
  error?: string;
}

export interface Last30DaysAnalyticsResponse {
  success: boolean;
  data?: Last30DaysAnalytics;
  message?: string;
  error?: string;
}

/**
 * Fetch Analytics Overview (Today, Yesterday, This Week, Last Week, This Month, Last Month, All Time)
 */
export const getAnalyticsOverview = async (
  token?: string | null
): Promise<AnalyticsOverviewResponse> => {
  try {
    const authToken = token || localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/admin/analytics/overview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: "include",
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching analytics overview:", error);
    return {
      success: false,
      message: error?.message || "Failed to fetch analytics overview",
    };
  }
};

/**
 * Fetch Last 30 Days Analytics (Daily breakdown, Summary, Payment modes, Order statuses)
 */
export const getLast30DaysAnalytics = async (
  token?: string | null
): Promise<Last30DaysAnalyticsResponse> => {
  try {
    const authToken = token || localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/admin/analytics/last-30-days`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: "include",
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching last 30 days analytics:", error);
    return {
      success: false,
      message: error?.message || "Failed to fetch last 30 days analytics",
    };
  }
};
