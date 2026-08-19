# Production decisions

The final improvement pass assumed this feature would face real users tomorrow. I prioritized fixes that improve correctness, cost containment, trust, and recovery without turning a two-hour exercise into a platform project.

## What did I improve?

### Reliable integration context

Integrations are defined in a trusted, typed server-side catalog. The API accepts only known IDs, normalizes duplicates, and builds the system prompt from those definitions. Tests prove selected integrations appear exactly once and unselected integrations are omitted.

### Perceived speed and user control

The model response streams into a structured result panel. Users can stop generation, keep a partial result, retry a failure, regenerate a completed brief, or copy the output. Loading, empty, error, and partial-result states have intentional UI rather than generic text.

### Safer request boundaries

- Prompt length is limited to 10–2,000 characters.
- Output is capped at 1,200 tokens.
- Generation has a 30-second SDK timeout.
- The model key stays server-only.
- Raw model HTML is ignored.
- Prompt content is not intentionally logged or stored.
- Provider errors are mapped to stable, non-sensitive messages.

### Accessibility and responsive behavior

Inputs have real labels and described validation. Integration cards expose `aria-pressed`, loading content uses `aria-live`, focus rings remain visible, animations respect reduced-motion preferences, and the layout adapts from mobile to wide desktop.

### Critical verification

The project has unit tests for validation and prompt construction, route tests for success and failure behavior, component tests for the core interaction, a mocked Playwright journey, strict TypeScript, zero-warning linting, and a production build gate.

## What did I intentionally leave out?

- Real Stripe, Shopify, Gmail, Slack, or Google Sheets OAuth and API calls.
- Accounts, authentication, prompt history, database persistence, or collaboration.
- Multi-model controls, agent loops, tool calling, and autonomous actions.
- Analytics, full tracing, moderation infrastructure, and enterprise audit logs.
- A distributed rate-limit service.

These are reasonable next steps for a validated product, but none is required to demonstrate the requested end-to-end flow. Adding them now would increase setup, credentials, failure modes, and review cost without improving the assignment’s central signal.

## What is the biggest production risk?

The public, unauthenticated inference endpoint can be abused and create unbounded aggregate model spend. Input, output, and timeout limits cap a single request, but they do not stop a caller from making many requests. An in-memory counter would provide false confidence on serverless infrastructure because state is not shared reliably across instances.

Before a broad launch I would add:

1. User or anonymous-session identity with abuse-resistant verification.
2. A distributed rate limiter with per-identity and per-IP budgets.
3. Provider spend limits, usage alerts, and model-call observability.
4. Content moderation and explicit prompt-injection evaluation.
5. Structured logging that excludes prompt content and secrets.

That is the first production investment because it protects availability and cost without changing the product experience.
