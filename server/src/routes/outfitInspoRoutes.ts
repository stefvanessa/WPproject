import { Router } from "express";
import { analyzeOutfitInspo } from "../controllers/outfitInspoController";
import { isAuthenticated } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/analyze", isAuthenticated, upload.single("image"), analyzeOutfitInspo);

export default router;
