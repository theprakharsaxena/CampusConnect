import { config } from '../config';

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
