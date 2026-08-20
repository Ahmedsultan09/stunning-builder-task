"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles, WandSparkles } from "lucide-react";

import { IntegrationPicker } from "@/components/buildbrief/integration-picker";
import {
  ResultPanel,
  type GenerationStatus,
  type SaveStatus,
} from "@/components/buildbrief/result-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  PROMPT_MAX_LENGTH,
  PROMPT_MIN_LENGTH,
  type GenerateRequest,
} from "@/lib/generate-schema";
import type { IntegrationId } from "@/lib/integrations";
import type { SaveBriefRequest } from "@/lib/save-brief-schema";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  {
    label: "Shopify analytics",
    prompt: "A subscription analytics dashboard for Shopify merchants",
  },
  {
    label: "Feedback hub",
    prompt: "A customer feedback hub that alerts product teams in Slack",
  },
  {
    label: "Invoice assistant",
    prompt: "An invoice follow-up assistant for small creative agencies",
  },
] as const;

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

type BuilderProps = {
  canPersist?: boolean;
};

export function Builder({ canPersist = false }: BuilderProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedIntegrations, setSelectedIntegrations] = useState<
    IntegrationId[]
  >([]);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [resultIntegrations, setResultIntegrations] = useState<IntegrationId[]>(
    [],
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<GenerateRequest | null>(null);
  const lastSaveRef = useRef<SaveBriefRequest | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const trimmedPrompt = prompt.trim();
  const isPromptValid =
    trimmedPrompt.length >= PROMPT_MIN_LENGTH &&
    trimmedPrompt.length <= PROMPT_MAX_LENGTH;
  const validationMessage =
    trimmedPrompt.length === 0
      ? "Tell us what you want to build."
      : trimmedPrompt.length < PROMPT_MIN_LENGTH
        ? `Add ${PROMPT_MIN_LENGTH - trimmedPrompt.length} more character${PROMPT_MIN_LENGTH - trimmedPrompt.length === 1 ? "" : "s"}.`
        : trimmedPrompt.length > PROMPT_MAX_LENGTH
          ? "Keep your idea under 2,000 characters."
          : null;

  const toggleIntegration = (id: IntegrationId) => {
    setSelectedIntegrations((current) =>
      current.includes(id)
        ? current.filter((integrationId) => integrationId !== id)
        : [...current, id],
    );
  };

  const applyExample = (example: string) => {
    setPrompt(example);
    setShowValidation(false);
    textareaRef.current?.focus();
  };

  const saveBrief = async (payload: SaveBriefRequest) => {
    setSaveStatus("saving");
    setSaveError(null);

    try {
      const response = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response
          .json()
          .catch(() => null)) as ApiErrorPayload | null;
        throw new Error(
          data?.error?.message ??
            "The brief was generated but could not be saved.",
        );
      }

      setSaveStatus("saved");
    } catch (saveFailure) {
      setSaveStatus("error");
      setSaveError(
        saveFailure instanceof Error
          ? saveFailure.message
          : "The brief was generated but could not be saved.",
      );
    }
  };

  const runGeneration = async (payload: GenerateRequest) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = crypto.randomUUID();
    abortControllerRef.current = controller;
    lastRequestRef.current = payload;
    lastSaveRef.current = null;
    setResultIntegrations(payload.integrations);

    setStatus("loading");
    setOutput("");
    setError(null);
    setNotice(null);
    setIsComplete(false);
    setSaveStatus("idle");
    setSaveError(null);

    let receivedOutput = false;
    let completeOutput = "";

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = (await response
          .json()
          .catch(() => null)) as ApiErrorPayload | null;
        throw new Error(
          data?.error?.message ??
            "The build brief could not be generated. Please try again.",
        );
      }

      if (!response.body) {
        throw new Error("The AI service returned an empty response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          receivedOutput = true;
          completeOutput += chunk;
          setOutput((current) => current + chunk);
        }
      }

      const finalChunk = decoder.decode();
      if (finalChunk) {
        receivedOutput = true;
        completeOutput += finalChunk;
        setOutput((current) => current + finalChunk);
      }

      if (!receivedOutput) {
        throw new Error("The AI service returned an empty response.");
      }

      setStatus("success");
      setIsComplete(true);

      if (canPersist) {
        const savePayload: SaveBriefRequest = {
          requestId,
          prompt: payload.prompt,
          integrations: payload.integrations,
          output: completeOutput,
        };
        lastSaveRef.current = savePayload;
        await saveBrief(savePayload);
      }
    } catch (generationError) {
      if (controller.signal.aborted) {
        setStatus(receivedOutput ? "success" : "idle");
        setNotice(
          receivedOutput
            ? "Generation stopped. The partial brief was kept."
            : null,
        );
        return;
      }

      setStatus("error");
      setError(
        generationError instanceof Error
          ? generationError.message
          : "The build brief could not be generated. Please try again.",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowValidation(true);

    if (!isPromptValid) {
      textareaRef.current?.focus();
      return;
    }

    void runGeneration({
      prompt: trimmedPrompt,
      integrations: selectedIntegrations,
    });
  };

  const retry = () => {
    if (lastRequestRef.current) void runGeneration(lastRequestRef.current);
  };

  const retrySave = () => {
    if (lastSaveRef.current) void saveBrief(lastSaveRef.current);
  };

  const cancel = () => {
    abortControllerRef.current?.abort();
  };

  const isBusy = status === "loading" || saveStatus === "saving";

  return (
    <section
      id="builder"
      aria-label="BuildBrief generator"
      className="scroll-mt-8"
    >
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.06fr)_minmax(24rem,0.94fr)]">
        <Card className="border-white/8 bg-card/88 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.75)] backdrop-blur-xl">
          <CardHeader className="border-b border-border/70 pb-5">
            <CardTitle className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/12 text-primary shadow-[0_0_24px_-8px_var(--primary)]">
                <WandSparkles aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-base font-semibold">
                  Create your brief
                </span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  Two quick steps, then let AI do the rest.
                </span>
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-1">
            <form onSubmit={submit} noValidate className="space-y-7">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-semibold text-primary">
                    1
                  </span>
                  <label htmlFor="product-idea" className="text-sm font-medium">
                    Describe what you want to build
                  </label>
                </div>
                <Textarea
                  ref={textareaRef}
                  id="product-idea"
                  name="product-idea"
                  value={prompt}
                  disabled={isBusy}
                  maxLength={PROMPT_MAX_LENGTH + 100}
                  aria-invalid={showValidation && !isPromptValid}
                  aria-describedby="prompt-help prompt-count prompt-error"
                  onChange={(event) => {
                    setPrompt(event.target.value);
                    if (showValidation) setShowValidation(false);
                  }}
                  placeholder="Build a subscription analytics dashboard for Shopify merchants that highlights churn risks..."
                  className={cn(
                    "min-h-44 resize-none rounded-xl border-white/10 bg-background/65 p-4 text-base leading-7 shadow-inner shadow-black/10 placeholder:text-muted-foreground/55",
                    "focus-visible:border-primary/60 focus-visible:ring-primary/20",
                  )}
                />
                <div className="flex min-h-5 items-start justify-between gap-4 text-xs">
                  <span id="prompt-help" className="text-muted-foreground">
                    A sentence or two is enough. Specific outcomes work best.
                  </span>
                  <span
                    id="prompt-count"
                    className={cn(
                      "shrink-0 font-mono text-muted-foreground",
                      prompt.length > PROMPT_MAX_LENGTH && "text-destructive",
                    )}
                  >
                    {prompt.length}/{PROMPT_MAX_LENGTH}
                  </span>
                </div>
                <p
                  id="prompt-error"
                  role="alert"
                  className={cn(
                    "text-xs text-destructive",
                    showValidation && validationMessage ? "min-h-5" : "sr-only",
                  )}
                >
                  {showValidation ? validationMessage : null}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Or start with an example
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((example) => (
                    <Button
                      key={example.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => applyExample(example.prompt)}
                      className="border-white/10 bg-white/3 text-muted-foreground hover:border-primary/25 hover:bg-primary/8 hover:text-foreground"
                    >
                      {example.label}
                    </Button>
                  ))}
                </div>
              </div>

              <IntegrationPicker
                selected={selectedIntegrations}
                onToggle={toggleIntegration}
                disabled={isBusy}
              />

              <div className="space-y-3 border-t border-border/60 pt-5">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isBusy}
                  className="h-12 w-full rounded-xl px-5 text-sm shadow-[0_14px_34px_-14px_var(--primary)]"
                >
                  <Sparkles data-icon="inline-start" />
                  {status === "loading"
                    ? "Generating…"
                    : "Generate build brief"}
                  {status !== "loading" ? (
                    <ArrowRight data-icon="inline-end" />
                  ) : null}
                </Button>
                <p className="text-center text-[11px] leading-5 text-muted-foreground">
                  Dummy integrations provide AI context only. No accounts are
                  connected.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <ResultPanel
          canPersist={canPersist}
          isComplete={isComplete}
          status={status}
          saveStatus={saveStatus}
          saveError={saveError}
          output={output}
          error={error}
          notice={notice}
          selectedIntegrations={resultIntegrations}
          onCancel={cancel}
          onRetry={retry}
          onRetrySave={retrySave}
        />
      </div>
    </section>
  );
}
