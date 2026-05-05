import { Router } from "express";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

router.get("/:key", isAuthenticated, (req, res) => {
  const { key } = req.params;
  const url = `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${key}`;
  res.json({ url });
});

export default router;

