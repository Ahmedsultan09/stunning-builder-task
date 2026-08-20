"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  CloudCheck,
  CloudOff,
  Copy,
  Layers3,
  RotateCcw,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Square,
  Workflow,
} from "lucide-react";

import { BriefMarkdown } from "@/components/buildbrief/brief-markdown";
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
import { INTEGRATION_BY_ID, type IntegrationId } from "@/lib/integrations";

export type GenerationStatus = "idle" | "loading" | "success" | "error";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

type ResultPanelProps = {
  canPersist: boolean;
  isComplete: boolean;
  status: GenerationStatus;
  saveStatus: SaveStatus;
  saveError: string | null;
  output: string;
  error: string | null;
  notice: string | null;
  selectedIntegrations: readonly IntegrationId[];
  onCancel: () => void;
  onRetry: () => void;
  onRetrySave: () => void;
};

export function ResultPanel({
  canPersist,
  isComplete,
  status,
  saveStatus,
  saveError,
  output,
  error,
  notice,
  selectedIntegrations,
  onCancel,
  onRetry,
  onRetrySave,
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

            <div className="flex-1">
              <BriefMarkdown content={output} />
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

            {isComplete &&
            status === "success" &&
            (!canPersist || saveStatus !== "idle") ? (
              <div className="mt-4 rounded-lg border border-border/70 bg-background/35 px-3 py-2.5 text-xs">
                {!canPersist ? (
                  <p className="text-muted-foreground">
                    <Link
                      href="/auth/login?next=/"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Sign in
                    </Link>{" "}
                    to save future completed briefs.
                  </p>
                ) : null}
                {canPersist && saveStatus === "saving" ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-3.5 animate-spin motion-reduce:animate-none"
                    />
                    Saving to your private history…
                  </p>
                ) : null}
                {canPersist && saveStatus === "saved" ? (
                  <p className="flex items-center gap-2 text-emerald-400">
                    <CloudCheck aria-hidden="true" className="size-3.5" />
                    Saved to history.
                    <Link
                      href="/history"
                      className="font-medium underline underline-offset-4"
                    >
                      View history
                    </Link>
                  </p>
                ) : null}
                {canPersist && saveStatus === "error" ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-destructive">
                      <CloudOff aria-hidden="true" className="size-3.5" />
                      {saveError ?? "This brief could not be saved."}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={onRetrySave}
                    >
                      Retry save
                    </Button>
                  </div>
                ) : null}
              </div>
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onRetry}
                    disabled={saveStatus === "saving"}
                  >
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
        Describe your idea, optionally select integrations, and your
        AI-generated direction will stream here.
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
      {["Product idea", "Integration context", "MVP outline"].map(
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
