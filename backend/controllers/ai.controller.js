import groq from "../ai/groq.js";
import { getUserInfoByUserId, getOrderDetailsByUserId } from "../ai/ai.tools.js";
import { getFaqAnswer } from "../ai/faq.js";

export const testAi = async (req, res, next) => {
  try {
    const prompt = req.body?.prompt || req.query?.prompt || "Say hello and confirm the AI integration is working!";
    const model = req.body?.model || req.query?.model || "openai/gpt-oss-20b";

    const userId = req.user?._id ? req.user._id.toString() : null;

    const tools = [
      {
        type: "function",
        function: {
          name: "getFaqAnswer",
          description:
            "Get official e-commerce store FAQs, policies, and platform information (such as about the store/platform, account management, registration, password reset, payment methods, shipping and delivery, order tracking, cancellations, returns, refunds, warranty, customer support, coupons/discounts, cart/wishlist, damaged orders, and security).",
          parameters: {
            type: "object",
            properties: {
              topic: {
                type: "string",
                description:
                  "The FAQ topic to lookup, such as 'about_platform', 'account_management', 'account_registration', 'forgot_password', 'payment_methods', 'shipping_information', 'track_order', 'cancellation_policy', 'return_policy', 'refund_policy', 'warranty_information', 'contact_support', 'discounts_and_coupons', 'cart_and_wishlist', 'order_issue_or_damage', 'security_privacy'.",
                enum: [
                  "about_platform",
                  "account_management",
                  "account_registration",
                  "forgot_password",
                  "payment_methods",
                  "shipping_information",
                  "track_order",
                  "cancellation_policy",
                  "return_policy",
                  "refund_policy",
                  "warranty_information",
                  "contact_support",
                  "discounts_and_coupons",
                  "cart_and_wishlist",
                  "order_issue_or_damage",
                  "security_privacy",
                ],
              },
            },
            required: ["topic"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getUserInfoByUserId",
          description:
            "Get the user profile information using their user ID.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      // {
      //   type: "function",
      //   function: {
      //     name: "getOrderDetailsByUserId",
      //     description:
      //       "Get the order details of a user using their user ID.",
      //     parameters: {
      //       type: "object",
      //       properties: {}
      //     },
      //   },
      // },
    ];

    const sanitizeInternalUrls = (text) => {
      if (!text || typeof text !== "string") return "";
      return text
        .replace(
          /\[([^\]]+)\]\((?:https?:\/\/)?(?:www\.)?(?:yourstore\.com|example\.com|myshop\.com|localhost:\d+)(\/[^\)\s]*)\)/gi,
          "[$1]($2)"
        )
        .replace(
          /(?:https?:\/\/)?(?:www\.)?(?:yourstore\.com|example\.com|myshop\.com|localhost:\d+)(\/[a-zA-Z0-9_\-\/]+)/gi,
          "$1"
        );
    };

    const systemPrompt = `
You are a friendly and helpful AI customer support assistant for our e-commerce platform.

STRICT RULES:
1. You may ONLY provide platform information that comes from the tools available to you.
2. NEVER invent or fabricate platform, product, order, or account information.
3. If the user asks for platform details, store information, policies, account issues, shipping, returns, refunds, or support, you MUST call the getFaqAnswer tool with the most appropriate topic (e.g. use "about_platform" for questions like "about", "what is this", "tell me about the store", "about us").
4. CRITICAL LINK FORMATTING RULE: Whenever providing a link or directing users to a page, ALWAYS output a clean relative path starting with a single forward slash (e.g. [About Us](/about), [Reset Password](/forgot-password), [My Orders](/order), [Contact Support](/contact)). NEVER prepend a domain name like "yourstore.com", "example.com", or full URLs like "https://...".
5. Format your answers beautifully using Markdown: use bullet points, bold text, and numbered steps for high readability.
6. If the required information is not available through any available tool, respond:
   "Sorry, I don't have that information."
7. If a user asks something unrelated to the e-commerce platform and no tool can provide the answer, respond:
   "Sorry, I can only help with information available through this platform."

IMPORTANT:
The tools are the ONLY source of truth for platform information.
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    // const completion = await groq.chat.completions.create({
    //   messages: [
    //     {
    //       role: "system",
    //       content: `
    //       You are a helpful assistant for an E-commerce platform.

    //       If the user asks for customer information and provides
    //       a user ID, use the getUserInfoByUserId tool.
    //     `
    //     },
    //     {
    //       role: "user",
    //       content: prompt,
    //     },
    //     {
    //       role: "assistant",
    //       content: null,

    //       tool_calls: [
    //         {
    //           id: "call_123",

    //           type: "function",

    //           function: {
    //             name: "getUserInfoByUserId",

    //             arguments: "{\"userId\":\"68d3e40c044187639aa3483e\"}"
    //           }
    //         }
    //       ]
    //     },
    //     {
    //       role: "tool",

    //       tool_call_id: "call_123",

    //       content: JSON.stringify({
    //         userId: "68d3e40c044187639aa3483e",
    //         name: "Aman",
    //         email: "[EMAIL_ADDRESS]",
    //         phone: "1234567890",
    //         role: "user",
    //         isActive: true,
    //         authProvider: "email",
    //         addresses: [],
    //         memberSince: "2022-01-01"
    //       })
    //     }
    //   ],
    //   tools: [

    //     {
    //       type: "function",

    //       function: {

    //         name: "getUserInfoByUserId",

    //         description:
    //           "Get the user information using there user ID",

    //         parameters: {

    //           type: "object",

    //           properties: {

    //             userId: {
    //               type: "string",
    //               description: "The customer's user ID"
    //             }

    //           },

    //           required: ["userId"]
    //         }
    //       }
    //     }

    //   ],
    //   model: model,
    // });

    const completion = await groq.chat.completions.create({
      model,
      messages,
      tools,
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    // console.log("completion", completion)

    const assistantMessage = completion.choices[0]?.message;

    // console.log("assistantMessage", assistantMessage)
    // console.log("assistantMessage", assistantMessage.tool_calls)
    // console.log("assistantMessage", assistantMessage.tool_calls[0].function.arguments)
    // console.log("assistantMessage tool call name", assistantMessage.tool_calls[0].function)

    if (!assistantMessage) {
      throw new Error("AI did not return a message");
    }

    messages.push(assistantMessage)

    if (!assistantMessage.tool_calls?.length) {
      return res.status(200).json({
        success: true,
        message: "Groq AI response received successfully",
        model,
        prompt,
        response: sanitizeInternalUrls(assistantMessage.content || ""),
      });
    }

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;

      const args = JSON.parse(
        toolCall.function.arguments
      );

      let toolResult;

      console.log("toolName", toolName)
      console.log("args", args)
      // console.log("toolResult", toolResult)

      if (toolName === "getUserInfoByUserId") {
        toolResult = await getUserInfoByUserId(userId);
      }
      // else if (toolName === "getOrderDetailsByUserId") {
      //   toolResult = await getOrderDetailsByUserId(userId);
      // }
      else if (toolName === "getFaqAnswer") {
        toolResult = await getFaqAnswer(args.topic);
      }
      else {
        throw new Error(`Unknown tool: ${toolName}`);
      }


      // console.log("toolResult", toolResult)

      // Send the REAL function result back to the AI.
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }



    const finalCompletion =
      await groq.chat.completions.create({
        model,
        messages,
        tools,
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        stream: false,
      });

    const finalMessage =
      finalCompletion.choices[0]?.message;

    console.log("finalMessage", finalMessage)


    return res.status(200).json({
      success: true,
      message: "Groq AI response received successfully",
      model,
      prompt,
      response: sanitizeInternalUrls(finalMessage?.content || ""),
    });

    // const aiResponse = completion.choices[0]?.message?.content || "";

    // return res.status(200).json({
    //   success: true,
    //   message: "Groq AI response received successfully",
    //   model,
    //   prompt,
    //   response: aiResponse,
    // });
  } catch (error) {
    console.error("AI Testing Route Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI response",
      error: error.message || error,
    });
  }
};

export const getAvailableModels = async (req, res, next) => {
  try {
    const models = await groq.models.list();
    return res.status(200).json({
      success: true,
      models: models.data.map((m) => ({ id: m.id, owned_by: m.owned_by })),
    });
  } catch (error) {
    console.error("Failed to list models:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve models",
    });
  }
};
