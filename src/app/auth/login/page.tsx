import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers3, ShieldCheck } from "lucide-react";

import { GitHubSignInButton } from "@/components/auth/github-sign-in-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewer } from "@/lib/auth";
import { getSafeRedirectPath } from "@/lib/auth-redirect";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirectPath(params.next, "/history");
  const viewer = await getViewer();

  if (viewer) redirect(nextPath);

  const configured = isSupabaseConfigured();
  const callbackFailed = params.error === "oauth";

  return (
    <main className="site-shell flex min-h-screen items-center justify-center px-5 py-12">
      <Card className="w-full max-w-md border-white/8 bg-card/92 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <CardHeader className="items-center border-b border-border/70 text-center">
          <Link
            href="/"
            aria-label="BuildBrief home"
            className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Layers3 aria-hidden="true" className="size-5" />
          </Link>
          <CardTitle>Save your build briefs</CardTitle>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Sign in to keep completed AI briefs private, revisit them later, and
            manage your history.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {callbackFailed ? (
            <p role="alert" className="text-center text-sm text-destructive">
              GitHub sign-in could not be completed. Please try again.
            </p>
          ) : null}

          {configured ? (
            <GitHubSignInButton nextPath={nextPath} />
          ) : (
            <p role="alert" className="text-center text-sm text-destructive">
              Sign-in is not configured for this environment.
            </p>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-3.5 text-primary" />
            Your saved briefs are protected with row-level security.
          </div>

          <Link
            href="/"
            className="block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Continue without signing in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
