/**
 * AI-Powered Alt Text Generator
 * Uses the OpenAI API to analyze images and generate descriptive,
 * SEO-friendly alt text. Requires OPENAI_API_KEY; without it (or on any
 * API failure) a generic fallback is returned so uploads never break.
 */

import OpenAI from "openai";
import { logErrorCauseChain } from "./_core/errorDetail";

export interface AltTextResult {
  altText: string;
  title: string;
  description: string;
  keywords: string[];
}

const FALLBACK_RESULT: AltTextResult = {
  altText: "Professional photography by Allen Henson",
  title: "Photography",
  description: "A photograph from Allen Henson's portfolio.",
  keywords: ["photography", "allen henson", "professional"],
};

let _keyWarned = false;

function buildPrompt(context?: string): string {
  return `You are an expert at writing SEO-optimized alt text for images. Analyze the provided image and return ONLY a JSON object with these fields:
- altText: The main alt text (50-125 chars)
- title: A short title (3-8 words)
- description: A detailed description (1-2 sentences)
- keywords: An array of 3-5 relevant keywords

Guidelines:
- Be specific and descriptive, not generic
- Include relevant details like colors, composition, mood, and subject matter
- For photography, mention the style (portrait, landscape, product, editorial, etc.)
- Avoid starting with "Image of" or "Picture of"
- Focus on what's visually important
- Consider the artistic and emotional qualities of the image
${context ? `- Context: This is ${context}` : ""}

Respond with ONLY valid JSON (no markdown fences, no prose).`;
}

function parseResult(text: string): AltTextResult {
  // Strip markdown code fences if the model added them anyway
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  const parsed = JSON.parse(cleaned) as Partial<AltTextResult>;
  if (
    typeof parsed.altText !== "string" ||
    typeof parsed.title !== "string" ||
    typeof parsed.description !== "string" ||
    !Array.isArray(parsed.keywords)
  ) {
    throw new Error("Alt text response missing required fields");
  }
  return parsed as AltTextResult;
}

/**
 * Generate alt text for an image using OpenAI vision capabilities.
 * Never throws — returns a generic fallback on any failure.
 * @param imageUrl - Publicly reachable URL of the image to analyze
 * @param context - Optional context about the image (e.g., "product photography")
 */
export async function generateAltText(
  imageUrl: string,
  context?: string
): Promise<AltTextResult> {
  if (!process.env.OPENAI_API_KEY) {
    if (!_keyWarned) {
      console.warn("[AltText] OPENAI_API_KEY not set — using generic fallback alt text");
      _keyWarned = true;
    }
    return FALLBACK_RESULT;
  }

  try {
    const client = new OpenAI();
    const response = await client.chat.completions.create(
      {
        model: "gpt-4o",
        max_tokens: 1024,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
              {
                type: "text",
                text: buildPrompt(context),
              },
            ],
          },
        ],
      },
      { timeout: 30_000 }
    );

    const text = response.choices[0]?.message?.content;
    if (!text) {
      throw new Error("No text content in model response");
    }

    const result = parseResult(text);
    console.log(`[AltText] Generated for image: "${result.altText}"`);
    return result;
  } catch (error) {
    logErrorCauseChain("[AltText] Error generating alt text:", error);
    return FALLBACK_RESULT;
  }
}

/**
 * Generate alt text for multiple images in batch
 * @param images - Array of image URLs with optional context
 * @returns Array of alt text results
 */
export async function generateAltTextBatch(
  images: Array<{ url: string; context?: string }>
): Promise<Array<{ url: string; result: AltTextResult }>> {
  const results: Array<{ url: string; result: AltTextResult }> = [];

  // Process images sequentially to avoid rate limiting
  for (const image of images) {
    const result = await generateAltText(image.url, image.context);
    results.push({ url: image.url, result });
    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}
