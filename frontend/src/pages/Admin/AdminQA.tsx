import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  MessageCircleQuestion,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  X,
  ExternalLink,
  Send,
  Loader2,
  Edit3,
  User as UserIcon,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAdminQAs,
  answerQuestionApi,
  type QAItem,
} from "../../services/qaService";
import "./AdminQA.css";

const AdminQA: React.FC = () => {
  const [questions, setQuestions] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Inline answering state
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<string>("");
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);

  // 1. Fetch questions from backend
  const loadQuestions = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchAdminQAs({
        status: statusFilter,
        page,
        limit: 15,
      });

      setQuestions(data.questions || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      console.error("Failed to load questions:", error);
      toast.error(error.message || "Failed to load questions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    setAnsweringId(null);
  };

  // 2. Computed KPI Stats
  const stats = useMemo(() => {
    let pending = 0;
    let answered = 0;
    questions.forEach((q) => {
      if (q.status === "pending") pending++;
      else if (q.status === "answered") answered++;
    });

    const answerRate =
      questions.length > 0
        ? Math.round((answered / questions.length) * 100)
        : 100;

    return {
      total: totalCount,
      pending,
      answered,
      answerRate,
    };
  }, [questions, totalCount]);

  // 3. Search filtering (client-side search across question, product name, asker)
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;

    const query = searchQuery.toLowerCase().trim();
    return questions.filter((q) => {
      const qText = q.question?.toLowerCase() || "";
      const pName = q.product?.name?.toLowerCase() || "";
      const uName = q.askedBy?.name?.toLowerCase() || "";
      const uEmail = q.askedBy?.email?.toLowerCase() || "";
      const aText = q.answer?.toLowerCase() || "";

      return (
        qText.includes(query) ||
        pName.includes(query) ||
        uName.includes(query) ||
        uEmail.includes(query) ||
        aText.includes(query)
      );
    });
  }, [questions, searchQuery]);

  // 4. Handle Answer Submission
  const handleStartAnswer = (item: QAItem) => {
    setAnsweringId(item._id);
    setAnswerText(item.answer || "");
  };

  const handleCancelAnswer = () => {
    setAnsweringId(null);
    setAnswerText("");
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answerText.trim()) {
      toast.error("Please enter an answer before publishing");
      return;
    }

    setSubmittingAnswer(true);
    try {
      const res = await answerQuestionApi(questionId, answerText.trim());

      toast.success(res.message || "Answer published successfully!");

      // Update question in local state
      setQuestions((prev) =>
        prev.map((item) =>
          item._id === questionId
            ? {
                ...item,
                answer: answerText.trim(),
                status: "answered",
                answeredAt: new Date().toISOString(),
                answeredBy: res.question?.answeredBy || item.answeredBy,
              }
            : item
        )
      );

      setAnsweringId(null);
      setAnswerText("");
    } catch (error: any) {
      console.error("Failed to answer question:", error);
      toast.error(error.message || "Failed to publish answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Helper to extract product thumbnail
  const getProductImage = (product?: QAItem["product"]): string => {
    if (!product) return "";
    if (product.image) return product.image;
    if (product.images && product.images.length > 0) {
      const first = product.images[0];
      if (typeof first === "string") return first;
      return first?.url || "";
    }
    return "";
  };

  // Helper to format date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-qa-section">
      <div className="qa-container">
        {/* ==========================================
            1. HEADER
            ========================================== */}
        <div className="qa-header">
          <div>
            <span className="qa-eyebrow">CUSTOMER SUPPORT & ENQUIRIES</span>
            <h1>Product Questions & Answers</h1>
            <p>
              Answer customer pre-sales queries, address product doubts, and improve customer confidence.
            </p>
          </div>

          <div className="qa-header-actions">
            <button
              type="button"
              className="qa-refresh-btn"
              onClick={() => loadQuestions(true)}
              disabled={refreshing || loading}
              title="Refresh questions"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* ==========================================
            2. KPI STATS CARDS
            ========================================== */}
        <div className="qa-stats-grid">
          <div className="qa-stat-card">
            <div className="qa-stat-icon purple">
              <MessageCircleQuestion size={22} />
            </div>
            <div className="qa-stat-info">
              <span className="qa-stat-label">Total Questions</span>
              <span className="qa-stat-val">{stats.total}</span>
            </div>
          </div>

          <div className="qa-stat-card">
            <div className="qa-stat-icon amber">
              <Clock size={22} />
            </div>
            <div className="qa-stat-info">
              <span className="qa-stat-label">Pending Answers</span>
              <span className="qa-stat-val">{stats.pending}</span>
            </div>
          </div>

          <div className="qa-stat-card">
            <div className="qa-stat-icon emerald">
              <CheckCircle2 size={22} />
            </div>
            <div className="qa-stat-info">
              <span className="qa-stat-label">Answered</span>
              <span className="qa-stat-val">{stats.answered}</span>
            </div>
          </div>

          <div className="qa-stat-card">
            <div className="qa-stat-icon blue">
              <Sparkles size={22} />
            </div>
            <div className="qa-stat-info">
              <span className="qa-stat-label">Resolution Rate</span>
              <span className="qa-stat-val">{stats.answerRate}%</span>
            </div>
          </div>
        </div>

        {/* ==========================================
            3. FILTER BAR & SEARCH
            ========================================== */}
        <div className="qa-filter-bar">
          <div className="qa-status-tabs">
            <button
              type="button"
              className={`qa-tab-btn ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => handleFilterChange("all")}
            >
              <span>All</span>
              <span className="qa-tab-badge">{stats.total}</span>
            </button>

            <button
              type="button"
              className={`qa-tab-btn pending ${statusFilter === "pending" ? "active" : ""}`}
              onClick={() => handleFilterChange("pending")}
            >
              <span>Pending</span>
              {stats.pending > 0 && (
                <span className="qa-tab-badge">{stats.pending}</span>
              )}
            </button>

            <button
              type="button"
              className={`qa-tab-btn ${statusFilter === "answered" ? "active" : ""}`}
              onClick={() => handleFilterChange("answered")}
            >
              <span>Answered</span>
              {stats.answered > 0 && (
                <span className="qa-tab-badge">{stats.answered}</span>
              )}
            </button>
          </div>

          <div className="qa-search-box">
            <Search size={16} className="qa-search-icon" />
            <input
              type="text"
              className="qa-search-input"
              placeholder="Search by question, product, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="qa-search-clear"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ==========================================
            4. QA CARDS LIST
            ========================================== */}
        {loading ? (
          <div className="qa-loading-state">
            <Loader2 size={36} className="qa-loading-spinner" />
            <p>Loading questions & answers...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="qa-empty-state">
            <div className="qa-empty-icon">
              <HelpCircle size={32} />
            </div>
            <h3>No questions found</h3>
            <p>
              {searchQuery
                ? `No questions match your search "${searchQuery}". Try a different keyword.`
                : statusFilter === "pending"
                ? "Awesome! There are no pending questions waiting for an answer right now."
                : "No customer questions have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="qa-cards-list">
            {filteredQuestions.map((item) => {
              const productImg = getProductImage(item.product);
              const isAnsweringThis = answeringId === item._id;

              return (
                <div
                  key={item._id}
                  className={`qa-card ${
                    item.status === "pending" ? "pending-card" : "answered-card"
                  }`}
                >
                  {/* Product Header Row */}
                  <div className="qa-card-product-header">
                    <div className="qa-product-meta">
                      {productImg ? (
                        <img
                          src={productImg}
                          alt={item.product?.name || "Product"}
                          className="qa-product-thumb"
                        />
                      ) : (
                        <div className="qa-product-thumb-placeholder">
                          <ShoppingBag size={20} />
                        </div>
                      )}

                      <div className="qa-product-title-wrap">
                        {item.productId ? (
                          <Link
                            to={`/product/${item.productId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="qa-product-link"
                          >
                            <span>{item.product?.name || "View Product"}</span>
                            <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <span className="qa-product-link">
                            {item.product?.name || "Product"}
                          </span>
                        )}

                        {item.product?.price && (
                          <span className="qa-product-price">
                            ₹{item.product.salePrice ?? item.product.price}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="qa-header-status">
                      {item.status === "answered" ? (
                        <span className="qa-status-pill answered">
                          <CheckCircle2 size={13} />
                          <span>ANSWERED</span>
                        </span>
                      ) : (
                        <span className="qa-status-pill pending">
                          <Clock size={13} />
                          <span>PENDING ANSWER</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question & Answer Body */}
                  <div className="qa-card-body">
                    {/* The Customer's Question */}
                    <div className="qa-question-block">
                      <div className="qa-q-badge">Q</div>
                      <div className="qa-q-content">
                        <p className="qa-q-text">{item.question}</p>
                        <div className="qa-user-meta">
                          <span className="qa-user-name">
                            <UserIcon size={13} />
                            {item.askedBy?.name || "Customer"}
                          </span>
                          {item.askedBy?.email && (
                            <>
                              <span className="qa-user-dot">•</span>
                              <span>{item.askedBy.email}</span>
                            </>
                          )}
                          <span className="qa-user-dot">•</span>
                          <span>Asked {formatDate(item.askedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Answer Area */}
                    {item.status === "answered" && !isAnsweringThis && (
                      <div className="qa-answer-block">
                        <div className="qa-a-badge">A</div>
                        <div className="qa-a-content">
                          <p className="qa-a-text">{item.answer}</p>

                          <div className="qa-a-footer">
                            <span>
                              Answered by{" "}
                              <strong>
                                {item.answeredBy?.name || "Admin"}
                              </strong>
                              {item.answeredAt && ` on ${formatDate(item.answeredAt)}`}
                            </span>

                            <button
                              type="button"
                              className="qa-edit-btn"
                              onClick={() => handleStartAnswer(item)}
                              title="Edit this answer"
                            >
                              <Edit3 size={13} />
                              <span>Edit Answer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inline Composer if answering or editing */}
                    {isAnsweringThis ? (
                      <div className="qa-inline-composer">
                        <span className="qa-composer-label">
                          <Send size={14} />
                          {item.status === "answered"
                            ? "Update Your Answer"
                            : "Write Answer for Customer"}
                        </span>

                        <textarea
                          className="qa-composer-textarea"
                          rows={3}
                          placeholder="Type a clear, helpful answer to this question..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          maxLength={2000}
                          autoFocus
                        />

                        <div className="qa-composer-footer">
                          <span className="qa-char-count">
                            {answerText.length} / 2000 characters
                          </span>

                          <div className="qa-composer-actions">
                            <button
                              type="button"
                              className="qa-btn-cancel"
                              onClick={handleCancelAnswer}
                              disabled={submittingAnswer}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="qa-btn-submit"
                              onClick={() => handleSubmitAnswer(item._id)}
                              disabled={submittingAnswer || !answerText.trim()}
                            >
                              {submittingAnswer ? (
                                <>
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                  <span>Publishing...</span>
                                </>
                              ) : (
                                <>
                                  <Send size={14} />
                                  <span>
                                    {item.status === "answered"
                                      ? "Update Answer"
                                      : "Publish Answer"}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      item.status === "pending" && (
                        <button
                          type="button"
                          className="qa-answer-trigger-btn"
                          onClick={() => handleStartAnswer(item)}
                        >
                          <Send size={14} />
                          <span>Answer Question</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==========================================
            5. PAGINATION CONTROLS
            ========================================== */}
        {!loading && filteredQuestions.length > 0 && totalPages > 1 && (
          <div className="qa-pagination">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> (
              {totalCount} total questions)
            </span>

            <div className="qa-page-btns">
              <button
                type="button"
                className="qa-page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>

              <button
                type="button"
                className="qa-page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQA;
