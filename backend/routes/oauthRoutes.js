import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// =========================================================
// GOOGLE LOGIN
// =========================================================

router.get(
  "/google",
  (req, res, next) => {
    const role = req.query.role;

    // Only allow valid roles
    if (role === "patient" || role === "practitioner") {
      req.session.role = role;
    } else {
      req.session.role = "patient";
    }

    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// =========================================================
// GOOGLE CALLBACK
// =========================================================

router.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        {
          id: req.user._id.toString(),
          email: req.user.email,
          role: req.user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn:
            process.env.JWT_EXPIRES_IN || "1d",
        }
      );

      const frontendUrl =
        process.env.FRONTEND_URL;

      if (!frontendUrl) {
        return res.status(500).json({
          message:
            "FRONTEND_URL is not configured",
        });
      }

      res.redirect(
        `${frontendUrl}/oauth-success?token=${encodeURIComponent(
          token
        )}&role=${encodeURIComponent(
          req.user.role
        )}`
      );
    } catch (error) {
      console.error(
        "❌ Google OAuth callback error:",
        error.message
      );

      res.status(500).json({
        message:
          "Google authentication failed",
      });
    }
  }
);

export default router;