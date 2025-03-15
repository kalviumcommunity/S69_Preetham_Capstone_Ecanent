import express from "express";
import passport from "passport";

const router = express.Router();
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/failure" }),
  (req, res) => {
    res.redirect(`http://localhost:5173/`);
  }
);

export default router;
