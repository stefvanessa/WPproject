//handles web requests
import { Router } from "express";
import passport from "passport";
 
const router = Router();

//redirects the browser to Google’s login page 
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

//Google sends the user back
router.get(
  "/google/callback",
  //exchanges that code for user info
  passport.authenticate("google", {
    //Then redirect to frontend:
    successRedirect: "http://localhost:5173/wardrobe",
    failureRedirect: "http://localhost:5173/login",
  })
);
 
router.get("/success", (req, res) => {
  res.json({ message: "Logged in", user: req.user });
});
 
router.get("/logout", (req, res) => {
  req.logout((passportErr) => {
    if (passportErr) console.error("Passport logout error:", passportErr);

    if (req.session) {
      req.session.destroy((sessionErr) => {
        if (sessionErr) console.error("Session destroy error:", sessionErr);
        res.clearCookie("connect.sid", { path: "/" });
        res.json({ message: "Logged out" });
      });
    } else {
      res.clearCookie("connect.sid", { path: "/" });
      res.json({ message: "Logged out" });
    }
  });
});
 
export default router;
