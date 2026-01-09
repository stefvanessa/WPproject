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
  // Passport req.logout supports a callback in newer types; make sure session destroyed
  try {
    req.logout?.(() => {});
  } catch (err) {
    // ignore
  }
 
  // destroy session and clear cookie
  if (req.session) {
    req.session.destroy((err) => {
      res.clearCookie("connect.sid", { path: "/" });
      if (err) {
        console.error("Failed to destroy session on logout:", err);
        return res.status(500).json({ message: "Logged out (session destroy failed)" });
      }
      return res.json({ message: "Logged out" });
    });
  } else {
    res.clearCookie("connect.sid", { path: "/" });
    res.json({ message: "Logged out" });
  }
});
 
export default router;
