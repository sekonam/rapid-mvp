"use client";

import { useCallback, useRef, useState } from "react";
import { SectionCard } from "@/components/SectionCard";
import { EXAMPLE_PROMPTS } from "@/lib/prompt";
import { parseSections, type Section } from "@/lib/parse-sections";

type Status = "idle" | "loading" | "streaming" | "done" | "error";

const PLACEHOLDER_SECTIONS: Section[] = [
  { title: "The situation", body: "" },
  { title: "Pros", body: "" },
  { title: "Cons", body: "" },
  { title: "Questions to sit with", body: "" },
  { title: "A nudge (not a verdict)", body: "" },
];

export function DecisionCompass() {
  const [dilemma, setDilemma] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const isBusy = status === "loading" || status === "streaming";
  const showResults =
    status === "loading" ||
    status === "streaming" ||
    status === "done" ||
    (status === "error" && sections.length > 0);

  const analyze = useCallback(async (text: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setLastSubmitted(text);
    setSections([]);
    setStatus("loading");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dilemma: text }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Something went wrong."
        );
      }

      if (!res.body) throw new Error("No response stream.");

      setStatus("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setSections(parseSections(accumulated));
      }

      setSections(parseSections(accumulated));
      setStatus("done");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Request failed.");
      setStatus("error");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = dilemma.trim();
    if (trimmed.length < 10 || isBusy) return;
    void analyze(trimmed);
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setStatus("idle");
    setSections([]);
    setError(null);
    setDilemma("");
    setLastSubmitted("");
  };

  const displaySections =
    status === "loading"
      ? PLACEHOLDER_SECTIONS
      : sections.length > 0
        ? sections
        : PLACEHOLDER_SECTIONS;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm text-[var(--ink-muted)]">
          <span className="text-[var(--accent)]" aria-hidden>
            ✦
          </span>
          AI thinking partner
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
          Decision Compass
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[var(--ink-muted)]">
          Stuck between two paths? Describe what you&apos;re weighing. Get
          clarity—not a verdict.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="dilemma" className="sr-only">
          Describe your decision
        </label>
        <div className="relative">
          <textarea
            id="dilemma"
            value={dilemma}
            onChange={(e) => setDilemma(e.target.value)}
            placeholder="I'm deciding whether to… What matters to me is… My main worry is…"
            rows={5}
            maxLength={2000}
            disabled={isBusy}
            className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 pr-16 text-[var(--ink)] shadow-sm transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-60"
          />
          <span className="absolute bottom-3 right-4 text-xs text-[var(--ink-faint)]">
            {dilemma.length}/2000
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={dilemma.trim().length < 10 || isBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? (
              <>
                <Spinner />
                Thinking…
              </>
            ) : status === "streaming" ? (
              <>
                <Spinner />
                Writing…
              </>
            ) : (
              "Find my bearings"
            )}
          </button>

          {showResults && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--ink-muted)] transition hover:bg-[var(--surface-elevated)]"
            >
              Start over
            </button>
          )}
        </div>
      </form>

      {status === "idle" && !showResults && (
        <EmptyState
          onSelect={(prompt) => {
            setDilemma(prompt);
          }}
        />
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
          {lastSubmitted && status === "error" && (
            <button
              type="button"
              onClick={() => void analyze(lastSubmitted)}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {showResults && (
        <section aria-live="polite" aria-busy={isBusy} className="space-y-4">
          {lastSubmitted && (
            <p className="text-sm text-[var(--ink-faint)]">
              Reflecting on:{" "}
              <span className="italic text-[var(--ink-muted)]">
                &ldquo;
                {lastSubmitted.length > 120
                  ? `${lastSubmitted.slice(0, 120)}…`
                  : lastSubmitted}
                &rdquo;
              </span>
            </p>
          )}
          <div className="grid gap-4">
            {displaySections.map((section) => (
              <SectionCard
                key={section.title}
                section={section}
                isStreaming={
                  status === "streaming" &&
                  !section.body &&
                  section.title !== "The situation"
                }
              />
            ))}
          </div>
          {status === "done" && (
            <p className="text-center text-sm text-[var(--ink-faint)]">
              This is a thinking tool, not professional advice. Trust your gut
              after you sit with it.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function EmptyState({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-6">
      <p className="mb-4 text-sm font-medium text-[var(--ink-muted)]">
        Not sure where to start? Try one of these:
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onSelect(prompt)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-sm text-[var(--ink-muted)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface-elevated)] hover:text-[var(--ink)]"
            >
              {prompt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
