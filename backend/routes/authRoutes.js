import express from "express";
import { registerUser, loginUser, getAllUsers, getMe } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js"; 

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// protected routes
router.get("/users", getAllUsers);   //admin ke baad ke liye
router.get("/me", authMiddleware, getMe);

export default router;
