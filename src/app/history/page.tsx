import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronDown, Clock3, History, Plus, Trash2 } from "lucide-react";

import { deleteBrief } from "@/app/history/actions";
import { BriefMarkdown } from "@/components/buildbrief/brief-markdown";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/login?next=/history");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("briefs")
    .select(
      "id, prompt, output, created_at, brief_integrations(integration_id, integrations(name))",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error("Saved briefs could not be loaded.");
  const briefs = data ?? [];

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader viewer={viewer} />
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge
              variant="outline"
              className="mb-4 border-primary/25 bg-primary/8 text-primary"
            >
              <History aria-hidden="true" />
              Private history
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Saved build briefs
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Your latest completed generations. Row-level security keeps every
              brief scoped to your authenticated account.
            </p>
          </div>
          <Button asChild>
            <Link href="/#builder">
              <Plus data-icon="inline-start" />
              New brief
            </Link>
          </Button>
        </div>

        {briefs.length ? (
          <div className="space-y-4">
            {briefs.map((brief) => (
              <Card key={brief.id} className="border-white/8 bg-card/88">
                <CardHeader className="gap-4 border-b border-border/60 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <CardTitle className="text-base leading-6">
                      {brief.prompt}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      <time dateTime={brief.created_at}>
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(brief.created_at))}
                      </time>
                    </div>
                  </div>
                  <form action={deleteBrief}>
                    <input type="hidden" name="briefId" value={brief.id} />
                    <Button
                      type="submit"
                      variant="destructive"
                      size="sm"
                      aria-label={`Delete brief: ${brief.prompt}`}
                    >
                      <Trash2 data-icon="inline-start" />
                      Delete
                    </Button>
                  </form>
                </CardHeader>
                <CardContent className="pt-5">
                  {brief.brief_integrations.length ? (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {brief.brief_integrations.map((relation) => (
                        <Badge
                          key={relation.integration_id}
                          variant="secondary"
                        >
                          {relation.integrations?.name ??
                            relation.integration_id}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <details className="group rounded-xl border border-border/70 bg-background/35">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium marker:hidden">
                      View generated brief
                      <ChevronDown
                        aria-hidden="true"
                        className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <BriefMarkdown
                      content={brief.output}
                      className="border-t border-border/70 px-4 py-5"
                    />
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-white/10 bg-card/60">
            <CardContent className="flex flex-col items-center py-14 text-center">
              <History aria-hidden="true" className="size-7 text-primary" />
              <h2 className="mt-4 font-medium">No saved briefs yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Complete a generation while signed in and it will appear here
                automatically.
              </p>
              <Button asChild className="mt-5">
                <Link href="/#builder">Create your first brief</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
