"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Sparkles, WandSparkles } from "lucide-react";

import { IntegrationPicker } from "@/components/buildbrief/integration-picker";
import {
  ResultPanel,
  type GenerationStatus,
} from "@/components/buildbrief/result-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  PROMPT_MAX_LENGTH,
  PROMPT_MIN_LENGTH,
  type GenerateRequest,
} from "@/lib/generate-schema";
import type { IntegrationId } from "@/lib/integrations";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "A subscription analytics dashboard for Shopify merchants",
  "A customer feedback hub that alerts product teams in Slack",
  "An invoice follow-up assistant for small creative agencies",
] as const;

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

export function Builder() {
  const [prompt, setPrompt] = useState("");
  const [selectedIntegrations, setSelectedIntegrations] = useState<
    IntegrationId[]
  >([]);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [resultIntegrations, setResultIntegrations] = useState<IntegrationId[]>(
    [],
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<GenerateRequest | null>(null);
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

  const runGeneration = async (payload: GenerateRequest) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    lastRequestRef.current = payload;
    setResultIntegrations(payload.integrations);

    setStatus("loading");
    setOutput("");
    setError(null);
    setNotice(null);

    let receivedOutput = false;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | ApiErrorPayload
          | null;
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
          setOutput((current) => current + chunk);
        }
      }

      const finalChunk = decoder.decode();
      if (finalChunk) {
        receivedOutput = true;
        setOutput((current) => current + finalChunk);
      }

      if (!receivedOutput) {
        throw new Error("The AI service returned an empty response.");
      }

      setStatus("success");
    } catch (generationError) {
      if (controller.signal.aborted) {
        setStatus(receivedOutput ? "success" : "idle");
        setNotice(
          receivedOutput ? "Generation stopped. The partial brief was kept." : null,
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

  const cancel = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <section id="builder" aria-label="BuildBrief generator" className="scroll-mt-8">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)]">
        <Card className="border-border/60 bg-card/80 shadow-2xl shadow-black/20">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <WandSparkles aria-hidden="true" className="size-3.5" />
              </span>
              Shape your idea
            </CardTitle>
            <CardDescription>
              Give us the rough brief. Add context only where it helps.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} noValidate className="space-y-6">
              <div className="space-y-2.5">
                <label htmlFor="product-idea" className="text-sm font-medium">
                  What do you want to build?
                </label>
                <Textarea
                  ref={textareaRef}
                  id="product-idea"
                  name="product-idea"
                  value={prompt}
                  disabled={status === "loading"}
                  maxLength={PROMPT_MAX_LENGTH + 100}
                  aria-invalid={showValidation && !isPromptValid}
                  aria-describedby="prompt-help prompt-count prompt-error"
                  onChange={(event) => {
                    setPrompt(event.target.value);
                    if (showValidation) setShowValidation(false);
                  }}
                  placeholder="Build a subscription analytics dashboard for Shopify merchants that highlights churn risks..."
                  className={cn(
                    "min-h-36 resize-none rounded-xl bg-background/60 p-4 text-base leading-7 shadow-inner placeholder:text-muted-foreground/65",
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
                  className="min-h-5 text-xs text-destructive"
                >
                  {showValidation ? validationMessage : null}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Try an example
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((example) => (
                    <Button
                      key={example}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={status === "loading"}
                      onClick={() => applyExample(example)}
                      className="h-auto min-h-7 max-w-full justify-start py-1.5 text-left whitespace-normal"
                    >
                      {example}
                      <ArrowUpRight data-icon="inline-end" />
                    </Button>
                  ))}
                </div>
              </div>

              <IntegrationPicker
                selected={selectedIntegrations}
                onToggle={toggleIntegration}
                disabled={status === "loading"}
              />

              <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  Your prompt stays in this request and is not stored by BuildBrief.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={status === "loading"}
                  className="h-11 shrink-0 rounded-xl px-5 shadow-lg shadow-primary/20"
                >
                  <Sparkles data-icon="inline-start" />
                  {status === "loading" ? "Generating…" : "Generate build brief"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <ResultPanel
          status={status}
          output={output}
          error={error}
          notice={notice}
          selectedIntegrations={resultIntegrations}
          onCancel={cancel}
          onRetry={retry}
        />
      </div>
    </section>
  );
}
