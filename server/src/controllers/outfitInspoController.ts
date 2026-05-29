import type { Request, Response } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/minIO";
import { Product } from "../models/Product";
import { analyzeInspoImage, matchInspoToWardrobe } from "../services/outfitInspoService";

const addSignedImage = async (product: any) => {
  const plainProduct = typeof product.toObject === "function" ? product.toObject() : { ...product };

  if (plainProduct.imageKey) {
    const cmd = new GetObjectCommand({ Bucket: process.env.MINIO_BUCKET, Key: plainProduct.imageKey });
    plainProduct.imageUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
  }

  return plainProduct;
};

export const analyzeOutfitInspo = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (!req.file) return res.status(400).json({ message: "Inspiration image is required" });

    const products = await Product.find({ user: (req.user as any)._id });
    const analysis = await analyzeInspoImage(req.file, products as any);
    const matches = matchInspoToWardrobe(analysis, products as any);

    const enrichedMatches = await Promise.all(
      matches.map(async (match) => ({
        ...match,
        product: match.product ? await addSignedImage(match.product) : undefined,
      }))
    );

    res.json({
      analysis,
      matches: enrichedMatches,
    });
  } catch (err) {
    console.error("Error analyzing outfit inspo", err);
    const detail = err instanceof Error ? err.message : undefined;
    res.status(500).json({ message: "Error analyzing outfit inspo", detail });
  }
};
