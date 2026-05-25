import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderLine(line: string, key: number) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("- ")) {
    return (
      <li key={key} className="ml-4 list-disc pl-1 leading-relaxed">
        {renderInline(trimmed.slice(2))}
      </li>
    );
  }

  return (
    <p key={key} className="leading-relaxed">
      {renderInline(trimmed)}
    </p>
  );
}

export function MarkdownBody({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      nodes.push(
        <ul key={key++} className="space-y-2">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("- ")) {
      listItems.push(renderLine(line, key++)!);
    } else {
      flushList();
      const node = renderLine(line, key++);
      if (node) nodes.push(node);
    }
  }
  flushList();

  return <div className="space-y-3 text-[var(--ink-muted)]">{nodes}</div>;
}
