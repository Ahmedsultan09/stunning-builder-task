import { beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => ({
  deleteBrief: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
  getViewer: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: actionMocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: actionMocks.redirect,
}));

vi.mock("@/lib/auth", () => ({
  getViewer: actionMocks.getViewer,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: actionMocks.from })),
}));

import { deleteBrief } from "@/app/history/actions";

describe("deleteBrief", () => {
  beforeEach(() => {
    actionMocks.getViewer.mockResolvedValue({
      id: "user-1",
      email: "owner@example.com",
    });
    actionMocks.eq.mockResolvedValue({ error: null });
    actionMocks.deleteBrief.mockReturnValue({ eq: actionMocks.eq });
    actionMocks.from.mockReturnValue({ delete: actionMocks.deleteBrief });
  });

  it("deletes through the cookie-scoped client and refreshes History", async () => {
    const formData = new FormData();
    formData.set("briefId", "42");

    await deleteBrief(formData);

    expect(actionMocks.from).toHaveBeenCalledWith("briefs");
    expect(actionMocks.eq).toHaveBeenCalledWith("id", 42);
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/history");
  });
});
