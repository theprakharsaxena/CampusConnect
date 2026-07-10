import { checkContentWithAI, moderateImageWithAI } from './novita';

/**
 * Checks content for inappropriate or uncensored language using AI.
 * Throws an AppError if validation fails.
 */
export async function checkPublicContent(text: string | undefined): Promise<void> {
  if (!text) return;

  // Fallback / deep check using AI
  await checkContentWithAI(text);
}

/**
 * Checks if an image buffer contains inappropriate or NSFW content.
 * Throws an AppError if validation fails.
 */
export async function checkPublicImage(imageBuffer: Buffer | undefined): Promise<void> {
  if (!imageBuffer) return;

  const base64 = imageBuffer.toString('base64');
  await moderateImageWithAI(base64);
}
