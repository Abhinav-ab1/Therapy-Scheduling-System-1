import express from "express";
import { sendSms, sendEmail } from "../services/notificationService.js";

const router = express.Router();

// Test SMS
router.post("/sms", async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: "to and message are required" });
    }

    const result = await sendSms(to, message);
    res.json({ success: true, result });
  } catch (err) {
    console.error("SMS error:", err);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

// Test Email
router.post("/email", async (req, res) => {
  try {
    const { to, subject, text } = req.body;
    if (!to || !subject || !text) {
      return res.status(400).json({ error: "to, subject, and text are required" });
    }

    const result = await sendEmail(to, subject, text);
    res.json({ success: true, result });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
