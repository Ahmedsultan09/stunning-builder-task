import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Builder } from "@/components/buildbrief/builder";

function textResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "text/plain" } },
  );
}

describe("Builder", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows focused client validation for an incomplete prompt", async () => {
    const user = userEvent.setup();
    render(<Builder />);

    await user.type(
      screen.getByLabelText(/describe what you want to build/i),
      "Short",
    );
    await user.click(
      screen.getByRole("button", { name: /generate build brief/i }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add 5 more characters.",
    );
    expect(
      screen.getByLabelText(/describe what you want to build/i),
    ).toHaveFocus();
  });

  it("submits the prompt and selected integrations, then renders the stream", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        textResponse([
          "## Product summary\n",
          "A focused subscription product.",
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<Builder />);

    await user.click(
      screen.getByRole("button", {
        name: /shopify analytics/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: /stripe/i }));
    expect(screen.getByRole("button", { name: /stripe/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(
      screen.getByRole("button", { name: /generate build brief/i }),
    );

    expect(
      await screen.findByText("A focused subscription product."),
    ).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(requestInit.body))).toEqual({
      prompt: "A subscription analytics dashboard for Shopify merchants",
      integrations: ["stripe"],
    });
  });

  it("auto-saves a completed brief for an authenticated user", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        textResponse(["## Product idea\n", "A saved subscription product."]),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 42,
            createdAt: "2026-08-20T12:00:00.000Z",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<Builder canPersist />);

    await user.click(
      screen.getByRole("button", { name: /shopify analytics/i }),
    );
    await user.click(screen.getByRole("button", { name: /stripe/i }));
    await user.click(
      screen.getByRole("button", { name: /generate build brief/i }),
    );

    expect(await screen.findByText(/saved to history/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/briefs");

    const saveInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(saveInit.body))).toEqual({
      requestId: expect.any(String),
      prompt: "A subscription analytics dashboard for Shopify merchants",
      integrations: ["stripe"],
      output: "## Product idea\nA saved subscription product.",
    });
  });

  it("keeps generated output visible when saving fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        textResponse(["A generated brief that remains visible."]),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { message: "The brief could not be saved." },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 42,
            createdAt: "2026-08-20T12:00:00.000Z",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<Builder canPersist />);

    await user.type(
      screen.getByLabelText(/describe what you want to build/i),
      "Build an operations dashboard for remote teams",
    );
    await user.click(
      screen.getByRole("button", { name: /generate build brief/i }),
    );

    expect(
      await screen.findByText("A generated brief that remains visible."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The brief could not be saved."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /retry save/i }),
    ).toBeInTheDocument();

    const firstSaveBody = JSON.parse(
      String((fetchMock.mock.calls[1]?.[1] as RequestInit).body),
    );
    await user.click(screen.getByRole("button", { name: /retry save/i }));

    expect(await screen.findByText(/saved to history/i)).toBeInTheDocument();
    const retrySaveBody = JSON.parse(
      String((fetchMock.mock.calls[2]?.[1] as RequestInit).body),
    );
    expect(retrySaveBody.requestId).toBe(firstSaveBody.requestId);
  });

  it("does not persist a failed generation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { message: "The model provider is unavailable." },
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<Builder canPersist />);

    await user.type(
      screen.getByLabelText(/describe what you want to build/i),
      "Build an operations dashboard for remote teams",
    );
    await user.click(
      screen.getByRole("button", { name: /generate build brief/i }),
    );

    expect(
      await screen.findByText("The model provider is unavailable."),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("disables editing during a request and lets the user cancel", async () => {
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<Builder canPersist />);

    const textarea = screen.getByLabelText(/describe what you want to build/i);
    await user.type(textarea, "Build an operations dashboard for remote teams");
    await user.click(
      screen.getByRole("button", { name: /generate build brief/i }),
    );

    expect(textarea).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /stop generation/i }));

    await waitFor(() => expect(textarea).toBeEnabled());
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
