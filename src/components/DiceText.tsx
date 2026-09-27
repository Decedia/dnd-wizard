import { useMemo } from "react";
import {
  AcidIcon,
  SnowflakeIcon,
  FireGiIcon,
  PowerLightningIcon,
  ThunderStruckIcon,
  DeathSkullIcon,
  PsychicWaveIcon,
  HolyGrailIcon,
  SparklesIcon,
  HeartIcon,
  WarningCircleIcon,
  PoisonBottleIcon,
  EyeSlashIcon,
  EarIcon,
  HandIcon,
  LockIcon,
  ShieldCheckIcon,
  MoonIcon,
  LightningBoltIcon,
  FistIcon,
} from "@/components/icons";

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

const STATUSES = [
  "blinded",
  "charmed",
  "deafened",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
  "exhaustion",
];

const DAMAGE_TYPE_RE = new RegExp(`\\b(${DAMAGE_TYPES.join("|")})\\s+damage\\b`, "gi");
const STATUS_RE = new RegExp(`\\b(${STATUSES.join("|")})\\b`, "gi");

const DAMAGE_STYLE: Record<string, string> = {
  acid: "bg-[var(--color-damage-acid-bg)] text-[var(--color-damage-acid)] border-[var(--color-damage-acid)]",
  bludgeoning: "bg-[var(--color-damage-bludgeoning-bg)] text-[var(--color-damage-bludgeoning)] border-[var(--color-damage-bludgeoning)]",
  cold: "bg-[var(--color-damage-cold-bg)] text-[var(--color-damage-cold)] border-[var(--color-damage-cold)]",
  fire: "bg-[var(--color-damage-fire-bg)] text-[var(--color-damage-fire)] border-[var(--color-damage-fire)]",
  force: "bg-[var(--color-damage-force-bg)] text-[var(--color-damage-force)] border-[var(--color-damage-force)]",
  lightning: "bg-[var(--color-damage-lightning-bg)] text-[var(--color-damage-lightning)] border-[var(--color-damage-lightning)]",
  necrotic: "bg-[var(--color-damage-necrotic-bg)] text-[var(--color-damage-necrotic)] border-[var(--color-damage-necrotic)]",
  piercing: "bg-[var(--color-damage-piercing-bg)] text-[var(--color-damage-piercing)] border-[var(--color-damage-piercing)]",
  poison: "bg-[var(--color-damage-poison-bg)] text-[var(--color-damage-poison)] border-[var(--color-damage-poison)]",
  psychic: "bg-[var(--color-damage-psychic-bg)] text-[var(--color-damage-psychic)] border-[var(--color-damage-psychic)]",
  radiant: "bg-[var(--color-damage-radiant-bg)] text-[var(--color-damage-radiant)] border-[var(--color-damage-radiant)]",
  slashing: "bg-[var(--color-damage-slashing-bg)] text-[var(--color-damage-slashing)] border-[var(--color-damage-slashing)]",
  thunder: "bg-[var(--color-damage-thunder-bg)] text-[var(--color-damage-thunder)] border-[var(--color-damage-thunder)]",
};

const DAMAGE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  acid: AcidIcon,
  bludgeoning: SparklesIcon,
  cold: SnowflakeIcon,
  fire: FireGiIcon,
  force: SparklesIcon,
  lightning: PowerLightningIcon,
  necrotic: DeathSkullIcon,
  piercing: SparklesIcon,
  poison: SparklesIcon,
  psychic: PsychicWaveIcon,
  radiant: HolyGrailIcon,
  slashing: SparklesIcon,
  thunder: ThunderStruckIcon,
};

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  blinded: EyeSlashIcon,
  charmed: HeartIcon,
  deafened: EarIcon,
  frightened: WarningCircleIcon,
  grappled: HandIcon,
  incapacitated: SparklesIcon,
  invisible: EyeSlashIcon,
  paralyzed: LightningBoltIcon,
  petrified: SparklesIcon,
  poisoned: PoisonBottleIcon,
  prone: FistIcon,
  restrained: LockIcon,
  stunned: SparklesIcon,
  unconscious: MoonIcon,
  exhaustion: WarningCircleIcon,
};

const STATUS_STYLE: Record<string, string> = {
  blinded: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  charmed: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  deafened: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  frightened: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  grappled: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  incapacitated: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  invisible: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  paralyzed: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  petrified: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  poisoned: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  prone: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  restrained: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  stunned: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  unconscious: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  exhaustion: "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
};

