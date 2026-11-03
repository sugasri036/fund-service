import { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm Investra AI 👋\n\nI can help you understand mutual funds, NAV, SIPs, investment concepts and how to use Investra. What would you like to know?",
};

const TOKEN_STORAGE_KEY = "token";

const CHATBOT_API_URL = "https://api-gateway-rz13.onrender.com";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Automatically scroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // Focus the input when the chatbot opens.
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  async function sendMessage(event) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      setMessages((previous) => [
        ...previous,
        {
          role: "user",
          content: message,
        },
        {
          role: "assistant",
          content:
            "Your login session could not be found. Please log in again to use Investra AI.",
        },
      ]);

      setInput("");
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: message,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${CHATBOT_API_URL}/api/chatbot/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message,
            ...(conversationId
              ? { conversationId }
              : {}),
          }),
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error("AUTHENTICATION_REQUIRED");
      }

      if (!response.ok) {
        throw new Error(
          `Chatbot request failed (${response.status})`
        );
      }

      const data = await response.json();

      if (!data.reply || !data.conversationId) {
        throw new Error("INVALID_RESPONSE");
      }

      setConversationId(data.conversationId);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);

      let errorMessage =
        "I'm unable to connect right now. Please try again.";

      if (error.message === "AUTHENTICATION_REQUIRED") {
        errorMessage =
          "Your login session may have expired. Please log in again.";
      } else if (error.message === "INVALID_RESPONSE") {
        errorMessage =
          "The chatbot returned an unexpected response. Please try again.";
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    if (loading) return;

    setMessages([INITIAL_MESSAGE]);
    setConversationId(null);
    setInput("");

    inputRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div
      className="investra-chatbot"
      onKeyDown={handleKeyDown}
    >
      {isOpen && (
        <section
          className="chatbot-window"
          aria-label="Investra AI assistant"
        >
          {/* Header */}
          <header className="chatbot-header">
            <div className="chatbot-brand">
              <div className="chatbot-avatar">
                ✦
              </div>

              <div className="chatbot-brand-info">
                <h3>Investra AI</h3>

                <span>
                  <i className="chatbot-status-dot" />
                  AI Assistant
                </span>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                title="Start new conversation"
                aria-label="Start new conversation"
                onClick={startNewChat}
                disabled={loading}
              >
                ↻
              </button>

              <button
                type="button"
                title="Close chatbot"
                aria-label="Close chatbot"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="chatbot-messages">
            <div className="chatbot-date-label">
              YOUR INVESTMENT ASSISTANT
            </div>

            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`chatbot-message-row ${message.role}`}
              >
                {message.role === "assistant" && (
                  <div className="chatbot-message-avatar">
                    ✦
                  </div>
                )}

                <div className="chatbot-message-bubble">
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-message-row assistant">
                <div className="chatbot-message-avatar">
                  ✦
                </div>

                <div
                  className="chatbot-message-bubble chatbot-typing"
                  aria-label="Investra AI is typing"
                >
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            className="chatbot-input-area"
            onSubmit={sendMessage}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder="Ask about mutual funds, SIP, NAV..."
              maxLength={2000}
              disabled={loading}
              aria-label="Ask Investra AI"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              title="Send message"
              aria-label="Send message"
            >
              ➤
            </button>
          </form>

          {/* Disclaimer */}
          <div className="chatbot-disclaimer">
            AI-generated information. Not financial advice.
          </div>
        </section>
      )}

      {/* Floating launcher */}
      <button
        type="button"
        className={`chatbot-launcher ${
          isOpen ? "active" : ""
        }`}
        onClick={() =>
          setIsOpen((previous) => !previous)
        }
        aria-label={
          isOpen
            ? "Close AI assistant"
            : "Open AI assistant"
        }
        aria-expanded={isOpen}
      >
        {isOpen ? "×" : "✦"}
      </button>
    </div>
  );
}