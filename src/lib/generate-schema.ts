import { z } from "zod";

import { INTEGRATION_IDS, type IntegrationId } from "@/lib/integrations";

export const PROMPT_MIN_LENGTH = 10;
export const PROMPT_MAX_LENGTH = 2_000;

export const generateRequestSchema = z
  .object({
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
  })
  .strict();

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
