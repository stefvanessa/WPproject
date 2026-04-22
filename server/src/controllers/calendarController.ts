import type { Request, Response } from 'express';
import { CalendarEntry } from '../models/CalendarEntry';
import { s3 } from '../config/minIO';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function signProductUrls(outfit: any) {
  if (!outfit || !process.env.MINIO_BUCKET) return outfit;

  const fields = ['top', 'bottom', 'dress', 'outerwear', 'shoes'];
  await Promise.all(
    fields.map(async (field) => {
      if (outfit[field]?.imageKey) {
        try {
          const cmd = new GetObjectCommand({
            Bucket: process.env.MINIO_BUCKET!,
            Key: outfit[field].imageKey,
          });
          outfit[field].imageUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
        } catch {
          // leave imageUrl undefined on failure
        }
      }
    })
  );
  return outfit;
}

const outfitPopulate = {
  path: 'outfit',
  populate: [
    { path: 'top' },
    { path: 'bottom' },
    { path: 'dress' },
    { path: 'outerwear' },
    { path: 'shoes' },
  ],
};

export const getMonthEntries = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)._id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: 'year and month are required' });
    }

    const prefix = `${year}-${String(month).padStart(2, '0')}`;

    const entries = await CalendarEntry.find({
      user: userId,
      date: { $regex: `^${prefix}` },
    }).populate(outfitPopulate);

    const result = await Promise.all(
      entries.map(async (entry) => {
        const obj = entry.toObject() as any;
        obj.outfit = await signProductUrls(obj.outfit);
        return obj;
      })
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching calendar entries' });
  }
};

export const upsertEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)._id;
    const { date, outfitId } = req.body;

    if (!date || !outfitId) {
      return res.status(400).json({ message: 'date and outfitId are required' });
    }

    let entry = await CalendarEntry.findOne({ user: userId, date });
    if (!entry) {
      entry = new CalendarEntry({ user: userId, date });
    }
    entry.outfit = outfitId;
    await entry.save();

    await entry.populate(outfitPopulate);

    const obj = entry.toObject() as any;
    obj.outfit = await signProductUrls(obj.outfit);

    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving calendar entry' });
  }
};

export const deleteEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)._id;
    const entry = await CalendarEntry.findById(req.params.id);

    if (!entry) return res.status(404).json({ message: 'Not found' });
    if (entry.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    await entry.deleteOne();
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting calendar entry' });
  }
};
