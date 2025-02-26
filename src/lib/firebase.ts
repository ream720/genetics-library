// src/lib/firebase.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import type { SeedAssistantResponse } from "../schemas/seedSchemas";

// Define the request type to match the function's expected input
interface AnalyzeSeedRequest {
  message: string;
  previousContext?: string;
}

const functions = getFunctions();

// Type the function call for better compile-time safety
export const analyzeSeedFunc = httpsCallable<
  AnalyzeSeedRequest,
  SeedAssistantResponse
>(functions, "analyzeSeed");
