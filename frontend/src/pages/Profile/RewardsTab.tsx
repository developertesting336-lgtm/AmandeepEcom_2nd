import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Coins,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  fetchUserRewardHistory,
  type RewardPointTransactionItem,
} from "../../services/rewardService";
import { useAuth } from "../../context/authContext";

export const RewardsTab: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "EARNED" | "REDEEMED">("ALL");
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<RewardPointTransactionItem[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalRedeemed, setTotalRedeemed] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(Number(user?.rewardPoints) || 0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadData = async (activePage: number, activeFilter: "ALL" | "EARNED" | "REDEEMED") => {
    setLoading(true);
    try {
      const res = await fetchUserRewardHistory(
        activePage,
        15,
        activeFilter === "ALL" ? undefined : activeFilter
      );
      if (res.success && res.data) {
        setTransactions(res.data.transactions || []);
        setTotalEarned(res.data.totalEarned || 0);
        setTotalRedeemed(res.data.totalRedeemed || 0);
        setCurrentBalance(res.data.currentBalance ?? (Number(user?.rewardPoints) || 0));
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to load reward points history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page, filterType);
    refreshUser?.();
  }, [page, filterType]);

  const handleFilterChange = (type: "ALL" | "EARNED" | "REDEEMED") => {
    setFilterType(type);
    setPage(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="rewards-tab-wrapper">
      {/* Tab Header */}
      <div className="rewards-header-card">
        <div className="rewards-header-content">
          <div className="rewards-badge-icon">
            <Coins size={28} className="gold-coin-spin" />
          </div>
          <div>
            <h2 className="rewards-title">Reward Points & History</h2>
            <p className="rewards-subtitle">
              Detailed ledger of points earned from friend referrals and points redeemed at checkout.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="rewards-refresh-btn"
          onClick={() => {
            loadData(page, filterType);
            refreshUser?.();
          }}
          title="Refresh Points"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Conversion Banner */}
      <div className="rewards-rate-banner">
        <div className="rewards-rate-left">
          <Sparkles size={18} className="rate-sparkle" />
          <span className="rate-text">
            <strong>Conversion Rate:</strong> 1 Reward Point = ₹1 Rupee (₹1) Discount on your orders!
          </span>
        </div>
        <Link to="/products" className="rate-browse-link">
          <span>Shop & Earn More</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="rewards-stats-grid">
        {/* Available Points */}
        <div className="rewards-stat-card available-card">
          <div className="stat-card-icon-wrap available-icon">
            <Coins size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Current Available Balance</span>
            <div className="stat-card-number">
              {currentBalance.toLocaleString("en-IN")}
              <span className="stat-unit">Pts</span>
            </div>
            <span className="stat-card-sub">
              Worth <strong>₹{currentBalance.toLocaleString("en-IN")} discount</strong> at checkout
            </span>
          </div>
        </div>

        {/* Lifetime Earned */}
        <div className="rewards-stat-card earned-card">
          <div className="stat-card-icon-wrap earned-icon">
            <TrendingUp size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Points Earned</span>
            <div className="stat-card-number text-emerald">
              +{totalEarned.toLocaleString("en-IN")}
              <span className="stat-unit">Pts</span>
            </div>
            <span className="stat-card-sub">From friend referral purchases</span>
          </div>
        </div>

        {/* Total Redeemed */}
        <div className="rewards-stat-card redeemed-card">
          <div className="stat-card-icon-wrap redeemed-icon">
            <ShoppingBag size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Points Redeemed</span>
            <div className="stat-card-number text-amber">
              -{totalRedeemed.toLocaleString("en-IN")}
              <span className="stat-unit">Pts</span>
            </div>
            <span className="stat-card-sub">
              Saved <strong>₹{totalRedeemed.toLocaleString("en-IN")}</strong> on orders
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="rewards-history-section">
        <div className="rewards-section-header">
          <div className="rewards-filter-group">
            <button
              type="button"
              className={`rewards-filter-btn ${filterType === "ALL" ? "active" : ""}`}
              onClick={() => handleFilterChange("ALL")}
            >
              All Activity
              {filterType === "ALL" && totalCount > 0 && (
                <span className="filter-count">{totalCount}</span>
              )}
            </button>
            <button
              type="button"
              className={`rewards-filter-btn ${filterType === "EARNED" ? "active" : ""}`}
              onClick={() => handleFilterChange("EARNED")}
            >
              <ArrowDownLeft size={14} className="filter-icon-in" />
              Points Earned
            </button>
            <button
              type="button"
              className={`rewards-filter-btn ${filterType === "REDEEMED" ? "active" : ""}`}
              onClick={() => handleFilterChange("REDEEMED")}
            >
              <ArrowUpRight size={14} className="filter-icon-out" />
              Points Used
            </button>
          </div>
        </div>

        {/* Transaction Items */}
        {loading ? (
          <div className="rewards-loading-box">
            <RefreshCw size={26} className="animate-spin text-amber" />
            <p>Loading your points ledger...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="rewards-empty-state">
            <div className="empty-coin-box">
              <Coins size={36} />
            </div>
            <h3>No points activity recorded yet</h3>
            <p>
              Share products with friends using your referral link to earn reward points whenever they buy!
            </p>
            <Link to="/products" className="empty-action-btn">
              Explore Products to Share
            </Link>
          </div>
        ) : (
          <div className="rewards-transactions-list">
            {transactions.map((tx) => {
              const isEarned = tx.type === "EARNED";
              return (
                <div
                  key={tx._id}
                  className={`rewards-transaction-item ${isEarned ? "earned-tx" : "redeemed-tx"}`}
                >
                  <div className="tx-left-col">
                    <div className={`tx-icon-bubble ${isEarned ? "earned-bubble" : "redeemed-bubble"}`}>
                      {isEarned ? (
                        <Coins size={17} />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                    </div>

                    <div className="tx-meta-info">
                      <div className="tx-title-row">
                        <span className={`tx-type-pill ${isEarned ? "pill-earned" : "pill-redeemed"}`}>
                          {isEarned ? "Earned Points" : "Redeemed Points"}
                        </span>
                        <span className="tx-time">
                          <Clock size={11} />
                          {formatDate(tx.createdAt)}
                        </span>
                      </div>

                      {/* Single sleek detail line without extra vertical whitespace */}
                      {isEarned ? (
                        <div className="tx-details-line">
                          {tx.buyerName && (
                            <span className="tx-detail-item">
                              <User size={12} />
                              <span>Buyer: <strong className="tx-buyer-name">{tx.buyerName}</strong></span>
                            </span>
                          )}
                          {tx.buyerName && tx.productName && <span className="tx-dot-separator">•</span>}
                          {tx.productName && (
                            <span className="tx-detail-item">
                              <ShoppingBag size={12} />
                              <span>Product: <strong className="tx-product-name">{tx.productName}</strong>{tx.quantity && tx.quantity > 1 ? ` (${tx.quantity}x)` : ""}</span>
                            </span>
                          )}
                          {!tx.buyerName && !tx.productName && (
                            <span className="tx-fallback-text">
                              {(tx.description || `Earned ${tx.points} referral points`).replace(/\s*\(?Order\s*#[^)]*\)?/gi, "").trim()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="tx-details-line">
                          <span className="tx-detail-item tx-redeemed-discount">
                            Discount Applied: <strong>₹{tx.discountAmount || tx.points} OFF</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tx-right-col">
                    <div className={`tx-points-amount ${isEarned ? "amount-plus" : "amount-minus"}`}>
                      {isEarned ? `+${tx.points}` : `-${tx.points}`}
                      <span className="pts-label">Pts</span>
                    </div>
                    <div className="tx-balance-after">
                      Balance: {tx.balanceAfter?.toLocaleString("en-IN") || 0} Pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="rewards-pagination">
            <button
              type="button"
              className="rewards-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span className="rewards-page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="rewards-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsTab;
