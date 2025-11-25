require("dotenv").config();
const app = require("./src/app");
const { createServer } = require("http");
const { Server } = require("socket.io");
const generateResponse = require("./src/service/ai.service")

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.Frontend_URL, // Vite ka URL
    methods: ["GET", "POST"],
  },
});


// ✅ kitna context rakhna hai (last N messages)
const MAX_HISTORY_MESSAGES = 12; // e.g. 6 user + 6 model turns

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // 🔹 ye history sirf is socket (user session) ke liye
  const chatHistory = [];

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
  });

  socket.on("ai-message", async (data) => {
    try {
      console.log("Received AI message from", socket.id, ":", data);

      // 1) user message add
      chatHistory.push({
        role: "user",
        parts: [{ text: data }],
      });

      // 2) limit apply → sirf last MAX_HISTORY_MESSAGES rakho
      if (chatHistory.length > MAX_HISTORY_MESSAGES) {
        const extra = chatHistory.length - MAX_HISTORY_MESSAGES;
        chatHistory.splice(0, extra); // purane nikal do
      }

      // 3) AI response generate with limited history
      const response = await generateResponse(chatHistory);

      // 4) AI ka message bhi history me add
      chatHistory.push({
        role: "model",
        parts: [{ text: response }],
      });

      if (chatHistory.length > MAX_HISTORY_MESSAGES) {
        const extra = chatHistory.length - MAX_HISTORY_MESSAGES;
        chatHistory.splice(0, extra);
      }

      console.log("AI Response for", socket.id, ":", response);

      // 5) front-end ko response bhejo
      socket.emit("ai-message-response", { response });
    } catch (err) {
      console.error("Error in ai-message handler:", err);
      socket.emit("ai-message-response", {
        response: "error from server side.",
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log("server is running on port", PORT);
});