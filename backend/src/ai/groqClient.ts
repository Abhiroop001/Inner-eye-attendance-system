import Groq from 'groq-sdk';
import { z } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../audit/auditLogger.js';

let groqInstance: Groq | null = null;

if (env.GROQ_API_KEY && env.GROQ_API_KEY.length > 5 && !env.GROQ_API_KEY.includes('placeholder')) {
  groqInstance = new Groq({ apiKey: env.GROQ_API_KEY });
}

export function getGroqClient(): Groq | null {
  return groqInstance;
}

export interface StructuredChatParams<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  fallbackGenerator: () => T;
  temperature?: number;
}

/**
 * Executes a structured Groq inference call with JSON schema parsing and fallback validation
 */
export async function executeStructuredInference<T>(params: StructuredChatParams<T>): Promise<T> {
  const { systemPrompt, userPrompt, schema, fallbackGenerator, temperature = 0.1 } = params;

  if (!groqInstance) {
    logger.debug('Groq client not configured or offline. Invoking deterministic fallback generator.');
    return fallbackGenerator();
  }

  try {
    const completion = await groqInstance.chat.completions.create({
      model: env.GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `${systemPrompt}\n\nIMPORTANT: You must return valid JSON only that strictly matches the required schema. Do not enclose in markdown blocks if possible.`,
        },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature,
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    const parsedJson = JSON.parse(rawContent);
    const validated = schema.safeParse(parsedJson);

    if (validated.success) {
      return validated.data;
    } else {
      logger.warn({ error: validated.error.format() }, 'Groq output schema validation failed. Using fallback.');
      return fallbackGenerator();
    }
  } catch (error: any) {
    logger.warn({ error: error.message }, 'Groq API request failed. Using fallback.');
    return fallbackGenerator();
  }
}
