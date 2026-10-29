const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Amandeep E-Commerce API Documentation",
    version: "1.0.0",
    description:
      "Comprehensive REST API documentation for the Amandeep E-Commerce platform. Includes endpoints for Authentication, Product Catalog, Shopping Cart, Orders & Payments (Stripe/COD), Reviews, AI Assistant & Search, Delivery & Pincodes, Referrals, Rewards, and Admin Management.",
    contact: {
      name: "API Support",
      email: "support@amandeepecom.com",
    },
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local Development Server",
    },
    {
      url: "https://amandeep2nd.vercel.app",
      description: "Production Server",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "HTTP-Only session cookie containing JWT token",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token with Bearer prefix: `Bearer <token>`",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error message details" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "664fa72a1e9482b1c28f110a" },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", example: "john@example.com" },
          role: { type: "string", enum: ["user", "admin"], example: "user" },
          phone: { type: "string", example: "+919876543210" },
          rewardPoints: { type: "number", example: 120 },
          isActive: { type: "boolean", example: true },
          isCookiesAccepted: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string", example: "664fa72a1e9482b1c28f110b" },
          name: { type: "string", example: "Men Premium Cotton Hoodie" },
          short_description: { type: "string", example: "Warm and stylish fleece hoodie" },
          full_description: { type: "string", example: "<p>Full detailed description in HTML</p>" },
          price: { type: "number", example: 1499 },
          salePrice: { type: "number", example: 1199 },
          stock: { type: "number", example: 45 },
          sku: { type: "string", example: "HOD-COT-001" },
          category: { type: "string", example: "664fa72a1e9482b1c28f110c" },
          subcategory: { type: "string", example: "664fa72a1e9482b1c28f110d" },
          brand: { type: "string", example: "US POLLO" },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string" },
                public_id: { type: "string" },
              },
            },
          },
          rating: { type: "number", example: 4.5 },
          numReviews: { type: "number", example: 12 },
          isFeatured: { type: "boolean", example: true },
          isActive: { type: "boolean", example: true },
        },
      },
      CartItem: {
        type: "object",
        properties: {
          product: { $ref: "#/components/schemas/Product" },
          quantity: { type: "integer", example: 2 },
          variantId: { type: "string", nullable: true },
        },
      },
      Cart: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/CartItem" },
          },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string" },
          orderId: { type: "string", example: "ORD-1715693000000" },
          user: { type: "string" },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "string" },
                quantity: { type: "number", example: 1 },
                purchasePrice: { type: "number", example: 1199 },
                variantId: { type: "string", nullable: true },
              },
            },
          },
          itemsTotal: { type: "number", example: 1199 },
          deliveryCharges: { type: "number", example: 0 },
          referralDiscount: { type: "number", example: 100 },
          pointsUsed: { type: "number", example: 50 },
          pointsDiscount: { type: "number", example: 50 },
          orderTotal: { type: "number", example: 1049 },
          paymentMode: { type: "string", enum: ["cod", "online", "points"], example: "online" },
          paymentStatus: { type: "string", enum: ["pending", "paid", "failed", "refunded"], example: "paid" },
          orderStatus: { type: "string", enum: ["confirmed", "processing", "shipped", "delivered", "cancelled"], example: "confirmed" },
          shippingAddress: {
            type: "object",
            properties: {
              fullname: { type: "string", example: "John Doe" },
              phone: { type: "string", example: "9876543210" },
              address: { type: "string", example: "123 Main St, Park Avenue" },
              city: { type: "string", example: "New Delhi" },
              state: { type: "string", example: "Delhi" },
              postalCode: { type: "string", example: "110001" },
              country: { type: "string", example: "India" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "User registration, OTP verification, login, logout, and password recovery" },
    { name: "User Products", description: "Public product listings, details, filters, recommendations, and search" },
    { name: "Cart", description: "Customer cart management and item quantities" },
    { name: "Orders", description: "Customer checkout (COD, Stripe payment, Points), order tracking, and cancellations" },
    { name: "Wishlist", description: "Customer wishlist management" },
    { name: "Profile", description: "Customer account profile, saved addresses, password update, and cookie consent" },
    { name: "Reviews", description: "Product ratings, reviews, and helpful votes (delivered buyers only)" },
    { name: "Q&A", description: "Customer product questions and admin answers" },
    { name: "AI Assistant", description: "Groq LLM natural language search & assistant tools" },
    { name: "Delivery", description: "Pincode serviceability check and expected delivery estimates" },
    { name: "Referrals & Rewards", description: "Referral links, coupon tokens, and reward points transactions" },
    { name: "Contact & Inquiries", description: "Public customer inquiries and help desk" },
    { name: "Notifications", description: "User in-app notifications and Web-Push subscriptions" },
    { name: "Admin - Analytics", description: "Administrative metrics, revenue, orders, and sales charts" },
    { name: "Admin - Products", description: "Admin catalog management, product CRUD, and categories" },
    { name: "Admin - Orders", description: "Admin order status fulfillment, tracking, and Stripe refunds" },
    { name: "Admin - Users", description: "Admin user listings and account active/deactivation" },
    { name: "Admin - Delivery & Warehouse", description: "Pincode zones, warehouse coordinates, and deliverability" },
    { name: "Admin - Top Offers & Promos", description: "Promotional banners, top bar marquee, and video promos" },
  ],
  paths: {
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Initiate user registration (sends 6-digit OTP to email)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Aman Sharma" },
                  email: { type: "string", format: "email", example: "aman@example.com" },
                  password: { type: "string", minLength: 6, example: "Password@123" },
                  phone: { type: "string", example: "9876543210" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OTP sent successfully to email" },
          400: { description: "Validation error" },
          409: { description: "Email already registered" },
        },
      },
    },
    "/api/auth/verify-register-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify registration OTP and create user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp"],
                properties: {
                  email: { type: "string", format: "email", example: "aman@example.com" },
                  otp: { type: "string", example: "452381" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User account created successfully, token set in cookie" },
          400: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/api/auth/resend-register-otp": {
      post: {
        tags: ["Auth"],
        summary: "Resend registration OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email", example: "aman@example.com" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "New OTP sent" },
          400: { description: "No pending registration found" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with email & password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "aman@example.com" },
                  password: { type: "string", example: "Password@123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful, session cookie set" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out user and clear session cookie",
        responses: {
          200: { description: "Logged out successfully" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request OTP for password reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email", example: "aman@example.com" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset OTP sent" },
          404: { description: "User not found" },
        },
      },
    },
    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify password reset OTP and set new password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp", "newPassword"],
                properties: {
                  email: { type: "string", format: "email", example: "aman@example.com" },
                  otp: { type: "string", example: "829104" },
                  newPassword: { type: "string", minLength: 6, example: "NewSecret@123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset successfully" },
          400: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/api/auth/google": {
      get: {
        tags: ["Auth"],
        summary: "Initiate Google OAuth 2.0 flow",
        responses: {
          302: { description: "Redirect to Google authentication consent screen" },
        },
      },
    },
    "/api/auth/google/callback": {
      get: {
        tags: ["Auth"],
        summary: "Google OAuth callback handler",
        parameters: [
          { name: "code", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          302: { description: "Redirects to frontend with auth token" },
        },
      },
    },

    // =========================================================================
    // USER PRODUCTS & SEARCH
    // =========================================================================
    "/api/products": {
      get: {
        tags: ["User Products"],
        summary: "Get paginated, filtered, and sorted products catalog",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 12 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Text or AI Natural Language query" },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "subcategory", in: "query", schema: { type: "string" } },
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "stock", in: "query", schema: { type: "string", enum: ["inStock", "outOfStock"] } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "price_asc", "price_desc", "rating", "popular"] } },
        ],
        responses: {
          200: {
            description: "Products list returned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    totalProducts: { type: "integer", example: 45 },
                    totalPages: { type: "integer", example: 4 },
                    currentPage: { type: "integer", example: 1 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/product/{productId}": {
      get: {
        tags: ["User Products"],
        summary: "Get single product by ID (tracks view history if logged in)",
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Product details returned" },
          404: { description: "Product not found" },
        },
      },
    },
    "/api/featured": {
      get: {
        tags: ["User Products"],
        summary: "Get featured products for homepage carousel",
        responses: {
          200: { description: "List of featured products" },
        },
      },
    },
    "/api/popular": {
      get: {
        tags: ["User Products"],
        summary: "Get popular trending products",
        responses: {
          200: { description: "List of popular products" },
        },
      },
    },
    "/api/recommended": {
      get: {
        tags: ["User Products"],
        summary: "Get personalized product recommendations based on browsing history",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "List of personalized recommended products" },
        },
      },
    },
    "/api/similar/{productId}": {
      get: {
        tags: ["User Products"],
        summary: "Get similar products in the same category/brand",
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of similar products" },
        },
      },
    },

    // =========================================================================
    // CART
    // =========================================================================
    "/api/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get current user's shopping cart",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "Cart retrieved",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Cart" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Cart"],
        summary: "Add product item to cart",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string", example: "664fa72a1e9482b1c28f110b" },
                  quantity: { type: "integer", minimum: 1, example: 1 },
                  variantId: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Item added to cart" },
          400: { description: "Stock exceeded or invalid product" },
        },
      },
    },
    "/api/cart/{productId}": {
      patch: {
        tags: ["Cart"],
        summary: "Update cart item quantity",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["quantity"],
                properties: {
                  quantity: { type: "integer", minimum: 1, example: 2 },
                  variantId: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Quantity updated" },
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Remove an item from cart",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Item removed from cart" },
        },
      },
    },

    // =========================================================================
    // ORDERS & CHECKOUT
    // =========================================================================
    "/api/order/cod": {
      post: {
        tags: ["Orders"],
        summary: "Place order with Cash on Delivery (COD) or 100% Reward Points",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["products", "address", "paymentMode"],
                properties: {
                  paymentMode: { type: "string", enum: ["COD", "points"], example: "COD" },
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["productId", "quantity"],
                      properties: {
                        productId: { type: "string" },
                        quantity: { type: "number", example: 1 },
                        variantId: { type: "string", nullable: true },
                      },
                    },
                  },
                  address: {
                    type: "object",
                    required: ["fullName", "phone", "addressLine", "city", "state", "pincode"],
                    properties: {
                      fullName: { type: "string", example: "John Doe" },
                      phone: { type: "string", example: "9876543210" },
                      addressLine: { type: "string", example: "Plot 44, MG Road" },
                      city: { type: "string", example: "Bengaluru" },
                      state: { type: "string", example: "Karnataka" },
                      pincode: { type: "string", example: "560001" },
                    },
                  },
                  pointsToRedeem: { type: "number", example: 50 },
                  referralTokens: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Order created successfully" },
          400: { description: "Invalid address or out-of-stock items" },
        },
      },
    },
    "/api/order/payment-checkout-session": {
      post: {
        tags: ["Orders"],
        summary: "Create a Stripe Checkout Session for online card/UPI payment",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["products", "address"],
                properties: {
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["productId", "quantity"],
                      properties: {
                        productId: { type: "string" },
                        quantity: { type: "number" },
                      },
                    },
                  },
                  address: { type: "object" },
                  pointsToRedeem: { type: "number", example: 0 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Stripe checkout session created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    checkoutUrl: { type: "string", example: "https://checkout.stripe.com/c/pay/cs_test_..." },
                    sessionId: { type: "string" },
                    orderId: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/order": {
      get: {
        tags: ["Orders"],
        summary: "Get logged-in user's order history",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "List of user orders",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    orders: { type: "array", items: { $ref: "#/components/schemas/Order" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/order/{orderId}": {
      get: {
        tags: ["Orders"],
        summary: "Get specific order details by ID",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Order details returned" },
          404: { description: "Order not found" },
        },
      },
    },
    "/api/order/cancel/{orderId}": {
      patch: {
        tags: ["Orders"],
        summary: "Customer order cancellation request with reason",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  reason: { type: "string", example: "Found a better deal elsewhere" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Order cancelled successfully" },
          400: { description: "Cannot cancel delivered or shipped orders" },
        },
      },
    },
    "/api/order/webhook": {
      post: {
        tags: ["Orders"],
        summary: "Stripe raw webhook handler (checkout.session.completed)",
        description: "Receives signed event payloads directly from Stripe servers to confirm payments.",
        responses: {
          200: { description: "Webhook received and verified" },
          400: { description: "Invalid signature" },
        },
      },
    },

    // =========================================================================
    // WISHLIST
    // =========================================================================
    "/api/wishlist": {
      get: {
        tags: ["Wishlist"],
        summary: "Get current user's wishlist",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Wishlist products returned" },
        },
      },
    },
    "/api/wishlist/{productId}": {
      post: {
        tags: ["Wishlist"],
        summary: "Toggle product in user's wishlist (add/remove)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Toggled successfully" },
        },
      },
    },

    // =========================================================================
    // USER PROFILE
    // =========================================================================
    "/api/profile/user": {
      get: {
        tags: ["Profile"],
        summary: "Get current user's profile details & reward points",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "Profile returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Profile"],
        summary: "Update current user profile (name, phone, addresses)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  phone: { type: "string" },
                  addresses: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile updated" },
        },
      },
    },
    "/api/profile/user/password": {
      put: {
        tags: ["Profile"],
        summary: "Change account password",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password updated successfully" },
          401: { description: "Incorrect current password" },
        },
      },
    },
    "/api/profile/user/cookies": {
      put: {
        tags: ["Profile"],
        summary: "Update GDPR/Cookie consent banner status",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["isCookiesAccepted"],
                properties: {
                  isCookiesAccepted: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Consent updated" },
        },
      },
    },

    // =========================================================================
    // REVIEWS
    // =========================================================================
    "/api/reviews/product/{productId}": {
      get: {
        tags: ["Reviews"],
        summary: "Get customer reviews and star distribution for a product",
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string" } },
          { name: "stars", in: "query", schema: { type: "integer", enum: [1, 2, 3, 4, 5] } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "highest", "lowest", "helpful"] } },
        ],
        responses: {
          200: { description: "Reviews list and ratings breakdown" },
        },
      },
    },
    "/api/reviews/eligibility/{productId}": {
      get: {
        tags: ["Reviews"],
        summary: "Check if current user is eligible to review (must have delivered order)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Eligibility status returned" },
        },
      },
    },
    "/api/reviews": {
      post: {
        tags: ["Reviews"],
        summary: "Submit or update a review with up to 5 photos (delivered buyers only)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["productId", "stars", "detailedReview"],
                properties: {
                  productId: { type: "string" },
                  stars: { type: "integer", minimum: 1, maximum: 5 },
                  detailedReview: { type: "string" },
                  images: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Review saved" },
          403: { description: "Must have delivered order to review" },
        },
      },
    },
    "/api/reviews/{reviewId}/helpful": {
      post: {
        tags: ["Reviews"],
        summary: "Upvote a helpful review",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "reviewId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Upvote registered" },
        },
      },
    },

    // =========================================================================
    // AI ASSISTANT & CHAT
    // =========================================================================
    "/api/ai/test": {
      post: {
        tags: ["AI Assistant"],
        summary: "Conversational AI assistant query (powered by Groq LLM)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", example: "Which running shoes are best under 2000 rupees?" },
                  history: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "AI response and relevant product recommendations" },
        },
      },
    },

    // =========================================================================
    // DELIVERY & LOGISTICS
    // =========================================================================
    "/api/delivery/estimate/{pincode}": {
      get: {
        tags: ["Delivery"],
        summary: "Check pincode deliverability, shipping fee, and estimated arrival date",
        parameters: [
          { name: "pincode", in: "path", required: true, schema: { type: "string", example: "110001" } },
        ],
        responses: {
          200: {
            description: "Delivery estimate calculated from primary warehouse",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    isDeliverable: { type: "boolean", example: true },
                    pincode: { type: "string", example: "110001" },
                    city: { type: "string", example: "New Delhi" },
                    state: { type: "string", example: "Delhi" },
                    distanceKm: { type: "number", example: 18.5 },
                    minDays: { type: "integer", example: 2 },
                    maxDays: { type: "integer", example: 4 },
                    shippingFee: { type: "number", example: 0 },
                  },
                },
              },
            },
          },
        },
      },
    },

    // =========================================================================
    // REFERRALS & REWARDS
    // =========================================================================
    "/api/referral/create-link": {
      post: {
        tags: ["Referrals & Rewards"],
        summary: "Generate a unique single-use referral discount token for a product",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId"],
                properties: {
                  productId: { type: "string", example: "664fa72a1e9482b1c28f110b" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Referral coupon URL and signed token generated" },
        },
      },
    },
    "/api/referral/validate": {
      post: {
        tags: ["Referrals & Rewards"],
        summary: "Validate a referral token and return discount amount",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: {
                  token: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Token is valid" },
          400: { description: "Invalid or expired token" },
        },
      },
    },
    "/api/rewards/history": {
      get: {
        tags: ["Referrals & Rewards"],
        summary: "Get current user's reward points transaction ledger (Earned/Redeemed/Refunded)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Points history list" },
        },
      },
    },

    // =========================================================================
    // ADMIN ENDPOINTS
    // =========================================================================
    "/api/admin/analytics/overview": {
      get: {
        tags: ["Admin - Analytics"],
        summary: "Get top-level dashboard metrics (Total Sales, Orders, Active Users, Revenue)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Analytics KPIs returned" },
        },
      },
    },
    "/api/admin/analytics/last-30-days": {
      get: {
        tags: ["Admin - Analytics"],
        summary: "Get 30-day time-series revenue and order volume for charts",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Time-series chart data" },
        },
      },
    },
    "/api/admin/all/products": {
      get: {
        tags: ["Admin - Products"],
        summary: "Get all catalog products with admin filters",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Catalog list" },
        },
      },
    },
    "/api/admin/add/product": {
      post: {
        tags: ["Admin - Products"],
        summary: "Create a new product with images uploaded to Cloudinary",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["name", "price", "stock", "sku", "category", "subcategory", "short_description", "full_description"],
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  salePrice: { type: "number" },
                  stock: { type: "integer" },
                  sku: { type: "string" },
                  category: { type: "string" },
                  subcategory: { type: "string" },
                  brand: { type: "string" },
                  short_description: { type: "string" },
                  full_description: { type: "string" },
                  images: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Product created successfully" },
        },
      },
    },
    "/api/admin/order": {
      get: {
        tags: ["Admin - Orders"],
        summary: "Get all customer orders across the platform with filtering",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "orderStatus", in: "query", schema: { type: "string" } },
          { name: "paymentStatus", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of orders" },
        },
      },
    },
    "/api/admin/order/{orderId}": {
      patch: {
        tags: ["Admin - Orders"],
        summary: "Update order status or address details",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  orderStatus: { type: "string", enum: ["confirmed", "processing", "shipped", "delivered", "cancelled"] },
                  paymentStatus: { type: "string", enum: ["pending", "paid", "refunded"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Order updated" },
        },
      },
    },
    "/api/admin/order/refund/{orderId}": {
      patch: {
        tags: ["Admin - Orders"],
        summary: "Issue Stripe refund for online paid order and mark cancelled",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Stripe refund processed and order marked refunded" },
          400: { description: "Not eligible for Stripe refund (e.g. COD or unpaid)" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin - Users"],
        summary: "Get all registered users with search and pagination",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "List of users" },
        },
      },
    },
    "/api/admin/users/toggle-active/{userId}": {
      post: {
        tags: ["Admin - Users"],
        summary: "Activate or deactivate a user account",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "User status toggled" },
        },
      },
    },
    "/api/admin/delivery/warehouse": {
      get: {
        tags: ["Admin - Delivery & Warehouse"],
        summary: "Get primary warehouse configuration and dispatch coordinates",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Warehouse configuration returned" },
        },
      },
      put: {
        tags: ["Admin - Delivery & Warehouse"],
        summary: "Update primary warehouse name, pincode, and coordinates",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Central Delhi Hub" },
                  pincode: { type: "string", example: "110001" },
                  latitude: { type: "number", example: 28.6139 },
                  longitude: { type: "number", example: 77.209 },
                  city: { type: "string", example: "New Delhi" },
                  state: { type: "string", example: "Delhi" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Warehouse updated" },
        },
      },
    },
    "/api/admin/delivery/pincodes": {
      get: {
        tags: ["Admin - Delivery & Warehouse"],
        summary: "List all configured pincodes and serviceability status",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Pincode list returned" },
        },
      },
    },
  },
};

export default swaggerSpec;

