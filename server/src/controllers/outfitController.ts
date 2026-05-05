import type { Request, Response } from 'express';
import { Outfit } from '../models/Outfit';
import { Product } from '../models/Product';
import { s3 } from '../config/minIO';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { buildOutfitSuggestions } from '../services/outfitRecommendationService';

const productFields = ['top', 'bottom', 'dress', 'outerwear', 'shoes'];

const addSignedProductImages = async (obj: Record<string, any>) => {
  for (const field of productFields) {
    const product = obj[field];
    if (product && product.imageKey) {
      const plainProduct =
        typeof product.toObject === 'function' ? product.toObject() : { ...product };

      try {
        const cmd = new GetObjectCommand({ Bucket: process.env.MINIO_BUCKET, Key: plainProduct.imageKey });
        plainProduct.imageUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
      } catch (err) {
        console.error('Failed to generate signed url for outfit product', err);
      }

      obj[field] = plainProduct;
    }
  }

  return obj;
};

export const createOutfit = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const body = req.body as Record<string, any>;

    const outfit = await Outfit.create({
      user: (req.user as any)._id,
      name: body.name ?? '',
      top: body.top || undefined,
      bottom: body.bottom || undefined,
      dress: body.dress || undefined,
      outerwear: body.outerwear || undefined,
      shoes: body.shoes || undefined,
    });

    res.status(201).json(outfit);
  } catch (err) {
    console.error('Error creating outfit', err);
    res.status(500).json({ message: 'Error creating outfit' });
  }
};

export const getOutfits = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const outfits = await Outfit.find({ user: (req.user as any)._id }).populate([
      { path: 'top' },
      { path: 'bottom' },
      { path: 'dress' },
      { path: 'outerwear' },
      { path: 'shoes' },
    ]);

    const enriched = await Promise.all(
      outfits.map(async (o) => {
        const obj: any = typeof o.toObject === 'function' ? o.toObject() : { ...o };
        return addSignedProductImages(obj);
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching outfits', err);
    res.status(500).json({ message: 'Error fetching outfits' });
  }
};

export const suggestOutfits = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const body = req.body as Record<string, any>;
    const count = body.count ? Number(body.count) : undefined;
    const temperature = body.temperature ? String(body.temperature) : undefined;
    const style = body.style ? String(body.style) : undefined;

    const products = await Product.find({ user: (req.user as any)._id });
    const suggestions = buildOutfitSuggestions(products as any, {
      temperature,
      style,
      count: Number.isFinite(count) ? count : undefined,
    });

    const enriched = await Promise.all(
      suggestions.map(async (suggestion) => addSignedProductImages({ ...suggestion }))
    );

    res.json({
      filters: { temperature, style },
      count: enriched.length,
      suggestions: enriched,
    });
  } catch (err) {
    console.error('Error suggesting outfits', err);
    res.status(500).json({ message: 'Error suggesting outfits' });
  }
};

export const deleteOutfit = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const o = await Outfit.findById(req.params.id);
    if (!o) return res.status(404).json({ message: 'Not found' });
    if (o.user.toString() !== (req.user as any)._id.toString()) return res.status(403).json({ message: 'Not allowed' });

    await o.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting outfit', err);
    res.status(500).json({ message: 'Error deleting outfit' });
  }
};
