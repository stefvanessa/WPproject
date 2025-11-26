import { Router } from "express";
import { s3 } from "../config/minIO";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

router.get("/:key", isAuthenticated, async (req, res) => {
  try {
    const key = req.params.key;

    const command = new GetObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating URL" });
  }
});

export default router;

