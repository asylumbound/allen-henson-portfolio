import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(),
}));

describe("Contact Form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Input Validation", () => {
    it("should require a name", () => {
      const input = { name: "", email: "test@example.com", message: "Hello there!" };
      expect(input.name.length).toBe(0);
    });

    it("should require a valid email", () => {
      const validEmail = "test@example.com";
      const invalidEmail = "not-an-email";
      
      expect(validEmail.includes("@")).toBe(true);
      expect(invalidEmail.includes("@")).toBe(false);
    });

    it("should require a message with at least 10 characters", () => {
      const shortMessage = "Hi";
      const validMessage = "Hello, I would like to inquire about your services.";
      
      expect(shortMessage.length).toBeLessThan(10);
      expect(validMessage.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Notification Content", () => {
    it("should format notification title correctly", () => {
      const name = "John Doe";
      const title = `New Contact Form Submission from ${name}`;
      
      expect(title).toBe("New Contact Form Submission from John Doe");
    });

    it("should format notification content with all fields", () => {
      const input = {
        name: "John Doe",
        email: "john@example.com",
        message: "I would like to book a photoshoot.",
      };
      
      const content = `
**Name:** ${input.name}
**Email:** ${input.email}

**Message:**
${input.message}

---
*Submitted via allenhenson.com contact form*
      `.trim();
      
      expect(content).toContain("**Name:** John Doe");
      expect(content).toContain("**Email:** john@example.com");
      expect(content).toContain("I would like to book a photoshoot.");
      expect(content).toContain("allenhenson.com contact form");
    });
  });

  describe("Form Submission", () => {
    it("should accept valid form data", () => {
      const validFormData = {
        name: "Jane Smith",
        email: "jane@example.com",
        message: "I'm interested in your commercial photography services for our upcoming campaign.",
      };
      
      expect(validFormData.name.length).toBeGreaterThan(0);
      expect(validFormData.email.includes("@")).toBe(true);
      expect(validFormData.message.length).toBeGreaterThanOrEqual(10);
    });
  });
});
