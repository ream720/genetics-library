import { gemini15Flash } from "@genkit-ai/googleai";
import { z } from "zod";
import { initializeGenkit } from "../lib/genkit.js";
import {
  SeedAssistantResponseSchema,
  type SeedAssistantResponse,
} from "../schemas/seedSchemas.js";

// Factory function to create both flows with a runtime API key
export function createSeedAssistantFlows(apiKey: string) {
  // Initialize Genkit with the runtime API key
  const ai = initializeGenkit(apiKey);

  const analyzeSeedFlow = ai.defineFlow(
    {
      name: "analyzeSeedFlow",
      inputSchema: z.object({
        message: z.string(),
        previousContext: z.string().optional().nullable(),
      }),
      outputSchema: SeedAssistantResponseSchema,
    },
    async ({ message, previousContext }) => {
      const seedAnalysisPrompt = ai.prompt("seed-analysis");
      const { output } = await seedAnalysisPrompt(
        {
          message,
          // Only pass previousContext if it exists and is non-null
          ...(previousContext && { previousContext }),
        },
        { model: gemini15Flash }
      );

      if (!output) {
        throw new Error("Failed to generate valid seed analysis");
      }

      // Ensure boolean values for fields that must be boolean
      const processedOutput: SeedAssistantResponse = {
        ...output,
        seed: {
          ...output.seed,
          feminized:
            typeof output.seed.feminized === "boolean"
              ? output.seed.feminized
              : false,
          open:
            typeof output.seed.open === "boolean" ? output.seed.open : false,
          available:
            typeof output.seed.available === "boolean"
              ? output.seed.available
              : false,
          isMultiple:
            typeof output.seed.isMultiple === "boolean"
              ? output.seed.isMultiple
              : false,
        },
      };

      return processedOutput;
    }
  );

  const streamingSeedFlow = ai.defineFlow(
    {
      name: "streamingSeedFlow",
      inputSchema: z.object({
        message: z.string(),
        previousContext: z.string().optional().nullable(),
      }),
      streamSchema: SeedAssistantResponseSchema,
      outputSchema: SeedAssistantResponseSchema,
    },
    async ({ message, previousContext }, { sendChunk }) => {
      const seedAnalysisPrompt = ai.prompt("seed-analysis");
      const response = await seedAnalysisPrompt.stream(
        { message, previousContext },
        { model: gemini15Flash }
      );

      for await (const chunk of response.stream) {
        if (chunk.output) {
          const typedOutput = chunk.output as SeedAssistantResponse;
          sendChunk({
            seed: {
              breeder: typedOutput.seed?.breeder || "",
              strain: typedOutput.seed?.strain || "",
              numSeeds: typedOutput.seed?.numSeeds || 0,
              feminized:
                typeof typedOutput.seed?.feminized === "boolean"
                  ? typedOutput.seed.feminized
                  : false,
              open:
                typeof typedOutput.seed?.open === "boolean"
                  ? typedOutput.seed.open
                  : false,
              available:
                typeof typedOutput.seed?.available === "boolean"
                  ? typedOutput.seed.available
                  : false,
              isMultiple:
                typeof typedOutput.seed?.isMultiple === "boolean"
                  ? typedOutput.seed.isMultiple
                  : false,
              quantity: typedOutput.seed?.quantity || 1,
              lineage: typedOutput.seed?.lineage,
              generation: typedOutput.seed?.generation,
            },
            confidence: typedOutput.confidence || 0,
            missingInfo: typedOutput.missingInfo || [],
            suggestedQuestions: typedOutput.suggestedQuestions || [],
          });
        }
      }

      const finalOutput = (await response.response).output;
      if (!finalOutput) {
        throw new Error("Failed to generate valid seed analysis");
      }

      return finalOutput;
    }
  );

  // Return both flows as an object
  return {
    analyzeSeedFlow,
    streamingSeedFlow,
  };
}

// Helper function to create a typed wrapper around streamingSeedFlow
export function createSeedAssistantStream(apiKey: string) {
  const { streamingSeedFlow } = createSeedAssistantFlows(apiKey);

  return {
    sendMessage: (message: string, previousContext?: string) =>
      streamingSeedFlow.stream({ message, previousContext }).stream,
    reset: () => {
      // Add any reset logic here if needed
    },
  };
}
