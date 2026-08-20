import Link from "next/link";
import { History, Layers3, LogIn, LogOut } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import type { Viewer } from "@/lib/auth";

type SiteHeaderProps = {
  viewer: Viewer | null;
};

export function SiteHeader({ viewer }: SiteHeaderProps) {
  return (
    <header className="relative z-20 border-b border-white/6 bg-background/45 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          href="/"
          aria-label="BuildBrief home"
          className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Layers3 aria-hidden="true" className="size-4" />
          </span>
          <span className="font-semibold tracking-tight">BuildBrief</span>
        </Link>

        {viewer ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden max-w-48 truncate text-xs text-muted-foreground md:block">
              {viewer.email ?? "Signed in"}
            </span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/history">
                <History data-icon="inline-start" />
                History
              </Link>
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut data-icon="inline-start" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/login?next=/history">
              <LogIn data-icon="inline-start" />
              Sign in
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
