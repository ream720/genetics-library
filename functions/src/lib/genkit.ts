// functions/src/lib/genkit.ts
import { genkit } from "genkit";
import { gemini, googleAI } from "@genkit-ai/googleai";
import { defineSecret } from "firebase-functions/params";

export const GOOGLE_AI_KEY = defineSecret("GOOGLE_AI_API_KEY");
export const SEED_ASSISTANT_MODEL_NAME = "gemini-2.5-flash-lite";
export const SEED_ASSISTANT_MAX_OUTPUT_TOKENS = 768;

export const seedAssistantModel = gemini(SEED_ASSISTANT_MODEL_NAME, {
  maxOutputTokens: SEED_ASSISTANT_MAX_OUTPUT_TOKENS,
});

export function initializeGenkit(apiKey: string) {
  return genkit({
    plugins: [
      googleAI({
        apiKey,
        models: [seedAssistantModel],
      }),
    ],
  });
}
