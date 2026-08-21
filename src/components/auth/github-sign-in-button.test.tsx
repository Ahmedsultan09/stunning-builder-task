import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GitHubSignInButton } from "@/components/auth/github-sign-in-button";

const { signInWithOAuth } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth } }),
}));

describe("GitHubSignInButton", () => {
  it("starts GitHub OAuth with the requested return path", async () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<GitHubSignInButton nextPath="/history" />);

    await user.click(
      screen.getByRole("button", { name: /continue with github/i }),
    );

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "github",
        options: {
          redirectTo: "http://localhost:3000/auth/callback?next=%2Fhistory",
        },
      });
    });
  });
});
