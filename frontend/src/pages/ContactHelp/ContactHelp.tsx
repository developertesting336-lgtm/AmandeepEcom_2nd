import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  CheckCircle2,
  Search,
  X,
  ChevronDown,
  Send,
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";
import { submitContactInquiry } from "../../services/contactService";
import Footer from "../Home/footersection";
import "./ContactHelp.css";

interface FaqItem {
  id: string;
  category: "orders" | "shipping" | "returns" | "payments" | "account";
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: "faq-1",
    category: "orders",
    question: "How can I track my order status?",
    answer:
      "You can track your order in real time by visiting the 'My Orders' section from your account menu. Once your package is dispatched, tracking details and courier updates will be displayed on the order timeline.",
  },
  {
    id: "faq-2",
    category: "orders",
    question: "Can I modify or cancel an order after placing it?",
    answer:
      "Orders can be cancelled or modified within 30 minutes of placement as long as they have not yet entered the fulfillment and packing stage. Please check your order details page or reach out to our team immediately.",
  },
  {
    id: "faq-3",
    category: "shipping",
    question: "What are your delivery timeframes and shipping costs?",
    answer:
      "Standard shipping typically arrives within 3 to 5 business days, with free shipping on orders over $50. Express shipping delivers within 1 to 2 business days. Precise delivery estimates are shown at checkout.",
  },
  {
    id: "faq-4",
    category: "shipping",
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship to over 40 countries worldwide. International shipping rates, estimated delivery dates, and applicable customs duties will be automatically calculated during checkout.",
  },
  {
    id: "faq-5",
    category: "returns",
    question: "What is your return and exchange policy?",
    answer:
      "We offer a 30-day hassle-free return window for all eligible items in their original, unused condition with packaging and tags intact. Refunds are credited to the original payment method upon warehouse inspection.",
  },
  {
    id: "faq-6",
    category: "returns",
    question: "How long does it take to receive my refund?",
    answer:
      "Once your returned item reaches our fulfillment center and passes quality check (usually within 24–48 hours), your refund will be processed immediately. Depending on your bank, it reflects in 3–7 business days.",
  },
  {
    id: "faq-7",
    category: "payments",
    question: "What payment methods are accepted?",
    answer:
      "We accept all major credit/debit cards (Visa, MasterCard, American Express), Stripe, PayPal, and digital wallets (Apple Pay & Google Pay). All transactions are encrypted via 256-bit SSL protocols.",
  },
  {
    id: "faq-8",
    category: "account",
    question: "How do I reset my password or update account details?",
    answer:
      "You can update your personal information, shipping addresses, and contact numbers in the Account Profile section. If you forgot your password, use the 'Forgot Password' link on the login page to receive a reset OTP.",
  },
];

