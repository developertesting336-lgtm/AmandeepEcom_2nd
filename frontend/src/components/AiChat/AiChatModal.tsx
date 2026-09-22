import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useVoiceSearch } from "../../hooks/useVoiceSearch";

import {
  MessageSquare,
  X,
  Send,
  // Sparkles,
  Bot,
  User as UserIcon,
  Mic,
  MicOff,
  // Trash2,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import { API_BASE_URL } from "../../config/api";
import "./AiChatModal.css";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  time: string;
}

const DEFAULT_SUGGESTIONS = [
  "How do I cancel an order?",
  "What is the return policy?",
  "How do I reset my password?",
  "What payment methods are available?",
];

export const AiChatModal: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "welcome",
        sender: "assistant",
        text: "Hi there! 👋 I am your store AI assistant. How can I help you today?",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];
  });

  const chatWindowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // console.log("chatwindow", chatWindowRef.current);
  console.log("messagesEnd", messagesEndRef);
  // console.log("inputRef", inputRef.current);

  // Auto-scroll to bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { isListening, startListening, isSupported } = useVoiceSearch({
    onResult: (transcriptText) => {
      console.log("🛒 [Navbar Voice Search] Recognized text applied to search:", transcriptText);
      // setSearchQuery(transcriptText);
      // setInputValue(transcriptText);
      handleSendMessage(transcriptText);
    },
  });


  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages, loading]);

  // Handle auto-close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    const handleOpenAiChat = () => {
      setIsOpen(true);
    };

    window.addEventListener("open-ai-chat", handleOpenAiChat);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-ai-chat", handleOpenAiChat);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputValue).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      // If user asks about their own account or orders, enrich prompt with their user ID
      let finalPrompt = textToSend;
      if (
        isAuthenticated &&
        user?._id &&
        !textToSend.toLowerCase().includes(user._id.toLowerCase())
      ) {
        finalPrompt = `${textToSend}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/ai/test`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: finalPrompt,
        }),
      });

      const data = await res.json();

      let aiText = "Sorry, I couldn't process that request right now.";
      if (data.success && data.response) {
        aiText = data.response;
      } else if (data.message) {
        aiText = data.message;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: aiText,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: "Oops! Failed to connect to the assistant. Please try again in a moment.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // const handleClearChat = () => {
  //   setMessages([
  //     {
  //       id: "welcome",
  //       sender: "assistant",
  //       text: "Hi there! 👋 I am your store AI assistant. How can I help you today?",
  //       time: new Date().toLocaleTimeString([], {
  //         hour: "2-digit",
  //         minute: "2-digit",
  //       }),
  //     },
  //   ]);
  // };

  const suggestions = [
    ...DEFAULT_SUGGESTIONS,
    ...(isAuthenticated && user?._id
      ? ["Where are my recent orders?", "Show my account information"]
      : []),
  ];

  return (
    <div className="ai-chat-root">
      <div ref={chatWindowRef}>
        {/* Floating Chat Modal */}
        {isOpen && (
          <div className="ai-chat-window" role="dialog" aria-label="AI Customer Support Chat">
            {/* Simple Top Bar with Dropdown Icon */}
            <div className="ai-chat-top-bar">
              <button
                type="button"
                className="ai-dropdown-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                aria-label="Minimize chat"
              >
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Message List */}
            <div className="ai-messages-container">
              {messages.map((msg) => (
                <div key={msg.id} className={`ai-message-row ${msg.sender}`}>
                  {msg.sender === "assistant" ? (
                    <div className="ai-msg-avatar">
                      <Bot size={14} />
                    </div>
                  ) : (
                    <div
                      className="ai-msg-avatar"
                      style={{
                        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                      }}
                    >
                      <UserIcon size={14} />
                    </div>
                  )}
                  <div className="ai-message-content">
                    <div className="ai-message-bubble">
                      {msg.sender === "assistant" ? (
                        <div className="ai-markdown-body">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ href, children, ...props }) => {
                                const raw = (href || "").trim();
                                // Clean any domain or prefix like yourstore.com/path, http://example.com/path
                                let clean = raw.replace(
                                  /^(?:https?:\/\/)?(?:www\.)?(?:[a-zA-Z0-9-]+\.(?:com|org|io|net)|localhost:\d+)/i,
                                  ""
                                );

                                if (
                                  !clean.startsWith("/") &&
                                  !clean.startsWith("http://") &&
                                  !clean.startsWith("https://") &&
                                  !clean.startsWith("mailto:") &&
                                  !clean.startsWith("tel:")
                                ) {
                                  clean = "/" + clean;
                                }

                                const isInternal =
                                  clean.startsWith("/") && !clean.startsWith("//");

                                if (isInternal) {
                                  return (
                                    <a
                                      href={clean}
                                      className="ai-chat-link"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        navigate(clean);
                                      }}
                                      {...props}
                                    >
                                      {children}
                                    </a>
                                  );
                                }

                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ai-chat-link"
                                    {...props}
                                  >
                                    {children}
                                  </a>
                                );
                              },
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                    <span className="ai-msg-time">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Typing Loader */}
              {loading && (
                <div className="ai-message-row assistant">
                  <div className="ai-msg-avatar">
                    <Bot size={14} />
                  </div>
                  <div className="ai-message-content">
                    <div className="ai-typing-indicator">
                      <div className="ai-typing-dot" />
                      <div className="ai-typing-dot" />
                      <div className="ai-typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Prompt Suggestions when only welcome message is shown */}
              {messages.length === 1 && !loading && (
                <div className="ai-quick-prompts">
                  <div className="ai-quick-title">Frequently Asked:</div>
                  {suggestions.slice(0, 4).map((sugg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="ai-pill-btn"
                      onClick={() => handleSendMessage(sugg)}
                    >
                      <HelpCircle size={13} color="#6366f1" />
                      <span>{sugg}</span>
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input */}
            <div className="ai-chat-footer">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="ai-input-wrapper"
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="ai-input-field"
                  placeholder="Ask a question..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading}
                />

                <button
                  type="button"
                  className={`voice-search-btn ${isListening ? "listening" : ""}`}
                  onClick={startListening}
                  title={
                    !isSupported
                      ? "Voice search not supported in this browser"
                      : isListening
                        ? "Listening... Click to stop"
                        : "Search by voice"
                  }
                  aria-label={isListening ? "Stop voice search" : "Start voice search"}
                >
                  {isListening ? (
                    <MicOff size={16} className="voice-mic-icon active" />
                  ) : (
                    <Mic size={16} className="voice-mic-icon" />
                  )}
                </button>
                <button
                  type="submit"
                  className="ai-send-btn"
                  disabled={!inputValue.trim() || loading}
                  title="Send message"
                >
                  <Send size={15} />
                </button>
              </form>
              <div className="ai-footer-note">
                AI responses are backed by store policies & tools.
              </div>
            </div>
          </div>
        )}

        {/* Floating Launcher Action Button */}
        <button
          type="button"
          className={`ai-chat-launcher ${isOpen ? "is-open" : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close AI Chat" : "Open AI Chat"}
          title={isOpen ? "Close Chat" : "Chat with AI Assistant"}
        >
          {isOpen ? (
            <X size={22} />
          ) : (
            <div className="ai-launcher-icon-wrap">
              <MessageSquare size={22} />
              <span className="ai-pulse-ring" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default AiChatModal;
