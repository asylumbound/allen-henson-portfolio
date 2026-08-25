/**
 * Tests for AI Alt Text Generator
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCreate } };
  },
}));

vi.mock("./_core/errorDetail", () => ({
  logErrorCauseChain: vi.fn(),
}));

import { generateAltText, generateAltTextBatch } from "./altTextGenerator";

function chatResponse(payload: unknown) {
  return {
    choices: [{ message: { content: JSON.stringify(payload) } }],
  };
}

describe("Alt Text Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("should generate alt text for an image", async () => {
    mockCreate.mockResolvedValueOnce(
      chatResponse({
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
    delete process.env.OPENAI_API_KEY;

    const result = await generateAltText("https://example.com/image.jpg");

    expect(result.altText).toBe("Professional photography by Allen Henson");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should return fallback on malformed JSON response", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "not valid json {{" } }],
    });

    const result = await generateAltText("https://example.com/image.jpg");

    expect(result.altText).toBe("Professional photography by Allen Henson");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("should include context in the prompt", async () => {
    mockCreate.mockResolvedValueOnce(
      chatResponse({
        altText: "Portrait of a woman in natural light",
        title: "Natural Light Portrait",
        description: "A portrait photograph taken with natural lighting.",
        keywords: ["portrait", "natural light", "photography"],
      })
    );

    await generateAltText("https://example.com/portrait.jpg", "editorial portrait");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: expect.arrayContaining([
              expect.objectContaining({
                type: "text",
                text: expect.stringContaining("editorial portrait"),
              }),
            ]),
          }),
        ]),
      }),
      expect.anything()
    );
  });

  it("should pass the image URL to the model", async () => {
    mockCreate.mockResolvedValueOnce(
      chatResponse({
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
                type: "image_url",
                image_url: expect.objectContaining({
                  url: "https://example.com/image.jpg",
                }),
              }),
            ]),
          }),
        ]),
      }),
      expect.anything()
    );
  });

  it("should process batch images sequentially", async () => {
    mockCreate
      .mockResolvedValueOnce(
        chatResponse({
          altText: "First image alt text",
          title: "First Image",
          description: "Description of first image.",
          keywords: ["first"],
        })
      )
      .mockResolvedValueOnce(
        chatResponse({
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
