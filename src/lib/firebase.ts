// src/lib/firebase.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../firebaseConfig";
import type { LegalAcceptedFrom, UserTermsAcceptance } from "./legal";
import { assertCurrentUserCanWrite } from "../services/legalAcceptance";
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

interface AcceptCurrentLegalTermsRequest {
  acceptedFrom: LegalAcceptedFrom;
}

const functions = getFunctions(app);

export function getCallableErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message.replace(/^FirebaseError:\s*/, "");
  }

  return fallback;
}

// Type the function call for better compile-time safety
const analyzeSeedCallable = httpsCallable<
  AnalyzeSeedRequest,
  SeedAssistantResponse
>(functions, "analyzeSeed");

export const acceptCurrentLegalTermsFunc = httpsCallable<
  AcceptCurrentLegalTermsRequest,
  UserTermsAcceptance
>(functions, "acceptCurrentLegalTerms");

export const analyzeSeedFunc = async (request: AnalyzeSeedRequest) => {
  await assertCurrentUserCanWrite();
  return analyzeSeedCallable(request);
};
