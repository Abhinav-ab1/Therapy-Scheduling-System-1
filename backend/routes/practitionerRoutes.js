import express from "express";
import { generateAadhaarOtp, verifyAadhaarOtp, verifyPractitionerHPID } from "../controllers/practitionerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getPractitioners } from "../controllers/userController.js";

const router = express.Router();

// Aadhaar OTP → txnId
router.post("/aadhaar/generate-otp", authMiddleware, generateAadhaarOtp);

// Aadhaar OTP verify
router.post("/aadhaar/verify-otp", authMiddleware, verifyAadhaarOtp);

// HPID verification
router.post("/hpid/verify", authMiddleware, verifyPractitionerHPID);

// Get list of practitioners - Remove auth middleware to allow public access
router.get("/", getPractitioners);

export default router;