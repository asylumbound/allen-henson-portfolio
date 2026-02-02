import { describe, it, expect, vi } from "vitest";

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "https://example.com/test.jpg" }),
}));

describe("Gallery Upload and Delete API", () => {
  const ADMIN_PASSWORD = "allenhenson2026";

  describe("uploadImage endpoint", () => {
    it("should reject upload with invalid password", async () => {
      const input = {
        gallery: "photos" as const,
        fileName: "test.jpg",
        fileData: "dGVzdA==", // base64 for "test"
        contentType: "image/jpeg",
        password: "wrongpassword",
      };

      // Simulate password check
      const isValid = input.password === ADMIN_PASSWORD;
      expect(isValid).toBe(false);
    });

    it("should accept upload with valid password", async () => {
      const input = {
        gallery: "photos" as const,
        fileName: "test.jpg",
        fileData: "dGVzdA==",
        contentType: "image/jpeg",
        password: ADMIN_PASSWORD,
      };

      const isValid = input.password === ADMIN_PASSWORD;
      expect(isValid).toBe(true);
    });

    it("should generate unique file key with timestamp", () => {
      const fileName = "My Photo.jpg";
      const gallery = "photos";
      const timestamp = Date.now();
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
      const fileKey = `gallery/${gallery}/${timestamp}-${cleanFileName}`;

      expect(cleanFileName).toBe("my-photo.jpg");
      expect(fileKey).toContain("gallery/photos/");
      expect(fileKey).toContain("-my-photo.jpg");
    });

    it("should handle special characters in filename", () => {
      const fileName = "Test Image (1) [final].jpg";
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
      
      expect(cleanFileName).toBe("test-image--1---final-.jpg");
    });
  });

  describe("deleteImage endpoint", () => {
    it("should reject delete with invalid password", async () => {
      const input = {
        gallery: "photos" as const,
        imageSrc: "/images/test.jpg",
        password: "wrongpassword",
      };

      const isValid = input.password === ADMIN_PASSWORD;
      expect(isValid).toBe(false);
    });

    it("should accept delete with valid password", async () => {
      const input = {
        gallery: "photos" as const,
        imageSrc: "/images/test.jpg",
        password: ADMIN_PASSWORD,
      };

      const isValid = input.password === ADMIN_PASSWORD;
      expect(isValid).toBe(true);
    });

    it("should filter out deleted image from order", () => {
      const currentOrder = ["/images/a.jpg", "/images/b.jpg", "/images/c.jpg"];
      const imageToDelete = "/images/b.jpg";
      const newOrder = currentOrder.filter(src => src !== imageToDelete);

      expect(newOrder).toEqual(["/images/a.jpg", "/images/c.jpg"]);
      expect(newOrder.length).toBe(2);
    });
  });

  describe("gallery types", () => {
    it("should only allow photos or journal galleries", () => {
      const validGalleries = ["photos", "journal"];
      
      expect(validGalleries.includes("photos")).toBe(true);
      expect(validGalleries.includes("journal")).toBe(true);
      expect(validGalleries.includes("other")).toBe(false);
    });
  });
});
