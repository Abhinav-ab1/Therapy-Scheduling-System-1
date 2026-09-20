import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/users.js";

dotenv.config();

// ==========================================
// GENERATE JWT TOKEN
// ==========================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

// ==========================================
// GET ALL USERS
// ==========================================

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json(users);
  } catch (err) {
    console.error("Get users error:", err.message);

    res.status(500).json({
      error: "Server error",
    });
  }
};

// ==========================================
// GET CURRENTLY LOGGED-IN USER
// ==========================================

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Get me error:", err.message);

    res.status(500).json({
      error: "Server error",
    });
  }
};

// ==========================================
// REGISTER USER
// ==========================================

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      dob,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Determine role
    const userRole = role || "patient";

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: userRole,
      phone: phone || null,
      dob: dob || null,
      isVerified: userRole === "practitioner" ? false : true,
    });

    // Generate JWT
    const token = generateToken(user);

    // Response
    res.status(201).json({
      message: "User registered successfully",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dob: user.dob,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Register error:", err);

    // Duplicate email
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    res.status(500).json({
      error: "Server error",
    });
  }
};

// ==========================================
// LOGIN USER
// ==========================================

export const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Generate JWT
    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dob: user.dob,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    res.status(500).json({
      error: "Server error",
    });
  }
};

// ==========================================
// OAUTH SUCCESS
// ==========================================

export const oauthSuccess = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({
        message: "OAuth login failed",
      });
    }

    const token = generateToken(req.user);

    res.status(200).json({
      message: "OAuth login successful",

      token,

      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        dob: req.user.dob,
        isVerified: req.user.isVerified,
      },
    });
  } catch (err) {
    console.error("OAuth success error:", err);

    res.status(500).json({
      error: "Server error",
    });
  }
};