import type { Request, Response } from 'express';
import { Outfit } from '../models/Outfit';
import { s3 } from '../config/minIO';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

    // Enrich each populated product with a signed imageUrl (MinIO)
    const enriched = await Promise.all(
      outfits.map(async (o) => {
        // Convert mongoose doc to plain object
        const obj: any = typeof o.toObject === 'function' ? o.toObject() : { ...o };

        const fields = ['top', 'bottom', 'dress', 'outerwear', 'shoes'];
        for (const f of fields) {
          const prod = obj[f];
          if (prod && prod.imageKey) {
            try {
              const cmd = new GetObjectCommand({ Bucket: process.env.MINIO_BUCKET, Key: prod.imageKey });
              const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
              prod.imageUrl = url;
            } catch (err) {
              console.error('Failed to generate signed url for outfit product', err);
            }
          }
        }

        return obj;
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching outfits', err);
    res.status(500).json({ message: 'Error fetching outfits' });
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
