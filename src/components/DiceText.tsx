import { useMemo } from "react";

const DICE_RE = /\*\*(\d+d\d+)\*\*|(?<!\*)(\d+d\d+)(?!\*)/g;

const DAMAGE_TYPES = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];

const DAMAGE_TYPE_RE = new RegExp(`\\b(${DAMAGE_TYPES.join("|")})\\s+damage\\b`, "gi");

const DAMAGE_STYLE: Record<string, string> = {
  acid: "bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-500/20 dark:text-lime-200 dark:border-lime-500/30",
  bludgeoning: "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-500/20 dark:text-stone-200 dark:border-stone-500/30",
  cold: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-500/30",
  fire: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30",
  force: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-500/30",
  lightning: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-500/30",
  necrotic: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-200 dark:border-green-500/30",
  piercing: "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-500/20 dark:text-stone-200 dark:border-stone-500/30",
  poison: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  psychic: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-200 dark:border-pink-500/30",
  radiant: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/30",
  slashing: "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-500/20 dark:text-stone-200 dark:border-stone-500/30",
  thunder: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30",
};

export function highlightDice(text: string) {
  const parts: Array<{ type: "text" | "dice" | "damage"; value: string; damageType?: string }> = [];
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

function splitDamageTokens(value: string) {
  const tokens: Array<{ type: "text" | "bold" | "damage"; value: string; damageType?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = DAMAGE_TYPE_RE.exec(value)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: value.slice(lastIndex, match.index) });
    }

    tokens.push({ type: "damage", value: match[0], damageType: match[1].toLowerCase() });

    lastIndex = DAMAGE_TYPE_RE.lastIndex;
  }

  if (lastIndex < value.length) {
    tokens.push({ type: "text", value: value.slice(lastIndex) });
  }

  return tokens;
}

function renderTextSegment(value: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const segments = value.split(/(\*\*[^*]+\*\*)/g);

  segments.forEach((segment, segIdx) => {
    if (!segment) return;

    if (segment.startsWith("**") && segment.endsWith("**")) {
      const inner = segment.slice(2, -2);
      nodes.push(
        <strong key={`bold-${segIdx}`} className="font-semibold text-slate-900 dark:text-slate-100">
          {inner}
        </strong>,
      );
    } else {
      nodes.push(<span key={`text-${segIdx}`}>{segment}</span>);
    }
  });

  return nodes;
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

        const damageTokens = splitDamageTokens(part.value);

        return (
          <span key={idx}>
            {damageTokens.map((token, tokenIdx) => {
              if (token.type === "damage") {
                const style = DAMAGE_STYLE[token.damageType || ""] || "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600";
                return (
                  <span
                    key={`dmg-${tokenIdx}`}
                    className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold ${style}`}
                  >
                    {token.value}
                  </span>
                );
              }

              return <span key={`txt-${tokenIdx}`}>{renderTextSegment(token.value)}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
}
