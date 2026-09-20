import express from "express";
import User from "../models/users.js";

const router = express.Router();

// =========================================================
// GET USER BY ID
// =========================================================

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error(
      "User fetch error:",
      error
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// =========================================================
// GET ALL USERS
// =========================================================

router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error(
      "Users fetch error:",
      error
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;