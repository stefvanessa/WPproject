import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(), // upload file to RAM, then send to MinIO
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
