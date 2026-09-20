import { generateAssistantReply } from "../ai/aiService.js";

export const chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;

    // Check whether the user sent a message
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    // Send the message to the AI service
    const answer = await generateAssistantReply(message);

    // Send AI response back to frontend
    return res.status(200).json({
      answer,
    });
  } catch (error) {
    console.error("AI Assistant Error:", error.message);

    return res.status(500).json({
      message: "AI assistant failed",
    });
  }
};