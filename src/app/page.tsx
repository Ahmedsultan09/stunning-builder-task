import {
  ArrowDown,
  Braces,
  Layers3,
  LockKeyhole,
  Sparkles,
  Zap,
} from "lucide-react";

import { Builder } from "@/components/buildbrief/builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const VALUE_POINTS = [
  { icon: Zap, label: "Streamed in real time" },
  { icon: Braces, label: "Integration-aware" },
  { icon: LockKeyhole, label: "No prompt storage" },
] as const;

export default function Home() {
  return (
    <div className="site-shell flex min-h-screen flex-col overflow-hidden">
      <header className="relative z-20 border-b border-white/5">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <a
            href="#top"
            aria-label="BuildBrief home"
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Layers3 aria-hidden="true" className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">BuildBrief</span>
          </a>

          <Badge
            variant="outline"
            className="border-white/10 bg-white/3 text-muted-foreground"
          >
            Powered by Claude Sonnet 5
          </Badge>
        </div>
      </header>

      <main id="top" className="relative z-10 flex-1">
        <section className="mx-auto w-full max-w-7xl px-5 pt-16 pb-12 sm:px-8 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-4xl text-center">
            <Badge
              variant="outline"
              className="mb-6 border-primary/25 bg-primary/8 px-3 text-primary"
            >
              <Sparkles aria-hidden="true" />
              From rough idea to focused build plan
            </Badge>
            <h1 className="text-balance text-4xl leading-[1.06] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Describe the product.
              <span className="block text-muted-foreground">
                We&apos;ll map the build.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Turn a rough idea into a practical product brief with clear user
              flows, architecture, milestones, and integration context.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {VALUE_POINTS.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Icon aria-hidden="true" className="size-3.5 text-primary" />
                  {label}
                </span>
              ))}
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mt-7 text-muted-foreground hover:text-foreground"
            >
              <a href="#builder">
                Start with your idea
                <ArrowDown data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 sm:pb-28">
          <Builder />
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>BuildBrief — a focused full-stack AI product exercise.</p>
          <p>Next.js 16 · AI SDK 7 · Vercel AI Gateway</p>
        </div>
      </footer>
    </div>
  );
}
