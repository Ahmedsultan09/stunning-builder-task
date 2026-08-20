import { describe, expect, it } from "vitest";

import { saveBriefSchema } from "@/lib/save-brief-schema";

const validPayload = {
  requestId: "3f753e46-bb8a-4d5f-841a-283da7a6760b",
  prompt: "Build a customer analytics dashboard",
  integrations: ["stripe", "slack"],
  output: "## Product idea\nA focused analytics product.",
};

describe("saveBriefSchema", () => {
  it("normalizes duplicate integrations", () => {
    expect(
      saveBriefSchema.parse({
        ...validPayload,
        integrations: ["stripe", "stripe"],
      }).integrations,
    ).toEqual(["stripe"]);
  });

  it("rejects invalid request IDs, integrations, and empty output", () => {
    expect(() =>
      saveBriefSchema.parse({
        ...validPayload,
        requestId: "not-a-uuid",
      }),
    ).toThrow();
    expect(() =>
      saveBriefSchema.parse({
        ...validPayload,
        integrations: ["unknown"],
      }),
    ).toThrow();
    expect(() =>
      saveBriefSchema.parse({ ...validPayload, output: "   " }),
    ).toThrow();
  });
});
