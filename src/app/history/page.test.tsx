import { beforeEach, describe, expect, it, vi } from "vitest";

const historyMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getViewer: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: historyMocks.redirect,
}));

vi.mock("@/lib/auth", () => ({
  getViewer: historyMocks.getViewer,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: historyMocks.createClient,
}));

import HistoryPage from "@/app/history/page";

describe("HistoryPage", () => {
  beforeEach(() => {
    historyMocks.getViewer.mockResolvedValue(null);
    historyMocks.redirect.mockImplementation((destination: string) => {
      throw new Error(`redirect:${destination}`);
    });
  });

  it("redirects unauthenticated visitors before reading saved data", async () => {
    await expect(HistoryPage()).rejects.toThrow(
      "redirect:/auth/login?next=/history",
    );
    expect(historyMocks.createClient).not.toHaveBeenCalled();
  });
});
