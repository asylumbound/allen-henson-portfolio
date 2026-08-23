/**
 * Tests for AI Alt Text Generator
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

import { generateAltText, generateAltTextBatch } from "./altTextGenerator";

function textResponse(payload: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

describe("Alt Text Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("should generate alt text for an image", async () => {
    mockCreate.mockResolvedValueOnce(
      textResponse({
        altText: "Elegant watch on dark background with dramatic lighting",
        title: "Luxury Watch Photography",
        description:
          "A high-end timepiece photographed with professional studio lighting against a dark backdrop.",
        keywords: ["watch", "luxury", "product photography", "studio"],
      })
    );

    const result = await generateAltText("https://example.com/watch.jpg", "product photography");

    expect(result.altText).toBe("Elegant watch on dark background with dramatic lighting");
    expect(result.title).toBe("Luxury Watch Photography");
    expect(result.keywords).toContain("watch");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("should return fallback alt text on API error", async () => {
    mockCreate.mockRejectedValueOnce(new Error("API unavailable"));

    const result = await generateAltText("https://example.com/image.jpg");

    expect(result.altText).toBe("Professional photography by Allen Henson");
    expect(result.title).toBe("Photography");
    expect(result.keywords).toContain("photography");
  });

  it("should return fallback alt text when no API key is configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await generateAltText("https://example.com/image.jpg");

    expect(result.altText).toBe("Professional photography by Allen Henson");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should include context in the system prompt", async () => {
    mockCreate.mockResolvedValueOnce(
      textResponse({
        altText: "Portrait of a woman in natural light",
        title: "Natural Light Portrait",
        description: "A portrait photograph taken with natural lighting.",
        keywords: ["portrait", "natural light", "photography"],
      })
    );

    await generateAltText("https://example.com/portrait.jpg", "editorial portrait");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("editorial portrait"),
      })
    );
  });

  it("should pass the image URL to the model", async () => {
    mockCreate.mockResolvedValueOnce(
      textResponse({
        altText: "Test alt text",
        title: "Test",
        description: "Test description.",
        keywords: ["test"],
      })
    );

    await generateAltText("https://example.com/image.jpg");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: expect.arrayContaining([
              expect.objectContaining({
                type: "image",
                source: expect.objectContaining({
                  type: "url",
                  url: "https://example.com/image.jpg",
                }),
              }),
            ]),
          }),
        ]),
      })
    );
  });

  it("should process batch images sequentially", async () => {
    mockCreate
      .mockResolvedValueOnce(
        textResponse({
          altText: "First image alt text",
          title: "First Image",
          description: "Description of first image.",
          keywords: ["first"],
        })
      )
      .mockResolvedValueOnce(
        textResponse({
          altText: "Second image alt text",
          title: "Second Image",
          description: "Description of second image.",
          keywords: ["second"],
        })
      );

    const results = await generateAltTextBatch([
      { url: "https://example.com/image1.jpg" },
      { url: "https://example.com/image2.jpg" },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].result.altText).toBe("First image alt text");
    expect(results[1].result.altText).toBe("Second image alt text");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
