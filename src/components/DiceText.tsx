import { useMemo } from "react";

const DICE_RE = /\*\*(\d+d\d+)\*\*|(?<!\*)(\d+d\d+)(?!\*)/g;

export function highlightDice(text: string) {
  const parts: Array<{ type: "text" | "dice"; value: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = DICE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    const dice = match[1] || match[2];
    parts.push({ type: "dice", value: dice });

    lastIndex = DICE_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

export function DiceText({ text }: { text: string }) {
  const parts = useMemo(() => highlightDice(text), [text]);

  return (
    <span className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
      {parts.map((part, idx) => {
        if (part.type === "dice") {
          return (
            <span
              key={idx}
              className="inline-flex items-center rounded-md border border-indigo-500/40 bg-indigo-500/10 px-1.5 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 mx-0.5"
            >
              {part.value}
            </span>
          );
        }

        const nodes: React.ReactNode[] = [];
        const segments = part.value.split(/(\*\*[^*]+\*\*)/g);

        segments.forEach((segment, segIdx) => {
          if (!segment) return;

          if (segment.startsWith("**") && segment.endsWith("**")) {
            const inner = segment.slice(2, -2);
            nodes.push(
              <strong key={`${idx}-${segIdx}`} className="font-semibold text-slate-900 dark:text-slate-100">
                {inner}
              </strong>,
            );
          } else {
            nodes.push(<span key={`${idx}-${segIdx}`}>{segment}</span>);
          }
        });

        return <span key={idx}>{nodes}</span>;
      })}
    </span>
  );
}
