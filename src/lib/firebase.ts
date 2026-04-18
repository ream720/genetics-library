// src/lib/firebase.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../firebaseConfig";
import type { SeedAssistantResponse } from "../schemas/seedSchemas";

export const AI_ASSISTANT_MAX_MESSAGE_CHARS = 2000;
export const AI_ASSISTANT_MAX_CONTEXT_MESSAGES = 4;
export const AI_ASSISTANT_MAX_CONTEXT_MESSAGE_CHARS = 500;

// Define the request type to match the function's expected input
interface AnalyzeSeedRequest {
  message: string;
  previousContext?: string;
  imageData?: string; // Base64 encoded image
  imageMimeType?: string; // MIME type of the image
}

const functions = getFunctions(app);

export function getCallableErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message.replace(/^FirebaseError:\s*/, "");
  }

  return fallback;
}

// Type the function call for better compile-time safety
export const analyzeSeedFunc = httpsCallable<
  AnalyzeSeedRequest,
  SeedAssistantResponse
>(functions, "analyzeSeed");