// functions/src/lib/genkit.ts
import { genkit } from "genkit";
import { gemini, googleAI } from "@genkit-ai/googleai";
import { defineSecret } from "firebase-functions/params";

export const GOOGLE_AI_KEY = defineSecret("GOOGLE_AI_API_KEY");
export const seedAssistantModel = gemini("gemini-2.5-flash");

export function initializeGenkit(apiKey: string) {
  console.log("Initializing Genkit...");

  const genkitInstance = genkit({
    plugins: [
      googleAI({
        apiKey,
        models: [seedAssistantModel],
      }),
    ],
  });

  console.log("Genkit initialized");
  return genkitInstance;
}
