import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.get(
  "/google",
  (req, res, next) => {
    // Store role in session if provided as query param
    if (req.query.role) {
      req.session.role = req.query.role;
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

  res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}&role=${req.user.role}`);
  }
);

export default router;
