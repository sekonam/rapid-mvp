import OpenAI from "openai";
import { openAiErrorMessage } from "@/lib/openai-errors";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { getClientIp, takeToken } from "@/lib/rate-limit";

export const runtime = "nodejs";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let dilemma: string;
  try {
    const body = await request.json();
    dilemma = typeof body.dilemma === "string" ? body.dilemma.trim() : "";
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!dilemma || dilemma.length < 10) {
    return Response.json(
      { error: "Please describe your decision in at least 10 characters." },
      { status: 400 }
    );
  }

  if (dilemma.length > 2000) {
    return Response.json(
      { error: "Please keep your description under 2000 characters." },
      { status: 400 }
    );
  }

  // Basic burst protection (best-effort on serverless).
  const ip = getClientIp(request.headers);
  const gate = takeToken({ key: ip, limit: 8, windowMs: 60_000 });
  if (!gate.ok) {
    return Response.json(
      {
        error:
          "Too many requests. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(gate.retryAfterSeconds) },
      }
    );
  }

  const openai = new OpenAI({ apiKey });

  let stream;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const requestPayload = {
    model,
    stream: true,
    temperature: 0.7,
    messages: [
      { role: "system" as const, content: SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: `Here's the decision I'm facing:\n\n${dilemma}`,
      },
    ],
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      stream = await openai.chat.completions.create(requestPayload);
      break;
    } catch (err) {
      const isApiErr = err instanceof OpenAI.APIError;
      const code = isApiErr ? (err.code ?? err.error?.code) : undefined;
      const status = isApiErr ? err.status : undefined;

      const shouldRetry =
        status === 429 && code !== "insufficient_quota" && attempt < 2;

      if (shouldRetry) {
        const base = attempt === 0 ? 400 : 1200;
        const jitter = Math.floor(Math.random() * 200);
        await sleep(base + jitter);
        continue;
      }

      const httpStatus = isApiErr && status ? status : 502;
      const headers =
        isApiErr && status === 429 && err.headers?.get("retry-after")
          ? { "Retry-After": err.headers.get("retry-after") as string }
          : undefined;

      return Response.json(
        { error: openAiErrorMessage(err) },
        { status: httpStatus, headers }
      );
    }
  }

  if (!stream) {
    return Response.json(
      { error: "Upstream did not return a stream." },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Stream failed.";
        controller.error(new Error(message));
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
