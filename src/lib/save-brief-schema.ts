import { z } from "zod";

import { PROMPT_MAX_LENGTH, PROMPT_MIN_LENGTH } from "@/lib/generate-schema";
import { INTEGRATION_IDS, type IntegrationId } from "@/lib/integrations";

export const SAVE_OUTPUT_MAX_LENGTH = 12_000;

export const saveBriefSchema = z
  .object({
    requestId: z.string().uuid("A valid request ID is required."),
    prompt: z
      .string()
      .trim()
      .min(PROMPT_MIN_LENGTH, "Describe your idea in at least 10 characters.")
      .max(PROMPT_MAX_LENGTH, "Keep your idea under 2,000 characters."),
    integrations: z
      .array(z.enum(INTEGRATION_IDS))
      .transform((ids) => Array.from(new Set(ids)) as IntegrationId[])
      .refine((ids) => ids.length <= INTEGRATION_IDS.length, {
        message: "Too many integrations selected.",
      }),
    output: z
      .string()
      .min(1, "The generated brief cannot be empty.")
      .max(SAVE_OUTPUT_MAX_LENGTH, "The generated brief is too long.")
      .refine((output) => output.trim().length > 0, {
        message: "The generated brief cannot be empty.",
      }),
  })
  .strict();

export type SaveBriefRequest = z.infer<typeof saveBriefSchema>;
