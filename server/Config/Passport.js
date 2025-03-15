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
      callbackURL: "http://localhost:3000/api/auth/google/callback", },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();
        const name = profile.displayName;
        const googleId = profile.id;

        let user = await User.findOne({ email });

        if (!user) {
          const randomPass = generateRandomPass(8);
          const hashedpassword = await bcrypt.hash(randomPass,12);
          user = new User({
            name,
            email,
            password: hashedpassword, 
            googleId,     
            isVerified:true
          });
          await user.save();
        } else {
          if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
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
