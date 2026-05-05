import { Router } from "express";
import { isAuthenticated } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/", isAuthenticated, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: "Background removal not configured" });
  }

  try {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype });
    form.append("image_file", blob, req.file.originalname);
    form.append("size", "auto");

    const resp = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form,
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).send(text);
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    const contentType = resp.headers.get("content-type") ?? "image/png";

    res.set("Content-Type", contentType);
    res.send(buffer);
  } catch (err) {
    console.error("remove-bg error:", err);
    res.status(500).json({ message: "Background removal failed" });
  }
});

export default router;
