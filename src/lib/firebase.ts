// src/lib/firebase.ts
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, auth } from "../../firebaseConfig";
import type { LegalAcceptedFrom, UserTermsAcceptance } from "./legal";
import { assertUserCanWrite } from "../services/legalAcceptance";
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

const requireCallableAuthUser = () => {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise<User>((resolve, reject) => {
    let settled = false;
    let unsubscribe = () => {};

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      unsubscribe();
      window.clearTimeout(timeoutId);
      callback();
    };

    const timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error("Sign in before using the AI assistant.")));
    }, 5000);

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        finish(() => {
          if (user) {
            resolve(user);
          } else {
            reject(new Error("Sign in before using the AI assistant."));
          }
        });
      },
      () => {
        finish(() =>
          reject(new Error("Unable to verify your sign-in. Please try again."))
        );
      }
    );
  });
};

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
  const user = await requireCallableAuthUser();
  await user.getIdToken();
  await assertUserCanWrite(user.uid);
  return analyzeSeedCallable(request);
};
