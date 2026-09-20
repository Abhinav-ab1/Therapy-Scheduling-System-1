import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/users.js";

dotenv.config();

// =========================================================
// GOOGLE OAUTH STRATEGY
// =========================================================

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,

      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      callbackURL: process.env.GOOGLE_CALLBACK_URL,

      // Allows us to access req/session inside callback
      passReqToCallback: true,
    },

    async (
      req,
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
      try {
        // ===================================================
        // GET GOOGLE EMAIL
        // ===================================================

        const email =
          profile?.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(
            new Error(
              "Google account email was not provided"
            ),
            null
          );
        }

        // ===================================================
        // FIND EXISTING USER
        // ===================================================

        let user = await User.findOne({
          email,
        });

        // ===================================================
        // IF USER DOES NOT EXIST → CREATE USER
        // ===================================================

        if (!user) {
          // Default role
          let role = "patient";

          // -------------------------------------------------
          // Get role from session
          // -------------------------------------------------

          if (
            req?.session?.role === "practitioner" ||
            req?.session?.role === "patient"
          ) {
            role = req.session.role;
          }

          // -------------------------------------------------
          // Also support role from callback query
          // -------------------------------------------------

          if (
            req?.query?.role === "practitioner" ||
            req?.query?.role === "patient"
          ) {
            role = req.query.role;
          }

          // -------------------------------------------------
          // Create MongoDB user
          // -------------------------------------------------

          user = await User.create({
            name:
              profile.displayName ||
              "Google User",

            email,

            role,

            isVerified: true,

            // Google users don't need a password
            password: null,
          });

          console.log(
            `✅ New Google user created: ${email} (${role})`
          );
        } else {
          console.log(
            `✅ Existing Google user found: ${email} (${user.role})`
          );
        }

        // ===================================================
        // LOGIN USER
        // ===================================================

        return done(null, user);
      } catch (error) {
        console.error(
          "❌ Google authentication error:",
          error
        );

        return done(error, null);
      }
    }
  )
);

// =========================================================
// SERIALIZE USER
// =========================================================

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

// =========================================================
// DESERIALIZE USER
// =========================================================

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
});

export default passport;