import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/users.js";

dotenv.config();

const authMiddleware = async (req, res, next) => {
  try {
    // ==========================================
    // 1. GET AUTHORIZATION HEADER
    // ==========================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token is required",
      });
    }

    // ==========================================
    // 2. CHECK BEARER FORMAT
    // ==========================================

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token is missing",
      });
    }

    // ==========================================
    // 3. VERIFY JWT
    // ==========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ==========================================
    // 4. FIND USER IN MONGODB
    // ==========================================

    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    // ==========================================
    // 5. ATTACH USER TO REQUEST
    // ==========================================

    req.user = user;

    // Continue to controller
    next();

  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    // JWT expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token has expired",
      });
    }

    // Invalid JWT
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // Other errors
    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

export default authMiddleware;