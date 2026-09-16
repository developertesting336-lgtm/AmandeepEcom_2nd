const faqData = {
  about_platform: {
    question: "What is this platform?",
    answer: `
This is a modern e-commerce platform where customers can:
- Browse a wide catalog of high-quality products across multiple categories.
- Manage personal profiles, delivery addresses, and account security.
- Place orders smoothly with multiple secure payment methods.
- Track real-time shipment status for all placed orders.
- Enjoy easy order cancellations, returns, and transparent refunds.
- Reach out to customer support anytime for assistance.
    `.trim(),
    url: "/about",
    aliases: [
      "about",
      "about_us",
      "about us",
      "platform",
      "company",
      "store",
      "who_are_you",
      "what_is_this_platform",
      "tell_me_about_platform",
      "what_is_this_store",
      "about_the_store",
      "website",
      "shop",
      "ecom",
      "info",
    ],
  },

  account_management: {
    question: "How do I manage my account and profile?",
    answer: `
You can manage your account directly from your Profile Dashboard:
1. Update your personal details (name, email, phone number).
2. Manage saved shipping addresses (add, edit, or set a default delivery address).
3. View your order history and live tracking details.
4. Review account activity and security preferences.
    `.trim(),
    url: "/profile",
    aliases: [
      "account",
      "profile",
      "account_settings",
      "manage_account",
      "edit_profile",
      "address",
      "addresses",
      "address_book",
      "my_account",
      "user_profile",
    ],
  },

  account_registration: {
    question: "How do I create a new account?",
    answer: `
To create a new account:
1. Click the "Sign Up" or "Register" button in the top navigation bar.
2. Fill in your name, email address, and a secure password.
3. Click "Create Account".
4. Once registered, you can log in, save items to your wishlist, and start placing orders immediately.
    `.trim(),
    url: "/register",
    aliases: [
      "register",
      "signup",
      "sign_up",
      "create_account",
      "new_account",
      "how_to_register",
      "join",
      "registration",
    ],
  },

  forgot_password: {
    question: "How do I reset my password?",
    answer: `
To reset your password:
1. Go to the Login page.
2. Click the "Forgot Password?" link.
3. Enter your registered email address.
4. Check your inbox for a password reset email link.
5. Click the link and enter your new password to restore account access.
    `.trim(),
    url: "/forgot-password",
    aliases: [

      "forgot_password",
      "reset_password",
      "password",
      "change_password",
      "recover_password",
      "password_reset",
      "login_issue",
      "cant_login",
    ],
  },

  payment_methods: {
    question: "What payment methods are supported?",
    answer: `
We support a variety of safe and convenient payment methods:
- Credit / Debit Cards (Visa, MasterCard, RuPay, American Express)
- Net Banking (All major banks supported)
- UPI Payments (Google Pay, PhonePe, Paytm, BHIM)
- Digital Wallets
- Cash on Delivery (COD) for eligible pincodes and orders
All transactions are secured with industry-standard 256-bit SSL encryption.
    `.trim(),
    url: "/checkout",
    aliases: [
      "payment",
      "payments",
      "payment_methods",
      "pay",
      "cod",
      "cash_on_delivery",
      "credit_card",
      "debit_card",
      "upi",
      "net_banking",
      "cards",
      "wallet",
      "razorpay",
      "stripe",
    ],
  },

  shipping_information: {
    question: "How does shipping and delivery work?",
    answer: `
Shipping and delivery details:
- Order Processing: Orders are verified and dispatched within 1-2 business days.
- Delivery Timelines: Standard delivery takes approximately 3-5 business days depending on your location.
- Shipping Charges: Standard delivery charges are calculated at checkout; Free Delivery is available on qualifying order totals.
- Tracking Updates: You will receive real-time updates as your package moves through transit.
    `.trim(),
    url: "/shipping-policy",
    aliases: [
      "shipping",
      "shipping_information",
      "delivery",
      "shipping_policy",
      "delivery_time",
      "delivery_charges",
      "shipping_charges",
      "free_delivery",
      "courier",
      "estimated_delivery",
      "when_will_i_get_my_order",
    ],
  },

  track_order: {
    question: "How can I track my order status?",
    answer: `
To track your order:
1. Navigate to the "My Orders" section in your account.
2. Locate the specific order you wish to track.
3. Click "View Details" to see the live shipment timeline (Pending -> Confirmed -> Processing -> Shipped -> Delivered).
4. If a tracking number is available, click the tracking link for carrier-specific updates.
    `.trim(),
    url: "/order",
    aliases: [
      "track",
      "tracking",
      "track_order",
      "order_status",
      "where_is_my_order",
      "track_shipment",
      "shipment_tracking",
      "order_tracking",
      "order_progress",
    ],
  },

  cancellation_policy: {
    question: "How do I cancel an order?",
    answer: `
Order Cancellation Policy:
- Cancellation Window: You can cancel your order anytime before it has been dispatched/shipped.
- Steps to Cancel:
  1. Go to "My Orders".
  2. Select the order you wish to cancel.
  3. Click "Cancel Order" and choose your reason.
- Once cancelled, an automatic confirmation is sent and your refund is immediately initiated.
- If the order has already shipped, you can reject delivery or request a return upon arrival.
    `.trim(),
    url: "/order",
    aliases: [
      "cancellation",
      "cancel_order",
      "cancellation_policy",
      "how_to_cancel",
      "cancel",
      "cancelling",
      "cancel_item",
    ],
  },

  return_policy: {
    question: "What is the return policy?",
    answer: `
Our Return Policy:
- Return Window: Eligible products can be returned within 7 to 14 days of delivery.
- Eligibility: Items must be unused, unwashed, in original condition, with original packaging, tags, and tax invoice intact.
- How to Request a Return:
  1. Go to "My Orders" and click on the delivered order.
  2. Select "Request Return / Exchange".
  3. Our courier partner will schedule a doorstep pickup.
    `.trim(),
    url: "/returns",
    aliases: [
      "return",
      "returns",
      "return_policy",
      "how_to_return",
      "replacement",
      "exchange",
      "item_return",
      "return_item",
    ],
  },

  refund_policy: {
    question: "How and when do refunds work?",
    answer: `
Refund Information:
- Initiation: Refunds are initiated within 24-48 hours after cancellation approval or returned item inspection.
- Payment Method:
  - Prepaid Orders (Card, UPI, Net Banking): Credited back to the original payment source in 3-7 business days.
  - Cash on Delivery (COD) Orders: Credited to your designated Bank Account or UPI ID within 2-4 business days.
- You will receive an email and notification confirmation once the refund has been processed.
    `.trim(),
    url: "/refunds",
    aliases: [
      "refund",
      "refunds",
      "refund_policy",
      "money_back",
      "refund_status",
      "refund_time",
      "how_refund_works",
      "when_will_i_get_refund",
    ],
  },

  warranty_information: {
    question: "Is there a warranty on products?",
    answer: `
Product Warranty Details:
- Many electronic items, appliances, and branded goods include official brand manufacturer warranties (typically 6 months to 2 years).
- Warranty coverage details and duration are listed in the product description specifications.
- You can claim warranty service directly at any authorized brand service center using your store tax invoice.
    `.trim(),
    aliases: [
      "warranty",
      "warranty_information",
      "guarantee",
      "product_warranty",
      "claim_warranty",
      "brand_warranty",
      "repair",
    ],
  },

  contact_support: {
    question: "How can I contact customer support?",
    answer: `
We are here to help you! You can reach customer support through:
- Contact Us page: Submit an inquiry anytime via our Contact form.
- Live Chat: Use this AI assistant or initiate a live chat during support hours.
- Email Support: Reach out to our dedicated support team via our contact portal.
Our support team typically responds within 24 business hours.
    `.trim(),
    url: "/contact",
    aliases: [
      "contact",
      "contact_us",
      "support",
      "help",
      "customer_care",
      "customer_service",
      "phone_number",
      "email_support",
      "helpdesk",
      "reach_out",
      "talk_to_human",
      "contact_info",
    ],
  },

  discounts_and_coupons: {
    question: "How do discounts and promo coupons work?",
    answer: `
Using Discounts and Coupons:
- Promo codes can be applied directly on the Checkout page before payment.
- Check out featured banner discounts, seasonal sales, and special offers on the homepage.
- Note: Only one promo coupon can typically be applied per order unless specified otherwise.
    `.trim(),
    url: "/offers",
    aliases: [
      "discount",
      "discounts",
      "coupon",
      "coupons",
      "promo_code",
      "promo",
      "voucher",
      "offers",
      "deals",
      "discount_code",
    ],
  },

  cart_and_wishlist: {
    question: "How do Cart and Wishlist work?",
    answer: `
Cart & Wishlist Features:
- Add to Cart: Reserve items you plan to purchase now; proceed to checkout when ready.
- Wishlist / Save for Later: Bookmark items you love to buy later or monitor price drops.
- Your cart and wishlist synchronize automatically across your devices when you are logged in.
    `.trim(),
    url: "/cart",
    aliases: [
      "cart",
      "wishlist",
      "save_for_later",
      "shopping_cart",
      "basket",
      "saved_items",
      "add_to_cart",
      "save_item",
    ],
  },

  order_issue_or_damage: {
    question: "What should I do if I receive a damaged or incorrect item?",
    answer: `
If your order arrived damaged, defective, or incorrect:
1. Please report it within 48 hours of delivery.
2. Go to "My Orders" or contact Customer Support.
3. Provide clear photos of the package and damaged/wrong product.
4. Our team will arrange an immediate free replacement or full refund.
    `.trim(),
    url: "/contact",
    aliases: [
      "damaged",
      "damaged_item",
      "defective",
      "wrong_item",
      "broken",
      "missing_item",
      "item_issue",
      "complaint",
      "received_damaged_item",
    ],
  },

  security_privacy: {
    question: "Is my personal and payment data safe?",
    answer: `
Account Security & Privacy:
- All data transmission is encrypted using industry-standard SSL (HTTPS).
- We do not store sensitive payment card details or CVVs on our servers.
- Your personal information is strictly protected and never shared with unauthorized third parties.
    `.trim(),
    url: "/privacy-policy",
    aliases: [
      "security",
      "privacy",
      "privacy_policy",
      "data_protection",
      "safe_payment",
      "is_it_safe",
      "safe",
      "secure",
    ],
  },
};

