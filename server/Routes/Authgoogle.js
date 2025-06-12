import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"],
}));

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, result, info) => {
    if (err || !result || !result.user) {
      const errorMessage = info?.message || "Authentication failed";
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`);
    }

    const { user, isNew } = result;

    const token = jwt.sign(
      { id: user._id},
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure:process.env.NODE_ENV === 'production',
      sameSite:process.env.NODE_ENV === 'production'? 'none':'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const redirectURL = isNew
      ? `${process.env.FRONTEND_URL}/selection`
      : `${process.env.FRONTEND_URL}/profile`;

    return res.redirect(redirectURL);
  })(req, res, next);
});

export default router;
