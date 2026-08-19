import { describe, expect, it } from "vitest";

import { buildSystemPrompt } from "@/lib/system-prompt";

describe("buildSystemPrompt", () => {
  it("includes selected integrations exactly once and excludes unselected ones", () => {
    const prompt = buildSystemPrompt(["stripe", "slack"]);

    expect(prompt.match(/Stripe/g)).toHaveLength(1);
    expect(prompt.match(/Slack/g)).toHaveLength(1);
    expect(prompt).not.toContain("Shopify");
    expect(prompt).not.toContain("Gmail");
    expect(prompt).not.toContain("Google Sheets");
  });

  it("makes an empty selection explicit", () => {
    expect(buildSystemPrompt([])).toContain(
      "No optional integrations selected",
    );
  });

  it("requires the six stable response sections", () => {
    const prompt = buildSystemPrompt([]);

    expect(prompt).toContain("## Product summary");
    expect(prompt).toContain("## Primary user flow");
    expect(prompt).toContain("## Integration roles");
    expect(prompt).toContain("## Suggested architecture");
    expect(prompt).toContain("## MVP milestones");
    expect(prompt).toContain("## Risks and assumptions");
  });
});
