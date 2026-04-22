import { Router } from "express";
import { upload } from "../middleware/upload";
import { s3 } from "../config/minIO";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { isAuthenticated } from "../middleware/auth";
import { randomUUID as uuid } from "crypto";

const router = Router();

router.post("/", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileName = `${uuid()}-${req.file.originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const publicUrl = `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${fileName}`;

    res.json({
      success: true,
      url: publicUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error uploading file" });
  }
});

export default router;
