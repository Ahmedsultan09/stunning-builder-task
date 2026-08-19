import { describe, expect, it } from "vitest";

import { generateRequestSchema } from "@/lib/generate-schema";

describe("generateRequestSchema", () => {
  it("trims the prompt and normalizes duplicate integrations", () => {
    const result = generateRequestSchema.parse({
      prompt: "  Build an operations dashboard  ",
      integrations: ["slack", "stripe", "slack"],
    });

    expect(result).toEqual({
      prompt: "Build an operations dashboard",
      integrations: ["slack", "stripe"],
    });
  });

  it("allows an empty integration selection", () => {
    expect(
      generateRequestSchema.parse({
        prompt: "Build a focused onboarding flow",
        integrations: [],
      }).integrations,
    ).toEqual([]);
  });

  it("rejects short prompts and unknown integration IDs", () => {
    expect(() =>
      generateRequestSchema.parse({ prompt: "Short", integrations: [] }),
    ).toThrow();

    expect(() =>
      generateRequestSchema.parse({
        prompt: "Build a focused onboarding flow",
        integrations: ["not-a-provider"],
      }),
    ).toThrow();
  });
});
