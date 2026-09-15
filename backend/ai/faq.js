const faqData = {
    about_platform: {
        question: "What is this platform?",
        answer: `
      This is an e-commerce platform where customers can browse products,
      manage their account, place orders, make payments, track orders,
      and manage returns and refunds.
    `,
    },

    account_management: {
        question: "How do I manage my account?",
        answer: `
      Customers can manage their profile information, addresses,
      account settings, and other account-related information from
      their account dashboard.
    `,
    },

    forgot_password: {
        question: "How do I reset my password?",
        answer: `
      To reset your password:
      1. Go to the login page.
      2. Click "Forgot Password".
      3. Enter your registered email address.
      4. Check your email for the password reset link.
      5. Open the link and create a new password.
    `,
    },

    payment_methods: {
        question: "What payment methods are available?",
        answer: `
      Customers can use the payment methods currently supported
      by the platform during checkout.
    `,
    },

    shipping_information: {
        question: "How does shipping work?",
        answer: `
      After an order is placed and confirmed, it is processed for
      shipment. Customers can track the shipping status from the
      order details page when tracking information is available.
    `,
    },

    return_policy: {
        question: "What is the return policy?",
        answer: `
      Customers should check the return information associated with
      the product and order. Return eligibility can depend on the
      product and the applicable platform policy.
    `,
    },

    refund_policy: {
        question: "How do refunds work?",
        answer: `
      Refunds are processed according to the platform's refund policy
      and the applicable order and payment status.
    `,
    },

    cancellation_policy: {
        question: "How do I cancel an order?",
        answer: `
      To cancel an order:
      1. Go to "My Orders".
      2. Select the order.
      3. Select "Cancel Order" if cancellation is available.
      4. Follow the instructions to confirm the cancellation.
    `,
    },

    warranty_information: {
        question: "What about product warranty?",
        answer: `
      Warranty information can vary by product. Customers should
      check the warranty information provided with the specific
      product or order.
    `,
    },
};


export const getFaqAnswer = async (topic) => {
    const faq = faqData[topic];

    if (!faq) {
        return {
            success: false,
            message: "FAQ not found",
        };
    }

    return {
        success: true,
        topic,
        question: faq.question,
        answer: faq.answer,
    };
};