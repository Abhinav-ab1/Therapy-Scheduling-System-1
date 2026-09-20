import User from "../models/users.js";

// =========================================================
// GET ALL PRACTITIONERS
// =========================================================

export const getPractitioners = async (req, res) => {
  try {
    const practitioners = await User.find({
      role: "practitioner",
    })
      .select("name email phone profileImage")
      .sort({ name: 1 });

    res.json(practitioners);
  } catch (error) {
    console.error(
      "getPractitioners error:",
      error
    );

    res.status(500).json({
      message: "Error fetching practitioners",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// =========================================================
// GET USER PROFILE
// =========================================================

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error(
      "getUserProfile error:",
      error
    );

    res.status(500).json({
      message: "Error fetching user profile",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// =========================================================
// UPDATE USER PROFILE
// =========================================================

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const { name, phone } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Update fields
    if (name !== undefined) {
      user.name = name;
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    await user.save();

    const updatedUser = await User.findById(
      userId
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "updateUserProfile error:",
      error
    );

    res.status(500).json({
      message: "Error updating user profile",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// =========================================================
// GET ALL USERS
// =========================================================

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error(
      "getAllUsers error:",
      error
    );

    res.status(500).json({
      message: "Error fetching users",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};