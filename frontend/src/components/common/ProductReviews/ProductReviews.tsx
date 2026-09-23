import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  ThumbsUp,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  getProductReviews,
  voteHelpfulReview,
} from "../../../services/reviewService";
import type { ReviewItem } from "../../../services/reviewService";
import { useAuth } from "../../../context/authContext";
import toast from "react-hot-toast";
import "./ProductReviews.css";

export interface ProductReviewsProps {
  productId: string;
  productName: string;
  productImage?: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
}) => {
  const { token } = useAuth();

  // Accordion Dropdown State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Reviews & Stats State
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [ratingsAverage, setRatingsAverage] = useState<number>(0);
  const [ratingsCount, setRatingsCount] = useState<number>(0);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });

  // Filter State
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalFiltered, setTotalFiltered] = useState<number>(0);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [votingReviewId, setVotingReviewId] = useState<string | null>(null);
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});

  // Listen for external open triggers (e.g. clicking rating/reviews links near product title)
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-product-reviews", handleOpenEvent);
    return () => {
      window.removeEventListener("open-product-reviews", handleOpenEvent);
    };
  }, []);

  // Fetch Reviews Function
  const fetchReviews = useCallback(
    async (pageToLoad: number = 1, append: boolean = false) => {
      if (pageToLoad === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const res = await getProductReviews(productId, {
          page: pageToLoad,
          limit: 6,
          stars: selectedStar || undefined,
          sort: "newest",
        });

        if (res.success && res.data) {
          const data = res.data;
          setRatingsAverage(data.ratingsAverage || 0);
          setRatingsCount(data.ratingsCount || 0);

          if (data.ratingDistribution) {
            setRatingDistribution({
              5: data.ratingDistribution[5] || 0,
              4: data.ratingDistribution[4] || 0,
              3: data.ratingDistribution[3] || 0,
              2: data.ratingDistribution[2] || 0,
              1: data.ratingDistribution[1] || 0,
            });
          }

          if (append) {
            setReviews((prev) => [...prev, ...(data.reviews || [])]);
          } else {
            setReviews(data.reviews || []);
          }

          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalFiltered(data.pagination.totalFiltered);
        }
      } catch (err: any) {
        console.error("Error fetching product reviews:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [productId, selectedStar]
  );

  useEffect(() => {
    fetchReviews(1, false);
  }, [fetchReviews]);

  // Load Next Page
  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchReviews(currentPage + 1, true);
    }
  };

  // Upvote Helpful Vote
  const handleVoteHelpful = async (reviewId: string) => {
    if (votedReviews[reviewId]) {
      toast("You already marked this review as helpful", { icon: "👍" });
      return;
    }

    try {
      setVotingReviewId(reviewId);
      const res = await voteHelpfulReview(reviewId, token);

      if (res.success) {
        setVotedReviews((prev) => ({ ...prev, [reviewId]: true }));
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId
              ? { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 }
              : r
          )
        );
        toast.success("Marked as helpful!");
      } else {
        toast.error(res.message || "Could not record vote.");
      }
    } catch (err) {
      toast.error("Failed to submit helpful vote.");
    } finally {
      setVotingReviewId(null);
    }
  };

  // Format Review Date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section
      className={`product-reviews-section ${!isOpen ? "section-collapsed" : ""}`}
      id="product-reviews-container"
    >
      {/* HEADER: TOP PILL ON THE LEFT (CLICKABLE TO OPEN/CLOSE DROPDOWN SECTION) */}
      <div className={`reviews-section-header ${!isOpen ? "header-collapsed" : ""}`}>
        <button
          type="button"
          className={`reviews-toggle-pill ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          title={isOpen ? "Click to collapse reviews" : "Click to view reviews"}
        >
          <span className="pill-text">
            {ratingsCount} {ratingsCount === 1 ? "Review" : "Reviews"}
          </span>
          <ChevronDown
            size={14}
            className={`pill-chevron ${isOpen ? "chevron-open" : ""}`}
          />
        </button>
      </div>

      {/* DROPDOWN OPEN SECTION: LEFT OVERVIEW CARD + RIGHT REVIEW CARDS */}
      {isOpen && (
        <div className="reviews-main-grid">
          {/* LEFT COLUMN: OVERVIEW CARD */}
          <aside className="reviews-overview-sidebar">
            <div className="reviews-overview-card">
              {/* Overall Rating Score */}
              <div className="overall-score-pane">
                <div className="score-number">
                  {ratingsAverage > 0 ? ratingsAverage.toFixed(1) : "0.0"}
                </div>

                <div className="score-stars-row">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const fillAmt = Math.max(0, Math.min(1, ratingsAverage - (star - 1)));
                    return (
                      <div key={star} className="star-wrapper">
                        <Star size={18} className="star-base" />
                        {fillAmt > 0 && (
                          <div
                            className="star-filled-clip"
                            style={{ width: `${fillAmt * 100}%` }}
                          >
                            <Star size={18} className="star-filled" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <span className="score-summary-text">
                  Based on <strong>{ratingsCount}</strong> verified customer{" "}
                  {ratingsCount === 1 ? "review" : "reviews"}
                </span>
              </div>

              {/* Star-by-Star Histogram Breakdown */}
              <div className="distribution-pane">
                <div className="distribution-heading">Rating Breakdown</div>
                <div className="star-breakdown-list">
                  {[5, 4, 3, 2, 1].map((starVal) => {
                    const count = ratingDistribution[starVal] || 0;
                    const percent =
                      ratingsCount > 0 ? Math.round((count / ratingsCount) * 100) : 0;
                    const isFilterActive = selectedStar === starVal;

                    return (
                      <button
                        key={starVal}
                        type="button"
                        className={`star-breakdown-row ${isFilterActive ? "filter-active" : ""}`}
                        onClick={() =>
                          setSelectedStar((prev) => (prev === starVal ? null : starVal))
                        }
                        title={`Filter by ${starVal} Star (${count} reviews)`}
                      >
                        <span className="star-label">
                          <span>{starVal}</span>
                          <Star size={12} className="star-icon-gold" />
                        </span>

                        <div className="progress-bar-track">
                          <div
                            className={`progress-bar-fill star-${starVal}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>

                        <span className="star-count-label">
                          {count}{" "}
                          <span className="percent-muted">({percent}%)</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: REVIEW CARDS */}
          <div className="reviews-list-container">
            {isLoading ? (
              <div className="reviews-loading-state">
                <Loader2 size={26} className="spin" />
                <span>Loading reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="reviews-empty-state">
                <div className="empty-icon-wrap">
                  <Star size={32} />
                </div>
                <h4>
                  {selectedStar !== null
                    ? `No ${selectedStar}-star reviews found`
                    : "No customer reviews yet"}
                </h4>
                <p>
                  {selectedStar !== null
                    ? "Try selecting a different star filter or viewing all reviews."
                    : "Verified buyers can submit reviews from their Orders page once their order is delivered."}
                </p>
                {selectedStar !== null && (
                  <button
                    type="button"
                    className="empty-action-btn"
                    onClick={() => setSelectedStar(null)}
                  >
                    View All Reviews
                  </button>
                )}
              </div>
            ) : (
              <div className="reviews-cards-stack">
                {reviews.map((review) => {
                  const reviewerName = review.userId?.name || "Verified Customer";
                  const userInitial = reviewerName.charAt(0).toUpperCase() || "U";
                  const hasVoted = Boolean(votedReviews[review._id]);
                  const isVoting = votingReviewId === review._id;

                  return (
                    <article key={review._id} className="review-card">
                      {/* Card Header: Reviewer Info & Rating */}
                      <div className="review-card-header">
                        <div className="reviewer-profile">
                          <div className="reviewer-avatar-circle">
                            {userInitial}
                          </div>
                          <div className="reviewer-meta">
                            <span className="reviewer-name">{reviewerName}</span>
                            <div className="verified-badge-row">
                              <CheckCircle2 size={12} className="verified-check" />
                              <span>Verified Purchase</span>
                            </div>
                          </div>
                        </div>

                        <div className="review-meta-right">
                          <div className="review-stars-display">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                className={
                                  s <= review.stars
                                    ? "star-card-active"
                                    : "star-card-idle"
                                }
                              />
                            ))}
                          </div>
                          <span className="review-date-text">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Review Body Text */}
                      <p className="review-body-text">{review.detailedReview}</p>

                      {/* Card Footer: Helpful Voting */}
                      <div className="review-card-footer">
                        <span className="helpful-question">
                          Was this review helpful to you?
                        </span>
                        <button
                          type="button"
                          className={`helpful-vote-btn ${hasVoted ? "voted" : ""}`}
                          onClick={() => handleVoteHelpful(review._id)}
                          disabled={hasVoted || isVoting}
                          title={hasVoted ? "You found this helpful" : "Mark review as helpful"}
                        >
                          {isVoting ? (
                            <Loader2 size={13} className="spin" />
                          ) : (
                            <ThumbsUp size={13} className={hasVoted ? "voted-icon" : ""} />
                          )}
                          <span>Helpful</span>
                          {(review.helpfulVotes || 0) > 0 && (
                            <span className="helpful-counter-badge">
                              {review.helpfulVotes}
                            </span>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {currentPage < totalPages && !isLoading && (
              <div className="load-more-reviews-wrap">
                <button
                  type="button"
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 size={15} className="spin" />
                      <span>Loading more reviews...</span>
                    </>
                  ) : (
                    <span>
                      Load More Reviews ({totalFiltered - reviews.length} remaining)
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
