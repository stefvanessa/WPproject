import { Router } from "express";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductMeta
} from "../controllers/productController";
import { isAuthenticated } from "../middleware/auth";
import { upload } from "../middleware/upload"; // ✅ use your custom upload (memoryStorage)

const router = Router();

// Create (with image upload)
router.post("/", isAuthenticated, upload.single("image"), createProduct);

// Read all + filtering
router.get("/", isAuthenticated, getProducts);

// Metadata for client forms
router.get("/meta/options", isAuthenticated, getProductMeta);

// Read single product
router.get("/:id", isAuthenticated, getProductById);

// Update
router.put("/:id", isAuthenticated, updateProduct);

// Delete
router.delete("/:id", isAuthenticated, deleteProduct);

export default router;
