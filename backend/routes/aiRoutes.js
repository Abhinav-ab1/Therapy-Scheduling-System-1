import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { chatWithAssistant } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", authMiddleware, chatWithAssistant);

export default router;