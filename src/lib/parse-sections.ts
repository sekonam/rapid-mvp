export type Section = {
  title: string;
  body: string;
};

const SECTION_ORDER = [
  "The situation",
  "Pros",
  "Cons",
  "Questions to sit with",
  "A nudge (not a verdict)",
] as const;

export function parseSections(markdown: string): Section[] {
  const parts = markdown.split(/^## /m).filter(Boolean);
  const parsed: Section[] = parts.map((part) => {
    const newline = part.indexOf("\n");
    const title =
      newline === -1 ? part.trim() : part.slice(0, newline).trim();
    const body =
      newline === -1 ? "" : part.slice(newline + 1).trim();
    return { title, body };
  });

  const byTitle = new Map(parsed.map((s) => [s.title, s]));
  const ordered = SECTION_ORDER.map((title) => byTitle.get(title)).filter(
    (s): s is Section => Boolean(s)
  );

  const extras = parsed.filter(
    (s) => !SECTION_ORDER.includes(s.title as (typeof SECTION_ORDER)[number])
  );

  return [...ordered, ...extras];
}

export function sectionIcon(title: string): string {
  switch (title) {
    case "The situation":
      return "◎";
    case "Pros":
      return "↑";
    case "Cons":
      return "↓";
    case "Questions to sit with":
      return "?";
    case "A nudge (not a verdict)":
      return "↗";
    default:
      return "•";
  }
}
