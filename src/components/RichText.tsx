import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useDice } from "@/contexts/DiceContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { groupFrom } from "@/lib/dice-roll";
import { GiDiceTwentyFacesTwenty as DiceIcon } from "react-icons/gi";
import {
  ShieldCheckIcon,
  SparklesIcon,
  HeartIcon,
  WarningCircleIcon,
  PoisonBottleIcon,
  EyeSlashIcon,
  EarIcon,
  HandIcon,
  LockIcon,
  MoonIcon,
  LightningBoltIcon,
  FistIcon,
} from "@/components/icons";
import { getDamageTypeStyle } from "@/lib/damage-types";
import { parseBlocks, tokenizeInline, toPlainText, type InlineToken } from "@/lib/rich-text";

type Icon = React.ComponentType<{ className?: string }>;

const CONDITION_ICON: Record<string, Icon> = {
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
};

/**
 * Dice badges are Roll buttons on a page with a dice tray. `title` names the roll
 * (the feature or item the text belongs to); `off` keeps them plain inside
 * something that is itself a button.
 */
const DiceBadgeContext = createContext<{ title?: string; off?: boolean }>({});

/** Names the rolls of the dice badges inside, or (`off`) keeps them from being buttons. */
export function RichDice({ title, off, children }: { title?: string; off?: boolean; children: ReactNode }) {
  const outer = useContext(DiceBadgeContext);
  const value = useMemo(() => ({ title: title ?? outer.title, off: off ?? outer.off }), [title, off, outer.title, outer.off]);
  return <DiceBadgeContext.Provider value={value}>{children}</DiceBadgeContext.Provider>;
}

// Sized in em so a badge follows the text it sits in (text-xs or text-sm).
const BADGE = "mx-px inline-flex items-center gap-[0.25em] whitespace-nowrap rounded-[0.4em] px-[0.4em] py-[0.05em] align-baseline text-[0.92em] font-semibold leading-[1.45]";
const ICON = "h-[1em] w-[1em] shrink-0";
const NEUTRAL = "border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)]";

function DiceBadge({ value }: { value: string }) {
  const dice = useDice();
  const { t } = useLanguage();
  const { title, off } = useContext(DiceBadgeContext);
  const group = dice && !off ? groupFrom(value, value) : null;
  if (!dice || !group) {
    return (
      <span className={`${BADGE} ${NEUTRAL} font-bold tabular-nums`}>
        <DiceIcon className={ICON} />
        {value}
      </span>
    );
  }
  const name = title || t("dice.free", "Dice");
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        dice.roll(name, [group]);
      }}
      aria-label={t("dice.rollName", { name: `${name} ${value}` }, "Roll {name}")}
      className={`${BADGE} ${NEUTRAL} cursor-pointer font-bold tabular-nums underline decoration-dotted underline-offset-2 hover:border-[var(--color-border-active)]`}
    >
      <DiceIcon className={ICON} />
      {value}
    </button>
  );
}

function Token({ token }: { token: InlineToken }) {
  switch (token.type) {
    case "text":
      return <>{token.value}</>;
    case "bold":
    case "term":
      return <strong className="font-semibold text-[var(--color-text-primary)]">{token.value}</strong>;
    case "dice":
      return <DiceBadge value={token.value} />;
    case "damage": {
      const style = getDamageTypeStyle(token.damage);
      if (!style) return <>{token.value}</>;
      return (
        <span className={BADGE} style={{ backgroundColor: `var(${style.bgColorVar})`, color: `var(${style.colorVar})` }}>
          <style.icon className={ICON} />
          {token.value}
        </span>
      );
    }
    case "save":
      return (
        <span className={`${BADGE} ${NEUTRAL}`}>
          <ShieldCheckIcon className={ICON} />
          {token.value}
        </span>
      );
    case "condition": {
      const ConditionIcon = CONDITION_ICON[token.condition] || SparklesIcon;
      return (
        <span className={`${BADGE} border border-dashed border-[var(--color-border-active)] text-[var(--color-text-primary)]`}>
          <ConditionIcon className={ICON} />
          {token.value}
        </span>
      );
    }
  }
}

function Tokens({ lead, tokens }: { lead?: string; tokens: InlineToken[] }) {
  return (
    <>
      {lead && <strong className="font-bold text-[var(--color-text-primary)]">{lead}</strong>}
      {tokens.map((token, i) => (
        <Token key={i} token={token} />
      ))}
    </>
  );
}

/** One line of rules text with badges, for places that cannot hold paragraphs. */
export function RichInline({ text }: { text: unknown }) {
  const tokens = useMemo(() => tokenizeInline(toPlainText(text).replace(/\s*\n+\s*/g, " ")), [text]);
  return <Tokens tokens={tokens} />;
}

/**
 * Rules text as paragraphs and lists, with dice, damage types, saving throws
 * and conditions shown as badges. Text size and colour come from `className`.
 */
export function RichText({ text, className = "text-sm text-[var(--color-text-secondary)]" }: { text: unknown; className?: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  if (blocks.length === 0) return null;
  return (
    <div className={`space-y-2 leading-relaxed ${className}`}>
      {blocks.map((block, i) => {
        if (block.type === "paragraph") {
          return (
            <p key={i}>
              <Tokens lead={block.lead} tokens={block.tokens} />
            </p>
          );
        }
        const List = block.ordered ? "ol" : "ul";
        return (
          <List key={i} className="space-y-1.5">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2">
                {block.ordered ? (
                  <span className="mt-[0.15em] flex h-[1.45em] w-[1.45em] shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[0.8em] font-bold text-[var(--color-text-muted)]">{j + 1}</span>
                ) : (
                  <span className="mt-[0.6em] h-[0.4em] w-[0.4em] shrink-0 rounded-full bg-[var(--color-text-muted)]" />
                )}
                <span className="min-w-0 flex-1">
                  <Tokens lead={item.lead} tokens={item.tokens} />
                </span>
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

