import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

// Socket.IO server ka URL (backend)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // 🔌 Socket.IO connect karna
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"], // optional, but helps
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", SOCKET_URL);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    // Backend se AI ka response
    socket.on("ai-message-response", (data) => {
      setIsTyping(false);
      const text = data.response || String(data);

      appendMessage({
        id: Date.now(),
        role: "assistant",
        text,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err);
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isTyping]);

  function appendMessage(msg) {
    setMessages((m) => [...m, msg]);
  }

  // ✅ Ab yahi se backend ko data bhejenge (sirf Socket.IO se)
  function sendToBackend(text) {
    if (socketRef.current && socketRef.current.connected) {
      // Backend me: socket.on("ai-message", async (data) => { ... })
      // Yaha text string bhej rahe hain
      socketRef.current.emit("ai-message", text);
    } else {
      setIsTyping(false);
      appendMessage({
        id: Date.now(),
        role: "assistant",
        text: "Not Able to connect with the Server. Please try again later.",
        timestamp: new Date().toISOString(),
      });
    }
  }

  function handleSubmit(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    appendMessage(userMsg);
    setInput("");
    setIsTyping(true);

    // Sirf message text bhej rahe hain
    sendToBackend(trimmed);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function clearConversation() {
    setMessages([]);
  }

  return (
    <div className="chat-app">
      <header className="chat-header">
        <h1 className="title">ChatBot</h1>
        <div className="status" title={connected ? "Connected" : "Disconnected"}>
          <span className={`dot ${connected ? "online" : "offline"}`}></span>
          <span className="status-text">
            {connected ? "Connected" : "Offline"}
          </span>
        </div>
      </header>

      <main className="chat-main" ref={listRef}>
        {messages.length === 0 && (
          <div className="empty">
            <p>Start a conversation — type a message below.</p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`bubble ${m.role === "user" ? "user" : "assistant"}`}
            aria-live="polite"
          >
            <div className="bubble-content">{m.text}</div>
            <div className="bubble-meta">
              <small>{new Date(m.timestamp).toLocaleTimeString()}</small>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="bubble assistant typing">
            <div className="bubble-content">
              Assistant is typing<span className="dots">...</span>
            </div>
          </div>
        )}
      </main>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message and press Enter to send..."
          rows={1}
          aria-label="Message"
        />

        <div className="controls">
          <button
            type="button"
            className="btn clear"
            onClick={clearConversation}
            title="Clear conversation"
            aria-label="Clear conversation"
          >
            Clear
          </button>
          <button
            type="submit"
            className="btn send"
            disabled={!input.trim()}
            aria-label="Send message"
            title="Send"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
