import { MarkdownBody } from "@/components/MarkdownBody";
import { sectionIcon, type Section } from "@/lib/parse-sections";

export function SectionCard({
  section,
  isStreaming,
}: {
  section: Section;
  isStreaming?: boolean;
}) {
  const isNudge = section.title === "A nudge (not a verdict)";

  return (
    <article
      className={`rounded-2xl border p-5 transition-all duration-300 ${
        isNudge
          ? "border-[var(--accent)]/30 bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--surface)]"
      } ${isStreaming ? "animate-pulse-subtle" : ""}`}
    >
      <header className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            isNudge
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface-elevated)] text-[var(--accent)]"
          }`}
          aria-hidden
        >
          {sectionIcon(section.title)}
        </span>
        <h3 className="font-medium text-[var(--ink)]">{section.title}</h3>
      </header>
      {section.body ? (
        <MarkdownBody content={section.body} />
      ) : (
        <div className="space-y-2">
          <div className="h-3 w-full animate-shimmer rounded bg-[var(--border)]" />
          <div className="h-3 w-4/5 animate-shimmer rounded bg-[var(--border)]" />
        </div>
      )}
    </article>
  );
}
