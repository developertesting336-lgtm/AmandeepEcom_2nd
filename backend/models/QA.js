import mongoose from "mongoose";

const productQASchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            unique: true,
            index: true,
        },

        questions: [
            {
                question: {
                    type: String,
                    required: true,
                    trim: true,
                },

                askedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },

                answer: {
                    type: String,
                    default: null,
                    trim: true,
                },

                answeredBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    default: null,
                },

                status: {
                    type: String,
                    enum: ["pending", "answered"],
                    default: "pending",
                },

                askedAt: {
                    type: Date,
                    default: Date.now,
                },

                answeredAt: {
                    type: Date,
                    default: null,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const ProductQA = mongoose.model("ProductQA", productQASchema);

export default ProductQA;
