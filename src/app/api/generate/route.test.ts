import { beforeEach, describe, expect, it, vi } from "vitest";

const aiMocks = vi.hoisted(() => ({
  streamText: vi.fn(),
  toTextStream: vi.fn(),
}));

vi.mock("ai", () => ({
  streamText: aiMocks.streamText,
  toTextStream: aiMocks.toTextStream,
  createTextStreamResponse: ({
    stream,
    headers,
  }: {
    stream: ReadableStream<string>;
    headers?: HeadersInit;
  }) => {
    const reader = stream.getReader();
    const encoder = new TextEncoder();
    const encodedStream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const chunk = await reader.read();
        if (chunk.done) {
          controller.close();
        } else {
          controller.enqueue(encoder.encode(chunk.value));
        }
      },
      cancel(reason) {
        return reader.cancel(reason);
      },
    });

    return new Response(encodedStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", ...headers },
    });
  },
}));

import { POST } from "@/app/api/generate/route";

function stringStream(chunks: string[]) {
  return new ReadableStream<string>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  });
}

function request(body: unknown) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    aiMocks.streamText.mockReturnValue({ stream: "provider-stream" });
    aiMocks.toTextStream.mockReturnValue(
      stringStream(["## Product summary\n", "A focused result."]),
    );
  });

  it("streams a valid integration-aware request", async () => {
    const response = await POST(
      request({
        prompt: "Build a subscription reporting dashboard",
        integrations: ["stripe", "stripe"],
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(
      "## Product summary\nA focused result.",
    );
    expect(aiMocks.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "anthropic/claude-sonnet-5",
        prompt: "Build a subscription reporting dashboard",
        maxOutputTokens: 900,
        timeout: 30_000,
        system: expect.stringContaining("Stripe"),
      }),
    );
    expect(aiMocks.streamText.mock.calls[0]?.[0].system).not.toContain("Slack");
  });

  it("returns 400 for invalid input before calling the model", async () => {
    const response = await POST(
      request({ prompt: "tiny", integrations: ["unknown"] }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: "Describe your idea in at least 10 characters.",
      },
    });
    expect(aiMocks.streamText).not.toHaveBeenCalled();
  });

  it("streams a valid request with no optional integrations", async () => {
    const response = await POST(
      request({ prompt: "Build a useful product dashboard", integrations: [] }),
    );

    expect(response.status).toBe(200);
    expect(aiMocks.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("No optional integrations selected"),
      }),
    );
  });

  it("maps first-chunk timeouts to 504", async () => {
    aiMocks.toTextStream.mockReturnValue(
      new ReadableStream({
        start(controller) {
          controller.error(new DOMException("Timed out", "TimeoutError"));
        },
      }),
    );

    const response = await POST(
      request({ prompt: "Build a useful product dashboard", integrations: [] }),
    );

    expect(response.status).toBe(504);
  });

  it("maps first-chunk provider failures to 502", async () => {
    aiMocks.toTextStream.mockReturnValue(
      new ReadableStream({
        start(controller) {
          controller.error(new Error("Provider unavailable"));
        },
      }),
    );

    const response = await POST(
      request({ prompt: "Build a useful product dashboard", integrations: [] }),
    );

    expect(response.status).toBe(502);
  });
});
