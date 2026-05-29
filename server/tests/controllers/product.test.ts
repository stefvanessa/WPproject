import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../testApp';
import { connectDB, disconnectDB, clearDB } from '../setup';
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
  name: 'Test T-Shirt',
  category: 'tops',
  type: 'tshirt',
  color: 'black',
  pattern: 'plain',
  fit: 'regular',
  style: ['casual'],
  temperature: ['warm'],
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

describe('GET /api/products/meta/options', () => {
  it('returns clothing metadata', async () => {
    const res = await request(app).get('/api/products/meta/options');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('clothingCategories');
    expect(res.body).toHaveProperty('clothingColors');
    expect(res.body).toHaveProperty('clothingFits');
    expect(res.body).toHaveProperty('clothingPatterns');
  });
});

describe('GET /api/products', () => {
  it('returns empty array when user has no products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns the user products with imageUrl', async () => {
    await Product.create({ ...baseProduct, user: userId, imageKey: 'key1' });
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Test T-Shirt');
    expect(res.body[0]).toHaveProperty('imageUrl');
  });

  it('filters by color', async () => {
    await Product.create({ ...baseProduct, user: userId, imageKey: 'k1' });
    await Product.create({ ...baseProduct, name: 'Blue Shirt', color: 'blue', type: 'shirt', user: userId, imageKey: 'k2' });

    const res = await request(app).get('/api/products?color=blue');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].color).toBe('blue');
  });

  it('filters by category', async () => {
    await Product.create({ ...baseProduct, user: userId, imageKey: 'k1' });
    await Product.create({ ...baseProduct, name: 'Jeans', category: 'bottoms', type: 'jeans', user: userId, imageKey: 'k2' });

    const res = await request(app).get('/api/products?category=bottoms');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].category).toBe('bottoms');
  });

  it('does not return another user products', async () => {
    const otherId = new mongoose.Types.ObjectId();
    await Product.create({ ...baseProduct, user: otherId, imageKey: 'k1' });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('GET /api/products/:id', () => {
  it('returns a product with imageUrl', async () => {
    const product = await Product.create({ ...baseProduct, user: userId, imageKey: 'k1' });
    const res = await request(app).get(`/api/products/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(product.id);
    expect(res.body).toHaveProperty('imageUrl');
  });

  it('returns 404 for a missing product', async () => {
    const res = await request(app).get(`/api/products/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });

  it('returns 403 for another user product', async () => {
    const product = await Product.create({ ...baseProduct, user: new mongoose.Types.ObjectId(), imageKey: 'k1' });
    const res = await request(app).get(`/api/products/${product._id}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/products', () => {
  it('creates a product and returns 201 with imageUrl', async () => {
    const res = await request(app)
      .post('/api/products')
      .field('name', baseProduct.name)
      .field('category', baseProduct.category)
      .field('type', baseProduct.type)
      .field('color', baseProduct.color)
      .field('pattern', baseProduct.pattern)
      .field('fit', baseProduct.fit)
      .field('style', 'casual')
      .field('temperature', 'warm')
      .attach('image', Buffer.from('fake-image-data'), { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(baseProduct.name);
    expect(res.body).toHaveProperty('imageUrl');
  });

  it('returns 400 when image is missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .field('name', 'Test')
      .field('category', 'tops')
      .field('type', 'tshirt')
      .field('color', 'black')
      .field('pattern', 'plain')
      .field('fit', 'regular')
      .field('style', 'casual')
      .field('temperature', 'warm');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/image/i);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .field('name', 'Test')
      .attach('image', Buffer.from('fake'), { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing/i);
  });
});

describe('PUT /api/products/:id', () => {
  it('updates a product', async () => {
    const product = await Product.create({ ...baseProduct, user: userId, imageKey: 'k1' });
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
    expect(res.body).toHaveProperty('imageUrl');
  });

  it('returns 403 when updating another user product', async () => {
    const product = await Product.create({ ...baseProduct, user: new mongoose.Types.ObjectId(), imageKey: 'k1' });
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .send({ name: 'Hijack' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for a missing product', async () => {
    const res = await request(app)
      .put(`/api/products/${new mongoose.Types.ObjectId()}`)
      .send({ name: 'x' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  it('deletes a product', async () => {
    const product = await Product.create({ ...baseProduct, user: userId, imageKey: 'k1' });
    const res = await request(app).delete(`/api/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(await Product.findById(product._id)).toBeNull();
  });

  it('returns 403 when deleting another user product', async () => {
    const product = await Product.create({ ...baseProduct, user: new mongoose.Types.ObjectId(), imageKey: 'k1' });
    const res = await request(app).delete(`/api/products/${product._id}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a missing product', async () => {
    const res = await request(app).delete(`/api/products/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });
});
