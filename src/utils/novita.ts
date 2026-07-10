import { config } from '../config';
import { AppError } from './response';

const NOVITA_API_URL = 'https://api.novita.ai/openai/v1/chat/completions';
// deepseek-v3.2 — best for DSA/coding on Novita AI, cheap and fast
const MODEL = 'deepseek/deepseek-v3.2';

interface NovitaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callNovita(messages: NovitaMessage[], maxTokens = 400): Promise<string> {
  const apiKey = config.novitaApiKey;
  if (!apiKey) {
    throw new Error('NOVITA_API_KEY is not configured');
  }

  const response = await fetch(NOVITA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Novita API error: ${response.status} — ${error}`);
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[];
  };

  return data.choices[0]?.message?.content?.trim() ?? '';
}

/**
 * Get a progressive hint for a DSA challenge without revealing the answer.
 * hintLevel: 1 = vague nudge, 2 = approach hint, 3 = almost there
 */
export async function getDSAHint(
  question: string,
  code: string | undefined,
  _correctOption: string,
  options: { label: string; text: string }[],
  hintLevel: 1 | 2 | 3
): Promise<string> {
  const optionsText = options.map((o) => `${o.label}: ${o.text}`).join('\n');
  const hintInstructions = {
    1: 'Give a very vague hint — just mention the general concept or data structure to think about. Do NOT mention the answer.',
    2: 'Give a medium hint — suggest the approach or algorithm to use. Do NOT mention the correct option.',
    3: 'Give a strong hint — almost give away the answer but make the student think the last step. Still do NOT say which option is correct.',
  };

  const messages: NovitaMessage[] = [
    {
      role: 'system',
      content: `You are a friendly DSA tutor. Your job is to help students understand DSA problems through hints — never give away the answer directly. Keep hints concise (2-3 sentences max).`,
    },
    {
      role: 'user',
      content: `Question: ${question}
${code ? `\nCode:\n${code}\n` : ''}
Options:
${optionsText}

${hintInstructions[hintLevel]}`,
    },
  ];

  return callNovita(messages, 150);
}

/**
 * Get an AI explanation of WHY the correct answer is correct after submission.
 */
export async function getDSAExplanation(
  question: string,
  code: string | undefined,
  options: { label: string; text: string }[],
  correctOption: string,
  correctText: string,
  userOption: string,
  isCorrect: boolean
): Promise<string> {
  const optionsText = options.map((o) => `${o.label}: ${o.text}`).join('\n');

  const messages: NovitaMessage[] = [
    {
      role: 'system',
      content: `You are a DSA tutor explaining why an answer is correct. Be concise, clear, and educational. Max 4-5 sentences.`,
    },
    {
      role: 'user',
      content: `Question: ${question}
${code ? `\nCode:\n${code}\n` : ''}
Options:
${optionsText}

Correct answer: ${correctOption} — ${correctText}
Student selected: ${userOption}
Student was: ${isCorrect ? 'CORRECT' : 'WRONG'}

Explain why ${correctOption} is the right answer. If wrong, also briefly explain why ${userOption} is incorrect. Focus on the concept, time/space complexity if relevant.`,
    },
  ];

  return callNovita(messages, 300);
}

/**
 * Generate a new DSA challenge using AI (used for auto-generating future challenges).
 */
export async function generateDSAChallenge(
  topic: string,
  difficulty: string,
  existingTitles: string[]
): Promise<{
  title: string;
  question: string;
  code?: string;
  options: { label: string; text: string }[];
  correctOption: string;
  explanation: string;
}> {
  const messages: NovitaMessage[] = [
    {
      role: 'system',
      content: `You are a DSA question generator. Generate a multiple-choice DSA question. Return ONLY valid JSON matching the exact schema provided. No extra text.`,
    },
    {
      role: 'user',
      content: `Generate a ${difficulty} level DSA question on the topic: ${topic}.
Do NOT repeat these titles: ${existingTitles.slice(-10).join(', ')}.

Return JSON in this exact format:
{
  "title": "short title",
  "question": "full question text",
  "code": "optional code snippet or null",
  "options": [
    {"label": "A", "text": "option A text"},
    {"label": "B", "text": "option B text"},
    {"label": "C", "text": "option C text"},
    {"label": "D", "text": "option D text"}
  ],
  "correctOption": "A or B or C or D",
  "explanation": "why correctOption is right"
}`,
    },
  ];

  const raw = await callNovita(messages, 600);

  // Extract JSON from response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON in AI response');

  return JSON.parse(jsonMatch[0]);
}

/**
 * Checks content appropriateness using AI (DeepSeek / Llama on Novita).
 */
export async function checkContentWithAI(text: string | undefined): Promise<void> {
  if (!text || text.trim() === '') return;

  const messages: NovitaMessage[] = [
    {
      role: 'system',
      content: `You are a content moderation AI for CampusConnect, a college network application.
Analyze if the user's content (posts, events, or opportunities) is appropriate to be published.
Content MUST NOT contain highly offensive, profane, uncensored bad words, hate speech, or explicit sexual language.

Respond in EXACTLY the following JSON format (no Markdown block, no backticks, just raw JSON):
{
  "approved": true or false,
  "reason": "If not approved, explain in one clear, polite sentence why it is inappropriate (e.g. 'Your content contains inappropriate or profane language. Please keep it clean.'). Otherwise, leave empty."
}`
    },
    {
      role: 'user',
      content: text
    }
  ];

  try {
    const responseText = await callNovita(messages, 150);
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned) as { approved: boolean; reason: string };
    if (!result.approved) {
      throw new AppError(result.reason || 'You are not publishing that data', 400);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('AI Moderation failed, falling back to local:', error);
  }
}

/**
 * Moderates an image using Llama 3.2 Vision on Novita AI.
 * Throws AppError 400 if the image contains NSFW or inappropriate content.
 */
export async function moderateImageWithAI(imageBase64: string): Promise<void> {
  const apiKey = config.novitaApiKey;
  if (!apiKey) {
    throw new Error('NOVITA_API_KEY is not configured');
  }

  let formattedBase64 = imageBase64;
  if (!formattedBase64.startsWith('data:image/')) {
    formattedBase64 = `data:image/jpeg;base64,${formattedBase64}`;
  }

  const messages = [
    {
      role: 'system',
      content: `You are an image moderation AI for CampusConnect, a college network application.
Analyze if the provided image is appropriate to be published on a college platform.
The image MUST NOT contain:
1. Underwear, lingerie, swimwear, nudity, semi-nudity, or highly suggestive/sexual content (NSFW).
2. Graphic violence, blood, or gore.
3. Obscene gestures or hate symbols.

Be extremely strict. If there is a person in underwear, lingerie, swimwear, or displaying suggestive poses, you MUST reject the image ("approved": false).

Respond in EXACTLY the following JSON format (no Markdown block, no backticks, just raw JSON):
{
  "approved": true or false,
  "reason": "If not approved, explain in one clear, polite sentence why it is inappropriate (e.g. 'The uploaded image contains inappropriate or suggestive content. Please upload a clean image.'). Otherwise, leave empty."
}`
    },
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: formattedBase64
          }
        }
      ]
    }
  ];

  try {
    const response = await fetch(NOVITA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-vl-30b-a3b-instruct',
        messages,
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Novita VLM API error: ${response.status} — ${error}`);
      throw new AppError('The uploaded image contains inappropriate or suggestive content (flagged by safety filter).', 400);
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
    };

    const responseText = data.choices[0]?.message?.content?.trim() ?? '';
    
    // Use regex to robustly find the "approved" value from the response text
    const approvedMatch = responseText.match(/"approved"\s*:\s*(true|false)/i);
    let approved = true;
    if (approvedMatch) {
      approved = approvedMatch[1].toLowerCase() === 'true';
    } else {
      // Fallback: try parsing JSON
      try {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        approved = parsed.approved;
      } catch (e) {
        approved = false;
      }
    }

    if (!approved) {
      throw new AppError('The uploaded image contains inappropriate or suggestive content. Please upload a clean image.', 400);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('AI Image Moderation failed:', error);
    throw new AppError('Image verification failed. Please try again with a different image.', 400);
  }
}
