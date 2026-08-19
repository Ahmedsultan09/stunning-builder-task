"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Workflow,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  INTEGRATION_BY_ID,
  type IntegrationId,
} from "@/lib/integrations";

export type GenerationStatus = "idle" | "loading" | "success" | "error";

type ResultPanelProps = {
  status: GenerationStatus;
  output: string;
  error: string | null;
  notice: string | null;
  selectedIntegrations: readonly IntegrationId[];
  onCancel: () => void;
  onRetry: () => void;
};

const markdownComponents = {
  h2: ({ children }: React.ComponentProps<"h2">) => (
    <h2 className="mt-6 mb-2 text-sm font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  p: ({ children }: React.ComponentProps<"p">) => (
    <p className="mb-3 text-sm leading-6 text-muted-foreground last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }: React.ComponentProps<"ul">) => (
    <ul className="mb-4 space-y-1.5 pl-4 text-sm text-muted-foreground marker:text-primary">
      {children}
    </ul>
  ),
  ol: ({ children }: React.ComponentProps<"ol">) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground marker:text-primary">
      {children}
    </ol>
  ),
  li: ({ children }: React.ComponentProps<"li">) => (
    <li className="pl-1 leading-6">{children}</li>
  ),
  strong: ({ children }: React.ComponentProps<"strong">) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
  code: ({ children }: React.ComponentProps<"code">) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  ),
};

export function ResultPanel({
  status,
  output,
  error,
  notice,
  selectedIntegrations,
  onCancel,
  onRetry,
}: ResultPanelProps) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 1_800);
  };

  const statusLabel =
    status === "loading"
      ? "Generating"
      : status === "success"
        ? "Complete"
        : status === "error"
          ? "Needs attention"
          : "Ready";

  return (
    <Card
      aria-busy={status === "loading"}
      className="min-h-[34rem] border-white/8 bg-card/88 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:min-h-[40rem] lg:sticky lg:top-6"
    >
      <CardHeader className="border-b border-border/70 pb-5">
        <CardTitle className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/12 text-primary">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>
          <span>
            <span className="block text-base font-semibold">AI response</span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              Generated from your idea and selected context.
            </span>
          </span>
        </CardTitle>
        <CardAction>
          <Badge
            variant="outline"
            className="border-primary/25 bg-primary/5 text-primary"
          >
            {status === "loading" ? (
              <span className="size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
            ) : null}
            {statusLabel}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent
        className="flex flex-1 flex-col"
        aria-live="polite"
        aria-atomic="false"
      >
        {status === "idle" ? <EmptyResult /> : null}

        {status === "error" && error ? (
          <div className="flex flex-1 flex-col justify-center gap-4">
            <Alert variant="destructive" className="border-destructive/30">
              <ShieldCheck aria-hidden="true" />
              <AlertTitle>We could not generate this brief</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button type="button" variant="outline" onClick={onRetry}>
              <RotateCcw data-icon="inline-start" />
              Try again
            </Button>
          </div>
        ) : null}

        {status === "loading" && !output ? (
          <div className="flex flex-1 flex-col">
            <LoadingResult />
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="mt-auto self-start"
            >
              <Square data-icon="inline-start" className="fill-current" />
              Stop generation
            </Button>
          </div>
        ) : null}

        {output ? (
          <div className="flex flex-1 flex-col">
            {selectedIntegrations.length ? (
              <div className="mb-5 flex flex-wrap gap-1.5">
                {selectedIntegrations.map((id) => {
                  const integration = INTEGRATION_BY_ID.get(id);
                  return integration ? (
                    <Badge key={id} variant="secondary">
                      {integration.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            ) : null}

            <div className="brief-markdown flex-1">
              <ReactMarkdown skipHtml components={markdownComponents}>
                {output}
              </ReactMarkdown>
              {status === "loading" ? (
                <span
                  aria-label="AI response is streaming"
                  className="ml-0.5 inline-block h-4 w-1 animate-pulse rounded-full bg-primary align-middle motion-reduce:animate-none"
                />
              ) : null}
            </div>

            {notice ? (
              <p className="mt-4 text-xs text-muted-foreground">{notice}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
              {status === "loading" ? (
                <Button type="button" variant="outline" onClick={onCancel}>
                  <Square data-icon="inline-start" className="fill-current" />
                  Stop generation
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={copyOutput}>
                    {copied ? (
                      <Check data-icon="inline-start" />
                    ) : (
                      <Copy data-icon="inline-start" />
                    )}
                    {copied ? "Copied" : "Copy brief"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={onRetry}>
                    <RotateCcw data-icon="inline-start" />
                    Regenerate
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmptyResult() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <div className="relative mb-7 flex size-20 items-center justify-center rounded-3xl border border-primary/15 bg-primary/5">
        <span className="absolute inset-2 rounded-2xl border border-primary/10" />
        <Workflow aria-hidden="true" className="size-6 text-primary" />
      </div>
      <h3 className="text-base font-medium">Ready when you are</h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
        Describe your idea, optionally select integrations, and your AI-generated
        direction will stream here.
      </p>
      <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground/75">
        <Layers3 aria-hidden="true" className="size-3.5" />
        Context-aware
        <span aria-hidden="true">·</span>
        <ShieldCheck aria-hidden="true" className="size-3.5" />
        No external connections
      </div>
    </div>
  );
}

function LoadingResult() {
  return (
    <div className="space-y-6 py-2" aria-label="Generating your build brief">
      {["Product summary", "Primary user flow", "Suggested architecture"].map(
        (label, index) => (
          <div key={label} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-md" />
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className={index === 1 ? "h-3 w-4/5" : "h-3 w-2/3"} />
          </div>
        ),
      )}
    </div>
  );
}
