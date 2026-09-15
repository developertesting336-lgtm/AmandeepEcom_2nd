import groq from "../ai/groq.js";
import { getUserInfoByUserId, getOrderDetailsByUserId } from "../ai/ai.tools.js";
import { getFaqAnswer } from "../ai/faq.js";

export const testAi = async (req, res, next) => {
  try {
    const prompt = req.body?.prompt || req.query?.prompt || "Say hello and confirm the AI integration is working!";
    const model = req.body?.model || req.query?.model || "openai/gpt-oss-20b";

    const userId = req.user?._id.toString()

    // console.log(userId)

    // console.log("prompt", prompt);
    // console.log("req.body", req.body)

    const tools = [
      {
        type: "function",
        function: {
          name: "getFaqAnswer",
          description:
            "Get the answer to a frequently asked customer support question.",
          parameters: {
            type: "object",
            properties: {
              topic: {
                type: "string",
                description:
                  "The FAQ topic, such as forgot_password or cancel_order"
              }
            },
            required: ["topic"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "getUserInfoByUserId",
          description:
            "Get the user information using their user ID.",
          parameters: {
            type: "object",
            properties: {
              userId: {
                type: "string",
                description: "The customer's user ID",
              },
            },
            required: ["userId"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getOrderDetailsByUserId",
          description:
            "Get the order details of a user using their user ID.",
          parameters: {
            type: "object",
            properties: {
              userId: {
                type: "string",
                description: "The customer's user ID",
              },
            },
            required: ["userId"],
          },
        },
      },
    ];

    const systemPrompt = `
You are an AI assistant for an e-commerce platform.

STRICT RULES:

1. You may ONLY provide information that comes from the tools available to you.
2. NEVER use your own general knowledge, assumptions, training data, guesses, or external knowledge to answer questions about the e-commerce platform.
3. If the user asks for information that can be obtained through an available tool, you MUST use the appropriate tool.
4. Do NOT invent, assume, or fabricate any information.
5. If the required information is not available through any available tool, simply respond:
   "Sorry, I don't have that information."
6. If a tool returns no data or says that the requested information was not found, do not make up an answer. Simply tell the user that the information was not found.
7. Use only the information returned by the tool when generating your final answer.
8. Do not claim that you performed an action unless a tool actually performed that action.
9. Keep responses short, clear, and direct.
10. If the user asks something unrelated to the e-commerce platform and no tool can provide the answer, respond:
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
        response: assistantMessage.content || "",
      });
    }

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;

      const args = JSON.parse(
        toolCall.function.arguments
      );

      let toolResult;

      if (toolName === "getUserInfoByUserId") {
        toolResult = await getUserInfoByUserId(userId);
      } else if (toolName === "getOrderDetailsByUserId") {
        toolResult = await getOrderDetailsByUserId(userId);
      }
      else if (toolName === "getFaqAnswer") {
        toolResult = await getFaqAnswer(args.topic);
      }
      else {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      // Send the REAL function result back to the AI.
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    // --------------------------------------------------
    // 4. Give the tool result back to AI
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 5. Return AI's final response to user
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Groq AI response received successfully",
      model,
      prompt,
      response: finalMessage?.content || "",
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