const ContactHelp: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "general",
    subject: "",
    orderId: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // FAQ State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  // Autofill user info if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [isAuthenticated, user]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@shopora.com");
    setCopiedEmail(true);
    toast.success("Support email copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    if (!formData.subject.trim()) {
      toast.error("Please provide a subject");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Please write your inquiry message");
      return;
    }

    setLoading(true);
    try {
      const res = await submitContactInquiry(formData);
      toast.success(res.message || "Inquiry sent successfully!");
      setSubmitted(true);
      setFormData({
        name: isAuthenticated && user ? user.name : "",
        email: isAuthenticated && user ? user.email : "",
        phone: isAuthenticated && user ? user.phone || "" : "",
        category: "general",
        subject: "",
        orderId: "",
        message: "",
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to send inquiry.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Filter FAQs based on category & search query
  const filteredFaqs = FAQ_DATA.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="contact-help-page">
      <div className="contact-help-container">
        {/* ==========================================
            1. BREADCRUMB & HEADER
            ========================================== */}
        <div className="ch-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} className="ch-breadcrumb-separator" />
          <span className="ch-breadcrumb-current">Contact & Help</span>
        </div>

        <header className="ch-page-header">
          <h1 className="ch-page-title">Contact & Help Center</h1>
          <p className="ch-page-subtitle">
            Have questions about an order, shipment, return, or product? Submit an inquiry below or reach our support team directly.
          </p>
        </header>

        {/* ==========================================
            2. EMAIL SUPPORT INFO STRIP
            ========================================== */}
        <section className="ch-email-strip">
          <div className="ch-email-strip-left">
            <div className="ch-email-icon-box">
              <Mail size={18} />
            </div>
            <div className="ch-email-strip-title">
              Email Support: <span>support@shopora.com</span>
            </div>
          </div>

          <button
            type="button"
            className={`ch-email-action-btn ${
              copiedEmail ? "ch-email-action-btn-copied" : ""
            }`}
            onClick={handleCopyEmail}
            title="Copy Email Address"
            aria-label="Copy Email Address"
          >
            {copiedEmail ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedEmail ? "Copied" : "Copy"}</span>
          </button>
        </section>

        {/* ==========================================
            3. MAIN SPLIT SECTION: FORM + FAQS
            ========================================== */}
        <div className="ch-split-grid">
          {/* LEFT: INQUIRY FORM */}
          <section className="ch-form-card" id="inquiry-form">
            <div className="ch-form-header">
              <span className="ch-section-tag">Send an Inquiry</span>
              <h2 className="ch-section-heading">How Can We Help You?</h2>
              <p className="ch-section-subtext">
                Fill out the form below and our customer support team will reply to your email within 2–4 hours.
              </p>
            </div>

            {submitted ? (
              <div className="ch-success-box">
                <div className="ch-success-icon">
                  <CheckCircle2 size={26} />
                </div>
                <h3 className="ch-success-title">Inquiry Sent Successfully!</h3>
                <p className="ch-success-desc">
                  Thank you for reaching out. A ticket has been created and our team will get back to you shortly.
                </p>
                <button
                  type="button"
                  className="ch-reset-btn"
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="ch-form-row">
                  <div className="ch-field-group">
                    <label className="ch-field-label" htmlFor="name">
                      Full Name
                      <span className="ch-required-star">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      className="ch-input"
                      placeholder="e.g. Alex Johnson"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="ch-field-group">
                    <label className="ch-field-label" htmlFor="email">
                      Email Address
                      <span className="ch-required-star">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      className="ch-input"
                      placeholder="e.g. alex@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="ch-form-row">
                  <div className="ch-field-group">
                    <label className="ch-field-label" htmlFor="phone">
                      Phone Number
                      <span className="ch-optional-tag">(Optional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      className="ch-input"
                      placeholder="e.g. +1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="ch-field-group">
                    <label className="ch-field-label" htmlFor="category">
                      Inquiry Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      className="ch-select"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="general">General Support</option>
                      <option value="order">Order Status & Tracking</option>
                      <option value="shipping">Shipping & Delivery</option>
                      <option value="refund">Returns & Refunds</option>
                      <option value="payment">Payment & Billing</option>
                      <option value="product">Product Inquiries</option>
                      <option value="account">Account & Security</option>
                      <option value="other">Other Inquiries</option>
                    </select>
                  </div>
                </div>

                <div className="ch-form-row">
                  <div className="ch-field-group">
                    <label className="ch-field-label" htmlFor="subject">
                      Subject
                      <span className="ch-required-star">*</span>
                    </label>
                    <input
                      id="subject"
                      type="text"
                      name="subject"
                      className="ch-input"
                      placeholder="Brief summary of your inquiry"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="ch-field-group">
                    <label className="ch-field-label" htmlFor="orderId">
                      Order ID
                      <span className="ch-optional-tag">(Optional)</span>
                    </label>
                    <input
                      id="orderId"
                      type="text"
                      name="orderId"
                      className="ch-input"
                      placeholder="e.g. ORD-98214"
                      value={formData.orderId}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="ch-field-group">
                  <label className="ch-field-label" htmlFor="message">
                    Detailed Message
                    <span className="ch-required-star">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className="ch-textarea"
                    placeholder="Describe your question or issue in detail..."
                    value={formData.message}
                    onChange={handleInputChange}
                    maxLength={2000}
                    required
                  ></textarea>
                  <div className="ch-char-count">
                    {formData.message.length} / 2000 characters
                  </div>
                </div>

                <button
                  type="submit"
                  className="ch-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>Sending Inquiry...</>
                  ) : (
                    <>
                      <Send size={15} />
                      Submit Inquiry
                    </>
                  )}
                </button>
              </form>
            )}
          </section>

          {/* RIGHT: SEARCHABLE FAQ ACCORDION */}
          <section className="ch-faq-card">
            <div className="ch-form-header">
              <span className="ch-section-tag">Instant Answers</span>
              <h2 className="ch-section-heading">Frequently Asked Questions</h2>
              <p className="ch-section-subtext">
                Quick answers to common questions about orders, shipping, and returns.
              </p>
            </div>

            {/* Inline FAQ Search */}
            <div className="ch-faq-search-wrap">
              <Search size={16} className="ch-faq-search-icon" />
              <input
                type="text"
                className="ch-faq-search-input"
                placeholder="Search FAQs (e.g. 'refund', 'tracking', 'payment')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search FAQs"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="ch-faq-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="ch-faq-categories">
              <button
                type="button"
                className={`ch-cat-pill ${
                  selectedCategory === "all" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("all")}
              >
                All Topics
              </button>
              <button
                type="button"
                className={`ch-cat-pill ${
                  selectedCategory === "orders" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("orders")}
              >
                Orders
              </button>
              <button
                type="button"
                className={`ch-cat-pill ${
                  selectedCategory === "shipping" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("shipping")}
              >
                Shipping
              </button>
              <button
                type="button"
                className={`ch-cat-pill ${
                  selectedCategory === "returns" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("returns")}
              >
                Returns & Refunds
              </button>
              <button
                type="button"
                className={`ch-cat-pill ${
                  selectedCategory === "payments" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("payments")}
              >
                Payments
              </button>
            </div>

            {/* FAQ Accordion List */}
            <div className="ch-accordion-list">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`ch-accordion-item ${isOpen ? "is-open" : ""}`}
                    >
                      <button
                        type="button"
                        className="ch-accordion-trigger"
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={isOpen}
                      >
                        <span>{faq.question}</span>
                        <ChevronDown size={16} className="ch-chevron" />
                      </button>
                      {isOpen && (
                        <div className="ch-accordion-body">{faq.answer}</div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="ch-no-results">
                  <HelpCircle
                    size={28}
                    style={{ margin: "0 auto 8px", color: "#94a3b8" }}
                  />
                  <p>No questions matched your search query.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ContactHelp;
