import { DecisionCompass } from "@/components/DecisionCompass";

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <DecisionCompass />
      <footer className="pb-6 text-center text-xs text-[var(--ink-faint)]">
        Built for the Rapid MVP challenge · Node.js + Next.js + OpenAI
      </footer>
    </main>
  );
}
