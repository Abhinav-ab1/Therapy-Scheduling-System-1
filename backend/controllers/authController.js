import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/users.js";

dotenv.config();


//  Utility to sign JWT
 
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};


//  Get all users (no passwords)
 
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.json(users);
  } catch (err) {
    console.error("Get users error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};


//  Get currently logged-in user
 
export const getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] }
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Get me error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

//  Register new user
 
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, dob } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password, // raw password; hashed in model hooks
      role: role || "patient",
      phone: phone || null,     
      dob: dob || null,          
      isVerified: role === "practitioner" ? false : true
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,        
        dob: user.dob,            
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};


 // Login user
 
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,      
        dob: user.dob,          
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};


 // OAuth success handler
 
export const oauthSuccess = async (req, res) => {
  try {
    if (!req.user) return res.status(400).json({ message: "OAuth login failed" });

    const token = generateToken(req.user);

    res.json({
      token,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,    
        dob: req.user.dob,         
        isVerified: req.user.isVerified
      }
    });
  } catch (err) {
    console.error("OAuth success error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
