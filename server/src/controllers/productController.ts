import type { Request, Response } from "express";
import { Product } from "../models/Product";
import { s3 } from "../config/minIO";
import {
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// CREATE PRODUCT
// CREATE PRODUCT
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";

export const createProduct = async (req: Request, res: Response) => {
  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // 1. Generate unique filename
    const fileName = `${uuid()}-${req.file.originalname}`;

    // 2. Upload file to MinIO
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    // 3. Create product entry in MongoDB
    const product = await Product.create({
      ...req.body,
      imageKey: fileName,
      user: (req.user as any)._id
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating product" });
  }
};


// GET ALL PRODUCTS (WITH FILTERING + SIGNED URLs)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const filters: any = { user: (req.user as any)._id };

    // Build dynamic filters
    if (req.query.color) filters.color = req.query.color;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.fit) filters.fit = req.query.fit;
    if (req.query.style) filters.style = req.query.style;
    if (req.query.pattern) filters.pattern = req.query.pattern;
    if (req.query.temperature) filters.temperature = req.query.temperature;
    if (req.query.category) filters.category = req.query.category;

    const products = await Product.find(filters);

    const result = await Promise.all(
      products.map(async (p) => {
        const cmd = new GetObjectCommand({
          Bucket: process.env.MINIO_BUCKET,
          Key: p.imageKey
        });

        const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });

        return {
          ...p.toObject(),
          imageUrl: signedUrl
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching products" });
  }
};

// GET SINGLE PRODUCT
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Not found" });

    if (product.user.toString() !== (req.user as any)._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const cmd = new GetObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: product.imageKey
    });

    const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });

    res.json({
      ...product.toObject(),
      imageUrl: signedUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching product" });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Not found" });

    if (product.user.toString() !== (req.user as any)._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    Object.assign(product, req.body);

    await product.save();

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating product" });
  }
};

// DELETE PRODUCT + DELETE IMAGE
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Not found" });

    if (product.user.toString() !== (req.user as any)._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 1. Delete image from MinIO
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: product.imageKey
      })
    );

    // 2. Delete product from MongoDB
    await product.deleteOne();

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting product" });
  }
};
