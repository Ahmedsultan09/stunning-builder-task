"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type GitHubSignInButtonProps = {
  nextPath: string;
};

export function GitHubSignInButton({ nextPath }: GitHubSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setPending(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo },
    });

    if (signInError) {
      setError("GitHub sign-in could not start. Please try again.");
      setPending(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        size="lg"
        onClick={signIn}
        disabled={pending}
        className="h-11 w-full"
      >
        <GitBranch data-icon="inline-start" />
        {pending ? "Opening GitHub…" : "Continue with GitHub"}
      </Button>
      {error ? (
        <p role="alert" className="text-center text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
