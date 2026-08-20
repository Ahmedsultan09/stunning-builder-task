import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: authMocks.exchangeCodeForSession },
  })),
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    authMocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it("exchanges the PKCE code and accepts a safe relative destination", async () => {
    const response = await GET(
      new Request(
        "http://localhost/auth/callback?code=oauth-code&next=%2Fhistory",
      ),
    );

    expect(authMocks.exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(response.headers.get("location")).toBe("http://localhost/history");
  });

  it("falls back to the application root for an unsafe destination", async () => {
    const response = await GET(
      new Request(
        "http://localhost/auth/callback?code=oauth-code&next=%2F%2Fattacker.example",
      ),
    );

    expect(response.headers.get("location")).toBe("http://localhost/");
  });
});
