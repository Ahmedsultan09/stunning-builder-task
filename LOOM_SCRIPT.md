# Loom recording guide — target 4:40

Keep your face visible, use your own voice, and record in one take. Close unrelated tabs and notifications before starting.

## 0:00–0:25 — Introduction

“Hi, I’m Ahmed. I built BuildBrief for the Stunning full-stack task. My product decision was to turn the prompt into a useful implementation brief rather than a generic chatbot response, while keeping the architecture intentionally small enough for the timebox.”

## 0:25–2:10 — Product demo

1. Show the mobile or narrow layout briefly, then switch to desktop.
2. Use the Shopify analytics example.
3. Select Stripe and Slack and mention that the cards are contextual, not connected accounts.
4. Generate the brief and point out streaming, selected-integration badges, stable sections, cancel, copy, and regenerate.
5. Make one second request with a different integration selection so the changed context is visible.

Suggested narration:

“The prompt and selected IDs go to one server endpoint. The response starts streaming as soon as the provider returns content. Changing the selected integrations changes the trusted system context, so they affect the plan without pretending we implemented OAuth.”

## 2:10–3:25 — Architecture and code

Show three files only:

1. `src/lib/integrations.ts` — trusted catalog and typed IDs.
2. `src/lib/system-prompt.ts` — server-only context construction and response contract.
3. `src/app/api/generate/route.ts` — validation, Groq-hosted GPT-OSS model, bounds, timeout, first-chunk handling, and streaming.

Mention that user input remains a user message and is not interpolated into the system role.

## 3:25–4:10 — Production judgment

Open `DECISIONS.md`.

“The improvement pass focused on validation, recovery states, accessibility, request bounds, and tests. I intentionally left out auth, persistence, real integrations, and an agent loop. The biggest risk is unauthenticated inference abuse. Per-request limits help, but the real fix is identity, a distributed limiter, budgets, and observability—not an in-memory counter on serverless.”

## 4:10–4:35 — Recent technology

Open `TECH.md`.

“I chose AI SDK 7, released in June 2026. Its production additions include standardized reasoning, durable agents, approvals, sandboxing, and global telemetry. I would use its streaming and provider abstraction today. I did not use its agent loop here because a single contextual generation is simpler, cheaper, and correct for this task.”

## 4:35–4:40 — Close

“The repository includes run instructions, automated tests, and the live Vercel deployment. Thank you for reviewing it.”
