import OpenAI from "openai";

export function openAiErrorMessage(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    const code = err.code ?? err.error?.code;
    if (code === "insufficient_quota") {
      return "Your OpenAI account has no remaining quota. Add billing or credits at platform.openai.com/account/billing, then try again.";
    }
    if (err.status === 401) {
      return "Invalid OpenAI API key. Check OPENAI_API_KEY in your environment.";
    }
    if (err.status === 429) {
      return "OpenAI rate limit hit. Wait a moment and try again.";
    }
    if (typeof err.error?.message === "string") {
      return err.error.message;
    }
  }

  if (err instanceof Error) return err.message;
  return "Something went wrong talking to OpenAI.";
}
