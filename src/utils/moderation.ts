import { AppError } from './response';
import { checkContentWithAI } from './novita';

// List of profane / inappropriate / uncensored words
const BAD_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'crap', 'porn', 'nude', 'sex', 'dick', 'pussy', 'slut'
];

/**
 * Checks content for inappropriate or uncensored language using local filter and AI.
 * Throws an AppError if validation fails.
 */
export async function checkPublicContent(text: string | undefined): Promise<void> {
  if (!text) return;

  const lowercase = text.toLowerCase();

  // 1. Fast local check for bad words / uncensored language
  for (const word of BAD_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowercase)) {
      throw new AppError('You are not publishing that data', 400);
    }
  }

  // 2. Fallback / deep check using AI
  await checkContentWithAI(text);
}
