import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Mock the database functions
vi.mock('./db', () => ({
  getImageOrder: vi.fn(),
  saveImageOrder: vi.fn(),
  getDb: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

import { getImageOrder, saveImageOrder } from './db';

function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as TrpcContext['res'],
  };
}

describe('Gallery Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('gallery.getOrder', () => {
    it('should return null order when no saved order exists', async () => {
      vi.mocked(getImageOrder).mockResolvedValue(null);
      
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.getOrder({ gallery: 'photos' });
      
      expect(result.order).toBeNull();
      expect(getImageOrder).toHaveBeenCalledWith('photos');
    });

    it('should return parsed order when saved order exists', async () => {
      const savedOrder = ['/images/photo1.jpg', '/images/photo2.jpg'];
      vi.mocked(getImageOrder).mockResolvedValue({
        id: 1,
        gallery: 'photos',
        imageOrder: JSON.stringify(savedOrder),
        updatedAt: new Date(),
      });
      
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.getOrder({ gallery: 'photos' });
      
      expect(result.order).toEqual(savedOrder);
    });
  });

  describe('gallery.saveOrder', () => {
    it('should reject invalid password', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.gallery.saveOrder({
          gallery: 'photos',
          order: ['/images/photo1.jpg'],
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid password');
    });

    it('should save order with correct password', async () => {
      vi.mocked(saveImageOrder).mockResolvedValue({ success: true });
      
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.saveOrder({
        gallery: 'photos',
        order: ['/images/photo1.jpg', '/images/photo2.jpg'],
        password: 'allenhenson2026',
      });
      
      expect(result.success).toBe(true);
      expect(saveImageOrder).toHaveBeenCalledWith('photos', ['/images/photo1.jpg', '/images/photo2.jpg']);
    });
  });

  describe('admin.verifyPassword', () => {
    it('should reject invalid password', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.admin.verifyPassword({ password: 'wrongpassword' })
      ).rejects.toThrow('Invalid password');
    });

    it('should accept correct password', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.admin.verifyPassword({ password: 'allenhenson2026' });
      
      expect(result.success).toBe(true);
      expect(result.token).toBe('admin-verified');
    });
  });
});
