
import mongoose from "mongoose";

const userViewProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    viewedProducts: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            viewCount: { type: Number, default: 1 },
            lastViewedAt: { type: Date, default: Date.now }
        }
    ],

    // category is a ref to Category, not a string — must match your Product schema
    categoryPreferences: [
        {
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
                required: true
            },
            viewCount: { type: Number, default: 1 }
        }
    ],

    priceRangePreferences: [
        {
            min: { type: Number, required: true },
            max: { type: Number, required: true },
            viewCount: { type: Number, default: 1 }
        }
    ],

    updatedAt: { type: Date, default: Date.now }
});

const UserViewProfile = mongoose.model("UserViewProfile", userViewProfileSchema);

export default UserViewProfile;