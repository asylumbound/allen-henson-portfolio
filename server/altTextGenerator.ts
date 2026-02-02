/**
 * AI-Powered Alt Text Generator
 * Uses the built-in LLM to analyze images and generate descriptive, SEO-friendly alt text
 */

import { invokeLLM } from "./_core/llm";

export interface AltTextResult {
  altText: string;
  title: string;
  description: string;
  keywords: string[];
}

/**
 * Generate alt text for an image using AI vision capabilities
 * @param imageUrl - URL of the image to analyze
 * @param context - Optional context about the image (e.g., "product photography", "portrait")
 * @returns Generated alt text and metadata
 */
export async function generateAltText(
  imageUrl: string,
  context?: string
): Promise<AltTextResult> {
  const systemPrompt = `You are an expert at writing SEO-optimized alt text for images. Your task is to analyze images and generate:
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

Respond in JSON format with these fields:
- altText: The main alt text (50-125 chars)
- title: A short title (3-8 words)
- description: A detailed description (1-2 sentences)
- keywords: An array of 3-5 relevant keywords`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Please analyze this image and generate alt text, title, description, and keywords.",
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "alt_text_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              altText: {
                type: "string",
                description: "Concise alt text for the image (50-125 characters)",
              },
              title: {
                type: "string",
                description: "Short title for the image (3-8 words)",
              },
              description: {
                type: "string",
                description: "Detailed description for accessibility (1-2 sentences)",
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "3-5 relevant SEO keywords",
              },
            },
            required: ["altText", "title", "description", "keywords"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      const result = JSON.parse(content) as AltTextResult;
      console.log(`[AltText] Generated for image: "${result.altText}"`);
      return result;
    }

    throw new Error("Unexpected response format from LLM");
  } catch (error) {
    console.error("[AltText] Error generating alt text:", error);
    // Return a fallback if AI generation fails
    return {
      altText: "Professional photography by Allen Henson",
      title: "Photography",
      description: "A photograph from Allen Henson's portfolio.",
      keywords: ["photography", "allen henson", "professional"],
    };
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
