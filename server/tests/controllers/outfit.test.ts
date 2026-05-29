import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../testApp';
import { connectDB, disconnectDB, clearDB } from '../setup';
import { Outfit } from '../../src/models/Outfit';
import { Product } from '../../src/models/Product';

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

const baseProduct = {
  name: 'Black Tee',
  category: 'tops',
  type: 'tshirt',
  color: 'black',
  pattern: 'plain',
  fit: 'regular',
  style: ['casual'],
  temperature: ['warm'],
  imageKey: 'key1',
};

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

describe('GET /api/outfits', () => {
  it('returns empty array when user has no outfits', async () => {
    const res = await request(app).get('/api/outfits');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns the user outfits', async () => {
    await Outfit.create({ user: userId, name: 'My Outfit' });
    const res = await request(app).get('/api/outfits');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('My Outfit');
  });

  it('does not return another user outfits', async () => {
    await Outfit.create({ user: new mongoose.Types.ObjectId(), name: 'Other Outfit' });
    const res = await request(app).get('/api/outfits');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('POST /api/outfits', () => {
  it('creates an outfit and returns 201', async () => {
    const res = await request(app).post('/api/outfits').send({ name: 'Casual Friday' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Casual Friday');
    expect(res.body).toHaveProperty('_id');
  });

  it('creates an outfit with a product reference', async () => {
    const product = await Product.create({ ...baseProduct, user: userId });
    const res = await request(app)
      .post('/api/outfits')
      .send({ name: 'With Top', top: product.id });

    expect(res.status).toBe(201);
    expect(res.body.top._id).toBe(product.id);
    expect(res.body.top).toHaveProperty('imageUrl');
  });

  it('creates an outfit with an empty name', async () => {
    const res = await request(app).post('/api/outfits').send({});
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('');
  });
});

describe('POST /api/outfits/suggestions', () => {
  it('returns suggestions array', async () => {
    await Product.create({ ...baseProduct, user: userId });
    const res = await request(app)
      .post('/api/outfits/suggestions')
      .send({ temperature: 'warm', count: 3 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('suggestions');
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body).toHaveProperty('filters');
    expect(res.body.filters.temperature).toBe('warm');
  });

  it('returns empty suggestions when wardrobe is empty', async () => {
    const res = await request(app).post('/api/outfits/suggestions').send({});
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toEqual([]);
    expect(res.body.count).toBe(0);
  });
});

describe('PUT /api/outfits/:id', () => {
  it('updates an outfit name', async () => {
    const outfit = await Outfit.create({ user: userId, name: 'Old Name' });
    const res = await request(app)
      .put(`/api/outfits/${outfit._id}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  it('returns 403 when updating another user outfit', async () => {
    const outfit = await Outfit.create({ user: new mongoose.Types.ObjectId(), name: 'Theirs' });
    const res = await request(app)
      .put(`/api/outfits/${outfit._id}`)
      .send({ name: 'Hijack' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for a missing outfit', async () => {
    const res = await request(app)
      .put(`/api/outfits/${new mongoose.Types.ObjectId()}`)
      .send({ name: 'x' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/outfits/:id', () => {
  it('deletes an outfit', async () => {
    const outfit = await Outfit.create({ user: userId, name: 'To Delete' });
    const res = await request(app).delete(`/api/outfits/${outfit._id}`);

    expect(res.status).toBe(200);
    expect(await Outfit.findById(outfit._id)).toBeNull();
  });

  it('returns 403 when deleting another user outfit', async () => {
    const outfit = await Outfit.create({ user: new mongoose.Types.ObjectId(), name: 'Theirs' });
    const res = await request(app).delete(`/api/outfits/${outfit._id}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a missing outfit', async () => {
    const res = await request(app).delete(`/api/outfits/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });
});
