import Inquiry from "../models/Inquiry.js";

// ==========================================
// 1. SUBMIT A NEW CONTACT INQUIRY (Public / User)
// ==========================================
export const submitInquiry = async (req, res) => {
  try {
    const { name, email, phone, category, subject, orderId, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject is required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const userId = req.user?._id || null;

    const newInquiry = await Inquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : "",
      category: category || "general",
      subject: subject.trim(),
      orderId: orderId ? orderId.trim() : "",
      message: message.trim(),
      userId,
      status: "unread",
    });

    return res.status(201).json({
      success: true,
      message: "Your inquiry has been received! Our support team will get back to you shortly.",
      inquiry: {
        id: newInquiry._id,
        name: newInquiry.name,
        email: newInquiry.email,
        subject: newInquiry.subject,
        category: newInquiry.category,
        createdAt: newInquiry.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error in submitInquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit inquiry. Please try again later.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. GET ALL INQUIRIES (Admin)
// ==========================================
export const getAllInquiries = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (category && category !== "all") {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { orderId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const inquiries = await Inquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email");

    const total = await Inquiry.countDocuments(query);

    return res.status(200).json({
      success: true,
      inquiries,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllInquiries:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries",
      error: error.message,
    });
  }
};

// ==========================================
// 3. GET SINGLE INQUIRY (Admin)
// ==========================================
export const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await Inquiry.findById(id).populate("userId", "name email");

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      inquiry,
    });
  } catch (error) {
    console.error("Error in getInquiryById:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inquiry details",
      error: error.message,
    });
  }
};

// ==========================================
// 4. UPDATE INQUIRY STATUS / NOTES (Admin)
// ==========================================
export const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const updated = await Inquiry.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inquiry updated successfully",
      inquiry: updated,
    });
  } catch (error) {
    console.error("Error in updateInquiryStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update inquiry",
      error: error.message,
    });
  }
};

// ==========================================
// 5. DELETE INQUIRY (Admin)
// ==========================================
export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Inquiry.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteInquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete inquiry",
      error: error.message,
    });
  }
};