const UNORDERED_LIST_RE = /^(?:[-*])\s+(.+)$/gm;
const ORDERED_LIST_RE = /^(\d+)\.\s+(.+)$/gm;

function parseListBlocks(text: string): Array<{ type: "paragraph" | "unordered" | "ordered"; content: string; index?: number }> {
  const lines = text.split("\n");
  const blocks: Array<{ type: "paragraph" | "unordered" | "ordered"; content: string; index?: number }> = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    const trimmed = currentParagraph.join("\n").trim();
    if (trimmed) {
      blocks.push({ type: "paragraph", content: trimmed });
    }
    currentParagraph = [];
  };

  for (const line of lines) {
    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);

    if (unorderedMatch) {
      flushParagraph();
      blocks.push({ type: "unordered", content: unorderedMatch[1] });
    } else if (orderedMatch) {
      flushParagraph();
      blocks.push({ type: "ordered", content: orderedMatch[2], index: Number(orderedMatch[1]) - 1 });
    } else {
      currentParagraph.push(line);
    }
  }

  flushParagraph();
  return blocks;
}

export function highlightDice(text: string) {
  const parts: Array<{ type: "text" | "dice" | "damage" | "status"; value: string; damageType?: string; statusType?: string }> = [];
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
  const tokens: Array<{ type: "text" | "bold" | "damage" | "status"; value: string; damageType?: string; statusType?: string }> = [];
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

function splitStatusTokens(value: string) {
  const tokens: Array<{ type: "text" | "bold" | "damage" | "status"; value: string; statusType?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = STATUS_RE.exec(value)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: value.slice(lastIndex, match.index) });
    }

    tokens.push({ type: "status", value: match[0], statusType: match[1].toLowerCase() });

    lastIndex = STATUS_RE.lastIndex;
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
        <strong key={`bold-${segIdx}`} className="font-semibold text-[var(--color-text-primary)]">
          {inner}
        </strong>,
      );
    } else {
      nodes.push(<span key={`text-${segIdx}`}>{segment}</span>);
    }
  });

  return nodes;
}

function renderInlineText(value: string): React.ReactNode[] {
  const damageTokens = splitDamageTokens(value);

  return damageTokens.flatMap((token, tokenIdx) => {
    if (token.type === "damage") {
      const style = DAMAGE_STYLE[token.damageType || ""] || "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]";
      const Icon = token.damageType ? DAMAGE_ICON[token.damageType] : null;
      return [
        <span
          key={`dmg-${tokenIdx}`}
          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold ${style}`}
        >
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {token.value}
        </span>,
      ];
    }

    const statusTokens = splitStatusTokens(typeof token.value === "string" ? token.value : "");

    return statusTokens.flatMap((statusToken, statusIdx) => {
      if (statusToken.type === "status") {
        const style = STATUS_STYLE[statusToken.statusType || ""] || "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]";
        const Icon = statusToken.statusType ? STATUS_ICON[statusToken.statusType] : null;
        return [
          <span
            key={`status-${statusIdx}`}
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold ${style}`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {statusToken.value}
          </span>,
        ];
      }

      return renderTextSegment(statusToken.value);
    });
  });
}

function RichText({ text }: { text: string }) {
  const parts = useMemo(() => highlightDice(text), [text]);

  return (
    <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
      {parts.map((part, idx) => {
        if (part.type === "dice") {
          return (
            <span
              key={idx}
              className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-0.5 text-xs font-bold text-[var(--color-text-primary)] mx-0.5"
            >
              {part.value}
            </span>
          );
        }

        return <span key={idx}>{renderInlineText(part.value)}</span>;
      })}
    </span>
  );
}

export function DiceText({ text }: { text: string }) {
  const blocks = useMemo(() => parseListBlocks(text || ""), [text]);

  return (
    <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed space-y-2">
      {blocks.map((block, idx) => {
        if (block.type === "paragraph") {
          return (
            <p key={idx} className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <RichText text={block.content} />
            </p>
          );
        }

        if (block.type === "unordered") {
          return (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
              <div className="flex-1">
                <RichText text={block.content} />
              </div>
            </li>
          );
        }

        if (block.type === "ordered") {
          return (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-[10px] font-bold text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                {(block.index ?? 0) + 1}
              </span>
              <div className="flex-1">
                <RichText text={block.content} />
              </div>
            </li>
          );
        }

        return null;
      })}
    </div>
  );
}
