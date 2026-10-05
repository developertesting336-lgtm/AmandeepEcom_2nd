import ProductQA from "../models/QA.js";
import Product from "../models/Product.js";
import User from "../models/user.js";
import mongoose from "mongoose";

export const askQuestion = async (req, res) => {
    try {
        const { productId, question } = req.body;
        const userId = req.user._id;

        // 1. Check required fields
        if (!productId || !question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "Product ID and question are required",
            });
        }

        // 2. Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        // 3. Verify product actually exists in the database
        const productExists = await Product.findById(productId);
        if (!productExists) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // 4. Save question with runValidators: true
        const productQA = await ProductQA.findOneAndUpdate(
            { productId },
            {
                $push: {
                    questions: {
                        question: question.trim(),
                        askedBy: userId,
                    },
                },
            },
            { upsert: true, new: true, runValidators: true }
        );

        return res.status(201).json({
            success: true,
            message: "Question submitted successfully",
            productQA,
        });
    } catch (error) {
        console.error("Error in askQuestion:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

// =====================================================
// 2. ANSWER QUESTION (Admin Only)
// Route: POST /api/qa/answer/:id
// =====================================================
export const answerQuestion = async (req, res) => {
    try {
        const { id: questionId } = req.params;
        const { answer } = req.body;
        const adminId = req.user._id;

        // 1. Validate answer body
        if (!answer || !answer.trim()) {
            return res.status(400).json({
                success: false,
                message: "Answer content is required",
            });
        }

        // 2. Validate question ID format
        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question ID",
            });
        }

        // 3. Find and update the specific question in the questions array
        const productQA = await ProductQA.findOneAndUpdate(
            { "questions._id": questionId },
            {
                $set: {
                    "questions.$.answer": answer.trim(),
                    "questions.$.answeredBy": adminId,
                    "questions.$.status": "answered",
                    "questions.$.answeredAt": new Date(),
                },
            },
            { new: true, runValidators: true }
        )
            .populate("productId", "name image images price")
            .populate("questions.askedBy", "name email")
            .populate("questions.answeredBy", "name email");

        if (!productQA) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }

        // Retrieve the updated question subdocument
        const updatedQuestion = productQA.questions.find(
            (q) => q._id.toString() === questionId
        );

        return res.status(200).json({
            success: true,
            message: "Answer submitted successfully",
            question: updatedQuestion,
            productQA,
        });
    } catch (error) {
        console.error("Error in answerQuestion:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

// =====================================================
// 3. GET QUESTIONS FOR A PRODUCT (Public / Optional Auth)
// Route: GET /api/qa/product/:id
// =====================================================
export const getProductQAs = async (req, res) => {
    try {
        const { id: productId } = req.params;

        // 1. Validate product ID format
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        // 2. Fetch Q&A document for the product
        const productQA = await ProductQA.findOne({ productId })
            .populate("productId", "name image images")
            .populate("questions.askedBy", "name")
            .populate("questions.answeredBy", "name");

        if (!productQA || !productQA.questions || productQA.questions.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                questions: [],
            });
        }

        // 3. Filter to only get and show questions where status is "answered"
        let questions = productQA.questions.filter(
            (q) => q.status === "answered"
        );

        // Optional: If an admin explicitly passes ?all=true, allow viewing pending questions too
        if (req.user?.role === "admin" && req.query.all === "true") {
            questions = productQA.questions;
        }

        // 4. Sort questions (newest first)
        questions.sort((a, b) => new Date(b.askedAt) - new Date(a.askedAt));

        return res.status(200).json({
            success: true,
            count: questions.length,
            productId,
            product: productQA.productId,
            questions,
        });
    } catch (error) {
        console.error("Error in getProductQAs:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

// =====================================================
// 4. GET ALL QUESTIONS ACROSS PRODUCTS (Admin Only)
// Route: GET /api/qa/all
// Supports: ?status=pending|answered&page=1&limit=10
// =====================================================
export const getAllQAs = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const matchStage = {};
        if (status && ["pending", "answered"].includes(status)) {
            matchStage["questions.status"] = status;
        }

        const pipeline = [
            { $unwind: "$questions" },
        ];

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push(
            { $sort: { "questions.askedAt": -1 } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: skip },
                        { $limit: limitNum },
                        {
                            $lookup: {
                                from: Product.collection.name,
                                localField: "productId",
                                foreignField: "_id",
                                as: "product",
                                pipeline: [
                                    { $project: { name: 1, images: 1, image: 1, price: 1 } },
                                ],
                            },
                        },
                        {
                            $unwind: {
                                path: "$product",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $lookup: {
                                from: User.collection.name,
                                localField: "questions.askedBy",
                                foreignField: "_id",
                                as: "askedByUser",
                                pipeline: [
                                    { $project: { name: 1, email: 1 } },
                                ],
                            },
                        },
                        {
                            $unwind: {
                                path: "$askedByUser",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $lookup: {
                                from: User.collection.name,
                                localField: "questions.answeredBy",
                                foreignField: "_id",
                                as: "answeredByUser",
                                pipeline: [
                                    { $project: { name: 1, email: 1 } },
                                ],
                            },
                        },
                        {
                            $unwind: {
                                path: "$answeredByUser",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $project: {
                                _id: "$questions._id",
                                productId: "$productId",
                                product: "$product",
                                question: "$questions.question",
                                askedBy: "$askedByUser",
                                answer: "$questions.answer",
                                answeredBy: "$answeredByUser",
                                status: "$questions.status",
                                askedAt: "$questions.askedAt",
                                answeredAt: "$questions.answeredAt",
                            },
                        },
                    ],
                },
            }
        );

        const [result] = await ProductQA.aggregate(pipeline);
        const total = result?.metadata[0]?.total || 0;
        const questions = result?.data || [];

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            questions,
        });
    } catch (error) {
        console.error("Error in getAllQAs:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};
