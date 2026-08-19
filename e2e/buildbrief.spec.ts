import { expect, test } from "@playwright/test";

const MOCK_BRIEF = `## Product summary
A focused analytics product for merchants.

## Primary user flow
- Connect context
- Review recommendations

## Integration roles
- Stripe supports billing insights.

## Suggested architecture
Use a small full-stack TypeScript application.

## MVP milestones
1. Validate the core workflow.

## Risks and assumptions
- Access is intentionally mocked for this test.`;

test("generates an integration-aware brief", async ({ page }) => {
  await page.route("**/api/generate", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.integrations).toEqual(["stripe"]);

    await route.fulfill({
      status: 200,
      contentType: "text/plain; charset=utf-8",
      body: MOCK_BRIEF,
    });
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /describe the product/i }),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: /a subscription analytics dashboard for shopify merchants/i,
    })
    .click();
  await page.getByRole("button", { name: /stripe/i }).click();
  await page.getByRole("button", { name: /generate build brief/i }).click();

  await expect(page.getByText("A focused analytics product for merchants.")).toBeVisible();
  await expect(page.getByText("Complete")).toBeVisible();
  await expect(
    page.locator('[data-slot="badge"]').filter({ hasText: /^Stripe$/ }),
  ).toBeVisible();
});
