import { checkContentWithAI } from './novita';

/**
 * Checks content for inappropriate or uncensored language using AI.
 * Throws an AppError if validation fails.
 */
export async function checkPublicContent(text: string | undefined): Promise<void> {
  if (!text) return;

  // Fallback / deep check using AI
  await checkContentWithAI(text);
}
