import React, { useState, useEffect } from "react";
import { X, Star, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { checkReviewEligibility, submitReview } from "../../../services/reviewService";
import type { ReviewItem } from "../../../services/reviewService";
import productFallback from "../../../assets/1.jpeg";
import "./ReviewModal.css";

export interface ReviewModalProduct {
  _id: string;
  name: string;
  image?: string;
}

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ReviewModalProduct | null;
  token?: string | null;
  onReviewSuccess?: (review: ReviewItem, isUpdated: boolean) => void;
}

const STAR_LABELS: Record<number, string> = {
  1: "Poor - Disappointed",
  2: "Fair - Needs Improvement",
  3: "Good - Meets Expectations",
  4: "Very Good - Highly Satisfied",
  5: "Excellent - Outstanding Quality!",
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  product,
  token,
  onReviewSuccess,
}) => {
  const [stars, setStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [detailedReview, setDetailedReview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState<boolean>(false);
  const [canReview, setCanReview] = useState<boolean>(true);
  const [existingReview, setExistingReview] = useState<ReviewItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !product?._id) return;

    // Reset state
    setStars(5);
    setHoverStars(0);
    setDetailedReview("");
    setErrorMsg("");
    setSuccessMsg("");
    setExistingReview(null);

    // Fetch existing review and eligibility
    const loadEligibility = async () => {
      setIsLoadingEligibility(true);
      try {
        const res = await checkReviewEligibility(product._id, token);
        setCanReview(res.canReview);

        if (res.hasReviewed && res.review) {
          setExistingReview(res.review);
          setStars(res.review.stars || 5);
          setDetailedReview(res.review.detailedReview || "");
        } else if (!res.canReview) {
          setErrorMsg(res.message || "You can only review products that have been delivered to you.");
        }
      } catch (err: any) {
        console.error("Error checking review eligibility:", err);
      } finally {
        setIsLoadingEligibility(false);
      }
    };

    loadEligibility();
  }, [isOpen, product?._id, token]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (stars < 1 || stars > 5) {
      setErrorMsg("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!detailedReview || detailedReview.trim().length < 5) {
      setErrorMsg("Please write at least 5 characters for your review.");
      return;
    }

    if (detailedReview.trim().length > 2000) {
      setErrorMsg("Review cannot exceed 2000 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitReview(
        {
          productId: product._id,
          stars,
          detailedReview: detailedReview.trim(),
        },
        token
      );

      if (res.success && res.data?.review) {
        const isUpdated = Boolean(res.isUpdated || existingReview);
        setSuccessMsg(
          isUpdated
            ? "Your review has been updated successfully!"
            : "Thank you! Your review has been submitted."
        );

        if (onReviewSuccess) {
          onReviewSuccess(res.data.review, isUpdated);
        }

        // Close modal after brief success feedback
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message || "Failed to submit review. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong while submitting your review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverStars || stars;

  return (
    <div className="review-modal-backdrop" onClick={onClose}>
      <div
        className="review-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="review-modal-header">
          <div className="header-titles">
            <h3 className="modal-heading">
              {existingReview ? "Edit Your Review" : "Rate & Review Product"}
            </h3>
            <span className="modal-subheading">
              Verified Delivered Purchase
            </span>
          </div>
          <button
            type="button"
            className="review-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Product Snippet */}
        <div className="review-product-preview">
          <div className="preview-img-wrap">
            <img
              src={product.image || productFallback}
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = productFallback;
              }}
            />
          </div>
          <div className="preview-details">
            <h4 className="preview-name">{product.name}</h4>
            <span className="preview-badge">Delivered Item</span>
          </div>
        </div>

        {isLoadingEligibility ? (
          <div className="review-modal-loading">
            <Loader2 size={24} className="spin" />
            <span>Loading review details...</span>
          </div>
        ) : !canReview && !existingReview ? (
          <div className="review-not-eligible">
            <AlertCircle size={28} className="warn-icon" />
            <h4>Review Unavailable</h4>
            <p>
              {errorMsg ||
                "You can only submit reviews for products that have been delivered to your address."}
            </p>
            <button type="button" className="close-prompt-btn" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="review-form">
            {/* Star Rating Section */}
            <div className="star-rating-block">
              <label className="section-label">Your Overall Rating</label>
              <div className="stars-interactive-row">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeRating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      className={`star-pick-btn ${isFilled ? "filled" : ""}`}
                      onMouseEnter={() => setHoverStars(starVal)}
                      onMouseLeave={() => setHoverStars(0)}
                      onClick={() => setStars(starVal)}
                      aria-label={`${starVal} Star`}
                    >
                      <Star
                        size={28}
                        className={isFilled ? "star-icon-active" : "star-icon-idle"}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="star-feedback-label">
                {STAR_LABELS[activeRating] || "Click to rate"}
              </div>
            </div>

            {/* Detailed Review Text */}
            <div className="review-text-block">
              <div className="text-label-row">
                <label htmlFor="detailed-review-input" className="section-label">
                  Detailed Review
                </label>
                <span className="char-count">
                  {detailedReview.length} / 2000
                </span>
              </div>
              <textarea
                id="detailed-review-input"
                rows={4}
                className="review-textarea"
                placeholder="What did you like or dislike about this product? How was the build quality, performance, or fit?"
                value={detailedReview}
                onChange={(e) => setDetailedReview(e.target.value)}
                maxLength={2000}
                required
              />
              <span className="input-hint">Minimum 5 characters required</span>
            </div>

            {/* Alert Messages */}
            {errorMsg && (
              <div className="review-alert-banner alert-error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="review-alert-banner alert-success">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="review-modal-actions">
              <button
                type="button"
                className="review-cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="review-submit-btn"
                disabled={isSubmitting || detailedReview.trim().length < 5}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Saving...</span>
                  </>
                ) : existingReview ? (
                  <span>Update Review</span>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
