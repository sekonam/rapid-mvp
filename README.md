# Decision Compass

A lightweight MVP that helps you think through tough decisions. Describe what you're weighing, and an AI thinking partner streams back structured reflection: situation summary, pros, cons, questions to sit with, and a gentle nudge—not a verdict.

Built for the **Rapid MVP** challenge (Node.js stack).

## Quick start

**Requirements:** Node.js 20+, an [OpenAI API key](https://platform.openai.com/api-keys)

```bash
npm install
cp .env.example .env.local
# Edit .env.local and set OPENAI_API_KEY=sk-...

npm run dev
```

Open [http://localhost:3000](http://localhost:3000), describe a decision, and hit **Find my bearings**.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model used for analysis |

## Deploy (live URL)

Works on [Vercel](https://vercel.com) out of the box:

1. Push this repo to GitHub
2. Import the project in Vercel
3. Add `OPENAI_API_KEY` in Project → Settings → Environment Variables
4. Deploy

## Product notes

- **Empty state:** Example dilemmas you can click to pre-fill the textarea
- **Loading:** Spinner + skeleton section cards while waiting for first tokens
- **Streaming:** Analysis appears section-by-section as the model writes
- **Done state:** Disclaimer that this is a thinking tool, not professional advice
- **Errors:** Clear messages (missing API key, validation) with retry

## Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) 4
- [OpenAI](https://github.com/openai/openai-node) streaming API

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
