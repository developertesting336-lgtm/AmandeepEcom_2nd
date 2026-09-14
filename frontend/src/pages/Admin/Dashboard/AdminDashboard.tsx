import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Users,
  Plus,
  ArrowRight,
  Layers,
  Eye,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  Calendar,
  DollarSign,
  Activity,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { getAdminOrders } from "../../../services/orderService";
import type { UserOrder } from "../../../services/orderService";
import {
  getAnalyticsOverview,
  getLast30DaysAnalytics,
  type AnalyticsOverview,
  type Last30DaysAnalytics,
} from "../../../services/analyticsService";
import "./AdminDashboard.css";

// Helper to format date "YYYY-MM-DD" to "MMM DD" (e.g. "Aug 20")
const formatChartDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  } catch {
    // fallback
  }
  return dateStr;
};

// Helper for Growth Calculations
const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) {
    if (current > 0) return { text: "+100%", isPositive: true };
    return { text: "0.0%", isPositive: true };
  }
  const diff = ((current - previous) / previous) * 100;
  const isPositive = diff >= 0;
  return {
    text: `${isPositive ? "+" : ""}${diff.toFixed(1)}%`,
    isPositive,
  };
};

// Status Colors Config
const STATUS_COLORS: Record<string, { color: string; label: string }> = {
  confirmed: { color: "#6366f1", label: "Confirmed" },
  delivered: { color: "#10b981", label: "Delivered" },
  shipped: { color: "#8b5cf6", label: "Shipped" },
  processing: { color: "#3b82f6", label: "Processing" },
  cancelled: { color: "#ef4444", label: "Cancelled" },
  unknown: { color: "#94a3b8", label: "Other" },
};