/**
 * Normalizes an input string for robust matching.
 */
const normalizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

/**
 * Intelligent FAQ resolver supporting:
 * 1. Direct key match (e.g. 'about_platform')
 * 2. Exact alias match (e.g. 'about', 'platform', 'returns', 'cancellation', 'shipping', 'track')
 * 3. Keyword / Substring similarity scoring across questions, aliases, and answers
 */
export const getFaqAnswer = async (topic) => {
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return {
      success: false,
      message: "Please provide a specific topic or question.",
      availableTopics: Object.keys(faqData),
    };
  }

  const rawTopic = topic.trim().toLowerCase();
  const normalizedKey = normalizeString(rawTopic);

  // 1. Direct exact key match
  if (faqData[normalizedKey]) {
    const faq = faqData[normalizedKey];
    return {
      success: true,
      topic: normalizedKey,
      question: faq.question,
      answer: faq.answer,
      url: faq.url,
    };
  }

  // 2. Exact alias match
  for (const [key, faq] of Object.entries(faqData)) {
    if (
      faq.aliases &&
      faq.aliases.some((alias) => {
        const normAlias = normalizeString(alias);
        return normAlias === normalizedKey || rawTopic === alias.toLowerCase();
      })
    ) {
      return {
        success: true,
        topic: key,
        question: faq.question,
        answer: faq.answer,
        url: faq.url,
      };
    }
  }

  // 3. Keyword / Partial similarity scoring
  const searchWords = rawTopic
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  let bestMatchKey = null;
  let highestScore = 0;

  for (const [key, faq] of Object.entries(faqData)) {
    let score = 0;

    // Check key contains search query or vice versa
    if (normalizedKey.includes(key) || key.includes(normalizedKey)) {
      score += 10;
    }

    // Check aliases
    if (faq.aliases) {
      for (const alias of faq.aliases) {
        const normAlias = normalizeString(alias);
        if (normAlias === normalizedKey) {
          score += 15;
        } else if (
          normAlias.includes(normalizedKey) ||
          normalizedKey.includes(normAlias)
        ) {
          score += 8;
        } else {
          for (const word of searchWords) {
            if (alias.toLowerCase().includes(word)) score += 3;
          }
        }
      }
    }

    // Check Question text
    const questionLower = faq.question.toLowerCase();
    for (const word of searchWords) {
      if (questionLower.includes(word)) score += 4;
    }

    // Check Answer text
    const answerLower = faq.answer.toLowerCase();
    for (const word of searchWords) {
      if (answerLower.includes(word)) score += 1;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatchKey = key;
    }
  }

  // If score passes minimum confidence threshold
  if (bestMatchKey && highestScore >= 3) {
    const faq = faqData[bestMatchKey];
    return {
      success: true,
      topic: bestMatchKey,
      question: faq.question,
      answer: faq.answer,
      url: faq.url,
    };
  }

  return {
    success: false,
    message: `No specific FAQ found for "${topic}".`,
    availableTopics: Object.keys(faqData),
  };
};

export default {
  faqData,
  getFaqAnswer,
};