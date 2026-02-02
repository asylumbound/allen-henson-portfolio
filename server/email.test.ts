/**
 * Email Service Tests
 * Tests SendGrid integration and email functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock SendGrid before importing email module
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));

describe("Email Service", () => {
  beforeEach(() => {
    vi.resetModules();
    // Set environment variables for tests
    process.env.SENDGRID_API_KEY = "SG.test_api_key_for_testing";
    process.env.SENDGRID_FROM_EMAIL = "test@allenhenson.com";
  });

  it("should check if email is configured correctly", async () => {
    const { isEmailConfigured } = await import("./email");
    
    // With valid SG. prefixed key
    process.env.SENDGRID_API_KEY = "SG.valid_key";
    const result = isEmailConfigured();
    expect(result).toBe(true);
  });

  it("should return false for invalid API key format", async () => {
    process.env.SENDGRID_API_KEY = "invalid_key_without_prefix";
    
    // Re-import to get fresh module with new env
    vi.resetModules();
    const { isEmailConfigured } = await import("./email");
    
    const result = isEmailConfigured();
    expect(result).toBe(false);
  });

  it("should return false when API key is not set", async () => {
    delete process.env.SENDGRID_API_KEY;
    
    vi.resetModules();
    const { isEmailConfigured } = await import("./email");
    
    const result = isEmailConfigured();
    expect(result).toBe(false);
  });

  it("should have sendEmail function exported", async () => {
    const { sendEmail } = await import("./email");
    expect(typeof sendEmail).toBe("function");
  });

  it("should have sendOrderConfirmation function exported", async () => {
    const { sendOrderConfirmation } = await import("./email");
    expect(typeof sendOrderConfirmation).toBe("function");
  });

  it("should have sendContactFormEmail function exported", async () => {
    const { sendContactFormEmail } = await import("./email");
    expect(typeof sendContactFormEmail).toBe("function");
  });

  it("should have sendContactAutoReply function exported", async () => {
    const { sendContactAutoReply } = await import("./email");
    expect(typeof sendContactAutoReply).toBe("function");
  });

  it("should format order confirmation email with correct data", async () => {
    const sgMail = await import("@sendgrid/mail");
    const { sendOrderConfirmation } = await import("./email");
    
    await sendOrderConfirmation({
      customerEmail: "customer@test.com",
      customerName: "John Doe",
      productName: "Test Print",
      productSize: '11"x17"',
      amountPaid: 26900, // $269.00 in cents
      orderDate: new Date("2026-01-15"),
      sessionId: "cs_test_123",
    });

    expect(sgMail.default.send).toHaveBeenCalled();
    const callArgs = (sgMail.default.send as any).mock.calls[0][0];
    expect(callArgs.to).toBe("customer@test.com");
    expect(callArgs.subject).toContain("Order Confirmation");
    expect(callArgs.subject).toContain("Test Print");
  });

  it("should format contact form email correctly", async () => {
    const sgMail = await import("@sendgrid/mail");
    // Clear previous mock calls
    (sgMail.default.send as any).mockClear();
    
    const { sendContactFormEmail } = await import("./email");
    
    await sendContactFormEmail({
      name: "Jane Smith",
      email: "jane@test.com",
      subject: "Project Inquiry",
      message: "I would like to discuss a photography project.",
      projectType: "Commercial",
    });

    expect(sgMail.default.send).toHaveBeenCalled();
    const callArgs = (sgMail.default.send as any).mock.calls[0][0];
    expect(callArgs.to).toBe("allen@allenhenson.com");
    expect(callArgs.subject).toContain("[Contact Form]");
    expect(callArgs.subject).toContain("Jane Smith");
  });
});
