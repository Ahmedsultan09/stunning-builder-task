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

    await user.type(screen.getByLabelText(/what do you want to build/i), "Short");
    await user.click(
      screen.getByRole("button", { name: /generate build brief/i }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add 5 more characters.",
    );
    expect(screen.getByLabelText(/what do you want to build/i)).toHaveFocus();
  });

  it("submits the prompt and selected integrations, then renders the stream", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        textResponse(["## Product summary\n", "A focused subscription product."]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<Builder />);

    await user.click(
      screen.getByRole("button", {
        name: /a subscription analytics dashboard for shopify merchants/i,
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

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(requestInit.body))).toEqual({
      prompt: "A subscription analytics dashboard for Shopify merchants",
      integrations: ["stripe"],
    });
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
    render(<Builder />);

    const textarea = screen.getByLabelText(/what do you want to build/i);
    await user.type(textarea, "Build an operations dashboard for remote teams");
    await user.click(
      screen.getByRole("button", { name: /generate build brief/i }),
    );

    expect(textarea).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /stop generation/i }));

    await waitFor(() => expect(textarea).toBeEnabled());
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});
