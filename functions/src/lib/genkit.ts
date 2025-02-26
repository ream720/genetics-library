// functions/src/lib/genkit.ts
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { defineSecret } from "firebase-functions/params";

export const GOOGLE_AI_KEY = defineSecret("GOOGLE_AI_API_KEY");

export function initializeGenkit(apiKey: string) {
  console.log("Initializing Genkit...");

  const genkitInstance = genkit({
    plugins: [
      googleAI({
        apiKey,
      }),
    ],
  });

  console.log("Genkit initialized");
  return genkitInstance;
}
