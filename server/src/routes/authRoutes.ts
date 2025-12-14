import { Router } from "express";
import passport from "passport";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:5173/wardrobe",
    failureRedirect: "http://localhost:5173/login",
  })
);

router.get("/success", (req, res) => {
  res.json({ message: "Logged in", user: req.user });
});

router.get("/logout", (req, res) => {
  req.logout(() => {});
  res.json({ message: "Logged out" });
});

export default router;
