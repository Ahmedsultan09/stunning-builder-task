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

  it("keeps the response concise and inside the requested scope", () => {
    const prompt = buildSystemPrompt([]);

    expect(prompt).toContain("never as already connected features");
    expect(prompt).toContain("Do not mention unselected integrations");
    expect(prompt).toContain("Do not invent features");
    expect(prompt).toContain("## Product idea");
    expect(prompt).toContain("## Integration context");
    expect(prompt).toContain("## MVP outline");
    expect(prompt).toContain("under 350 words");
  });
});
