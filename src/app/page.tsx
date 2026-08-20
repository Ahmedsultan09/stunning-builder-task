import { Sparkles } from "lucide-react";

import { Builder } from "@/components/buildbrief/builder";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const viewer = await getViewer();

  return (
    <div className="site-shell flex min-h-screen flex-col overflow-hidden">
      <SiteHeader viewer={viewer} />

      <main id="top" className="relative z-10 flex-1">
        <section className="mx-auto w-full max-w-6xl px-5 pt-12 pb-9 sm:px-8 sm:pt-18 sm:pb-12">
          <div className="max-w-4xl">
            <Badge
              variant="outline"
              className="mb-5 border-primary/25 bg-primary/8 px-3 text-primary"
            >
              <Sparkles aria-hidden="true" />
              Plan with the tools you already use
            </Badge>
            <h1 className="max-w-3xl text-balance text-4xl leading-[1.04] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[4.25rem]">
              Turn your product idea into a clear build direction.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Describe what you want to create, add the integrations that
              matter, and get a focused AI response shaped around your context.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
          <Builder canPersist={Boolean(viewer)} />
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>BuildBrief — ideas in, direction out.</p>
          <p>Powered by GPT-OSS 120B</p>
        </div>
      </footer>
    </div>
  );
}
