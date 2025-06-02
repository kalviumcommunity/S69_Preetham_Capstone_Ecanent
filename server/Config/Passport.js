import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../Models/UserSchema.js";
import { generateRandomPass } from "../Config/generateRandomPass.js";
import bcrypt from "bcryptjs"
import 'dotenv/config'

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();
        const name = profile.displayName;
        const googleId = profile.id;

        let user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
          }
          return done(null, { user, isNew: false });
        }

        const randomPass = generateRandomPass(8);
        const hashedPassword = await bcrypt.hash(randomPass, 12);

        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          googleId,
          role: "Student",
          isVerified: true,
        });

        await newUser.save();
        return done(null, { user: newUser, isNew: true });

      } catch (err) {
        console.error("Google Auth Error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((obj, done) => {
  done(null, obj.user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
