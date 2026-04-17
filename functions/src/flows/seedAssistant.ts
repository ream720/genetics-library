import { z } from "zod";
import { initializeGenkit, seedAssistantModel } from "../lib/genkit.js";
import {
  SeedAssistantResponseSchema,
  type SeedAssistantResponse,
} from "../schemas/seedSchemas.js";

type SeedAssistantPromptInput = {
  message: string;
  previousContext?: string;
  imageUrl?: string;
  imageMimeType?: string;
};

type SeedAssistantFlowInput = {
  message: string;
  previousContext?: string | null;
  imageData?: string | null;
  imageMimeType?: string | null;
};

function normalizeImageInput(
  imageData?: string | null,
  imageMimeType?: string | null
): { imageUrl: string; imageMimeType: string } | undefined {
  if (!imageData && !imageMimeType) {
    return undefined;
  }

  if (!imageData || !imageMimeType) {
    throw new Error("Both image data and image MIME type are required.");
  }

  const normalizedMimeType = imageMimeType.trim();
  if (!normalizedMimeType.startsWith("image/")) {
    throw new Error("Uploaded file must be an image.");
  }

  const normalizedImageData = imageData.trim();
  const imageUrl = normalizedImageData.startsWith("data:")
    ? normalizedImageData
    : `data:${normalizedMimeType};base64,${normalizedImageData}`;

  return {
    imageUrl,
    imageMimeType: normalizedMimeType,
  };
}

function buildSeedAssistantPromptInput({
  message,
  previousContext,
  imageData,
  imageMimeType,
}: SeedAssistantFlowInput): SeedAssistantPromptInput {
  const promptInput: SeedAssistantPromptInput = {
    message,
    ...(previousContext ? { previousContext } : {}),
  };
  const imageInput = normalizeImageInput(imageData, imageMimeType);

  if (imageInput) {
    promptInput.imageUrl = imageInput.imageUrl;
    promptInput.imageMimeType = imageInput.imageMimeType;
  }

  return promptInput;
}

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
        imageData: z.string().optional().nullable(), // Base64 encoded image
        imageMimeType: z.string().optional().nullable(), // MIME type of the image
      }),
      outputSchema: SeedAssistantResponseSchema,
    },
    async ({ message, previousContext, imageData, imageMimeType }) => {
      const seedAnalysisPrompt = ai.prompt("seed-analysis");

      const promptInput = buildSeedAssistantPromptInput({
        message,
        previousContext,
        imageData,
        imageMimeType,
      });

      const { output } = await seedAnalysisPrompt(promptInput, {
        model: seedAssistantModel,
        output: {
          format: "json",
          schema: SeedAssistantResponseSchema,
        },
      });
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
        imageData: z.string().optional().nullable(), // Base64 encoded image
        imageMimeType: z.string().optional().nullable(), // MIME type of the image
      }),
      streamSchema: SeedAssistantResponseSchema,
      outputSchema: SeedAssistantResponseSchema,
    },
    async (
      { message, previousContext, imageData, imageMimeType },
      { sendChunk }
    ) => {
      const seedAnalysisPrompt = ai.prompt("seed-analysis");

      const promptInput = buildSeedAssistantPromptInput({
        message,
        previousContext,
        imageData,
        imageMimeType,
      });

      const response = await seedAnalysisPrompt.stream(promptInput, {
        model: seedAssistantModel,
        output: {
          format: "json",
          schema: SeedAssistantResponseSchema,
        },
      });
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
    sendMessage: (
      message: string,
      previousContext?: string,
      imageData?: string,
      imageMimeType?: string
    ) =>
      streamingSeedFlow.stream({
        message,
        previousContext,
        imageData,
        imageMimeType,
      }).stream,
    reset: () => {
      // Add any reset logic here if needed
    },
  };
}
