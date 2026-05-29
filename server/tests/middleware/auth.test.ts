import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { isAuthenticated } from '../../src/middleware/auth';
import { User } from '../../src/models/User';
import { connectDB, disconnectDB, clearDB } from '../setup';

beforeAll(connectDB);
afterAll(disconnectDB);
afterEach(clearDB);

const buildReq = (overrides: Partial<Request> = {}): Request =>
  ({
    isAuthenticated: () => false,
    headers: {},
    ...overrides,
  } as unknown as Request);

const buildRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('isAuthenticated middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next when session is already authenticated', async () => {
    const req = buildReq({ isAuthenticated: (() => true) as any });
    const res = buildRes();
    await isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('authenticates via a valid JWT Bearer token', async () => {
    const user = await User.create({ googleId: 'g123', name: 'Alice', email: 'alice@test.com', avatar: '' });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);

    const req = buildReq({ headers: { authorization: `Bearer ${token}` } });
    const res = buildRes();
    await isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe(user.id);
  });

  it('returns 401 for an invalid JWT token', async () => {
    const req = buildReq({ headers: { authorization: 'Bearer not-a-valid-token' } });
    const res = buildRes();
    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when JWT has a valid signature but unknown user', async () => {
    const token = jwt.sign({ userId: new mongoose.Types.ObjectId().toString() }, process.env.JWT_SECRET!);
    const req = buildReq({ headers: { authorization: `Bearer ${token}` } });
    const res = buildRes();
    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when no authentication is present', async () => {
    const req = buildReq();
    const res = buildRes();
    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
