import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // The product being reviewed
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
      index: true,
    },

    // The user who wrote the review
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // Rating in stars (1 to 5)
    stars: {
      type: Number,
      required: [true, "Rating (stars) is required"],
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
      alias: "rating",
    },

    // Detailed text review
    detailedReview: {
      type: String,
      required: [true, "Detailed review is required"],
      trim: true,
      minlength: [5, "Detailed review must be at least 5 characters"],
      maxlength: [2000, "Detailed review cannot exceed 2000 characters"],
      alias: "comment",
    },

    // Total count of helpful votes
    helpfulVotes: {
      type: Number,
      default: 0,
      min: [0, "Helpful votes cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==========================================
// INDEXES
// ==========================================

// 1 review per user per product (updates existing review on repeat purchases)
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Optimize querying reviews by product ordered by newest
reviewSchema.index({ productId: 1, createdAt: -1 });

// ==========================================
// STATIC METHODS
// ==========================================

// Recalculate average rating, total review count, and star distribution (1 to 5 stars) on Product
reviewSchema.statics.calculateAverageRating = async function (productId) {
  try {
    const stats = await this.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId.toString()),
        },
      },
      {
        $group: {
          _id: "$productId",
          ratingsCount: { $sum: 1 },
          ratingsAverage: { $avg: "$stars" },
          fiveStar: { $sum: { $cond: [{ $eq: ["$stars", 5] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ["$stars", 4] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $eq: ["$stars", 3] }, 1, 0] } },
          twoStar: { $sum: { $cond: [{ $eq: ["$stars", 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ["$stars", 1] }, 1, 0] } },
        },
      },
    ]);

    const Product = mongoose.model("Product");

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        ratingsAverage: Math.round(stats[0].ratingsAverage * 10) / 10,
        ratingsCount: stats[0].ratingsCount,
        ratingDistribution: {
          5: stats[0].fiveStar || 0,
          4: stats[0].fourStar || 0,
          3: stats[0].threeStar || 0,
          2: stats[0].twoStar || 0,
          1: stats[0].oneStar || 0,
        },
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        ratingsAverage: 0,
        ratingsCount: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    }
  } catch (error) {
    console.error("Error calculating average rating for product:", error);
  }
};

// ==========================================
// MIDDLEWARE HOOKS
// ==========================================

// Automatically update Product ratings when a review is created or updated
reviewSchema.post("save", function () {
  this.constructor.calculateAverageRating(this.productId);
});

// Automatically update Product ratings when a review is deleted
reviewSchema.post(
  "deleteOne",
  { document: true, query: false },
  function () {
    this.constructor.calculateAverageRating(this.productId);
  }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
