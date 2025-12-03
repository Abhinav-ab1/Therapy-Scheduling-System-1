import { User } from "../models/index.js";

// Get all practitioners
export const getPractitioners = async (req, res) => {
  try {
    const practitioners = await User.findAll({
      where: {
        role: "practitioner",
        //isVerified: true
      },
      attributes: ["id", "name", "email", "phone", "profileImage"],
      order: [["name", "ASC"]]
    });

    res.json(practitioners);
  } catch (error) {
    console.error("getPractitioners error:", error);
    res.status(500).json({ 
      message: "Error fetching practitioners",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("getUserProfile error:", error);
    res.status(500).json({ 
      message: "Error fetching user profile",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] }
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("updateUserProfile error:", error);
    res.status(500).json({ 
      message: "Error updating user profile",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]]
    });

    res.json(users);
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ 
      message: "Error fetching users",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};