import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  isConfigured: vi.fn(() => true),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: supabaseMocks.isConfigured,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getClaims: supabaseMocks.getClaims },
    rpc: supabaseMocks.rpc,
  })),
}));

import { POST } from "@/app/api/briefs/route";

const validBody = {
  requestId: "3f753e46-bb8a-4d5f-841a-283da7a6760b",
  prompt: "Build a customer analytics dashboard",
  integrations: ["stripe", "slack"],
  output: "## Product idea\nA focused analytics product.",
};

function request(body: unknown) {
  return new Request("http://localhost/api/briefs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/briefs", () => {
  beforeEach(() => {
    supabaseMocks.isConfigured.mockReturnValue(true);
    supabaseMocks.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    supabaseMocks.rpc.mockResolvedValue({
      data: [{ id: 42, created_at: "2026-08-20T12:00:00.000Z" }],
      error: null,
    });
  });

  it("returns 401 when there is no verified user", async () => {
    supabaseMocks.getClaims.mockResolvedValue({
      data: { claims: null },
      error: new Error("No session"),
    });

    const response = await POST(request(validBody));

    expect(response.status).toBe(401);
    expect(supabaseMocks.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["request ID", { ...validBody, requestId: "invalid" }],
    ["prompt", { ...validBody, prompt: "short" }],
    ["output", { ...validBody, output: "" }],
    ["integration", { ...validBody, integrations: ["unknown"] }],
  ])(
    "rejects an invalid %s before touching the database",
    async (_label, body) => {
      const response = await POST(request(body));

      expect(response.status).toBe(400);
      expect(supabaseMocks.getClaims).not.toHaveBeenCalled();
      expect(supabaseMocks.rpc).not.toHaveBeenCalled();
    },
  );

  it("saves through the atomic RPC and returns the saved brief", async () => {
    const response = await POST(request(validBody));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: 42,
      createdAt: "2026-08-20T12:00:00.000Z",
    });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("save_brief", {
      p_client_request_id: validBody.requestId,
      p_prompt: validBody.prompt,
      p_output: validBody.output,
      p_integration_ids: validBody.integrations,
    });
  });

  it("returns a sanitized error when persistence fails", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("sensitive database details"),
    });

    const response = await POST(request(validBody));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error.message).not.toContain("sensitive");
  });
});
