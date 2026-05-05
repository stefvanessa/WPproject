import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    // Web: session cookie via Passport
    if (req.isAuthenticated()) return next();

    // Mobile: JWT in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const user = await User.findById(payload.userId);
        if (user) {
          req.user = user as any;
          return next();
        }
      } catch {
        // invalid / expired token — fall through to 401
      }
    }

    return res.status(401).json({ message: "Not authenticated" });
  } catch (err) {
    next(err);
  }
}
