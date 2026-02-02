/**
 * Tests for AI Alt Text Generator
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { generateAltText, generateAltTextBatch } from "./altTextGenerator";
import { invokeLLM } from "./_core/llm";

const mockInvokeLLM = vi.mocked(invokeLLM);

describe("Alt Text Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate alt text for an image", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      id: "test-id",
      created: Date.now(),
      model: "test-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              altText: "Elegant watch on dark background with dramatic lighting",
              title: "Luxury Watch Photography",
              description: "A high-end timepiece photographed with professional studio lighting against a dark backdrop.",
              keywords: ["watch", "luxury", "product photography", "studio"],
            }),
          },
          finish_reason: "stop",
        },
      ],
    });

    const result = await generateAltText("https://example.com/watch.jpg", "product photography");

    expect(result.altText).toBe("Elegant watch on dark background with dramatic lighting");
    expect(result.title).toBe("Luxury Watch Photography");
    expect(result.keywords).toContain("watch");
    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
  });

  it("should return fallback alt text on LLM error", async () => {
    mockInvokeLLM.mockRejectedValueOnce(new Error("LLM service unavailable"));

    const result = await generateAltText("https://example.com/image.jpg");

    expect(result.altText).toBe("Professional photography by Allen Henson");
    expect(result.title).toBe("Photography");
    expect(result.keywords).toContain("photography");
  });

  it("should include context in the system prompt", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      id: "test-id",
      created: Date.now(),
      model: "test-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              altText: "Portrait of a woman in natural light",
              title: "Natural Light Portrait",
              description: "A portrait photograph taken with natural lighting.",
              keywords: ["portrait", "natural light", "photography"],
            }),
          },
          finish_reason: "stop",
        },
      ],
    });

    await generateAltText("https://example.com/portrait.jpg", "editorial portrait");

    expect(mockInvokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("editorial portrait"),
          }),
        ]),
      })
    );
  });

  it("should process batch images sequentially", async () => {
    mockInvokeLLM
      .mockResolvedValueOnce({
        id: "test-1",
        created: Date.now(),
        model: "test-model",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                altText: "First image alt text",
                title: "First Image",
                description: "Description of first image.",
                keywords: ["first"],
              }),
            },
            finish_reason: "stop",
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "test-2",
        created: Date.now(),
        model: "test-model",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                altText: "Second image alt text",
                title: "Second Image",
                description: "Description of second image.",
                keywords: ["second"],
              }),
            },
            finish_reason: "stop",
          },
        ],
      });

    const results = await generateAltTextBatch([
      { url: "https://example.com/image1.jpg" },
      { url: "https://example.com/image2.jpg" },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].result.altText).toBe("First image alt text");
    expect(results[1].result.altText).toBe("Second image alt text");
    expect(mockInvokeLLM).toHaveBeenCalledTimes(2);
  });

  it("should use high detail for image analysis", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      id: "test-id",
      created: Date.now(),
      model: "test-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              altText: "Test alt text",
              title: "Test",
              description: "Test description.",
              keywords: ["test"],
            }),
          },
          finish_reason: "stop",
        },
      ],
    });

    await generateAltText("https://example.com/image.jpg");

    expect(mockInvokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: expect.arrayContaining([
              expect.objectContaining({
                type: "image_url",
                image_url: expect.objectContaining({
                  detail: "high",
                }),
              }),
            ]),
          }),
        ]),
      })
    );
  });
});
