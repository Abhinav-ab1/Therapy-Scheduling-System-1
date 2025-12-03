// routes/userRoutes.js
import express from "express";
import User from "../models/users.js";

const router = express.Router();

//  GET user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//  GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
