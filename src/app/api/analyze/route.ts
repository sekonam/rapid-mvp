import OpenAI from "openai";
import { openAiErrorMessage } from "@/lib/openai-errors";
import { SYSTEM_PROMPT } from "@/lib/prompt";

export const runtime = "nodejs";

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

  const openai = new OpenAI({ apiKey });

  let stream;
  try {
    stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      stream: true,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here's the decision I'm facing:\n\n${dilemma}`,
        },
      ],
    });
  } catch (err) {
    const httpStatus =
      err instanceof OpenAI.APIError && err.status ? err.status : 502;
    return Response.json(
      { error: openAiErrorMessage(err) },
      { status: httpStatus }
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
