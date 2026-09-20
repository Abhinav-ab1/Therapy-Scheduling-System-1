import React, { useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Namaste! 🙏 I'm the AyurSutra AI Assistant. How can I help you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI assistant failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
        },
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn't process your request right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.aiButton}
        title="AyurSutra AI Assistant"
      >
        🤖
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <div style={styles.title}>AyurSutra AI</div>
              <div style={styles.status}>
                ● Online
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={styles.closeButton}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  ...(msg.role === "user"
                    ? styles.userMessage
                    : styles.assistantMessage),
                }}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div style={styles.assistantMessage}>
                Thinking... 🤔
              </div>
            )}
          </div>

          {/* Input */}
          <div style={styles.inputContainer}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AyurSutra AI..."
              rows="1"
              style={styles.input}
            />

            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              style={styles.sendButton}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  aiButton: {
    position: "fixed",
    right: "25px",
    bottom: "25px",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "none",
    background: "#6b8e23",
    color: "white",
    fontSize: "26px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
    zIndex: 1000,
  },

  chatWindow: {
    position: "fixed",
    right: "25px",
    bottom: "95px",
    width: "360px",
    height: "500px",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 1000,
    border: "1px solid #e5e5e5",
  },

  header: {
    background: "#6b8e23",
    color: "white",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: "18px",
    fontWeight: "600",
  },

  status: {
    fontSize: "12px",
    marginTop: "3px",
    opacity: 0.9,
  },

  closeButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "28px",
    cursor: "pointer",
  },

  messages: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
    background: "#f7f8f5",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  message: {
    maxWidth: "80%",
    padding: "10px 13px",
    borderRadius: "12px",
    fontSize: "14px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
  },

  userMessage: {
    alignSelf: "flex-end",
    background: "#6b8e23",
    color: "white",
    borderBottomRightRadius: "3px",
  },

  assistantMessage: {
    alignSelf: "flex-start",
    background: "white",
    color: "#333",
    border: "1px solid #e5e5e5",
    borderBottomLeftRadius: "3px",
  },

  inputContainer: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #ddd",
    background: "white",
    gap: "8px",
  },

  input: {
    flex: 1,
    resize: "none",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "10px",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "14px",
  },

  sendButton: {
    width: "42px",
    border: "none",
    borderRadius: "10px",
    background: "#6b8e23",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
  },
};

export default AIChatbot;