import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/users.js";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ where: { email } });


        if (!user) {
          // Get role from session if available, else default to patient
          let role = "patient";
          if (typeof profile._json === "object" && profile._json.role) {
            role = profile._json.role;
          } else if (profile && profile.role) {
            role = profile.role;
          } else if (profile && profile._req && profile._req.session && profile._req.session.role) {
            role = profile._req.session.role;
          } else if (global._passport_role) {
            role = global._passport_role;
          } else if (User.sequelize.options && User.sequelize.options.role) {
            role = User.sequelize.options.role;
          } else if (User.role) {
            role = User.role;
          } else if (User.session && User.session.role) {
            role = User.session.role;
          } else if (User.req && User.req.session && User.req.session.role) {
            role = User.req.session.role;
          } else if (User.req && User.req.role) {
            role = User.req.role;
          } else if (User.req && User.req.query && User.req.query.role) {
            role = User.req.query.role;
          } else if (User.req && User.req.body && User.req.body.role) {
            role = User.req.body.role;
          } else if (User.req && User.req.headers && User.req.headers.role) {
            role = User.req.headers.role;
          } else if (User.req && User.req.headers && User.req.headers["x-role"]) {
            role = User.req.headers["x-role"];
          } else if (User.req && User.req.headers && User.req.headers["role"]) {
            role = User.req.headers["role"];
          } else if (User.req && User.req.headers && User.req.headers["x-user-role"]) {
            role = User.req.headers["x-user-role"];
          } else if (User.req && User.req.headers && User.req.headers["user-role"]) {
            role = User.req.headers["user-role"];
          } else if (User.req && User.req.headers && User.req.headers["x-userrole"]) {
            role = User.req.headers["x-userrole"];
          } else if (User.req && User.req.headers && User.req.headers["userrole"]) {
            role = User.req.headers["userrole"];
          } else if (User.req && User.req.headers && User.req.headers["x-role"]) {
            role = User.req.headers["x-role"];
          } else if (User.req && User.req.headers && User.req.headers["role"]) {
            role = User.req.headers["role"];
          }
          user = await User.create({
            name: profile.displayName,
            email,
            role: role,
            isVerified: false
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findByPk(id);
  done(null, user);
});

export default passport;