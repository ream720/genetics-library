import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.VITE_GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "VITE_GOOGLE_GENAI_API_KEY environment variable is required. Add it to your .env file."
  );
}

console.log("Initializing Genkit...");

const genkitInstance = genkit({
  plugins: [
    googleAI({
      apiKey,
    }),
  ],
});

console.log("Genkit initialized");

export const ai = genkitInstance;
