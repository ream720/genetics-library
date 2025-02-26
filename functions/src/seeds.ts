// functions/src/seeds.ts
import { onCall } from "firebase-functions/v2/https";
import { GOOGLE_AI_KEY } from "./lib/genkit.js";
import { createSeedAssistantFlows } from "./flows/seedAssistant.js";

export const analyzeSeed = onCall(
  {
    enforceAppCheck: false,
    secrets: [GOOGLE_AI_KEY],
  },
  async (request) => {
    const { message, previousContext } = request.data;

    try {
      // Initialize flows with the runtime API key
      const { analyzeSeedFlow } = createSeedAssistantFlows(
        GOOGLE_AI_KEY.value()
      );

      const result = await analyzeSeedFlow({
        message,
        previousContext,
      });
      return result;
    } catch (error) {
      console.error("Seed analysis error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to analyze seed"
      );
    }
  }
);
