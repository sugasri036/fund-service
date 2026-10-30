import { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm Investra AI 👋\n\nI can help you understand mutual funds, NAV, SIPs, investment concepts and how to use Investra. What would you like to know?",
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(event) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", content: message },
    ]);

    setInput("");
    setLoading(true);

    try {
      const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL || "";

      const response = await fetch(`${CHATBOT_API_URL}/api/chatbot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Chatbot request failed (${response.status})`);
      }

      const data = await response.json();

      if (!data.reply) {
        throw new Error("The chatbot returned an empty response.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "I'm unable to connect right now. Please check whether the chatbot service is running and try again.",
        },
      ]);

      console.error("Chatbot error:", error);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([INITIAL_MESSAGE]);
  }

  return (
    <div className="investra-chatbot">
      {isOpen && (
        <section className="chatbot-window">
          <header className="chatbot-header">
            <div className="chatbot-brand">
              <div className="chatbot-avatar">✦</div>

              <div>
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
                title="Clear conversation"
                onClick={clearChat}
                disabled={loading}
              >
                ↻
              </button>

              <button
                type="button"
                title="Close chatbot"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          <div className="chatbot-messages">
            <div className="chatbot-date-label">YOUR INVESTMENT ASSISTANT</div>

            {messages.map((message, index) => (
              <div
                key={index}
                className={`chatbot-message-row ${message.role}`}
              >
                {message.role === "assistant" && (
                  <div className="chatbot-message-avatar">✦</div>
                )}

                <div className="chatbot-message-bubble">{message.content}</div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-message-row assistant">
                <div className="chatbot-message-avatar">✦</div>

                <div className="chatbot-message-bubble chatbot-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-area" onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about mutual funds, SIP, NAV..."
              maxLength={2000}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              title="Send message"
            >
              ➤
            </button>
          </form>

          <div className="chatbot-disclaimer">
            AI-generated information. Not financial advice.
          </div>
        </section>
      )}

      <button
        type="button"
        className={`chatbot-launcher ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        {isOpen ? "×" : "✦"}
      </button>
    </div>
  );
}
