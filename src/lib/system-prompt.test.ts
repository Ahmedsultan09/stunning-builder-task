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

  it("keeps generated details clearly framed as recommendations", () => {
    const prompt = buildSystemPrompt([]);

    expect(prompt).toContain("never as already connected features");
    expect(prompt).toContain("Do not invent domains");
    expect(prompt).toContain("details as recommendations");
    expect(prompt).toContain("Adapt the structure");
  });
});
