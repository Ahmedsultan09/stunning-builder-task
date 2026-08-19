# BuildBrief

BuildBrief turns a rough product idea into a concise, integration-aware product and engineering plan. It is a focused full-stack AI exercise built for the Stunning Full-Stack Vibe Coder candidate task.

**[Live application](https://stunning-builder-task.vercel.app)** ·
**[GitHub repository](https://github.com/Ahmedsultan09/stunning-builder-task)**

![BuildBrief desktop preview](./public/buildbrief-preview.png)

## What it does

- Accepts a product prompt between 10 and 2,000 characters.
- Adds optional context for Stripe, Shopify, Gmail, Slack, and Google Sheets.
- Constructs the system prompt on the server so selected integrations reliably affect the result.
- Streams a concise AI response shaped by the user’s idea and selected integration context.
- Supports cancellation, retry, regeneration, safe Markdown rendering, and copy-to-clipboard.
- Includes responsive, keyboard-accessible idle, loading, success, validation, timeout, and provider-error states.

## Architecture

```text
Browser form
    │  POST { prompt, integrations[] }
    ▼
Next.js route handler
    ├─ Zod validation + duplicate normalization
    ├─ trusted integration catalog
    ├─ server-only system prompt construction
    └─ AI SDK 7 → Groq provider → OpenAI GPT-OSS 120B
                         │
                         ▼
                  UTF-8 text stream
```

The page shell is a React Server Component. Only the interactive builder is a Client Component. There is no database, authentication layer, or external OAuth because the assignment explicitly treats integrations as prompt context.

## Stack

- Next.js 16.3 App Router and React 19.2
- TypeScript in strict mode
- Tailwind CSS 4 and shadcn/UI with Radix primitives
- Vercel AI SDK 7 and the direct Groq provider
- Zod 4 request validation
- Vitest, Testing Library, and Playwright

AI SDK 7 requires Node.js 22 or newer. The repository includes `.nvmrc` and an `engines` declaration so local and hosted runtimes stay aligned.

## Run locally

```bash
nvm use
npm install
cp .env.example .env.local
```

Add a free Groq API key to `.env.local`:

```env
GROQ_API_KEY=your_groq_api_key
```

The key is read only inside the server route and is never exposed to the
browser. Configure the same variable as a sensitive Vercel environment
variable for production.

Then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev        # local development
npm run lint       # ESLint with zero warnings allowed
npm run typecheck  # strict TypeScript check
npm test           # unit, route, and component tests
npm run test:e2e   # Playwright browser smoke test
npm run build      # production build
npm run check      # lint + typecheck + tests + build
```

The Playwright test intercepts the AI endpoint. This keeps automated runs deterministic and free from inference cost. A real Groq request should still be smoke-tested manually before submission.

Additional responsive preview: [mobile layout](./public/buildbrief-mobile.png).

## API

`POST /api/generate`

```json
{
  "prompt": "Build a subscription dashboard for small agencies",
  "integrations": ["stripe", "slack"]
}
```

The endpoint returns a UTF-8 text stream. Invalid input returns `400`; missing or unavailable model access returns `502`; a timeout before the response starts returns `504`. Input, output, and request duration are bounded to control individual request cost.

## Provider choice

The original architecture targeted Vercel AI Gateway with Claude Sonnet 5.
Gateway inference was blocked by account-level billing verification, and the
available OpenAI Platform organization had no API credit. The live deployment
therefore uses Groq's free tier with OpenAI GPT-OSS 120B. This preserves a real
streamed model response, AI SDK 7 provider abstraction, and all server-side
safety boundaries without adding a payment requirement. The free tier is
appropriate for a candidate-task demo, not an SLA-backed production workload.

## Design and engineering rationale

- The visual direction uses dark neutral surfaces, one violet accent, Geist typography, restrained ambient lighting, and a focused two-step workspace.
- Integration selection uses real buttons with `aria-pressed`, so the interaction works with keyboard and assistive technology.
- User input is sent as a user message, never interpolated into the system role. Only trusted integration metadata is added to the system prompt.
- The route reads the first model chunk before sending response headers. Provider setup failures can therefore return a useful HTTP status instead of a broken `200` stream.
- Model Markdown is rendered without raw HTML.
- Prompts and generated briefs are not persisted or intentionally logged by the application.

For prioritization and production tradeoffs, see [DECISIONS.md](./DECISIONS.md). For the recent-technology assessment, see [TECH.md](./TECH.md).
