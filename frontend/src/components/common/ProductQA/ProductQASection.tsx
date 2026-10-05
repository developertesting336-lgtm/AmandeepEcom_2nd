import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircleQuestion,
  Search,
  X,
  Plus,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/authContext";
import {
  fetchProductQAs,
  askQuestionApi,
  type QAItem,
} from "../../../services/qaService";
import "./ProductQASection.css";

export interface ProductQASectionProps {
  productId: string;
  productName: string;
}

export const ProductQASection: React.FC<ProductQASectionProps> = ({
  productId,
  productName,
}) => {
  const { isAuthenticated } = useAuth();

  // Accordion open/close state (opens on click)
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [questions, setQuestions] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAll, setShowAll] = useState<boolean>(false);

  // Ask Question Modal State
  const [askModalOpen, setAskModalOpen] = useState<boolean>(false);
  const [questionText, setQuestionText] = useState<string>("");
  const [submittingQuestion, setSubmittingQuestion] = useState<boolean>(false);

  // 1. Fetch answered questions for this product
  const loadProductQuestions = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetchProductQAs(productId);
      setQuestions(res.questions || []);
    } catch (error: any) {
      console.error("Failed to fetch product Q&As:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProductQuestions();
  }, [loadProductQuestions]);

  // 2. Client-side search filtering
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const query = searchQuery.toLowerCase().trim();
    return questions.filter(
      (q) =>
        q.question?.toLowerCase().includes(query) ||
        q.answer?.toLowerCase().includes(query)
    );
  }, [questions, searchQuery]);

  // Display only first 4 questions unless user toggles "View all"
  const visibleQuestions = useMemo(() => {
    if (showAll || filteredQuestions.length <= 4) {
      return filteredQuestions;
    }
    return filteredQuestions.slice(0, 4);
  }, [filteredQuestions, showAll]);

  // 3. Handle Question Submission
  const handleOpenAskModal = () => {
    setQuestionText("");
    setAskModalOpen(true);
  };

  const handleCloseAskModal = () => {
    if (submittingQuestion) return;
    setAskModalOpen(false);
    setQuestionText("");
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = questionText.trim();

    if (!trimmed) {
      toast.error("Please enter a question");
      return;
    }

    if (trimmed.length < 5) {
      toast.error("Question must be at least 5 characters long");
      return;
    }

    setSubmittingQuestion(true);
    try {
      await askQuestionApi({
        productId,
        question: trimmed,
      });

      toast.success(
        "Question submitted successfully! It will appear once answered."
      );
      handleCloseAskModal();
    } catch (error: any) {
      console.error("Failed to submit question:", error);
      toast.error(error.message || "Failed to submit question");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  return (
    <section
      className={`product-qa-section ${!isOpen ? "section-collapsed" : ""}`}
      id="product-qa-container"
    >
      {/* ==========================================
          1. HEADER: CLICKABLE TOGGLE PILL
          ========================================== */}
      <div className={`pqa-section-header ${!isOpen ? "header-collapsed" : ""}`}>
        <button
          type="button"
          className={`pqa-toggle-pill ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          title={isOpen ? "Click to collapse questions" : "Click to view questions"}
        >
          <MessageCircleQuestion size={16} />
          <span className="pqa-pill-text">
            {questions.length}{" "}
            {questions.length === 1
              ? "Question & Answer"
              : "Questions & Answers"}
          </span>
          <ChevronDown
            size={14}
            className={`pqa-pill-chevron ${isOpen ? "chevron-open" : ""}`}
          />
        </button>

        {isOpen && (
          <button
            type="button"
            className="pqa-ask-btn"
            onClick={handleOpenAskModal}
          >
            <Plus size={15} />
            <span>Ask a Question</span>
          </button>
        )}
      </div>

      {/* ==========================================
          2. EXPANDED CONTENT (VISIBLE ON CLICK)
          ========================================== */}
      {isOpen && (
        <div className="pqa-expanded-body">
          {/* Search Bar */}
          {questions.length > 0 && (
            <div className="pqa-search-bar">
              <Search size={16} className="pqa-search-icon" />
              <input
                type="text"
                className="pqa-search-input"
                placeholder="Have a question? Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="pqa-search-clear"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Questions List */}
          {loading ? (
            <div className="pqa-loading-state">
              <Loader2 size={28} className="animate-spin" color="#7257c2" />
              <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: "13px" }}>
                Loading questions & answers...
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="pqa-empty-state">
              <div className="pqa-empty-icon">
                <HelpCircle size={24} />
              </div>
              <h4>No questions asked yet</h4>
              <p>
                Have doubts about sizing, specifications, or delivery? Be the first to ask!
              </p>
              <button
                type="button"
                className="pqa-ask-btn"
                onClick={handleOpenAskModal}
              >
                <Plus size={15} />
                <span>Ask the First Question</span>
              </button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="pqa-empty-state">
              <div className="pqa-empty-icon">
                <Search size={24} />
              </div>
              <h4>No answers found</h4>
              <p>
                No questions matching "{searchQuery}". Can't find what you need?
              </p>
              <button
                type="button"
                className="pqa-ask-btn"
                onClick={handleOpenAskModal}
              >
                <Plus size={15} />
                <span>Ask a New Question</span>
              </button>
            </div>
          ) : (
            <div className="pqa-list">
              {visibleQuestions.map((item) => (
                <div key={item._id} className="pqa-qa-pair">
                  {/* Question Box: Transparent Blue */}
                  <div className="pqa-box pqa-question-box">
                    <span className="pqa-letter-badge q">Q</span>
                    <p className="pqa-q-text">{item.question}</p>
                  </div>

                  {/* Answer Box Below: Transparent Green (No timestamps/date details) */}
                  {item.answer ? (
                    <div className="pqa-box pqa-answer-box">
                      <span className="pqa-letter-badge a">A</span>
                      <p className="pqa-a-text">{item.answer}</p>
                    </div>
                  ) : (
                    <div className="pqa-box pqa-answer-box">
                      <span className="pqa-letter-badge a">A</span>
                      <p className="pqa-a-text" style={{ fontStyle: "italic", color: "#64748b" }}>
                        Answer pending from seller
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Show More / Show Less Toggle Button */}
              {filteredQuestions.length > 4 && (
                <button
                  type="button"
                  className="pqa-toggle-more-btn"
                  onClick={() => setShowAll((prev) => !prev)}
                >
                  <span>
                    {showAll
                      ? "Show fewer questions"
                      : `View all ${filteredQuestions.length} answered questions`}
                  </span>
                  {showAll ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          3. ASK QUESTION MODAL
          ========================================== */}
      <AnimatePresence>
        {askModalOpen && (
          <div className="pqa-modal-overlay" onClick={handleCloseAskModal}>
            <motion.div
              className="pqa-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18 }}
            >
              <div className="pqa-modal-header">
                <h3>Ask a Question</h3>
                <button
                  type="button"
                  className="pqa-modal-close-btn"
                  onClick={handleCloseAskModal}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="pqa-modal-body">
                {isAuthenticated ? (
                  <form onSubmit={handleSubmitQuestion}>
                    <p className="pqa-modal-subtitle">
                      Ask about <strong>{productName}</strong>. Our team or verified sellers will answer promptly.
                    </p>

                    <textarea
                      className="pqa-modal-textarea"
                      placeholder="e.g., What are the exact dimensions? Is this compatible with...?"
                      rows={4}
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      maxLength={500}
                      autoFocus
                    />

                    <div className="pqa-modal-footer">
                      <span className="pqa-modal-char-count">
                        {questionText.length} / 500 characters
                      </span>

                      <div className="pqa-modal-actions">
                        <button
                          type="button"
                          className="pqa-modal-cancel-btn"
                          onClick={handleCloseAskModal}
                          disabled={submittingQuestion}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="pqa-modal-submit-btn"
                          disabled={submittingQuestion || !questionText.trim()}
                        >
                          {submittingQuestion ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Send size={14} />
                              <span>Submit Question</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="pqa-login-prompt">
                    <p className="pqa-modal-subtitle">
                      Please log in to your account to submit a question about this product.
                    </p>
                    <Link
                      to="/login"
                      className="pqa-login-cta-btn"
                      onClick={handleCloseAskModal}
                    >
                      <LogIn size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                      Log In to Ask
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProductQASection;
