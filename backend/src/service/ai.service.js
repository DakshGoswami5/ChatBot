const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

async function generateResponse(chatHistory) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: chatHistory,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AI generation failed");
  }
}


module.exports = generateResponse;