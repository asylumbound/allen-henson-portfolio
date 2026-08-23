/**
 * AI-Powered Alt Text Generator
 * Uses the Anthropic API to analyze images and generate descriptive,
 * SEO-friendly alt text. Requires ANTHROPIC_API_KEY; without it (or on any
 * API failure) a generic fallback is returned so uploads never break.
 */

import Anthropic from "@anthropic-ai/sdk";

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

function buildSystemPrompt(context?: string): string {
  return `You are an expert at writing SEO-optimized alt text for images. Your task is to analyze images and generate:
1. A concise, descriptive alt text (50-125 characters) that accurately describes the image content
2. A short title suitable for image captions
3. A longer description for accessibility
4. Relevant keywords for SEO

Guidelines:
- Be specific and descriptive, not generic
- Include relevant details like colors, composition, mood, and subject matter
- For photography, mention the style (portrait, landscape, product, editorial, etc.)
- Avoid starting with "Image of" or "Picture of"
- Focus on what's visually important
- Consider the artistic and emotional qualities of the image
${context ? `- Context: This is ${context}` : ""}

Respond with ONLY a JSON object (no markdown fences, no prose) with these fields:
- altText: The main alt text (50-125 chars)
- title: A short title (3-8 words)
- description: A detailed description (1-2 sentences)
- keywords: An array of 3-5 relevant keywords`;
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
 * Generate alt text for an image using AI vision capabilities.
 * Never throws — returns a generic fallback on any failure.
 * @param imageUrl - Publicly reachable URL of the image to analyze
 * @param context - Optional context about the image (e.g., "product photography")
 */
export async function generateAltText(
  imageUrl: string,
  context?: string
): Promise<AltTextResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[AltText] ANTHROPIC_API_KEY not configured — using fallback alt text");
    return FALLBACK_RESULT;
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      system: buildSystemPrompt(context),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: imageUrl } },
            {
              type: "text",
              text: "Please analyze this image and generate alt text, title, description, and keywords.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    if (!textBlock) {
      throw new Error("No text content in model response");
    }

    const result = parseResult(textBlock.text);
    console.log(`[AltText] Generated for image: "${result.altText}"`);
    return result;
  } catch (error) {
    console.error("[AltText] Error generating alt text:", error);
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
