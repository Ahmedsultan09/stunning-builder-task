import { groq } from "@ai-sdk/groq";
import {
  createTextStreamResponse,
  streamText,
  type TextStreamPart,
  type ToolSet,
} from "ai";
import { ZodError } from "zod";

import { generateRequestSchema } from "@/lib/generate-schema";
import { buildSystemPrompt } from "@/lib/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 35;

const MODEL_ID = "openai/gpt-oss-120b";
const GENERATION_TIMEOUT_MS = 30_000;

type ApiErrorCode =
  | "INVALID_REQUEST"
  | "CONFIGURATION_ERROR"
  | "UPSTREAM_ERROR"
  | "TIMEOUT";

function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
) {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function isTimeoutError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";

  return (
    name === "TimeoutError" || message.toLowerCase().includes("timeout")
  );
}

async function parseRequest(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ZodError([
      {
        code: "custom",
        message: "Request body must be valid JSON.",
        path: [],
      },
    ]);
  }

  return generateRequestSchema.parse(body);
}

function toCheckedTextStream<TOOLS extends ToolSet>(
  stream: ReadableStream<TextStreamPart<TOOLS>>,
) {
  return stream.pipeThrough(
    new TransformStream<TextStreamPart<TOOLS>, string>({
      transform(part, controller) {
        if (part.type === "text-delta") {
          controller.enqueue(part.text);
        } else if (part.type === "error") {
          // AI SDK streams provider failures as typed parts. Promote them to
          // stream errors so pre-header failures become stable 502/504 replies
          // and mid-stream failures reach the client instead of looking like a
          // successful empty response.
          controller.error(part.error);
        }
      },
    }),
  );
}

export async function POST(request: Request) {
  try {
    const { prompt, integrations } = await parseRequest(request);

    if (!process.env.GROQ_API_KEY) {
      return errorResponse(
        502,
        "CONFIGURATION_ERROR",
        "AI generation is not configured for this environment.",
      );
    }

    const result = streamText({
      model: groq(MODEL_ID),
      system: buildSystemPrompt(integrations),
      prompt,
      reasoning: "low",
      maxOutputTokens: 900,
      timeout: GENERATION_TIMEOUT_MS,
      abortSignal: request.signal,
    });

    const source = toCheckedTextStream(result.stream);
    const reader = source.getReader();

    // Read the first chunk before sending headers so setup/provider failures can
    // still return a useful HTTP status instead of a broken 200 stream.
    const firstChunk = await reader.read();
    const stream = new ReadableStream<string>({
      start(controller) {
        if (!firstChunk.done) controller.enqueue(firstChunk.value);

        const pump = async () => {
          try {
            while (true) {
              const chunk = await reader.read();
              if (chunk.done) break;
              controller.enqueue(chunk.value);
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        };

        void pump();
      },
      cancel(reason) {
        return reader.cancel(reason);
      },
    });

    return createTextStreamResponse({
      stream,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "INVALID_REQUEST",
        error.issues[0]?.message ?? "Invalid request.",
      );
    }

    if (isTimeoutError(error)) {
      return errorResponse(
        504,
        "TIMEOUT",
        "The model took too long to respond. Please try again.",
      );
    }

    return errorResponse(
      502,
      "UPSTREAM_ERROR",
      "The AI service is temporarily unavailable. Please try again.",
    );
  }
}