// Custom Glassmorphic Tooltip for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-recharts-tooltip">
        <div className="tooltip-date">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div className="tooltip-item" key={`item-${index}`}>
            <span className="tooltip-item-label">
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: entry.color,
                }}
              />
              {entry.name}:
            </span>
            <span className="tooltip-item-val">
              {entry.name.toLowerCase().includes("revenue")
                ? `₹${Number(entry.value).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard: React.FC = () => {
  const [recentOrders, setRecentOrders] = useState<UserOrder[]>([]);
  const [overviewData, setOverviewData] = useState<AnalyticsOverview | null>(null);
  const [last30DaysData, setLast30DaysData] = useState<Last30DaysAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // View state switchers
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "today" | "week" | "month" | "all"
  >("month");
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders" | "both">(
    "both"
  );

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      const token = localStorage.getItem("token");

      const [ordersRes, overviewRes, last30DaysRes] = await Promise.all([
        getAdminOrders(token),
        getAnalyticsOverview(token),
        getLast30DaysAnalytics(token),
      ]);

      if (ordersRes?.success && Array.isArray(ordersRes.orders)) {
        setRecentOrders(ordersRes.orders.slice(0, 5));
      }

      if (overviewRes?.success && overviewRes.data) {
        setOverviewData(overviewRes.data);
      }

      if (last30DaysRes?.success && last30DaysRes.data) {
        setLast30DaysData(last30DaysRes.data);
      }
    } catch (error) {
      console.error("Dashboard real data load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Formatted Daily 30-Day Trends for Recharts
  const chartTrendsData = useMemo(() => {
    if (!last30DaysData?.dailyTrends) return [];
    return last30DaysData.dailyTrends.map((item) => ({
      date: formatChartDate(item.date),
      fullDate: item.date,
      revenue: item.revenue || 0,
      orders: item.orders || 0,
      delivered: item.delivered || 0,
      cancelled: item.cancelled || 0,
    }));
  }, [last30DaysData]);

  // Real Payment Modes Distribution
  const paymentModesData = useMemo(() => {
    if (!last30DaysData?.paymentModes || last30DaysData.paymentModes.length === 0) {
      return [];
    }
    const totalRev = last30DaysData.paymentModes.reduce((acc, curr) => acc + (curr.revenue || 0), 0) || 1;

    return last30DaysData.paymentModes.map((item) => {
      const isCod = item.mode?.toLowerCase() === "cod";
      const percent = Math.round(((item.revenue || 0) / totalRev) * 100);
      return {
        name: isCod ? "Cash on Delivery (COD)" : "Online Payments",
        value: percent,
        amount: item.revenue || 0,
        orders: item.orders || 0,
        color: isCod ? "#10b981" : "#6366f1",
      };
    });
  }, [last30DaysData]);

  // Real Order Status Pipeline Breakdown
  const statusPipelineData = useMemo(() => {
    if (!last30DaysData?.orderStatuses || last30DaysData.orderStatuses.length === 0) {
      return [];
    }
    const totalCount = last30DaysData.orderStatuses.reduce((acc, curr) => acc + (curr.count || 0), 0) || 1;

    return last30DaysData.orderStatuses
      .slice()
      .sort((a, b) => b.count - a.count)
      .map((item) => {
        const config = STATUS_COLORS[item.status.toLowerCase()] || {
          color: "#64748b",
          label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        };
        const percentage = Math.round(((item.count || 0) / totalCount) * 100);
        return {
          status: config.label,
          count: item.count,
          percentage,
          color: config.color,
        };
      });
  }, [last30DaysData]);

  // Real Dynamic KPI Metrics based on selected timeframe
  const kpiMetrics = useMemo(() => {
    const ov = overviewData || {
      todayOrders: 0,
      todayRevenue: 0,
      yesterdayOrders: 0,
      yesterdayRevenue: 0,
      thisWeekOrders: 0,
      thisWeekRevenue: 0,
      lastWeekOrders: 0,
      lastWeekRevenue: 0,
      thisMonthOrders: 0,
      thisMonthRevenue: 0,
      lastMonthOrders: 0,
      lastMonthRevenue: 0,
      allTimeOrders: 0,
      allTimeRevenue: 0,
    };
    const sum = last30DaysData?.summary || {
      totalOrders: 0,
      totalRevenue: 0,
      validOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      averageOrderValue: 0,
      startDate: "",
      endDate: "",
    };

    if (selectedTimeframe === "today") {
      const growthRev = calculateGrowth(ov.todayRevenue, ov.yesterdayRevenue);
      const growthOrd = calculateGrowth(ov.todayOrders, ov.yesterdayOrders);
      return {
        revenue: ov.todayRevenue,
        revenueGrowth: growthRev.text,
        isRevPositive: growthRev.isPositive,
        orders: ov.todayOrders,
        ordersGrowth: growthOrd.text,
        isOrdPositive: growthOrd.isPositive,
        aov: ov.todayOrders > 0 ? Math.round(ov.todayRevenue / ov.todayOrders) : 0,
        validOrders: ov.todayOrders,
        deliveryRate: ov.todayOrders > 0 ? "100%" : "0%",
        label: "Today vs Yesterday",
      };
    }

    if (selectedTimeframe === "week") {
      const growthRev = calculateGrowth(ov.thisWeekRevenue, ov.lastWeekRevenue);
      const growthOrd = calculateGrowth(ov.thisWeekOrders, ov.lastWeekOrders);
      return {
        revenue: ov.thisWeekRevenue,
        revenueGrowth: growthRev.text,
        isRevPositive: growthRev.isPositive,
        orders: ov.thisWeekOrders,
        ordersGrowth: growthOrd.text,
        isOrdPositive: growthOrd.isPositive,
        aov: ov.thisWeekOrders > 0 ? Math.round(ov.thisWeekRevenue / ov.thisWeekOrders) : 0,
        validOrders: ov.thisWeekOrders,
        deliveryRate: ov.thisWeekOrders > 0 ? "100%" : "0%",
        label: "This Week vs Last Week",
      };
    }

    if (selectedTimeframe === "all") {
      return {
        revenue: ov.allTimeRevenue,
        revenueGrowth: "+100%",
        isRevPositive: true,
        orders: ov.allTimeOrders,
        ordersGrowth: "+100%",
        isOrdPositive: true,
        aov: ov.allTimeOrders > 0 ? Math.round(ov.allTimeRevenue / ov.allTimeOrders) : 0,
        validOrders: sum.validOrders,
        deliveryRate: ov.allTimeOrders > 0 ? `${Math.round((sum.validOrders / ov.allTimeOrders) * 100)}%` : "0%",
        label: "All Time Aggregate",
      };
    }

    // Default: "month"
    const growthRev = calculateGrowth(ov.thisMonthRevenue, ov.lastMonthRevenue);
    const growthOrd = calculateGrowth(ov.thisMonthOrders, ov.lastMonthOrders);
    const validRate = sum.totalOrders > 0 ? Math.round((sum.validOrders / sum.totalOrders) * 100) : 0;

    return {
      revenue: ov.thisMonthRevenue,
      revenueGrowth: growthRev.text,
      isRevPositive: growthRev.isPositive,
      orders: ov.thisMonthOrders,
      ordersGrowth: growthOrd.text,
      isOrdPositive: growthOrd.isPositive,
      aov: sum.averageOrderValue || (ov.thisMonthOrders > 0 ? Math.round(ov.thisMonthRevenue / ov.thisMonthOrders) : 0),
      validOrders: sum.validOrders,
      deliveryRate: `${validRate}%`,
      label: "This Month vs Last Month",
    };
  }, [selectedTimeframe, overviewData, last30DaysData]);

  if (loading && !overviewData && !last30DaysData) {
    return (
      <main className="admin-dashboard" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Loader2 size={36} className="spin-icon" style={{ color: "#4f46e5" }} />
          <p style={{ color: "#64748b", fontWeight: 600, fontSize: 14 }}>Loading Admin Analytics...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      {/* =====================================================
          HEADER SECTION WITH REAL TIMEFRAME SELECTOR
      ===================================================== */}
      <header className="admin-header">
        <div className="admin-header-main">
          <span className="admin-eyebrow">
            <ShieldCheck size={14} strokeWidth={2.5} />
            EXECUTIVE CONTROL CENTER
          </span>
          <h1 className="admin-title">Admin Intelligence & Analytics</h1>
          <p className="admin-subtext">
            Live order intelligence, revenue curves, payment splits, and store management modules.
          </p>
        </div>

        <div className="admin-header-actions">
          {/* Timeframe pill selector */}
          <div className="timeframe-pill-group">
            <button
              type="button"
              className={`timeframe-pill-btn ${selectedTimeframe === "today" ? "active" : ""}`}
              onClick={() => setSelectedTimeframe("today")}
            >
              Today
            </button>
            <button
              type="button"
              className={`timeframe-pill-btn ${selectedTimeframe === "week" ? "active" : ""}`}
              onClick={() => setSelectedTimeframe("week")}
            >
              This Week
            </button>
            <button
              type="button"
              className={`timeframe-pill-btn ${selectedTimeframe === "month" ? "active" : ""}`}
              onClick={() => setSelectedTimeframe("month")}
            >
              This Month
            </button>
            <button
              type="button"
              className={`timeframe-pill-btn ${selectedTimeframe === "all" ? "active" : ""}`}
              onClick={() => setSelectedTimeframe("all")}
            >
              All Time
            </button>
          </div>

          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            title="Refresh analytics data"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "spin-icon" : ""}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </header>

      {/* =====================================================
          REAL KPI STAT CARDS (DYNAMIC FROM BACKEND)
      ===================================================== */}
      <section className="admin-stats">
        {/* Card 1: Revenue */}
        <div className="admin-stat">
          <div className="admin-stat-top">
            <div className="admin-stat-icon icon-revenue">
              <DollarSign size={20} strokeWidth={2.4} />
            </div>
            <span
              className={`stat-trend ${kpiMetrics.isRevPositive ? "positive" : "warning"}`}
            >
              {kpiMetrics.isRevPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {kpiMetrics.revenueGrowth}
            </span>
          </div>
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">
            ₹{Number(kpiMetrics.revenue).toLocaleString("en-IN", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="stat-hint">{kpiMetrics.label}</span>
        </div>

        {/* Card 2: Total Orders */}
        <div className="admin-stat">
          <div className="admin-stat-top">
            <div className="admin-stat-icon icon-orders">
              <ShoppingBag size={20} strokeWidth={2.4} />
            </div>
            <span
              className={`stat-trend ${kpiMetrics.isOrdPositive ? "positive" : "warning"}`}
            >
              {kpiMetrics.isOrdPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {kpiMetrics.ordersGrowth}
            </span>
          </div>
          <span className="stat-label">Orders Placed</span>
          <span className="stat-value">{kpiMetrics.orders} Orders</span>
          <span className="stat-hint">{kpiMetrics.label}</span>
        </div>

        {/* Card 3: Average Order Value */}
        <div className="admin-stat">
          <div className="admin-stat-top">
            <div className="admin-stat-icon icon-aov">
              <Activity size={20} strokeWidth={2.4} />
            </div>
            <span className="stat-trend positive">
              <TrendingUp size={12} />
              AOV
            </span>
          </div>
          <span className="stat-label">Avg Order Value (AOV)</span>
          <span className="stat-value">
            ₹{Number(kpiMetrics.aov).toLocaleString("en-IN")}
          </span>
          <span className="stat-hint">Per completed transaction</span>
        </div>

        {/* Card 4: Valid Order Rate */}
        <div className="admin-stat">
          <div className="admin-stat-top">
            <div className="admin-stat-icon icon-delivery">
              <CheckCircle2 size={20} strokeWidth={2.4} />
            </div>
            <span className="stat-trend positive">
              <TrendingUp size={12} />
              {kpiMetrics.validOrders} Valid
            </span>
          </div>
          <span className="stat-label">Order Success Rate</span>
          <span className="stat-value">{kpiMetrics.deliveryRate}</span>
          <span className="stat-hint">
            {last30DaysData?.summary?.cancelledOrders || 0} cancelled orders
          </span>
        </div>
      </section>

      {/* =====================================================
          PRIMARY RECHARTS SECTION: 30-DAY DAILY SALES TRENDS
      ===================================================== */}
      <section className="admin-charts-grid">
        {/* Main Sales Trend Area Chart */}
        <div className="admin-chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title-wrap">
              <span className="chart-badge-tag">
                <Calendar size={12} />
                30-DAY REVENUE VELOCITY
              </span>
              <h2 className="chart-card-title">Daily Sales & Order Volume</h2>
              <p className="chart-card-subtitle">
                Aug 16 – Sep 14 continuous timeline of revenue (₹) and daily orders.
              </p>
            </div>

            {/* Toggle metric */}
            <div className="chart-toggle-controls">
              <button
                type="button"
                className={`chart-toggle-btn ${chartMetric === "both" ? "active" : ""}`}
                onClick={() => setChartMetric("both")}
              >
                Combined
              </button>
              <button
                type="button"
                className={`chart-toggle-btn ${chartMetric === "revenue" ? "active" : ""}`}
                onClick={() => setChartMetric("revenue")}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                className={`chart-toggle-btn ${chartMetric === "orders" ? "active" : ""}`}
                onClick={() => setChartMetric("orders")}
              >
                Orders
              </button>
            </div>
          </div>

          <div className="chart-container-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartTrendsData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  {/* Revenue Gradient */}
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Orders Gradient */}
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  interval={2}
                />

                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`
                  }
                />

                {chartMetric === "both" && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#10b981", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                )}

                <Tooltip content={<CustomChartTooltip />} />

                {(chartMetric === "revenue" || chartMetric === "both") && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Daily Revenue (₹)"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                )}

                {(chartMetric === "orders" || chartMetric === "both") && (
                  <Area
                    yAxisId={chartMetric === "both" ? "right" : "left"}
                    type="monotone"
                    dataKey="orders"
                    name="Daily Orders"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#ordersGrad)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Payment Modes Donut Chart */}
        <div className="admin-chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title-wrap">
              <span className="chart-badge-tag">
                <CreditCard size={12} />
                PAYMENT SPLIT
              </span>
              <h2 className="chart-card-title">Payment Methods</h2>
              <p className="chart-card-subtitle">
                Revenue distribution between COD & Online Prepaid.
              </p>
            </div>
          </div>

          <div className="chart-container-wrap" style={{ height: 210 }}>
            {paymentModesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentModesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {paymentModesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `${value}% (₹${Number(item.payload.amount).toLocaleString("en-IN", { minimumFractionDigits: 1 })})`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8", fontSize: 13 }}>
                No payment data available
              </div>
            )}
          </div>

          <div className="donut-legend-wrap">
            {paymentModesData.map((item, idx) => (
              <div key={idx} className="donut-legend-row">
                <div className="donut-legend-left">
                  <span
                    className="donut-dot"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
                <div className="donut-legend-right">
                  <span className="donut-legend-amount">
                    ₹{Number(item.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="donut-legend-percent">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          SECONDARY ROW: REAL STATUS PIPELINE & BAR CHART
      ===================================================== */}
      <section className="admin-secondary-charts">
        {/* Real Order Fulfillment Pipeline */}
        <div className="admin-chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title-wrap">
              <span className="chart-badge-tag">
                <ShoppingBag size={12} />
                LIFECYCLE STATUS
              </span>
              <h2 className="chart-card-title">Order Status Distribution</h2>
              <p className="chart-card-subtitle">
                Breakdown of total platform orders by current stage.
              </p>
            </div>
          </div>

          <div className="status-progress-list">
            {statusPipelineData.length > 0 ? (
              statusPipelineData.map((s, idx) => (
                <div key={idx} className="status-progress-item">
                  <div className="status-progress-header">
                    <span>{s.status}</span>
                    <span
                      className="status-progress-badge"
                      style={{
                        color: s.color,
                        backgroundColor: `${s.color}15`,
                      }}
                    >
                      {s.count} orders ({s.percentage}%)
                    </span>
                  </div>
                  <div className="status-progress-track">
                    <div
                      className="status-progress-bar"
                      style={{
                        width: `${s.percentage}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "20px 0", color: "#94a3b8", fontSize: 13, textAlign: "center" }}>
                No status data available
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Order Volume Breakdown (Delivered vs Cancelled) */}
        <div className="admin-chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title-wrap">
              <span className="chart-badge-tag">
                <Activity size={12} />
                RECENT ACTIVITY
              </span>
              <h2 className="chart-card-title">Recent Order Activity</h2>
              <p className="chart-card-subtitle">
                Daily activity comparison across recent active periods.
              </p>
            </div>
          </div>

          <div className="chart-container-wrap" style={{ height: 210 }}>
            {chartTrendsData.filter((d) => d.orders > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartTrendsData.filter((d) => d.orders > 0).slice(-7)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar
                    dataKey="orders"
                    name="Orders"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="cancelled"
                    name="Cancelled"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8", fontSize: 13 }}>
                No recent activity records
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          STORE MANAGEMENT MODULE SHORTCUTS
      ===================================================== */}
      <div className="section-title-wrap">
        <span className="admin-eyebrow">
          <ShieldCheck size={14} strokeWidth={2.5} />
          NAVIGATION
        </span>
        <h2>Store Management Modules</h2>
        <p>Quick shortcuts to manage different sections of your platform</p>
      </div>

      <section className="admin-content">
        {/* Products Panel */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div className="panel-badge-icon blue">
              <Package size={20} />
            </div>
            <p className="panel-tag">CATALOG</p>
          </div>
          <h2>Product Management</h2>
          <span>
            Add new products, edit descriptions, adjust pricing, stock levels,
            and upload gallery images.
          </span>
          <div className="panel-footer-links">
            <Link to="/admin/products" className="admin-panel-link">
              <span>View Product List</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/admin/add/product" className="panel-sub-action">
              <Plus size={13} /> Add
            </Link>
          </div>
        </div>

        {/* Categories Panel */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div className="panel-badge-icon purple">
              <Layers size={20} />
            </div>
            <p className="panel-tag">TAXONOMY</p>
          </div>
          <h2>Category Management</h2>
          <span>
            Create and organize categories, upload category icons, and structure
            the product navigation hierarchy.
          </span>
          <div className="panel-footer-links">
            <Link to="/admin/categories" className="admin-panel-link">
              <span>Manage Categories</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Orders Panel */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div className="panel-badge-icon emerald">
              <ShoppingBag size={20} />
            </div>
            <p className="panel-tag">FULFILLMENT</p>
          </div>
          <h2>Order Management</h2>
          <span>
            Inspect customer purchases, update delivery & shipping milestones,
            and process refunds.
          </span>
          <div className="panel-footer-links">
            <Link to="/admin/orders" className="admin-panel-link">
              <span>View All Orders</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Users Panel */}
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div className="panel-badge-icon amber">
              <Users size={20} />
            </div>
            <p className="panel-tag">ACCESS & ROLES</p>
          </div>
          <h2>User Management</h2>
          <span>
            View registered customer profiles, inspect authentication providers,
            and toggle account active status.
          </span>
          <div className="panel-footer-links">
            <Link to="/admin/users" className="admin-panel-link">
              <span>Manage Platform Users</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          RECENT ORDERS OVERVIEW TABLE
      ===================================================== */}
      {recentOrders.length > 0 && (
        <section className="admin-recent-orders-section">
          <div className="recent-orders-header">
            <div>
              <span className="admin-eyebrow">ACTIVITY FEED</span>
              <h2>Recent Orders</h2>
            </div>
            <Link to="/admin/orders" className="view-all-link">
              <span>View All Orders</span>
              <ExternalLink size={14} />
            </Link>
          </div>

          <div className="recent-orders-table-wrapper">
            <table className="recent-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => {
                  const orderId = ord._id || ord.orderId || "";
                  const customerName =
                    ord.shippingAddress?.fullName ||
                    ord.address?.fullName ||
                    ord.user?.name ||
                    "Customer";
                  const dateStr = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  const status = ord.orderStatus || "Processing";

                  return (
                    <tr key={orderId}>
                      <td>
                        <span className="order-id-cell">
                          #{orderId.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong>{customerName}</strong>
                      </td>
                      <td>{dateStr}</td>
                      <td>
                        <span
                          className={`order-status-pill ${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to="/admin/orders"
                          className="order-action-link"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
};

export default AdminDashboard;