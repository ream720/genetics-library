import { z } from "zod";
// Schema for seed data that matches our form fields
export const SeedInputSchema = z.object({
    breeder: z.string().min(1, "Breeder is required"),
    strain: z.string().min(1, "Strain name is required"),
    lineage: z.string().optional(),
    generation: z.string().optional(),
    numSeeds: z.number().int().min(0).default(0),
    feminized: z.boolean().default(false),
    open: z.boolean().default(false),
    available: z.boolean().default(false),
    isMultiple: z.boolean().default(false),
    quantity: z.number().int().min(1).default(1),
});
// Schema for the AI assistant's response
export const SeedAssistantResponseSchema = z.object({
    seed: SeedInputSchema,
    confidence: z.number().min(0).max(1),
    missingInfo: z.array(z.string()),
    suggestedQuestions: z.array(z.string()),
});
// Schema for user input to the assistant
export const UserInputSchema = z.object({
    message: z.string(),
    previousContext: z.string().optional(),
});
//# sourceMappingURL=seedSchemas.js.map