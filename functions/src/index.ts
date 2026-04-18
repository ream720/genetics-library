// functions/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";
import { createSeedAssistantFlows } from "./flows/seedAssistant.js";
import { SEED_ASSISTANT_MODEL_NAME } from "./lib/genkit.js";
import { adminDb } from "./lib/admin.js";
import {
  assertAiAssistantEnabled,
  createAiAssistantEvent,
  getErrorCategory,
  getRejectedRequestMetrics,
  getValidatedRequestMetrics,
  loadAiAssistantConfig,
  reserveAiAssistantQuota,
  updateAiAssistantEvent,
  validateAnalyzeSeedData,
  type AiAssistantEventHandle,
  type ValidatedAnalyzeSeedData,
} from "./lib/aiAssistantGuards.js";

// Define email password as a secret parameter
const emailPassword = defineSecret("EMAIL_PASSWORD");
const googleAiKey = defineSecret("GOOGLE_AI_API_KEY");

async function logValidationErrorEvent(
  uid: string,
  startTimeMs: number,
  data: unknown,
  error: unknown
) {
  try {
    await createAiAssistantEvent(adminDb, {
      uid,
      model: SEED_ASSISTANT_MODEL_NAME,
      status: "validation_error",
      metrics: getRejectedRequestMetrics(data),
      startTimeMs,
      errorCategory: getErrorCategory(error),
    });
  } catch (loggingError) {
    console.error("Failed to log AI assistant validation error event", {
      uid,
      errorName: loggingError instanceof Error ? loggingError.name : typeof loggingError,
    });
  }
}

function getAttemptStatus(error: unknown) {
  if (error instanceof HttpsError && error.code === "unavailable") {
    return "disabled";
  }

  if (error instanceof HttpsError && error.code === "resource-exhausted") {
    return "quota_denied";
  }

  return "model_error";
}

async function updateAttemptEvent(
  event: AiAssistantEventHandle,
  error: unknown
) {
  try {
    await updateAiAssistantEvent(
      event,
      getAttemptStatus(error),
      getErrorCategory(error)
    );
  } catch (loggingError) {
    console.error("Failed to update AI assistant event", {
      errorName: loggingError instanceof Error ? loggingError.name : typeof loggingError,
    });
  }
}

export const analyzeSeed = onCall(
  {
    enforceAppCheck: true,
    maxInstances: 3,
    concurrency: 5,
    secrets: [googleAiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in to use the AI assistant."
      );
    }

    const uid = request.auth.uid;
    const startTimeMs = Date.now();
    let validatedData: ValidatedAnalyzeSeedData;

    try {
      validatedData = validateAnalyzeSeedData(request.data);
    } catch (error) {
      await logValidationErrorEvent(uid, startTimeMs, request.data, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "invalid-argument",
        "Request data could not be validated."
      );
    }

    const attemptEvent = await createAiAssistantEvent(adminDb, {
      uid,
      model: SEED_ASSISTANT_MODEL_NAME,
      status: "started",
      metrics: getValidatedRequestMetrics(validatedData),
      startTimeMs,
    });

    try {
      const config = await loadAiAssistantConfig(adminDb);
      assertAiAssistantEnabled(config);
      await reserveAiAssistantQuota(
        adminDb,
        uid,
        validatedData.hasImage,
        config
      );

      // Initialize flows with the runtime API key.
      const { analyzeSeedFlow } = createSeedAssistantFlows(googleAiKey.value());
      const result = await analyzeSeedFlow({
        message: validatedData.message,
        previousContext: validatedData.previousContext,
        imageData: validatedData.imageData,
        imageMimeType: validatedData.imageMimeType,
      });

      await updateAiAssistantEvent(attemptEvent, "success");
      return result;
    } catch (error) {
      await updateAttemptEvent(attemptEvent, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      console.error("Seed analysis failed", {
        uid,
        model: SEED_ASSISTANT_MODEL_NAME,
        hasImage: validatedData.hasImage,
        errorName: error instanceof Error ? error.name : typeof error,
      });

      throw new HttpsError(
        "internal",
        "Failed to analyze seed. Please try again."
      );
    }
  }
);

export const sendSupportEmail = onCall(
  {
    enforceAppCheck: false,
    secrets: [emailPassword], // Explicitly declare secrets used by this function
  },
  async (request) => {
    const { message } = request.data;
    const userEmail = request.auth?.token.email;

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Unauthorized");
    }

    // Create transporter inside function to ensure secret is available
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "geneticslibrary@gmail.com",
        pass: emailPassword.value(),
      },
    });

    try {
      const result = await transporter.sendMail({
        from: "geneticslibrary@gmail.com",
        to: "geneticslibrary@gmail.com",
        subject: "Support Request",
        text: `Message from ${userEmail}:\n\n${message}`,
      });

      if (process.env.NODE_ENV === "development") {
        console.log("Email sent successfully:", result);
      }
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new HttpsError("internal", `Failed to send email: ${error.message}`);
      }
      throw new HttpsError(
        "internal",
        "Failed to send email: An unknown error occurred"
      );
    }
  }
);