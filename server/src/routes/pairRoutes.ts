import { Router } from "express";
import jwt from "jsonwebtoken";
import { isAuthenticated } from "../middleware/auth";
import { PairingCode } from "../models/PairingCode";
import { User } from "../models/User";

const router = Router();

// Web calls this to generate a pairing code (requires active web session)
router.post("/generate", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any)._id;

    // One active code per user at a time
    await PairingCode.deleteMany({ userId });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await PairingCode.create({ code, userId, expiresAt });

    res.json({ code, expiresAt });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate code" });
  }
});

// Mobile calls this with the code to get a JWT (no prior auth needed)
router.post("/connect", async (req, res) => {
  try {
    const { code } = req.body as { code?: string };
    if (!code) return res.status(400).json({ message: "Code is required" });

    const pairing = await PairingCode.findOne({
      code,
      expiresAt: { $gt: new Date() },
    });

    if (!pairing) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const user = await User.findById(pairing.userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    // Invalidate the code immediately after use
    await PairingCode.deleteOne({ _id: pairing._id });

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to connect" });
  }
});

export default router;
