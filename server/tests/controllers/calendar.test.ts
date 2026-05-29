import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../testApp';
import { connectDB, disconnectDB, clearDB } from '../setup';
import { CalendarEntry } from '../../src/models/CalendarEntry';
import { Outfit } from '../../src/models/Outfit';

jest.mock('../../src/middleware/auth', () => ({ isAuthenticated: jest.fn() }));
jest.mock('../../src/config/minIO', () => ({
  s3: { send: jest.fn().mockResolvedValue({}) },
  s3Public: { send: jest.fn().mockResolvedValue({}) },
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://fake.url/image.jpg'),
}));

import { isAuthenticated } from '../../src/middleware/auth';

const app = createApp();
let userId: mongoose.Types.ObjectId;

beforeAll(connectDB);
afterAll(disconnectDB);
afterEach(clearDB);

beforeEach(() => {
  userId = new mongoose.Types.ObjectId();
  jest.mocked(isAuthenticated).mockImplementation(async (req: any, _: any, next: any) => {
    req.user = { _id: userId };
    next();
  });
});

describe('GET /api/calendar', () => {
  it('returns 400 when year and month are missing', async () => {
    const res = await request(app).get('/api/calendar');
    expect(res.status).toBe(400);
  });

  it('returns empty array for a month with no entries', async () => {
    const res = await request(app).get('/api/calendar?year=2024&month=1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns entries only for the given month', async () => {
    const outfit = await Outfit.create({ user: userId, name: 'Outfit' });
    await CalendarEntry.create({ user: userId, date: '2024-01-15', outfit: outfit._id });
    await CalendarEntry.create({ user: userId, date: '2024-02-01', outfit: outfit._id });

    const res = await request(app).get('/api/calendar?year=2024&month=1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].date).toBe('2024-01-15');
  });

  it('does not return another user calendar entries', async () => {
    const otherId = new mongoose.Types.ObjectId();
    const outfit = await Outfit.create({ user: otherId, name: 'Other' });
    await CalendarEntry.create({ user: otherId, date: '2024-01-10', outfit: outfit._id });

    const res = await request(app).get('/api/calendar?year=2024&month=1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('POST /api/calendar', () => {
  it('returns 400 when date is missing', async () => {
    const outfit = await Outfit.create({ user: userId, name: 'Outfit' });
    const res = await request(app)
      .post('/api/calendar')
      .send({ outfitId: outfit.id });

    expect(res.status).toBe(400);
  });

  it('returns 400 when outfitId is missing', async () => {
    const res = await request(app)
      .post('/api/calendar')
      .send({ date: '2024-01-15' });

    expect(res.status).toBe(400);
  });

  it('creates a new calendar entry', async () => {
    const outfit = await Outfit.create({ user: userId, name: 'My Outfit' });
    const res = await request(app)
      .post('/api/calendar')
      .send({ date: '2024-01-15', outfitId: outfit.id });

    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2024-01-15');
    expect(res.body.outfit._id).toBe(outfit.id);
  });

  it('updates an existing entry for the same date (upsert)', async () => {
    const outfit1 = await Outfit.create({ user: userId, name: 'First' });
    const outfit2 = await Outfit.create({ user: userId, name: 'Second' });

    await request(app)
      .post('/api/calendar')
      .send({ date: '2024-01-15', outfitId: outfit1.id });

    const res = await request(app)
      .post('/api/calendar')
      .send({ date: '2024-01-15', outfitId: outfit2.id });

    expect(res.status).toBe(200);
    expect(res.body.outfit._id).toBe(outfit2.id);

    const count = await CalendarEntry.countDocuments({ user: userId, date: '2024-01-15' });
    expect(count).toBe(1);
  });
});

describe('DELETE /api/calendar/:id', () => {
  it('deletes a calendar entry', async () => {
    const outfit = await Outfit.create({ user: userId, name: 'Outfit' });
    const entry = await CalendarEntry.create({ user: userId, date: '2024-01-15', outfit: outfit._id });

    const res = await request(app).delete(`/api/calendar/${entry._id}`);
    expect(res.status).toBe(200);
    expect(await CalendarEntry.findById(entry._id)).toBeNull();
  });

  it('returns 403 when deleting another user entry', async () => {
    const otherId = new mongoose.Types.ObjectId();
    const outfit = await Outfit.create({ user: otherId, name: 'Other' });
    const entry = await CalendarEntry.create({ user: otherId, date: '2024-01-20', outfit: outfit._id });

    const res = await request(app).delete(`/api/calendar/${entry._id}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 for a missing entry', async () => {
    const res = await request(app).delete(`/api/calendar/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });
});
