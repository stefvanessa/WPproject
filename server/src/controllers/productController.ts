import type { Request, Response } from "express";
import { Product } from "../models/Product";
import { s3 } from "../config/minIO";
import {
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  clothingCategories,
  clothingPatterns,
  clothingWeather,
  clothingColors,
  clothingStyles,
  clothingFits,
} from "../data/clothingData";

import { randomUUID as uuid } from "crypto";

export const createProduct = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!process.env.MINIO_BUCKET) {
      return res.status(500).json({ message: "Storage bucket not configured" });
    }

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    //it reads form fields
    const body = req.body as Record<string, any>;

    //style and temperature are always arrays
    const normalizeArray = (value: unknown): string[] => {
      if (Array.isArray(value)) return value as string[];
      if (value === undefined || value === null) return [];
      return [String(value)];
    };

    const style = normalizeArray(body.style);
    const temperature = normalizeArray(body.temperature);

    const requiredFields = ["name", "category", "type", "color", "pattern", "fit"];
    const missing = requiredFields.filter((field) => !body[field]);
    if (missing.length > 0 || style.length === 0 || temperature.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Generate unique filename and (optionally) remove background via remove.bg
    let fileName = `${uuid()}-${req.file.originalname}`;
    let uploadBody: Buffer = req.file.buffer;
    let contentType = req.file.mimetype;

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (apiKey) {
      try {
        // Build form data to send to external remove-bg service
        const form = new FormData();
        // Convert Node Buffer to Uint8Array so Blob accepts the data in TypeScript
        const uint8 = new Uint8Array(req.file.buffer);
        const blob = new Blob([uint8], { type: req.file.mimetype });
        form.append("image_file", blob, req.file.originalname);
        form.append("size", "auto");

        const resp = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": apiKey,
            // Note: do not set Content-Type here — fetch will set the multipart boundary for FormData
          },
          body: form,
        });

        if (!resp.ok) {
          const txt = await resp.text();
          return res.status(resp.status).send(txt);
        }

        const array = await resp.arrayBuffer();
        contentType = resp.headers.get("content-type") ?? "image/png";
        uploadBody = Buffer.from(array);
        fileName = `${uuid()}-cleaned.png`;
      } catch (bgErr) {
        console.error("remove.bg error, falling back to original image:", bgErr);
        // Continue and upload original image buffer
        uploadBody = req.file.buffer;
        contentType = req.file.mimetype;
        fileName = `${uuid()}-${req.file.originalname}`;
      }
    }

    // Ensure bucket exists (for local MinIO)
    try {
      await s3.send(new HeadBucketCommand({ Bucket: process.env.MINIO_BUCKET }));
    } catch (headErr) {
      try {
        await s3.send(new CreateBucketCommand({ Bucket: process.env.MINIO_BUCKET }));
      } catch (createErr) {
        console.error("Failed to create bucket:", createErr);
        return res.status(500).json({
          message: "Error creating product",
          detail: "Unable to create storage bucket",
        });
      }
    }

    // 2. Upload file (cleaned or original) to MinIO
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.MINIO_BUCKET,
          Key: fileName,
          Body: uploadBody,
          ContentType: contentType,
        })
      );
    } catch (uploadErr) {
      console.error("Failed to upload to storage:", uploadErr);
      return res.status(500).json({
        message: "Error creating product",
        detail: "Unable to upload image to storage",
      });
    }

    // 3. Create product entry in MongoDB
    const product = await Product.create({
      ...body,
      style,
      temperature,
      imageKey: fileName,
      user: (req.user as any)._id,
    });

    // Build signed URL for immediate display
    const cmd = new GetObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: product.imageKey,
    });
    const imageUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });

    res.status(201).json({
      ...product.toObject(),
      imageUrl,
    });
  } catch (err) {
    console.error("Error creating product:", err);
    const detail = err instanceof Error ? err.message : undefined;
    res.status(500).json({ message: "Error creating product", detail });
  }
};


// GET ALL PRODUCTS (WITH FILTERING + SIGNED URLs)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const filters: any = { user: (req.user as any)._id };
    //     const products = await Product.find({
    //   user: (req.user as any)._id,
    //   color: "black",
    //   type: "tshirt"
    // });
    // Build dynamic filters
    //only filter by fields the client provided
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

// PRODUCT METADATA (options for client forms)
//Return dropdown values for frontend forms
export const getProductMeta = (_req: Request, res: Response) => {
  res.json({
    clothingCategories,
    clothingPatterns,
    clothingWeather,
    clothingColors,
    clothingStyles,
    clothingFits,
  });
};
