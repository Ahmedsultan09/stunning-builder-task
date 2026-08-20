import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "@/lib/auth-redirect";

describe("getSafeRedirectPath", () => {
  it("accepts relative application paths", () => {
    expect(getSafeRedirectPath("/history?from=login")).toBe(
      "/history?from=login",
    );
  });

  it.each([
    "https://attacker.example",
    "//attacker.example/path",
    "/\\attacker.example/path",
    "///attacker.example/path",
    "history",
    null,
  ])("rejects unsafe redirect value %s", (value) => {
    expect(getSafeRedirectPath(value, "/history")).toBe("/history");
  });
});
