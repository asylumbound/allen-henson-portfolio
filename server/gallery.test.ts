import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

const EDIT_PASSWORD = "&&77MAnila";

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

    it('should accept destinations gallery keys', async () => {
      const savedOrder = ['https://example.com/destinations/new-upload.webp'];
      vi.mocked(getImageOrder).mockResolvedValue({
        id: 1,
        gallery: 'destinations',
        imageOrder: JSON.stringify(savedOrder),
        updatedAt: new Date(),
      });

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.getOrder({ gallery: 'destinations' });

      expect(result.order).toEqual(savedOrder);
      expect(getImageOrder).toHaveBeenCalledWith('destinations');
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
        password: EDIT_PASSWORD,
      });
      
      expect(result.success).toBe(true);
      expect(saveImageOrder).toHaveBeenCalledWith('photos', ['/images/photo1.jpg', '/images/photo2.jpg']);
    });

    it('should return a safe error when order persistence fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(saveImageOrder).mockRejectedValue(new Error('Failed query: select * from image_orders'));

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.gallery.saveOrder({
          gallery: 'destinations',
          order: ['https://example.com/destinations/new-upload.webp'],
          password: EDIT_PASSWORD,
        })
      ).rejects.toThrow('Failed to save image order. Please try again.');

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should map nested SQLSTATE errors to DB_CONSTRAINT_MISSING', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(saveImageOrder).mockRejectedValue({
        name: 'DrizzleQueryError',
        message: 'Failed query: insert into "image_orders"',
        cause: {
          name: 'PostgresError',
          code: '42P10',
          message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification',
        },
      });

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.gallery.saveOrder({
          gallery: 'destinations',
          order: ['https://example.com/destinations/new-upload.webp'],
          password: EDIT_PASSWORD,
        })
      ).rejects.toMatchObject({
        cause: expect.objectContaining({ dbErrorCode: 'DB_CONSTRAINT_MISSING' }),
      });

      consoleError.mockRestore();
    });

    it('should log nested connection errors and map to DB_UNAVAILABLE', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(saveImageOrder).mockRejectedValue({
        name: 'DrizzleQueryError',
        message: 'Failed query: insert into "image_orders"',
        cause: {
          name: 'Error',
          code: 'ENOTFOUND',
          syscall: 'getaddrinfo',
          address: 'aws-0-us-east-1.pooler.supabase.com',
          port: 5432,
          message: 'getaddrinfo ENOTFOUND aws-0-us-east-1.pooler.supabase.com',
        },
      });

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.gallery.saveOrder({
          gallery: 'destinations',
          order: ['https://example.com/destinations/new-upload.webp'],
          password: EDIT_PASSWORD,
        })
      ).rejects.toMatchObject({
        cause: expect.objectContaining({ dbErrorCode: 'DB_UNAVAILABLE' }),
      });

      const loggedLines = consoleError.mock.calls.map((call) => String(call[0]));
      expect(loggedLines.some((line) => line.includes('cause[1]:') && line.includes('code=ENOTFOUND'))).toBe(true);
      consoleError.mockRestore();
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
      const result = await caller.admin.verifyPassword({ password: EDIT_PASSWORD });
      
      expect(result.success).toBe(true);
      expect(result.token).toBe('admin-verified');
    });
  });
});
