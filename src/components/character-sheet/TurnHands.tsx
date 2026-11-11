"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { ItemIcon } from "@/components/ItemIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { handChoices, heldInHands, weaponDamageDice, type Hand, type InventoryRow } from "@/lib/inventory";
import type { Character } from "@/lib/storage";
import { changeHands, type HandChangeCost } from "@/lib/turn";

interface TurnHandsProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

type Pick = { row: InventoryRow | null; hand: Hand };

/** "In your hands": what the character holds, and a picker to change it at the rulebook's cost. */
export function TurnHands({ character, onChange }: TurnHandsProps) {
  const { t } = useLanguage();
  const [slot, setSlot] = useState<"main" | "off" | null>(null);
  const [drop, setDrop] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const inventory = character.inventory || [];
  const held = heldInHands(inventory);

  const costText = (cost: HandChangeCost): string => {
    if (cost.blocked) return t("hands.cost.blockedShort", "Needs your action, already used");
    if (cost.action) return t("hands.cost.actionShort", "Uses your action");
    if (cost.interaction) return t("hands.cost.freeShort", "Free this turn");
    return t("hands.cost.none", "Free");
  };

  // Everything that could go in the open slot: each weapon once per grip, a shield for the off hand, and "nothing".
  const picks: Pick[] = [];
  if (slot) {
    const current = slot === "main" ? held.main : held.off;
    for (const row of inventory) {
      if (row.itemType === "weapon") {
        for (const hand of handChoices(row)) {
          const forSlot = slot === "main" ? hand !== "off" : hand === "off";
          if (!forSlot) continue;
          if (row.equipped && row.hand === hand) continue;
          picks.push({ row, hand });
        }
      } else if (slot === "off" && row.armorType === "shield" && !row.equipped) {
        picks.push({ row, hand: "off" });
      }
    }
    if (current) picks.push({ row: null, hand: slot });
  }
  const current = slot ? (slot === "main" ? held.main : held.off) : undefined;
  const canDrop = !!character.turnActive && !!current && current.itemType === "weapon";

  const choose = (pick: Pick) => {
    const { patch, cost, removed } = changeHands(character, pick.row?.id ?? null, pick.hand, drop && canDrop);
    if (!patch) return;
    onChange(patch);
    const parts: string[] = [];
    if (removed.length > 0) parts.push(drop && canDrop ? t("hands.dropped", { names: removed.join(", ") }, "Dropped {names}. Pick it up after the fight.") : t("hands.stowed", { names: removed.join(", ") }, "Put away {names}."));
    if (cost.action) parts.push(t("hands.cost.action", "Used your action."));
    else if (cost.interaction) parts.push(t("hands.cost.free", "Used your free object interaction for this turn."));
    setNote(parts.join(" ") || null);
    setSlot(null);
    setDrop(false);
  };

  const slotButton = (key: "main" | "off", row: InventoryRow | undefined, label: string, disabled = false) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => { setSlot(key); setDrop(false); }}
      className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2.5 py-2 text-left hover:border-[var(--color-border-active)] disabled:opacity-45"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-text-primary)]">
        {row ? <ItemIcon item={row.itemId || row.name} className="h-5 w-5" /> : <span className="text-xs text-[var(--color-text-muted)]">–</span>}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</span>
        <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{row ? row.name : t("hands.empty", "Empty")}</span>
      </span>
    </button>
  );

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{t("hands.title", "In your hands")}</h3>
        {character.turnActive && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            {character.objectInteractionUsed ? t("hands.freeUsed", "Free swap used") : t("hands.freeReady", "1 free draw or stow")}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {slotButton("main", held.main, held.twoHanded ? t("hands.both", "Both hands") : t("hands.main", "Main hand"))}
        {slotButton("off", held.off, t("hands.off", "Off hand"))}
      </div>
      {note && <p className="mt-1.5 text-[11px] text-[var(--color-text-secondary)]">{note}</p>}

      {slot && (
        <BottomSheet isOpen onClose={() => setSlot(null)} title={slot === "main" ? t("hands.pick.main", "Main hand") : t("hands.pick.off", "Off hand")} className="!mb-4 !max-h-[86vh]">
          <div className="space-y-2 px-4 py-4">
            <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              {character.turnActive
                ? t("hands.rule", "Each turn you may draw or put away one weapon for free. A second one, or a shield, takes your action. Dropping a weapon is always free.")
                : t("hands.ruleOutside", "Outside your turn, changing weapons costs nothing.")}
            </p>
            {canDrop && (
              <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-primary)]">
                <input type="checkbox" checked={drop} onChange={(e) => setDrop(e.target.checked)} />
                <span>{t("hands.dropToggle", { name: current!.name }, "Drop {name} on the ground instead of putting it away")}</span>
              </label>
            )}
            {picks.length === 0 && <p className="text-xs text-[var(--color-text-secondary)]">{t("hands.nothing", "Nothing else you carry fits this hand.")}</p>}
            {picks.map((pick) => {
              const { cost } = changeHands(character, pick.row?.id ?? null, pick.hand, drop && canDrop);
              const row = pick.row;
              const dice = row && row.itemType === "weapon" ? weaponDamageDice({ ...row, hand: pick.hand }) : "";
              return (
                <button
                  key={`${row?.id ?? "none"}:${pick.hand}`}
                  type="button"
                  disabled={cost.blocked}
                  onClick={() => choose(pick)}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-left hover:border-[var(--color-border-active)] disabled:opacity-45"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)]">
                    {row ? <ItemIcon item={row.itemId || row.name} className="h-5 w-5" /> : <span className="text-xs text-[var(--color-text-muted)]">–</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[var(--color-text-primary)]">
                      {row ? (row.onGround ? t("hands.fromGround", { name: row.name }, "{name} (pick up from the ground)") : row.name) : t("hands.putAway", { name: current?.name ?? "" }, "Put away {name}")}
                    </span>
                    {row && (
                      <span className="block text-[11px] text-[var(--color-text-muted)]">
                        {row.armorType === "shield" ? "+2 AC" : [pick.hand === "both" ? t("hands.both", "Both hands") : null, dice, row.damageType].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cost.blocked ? "bg-[var(--color-bg)] text-[var(--color-text-muted)]" : cost.action ? "bg-amber-500/15 text-amber-700" : "bg-[var(--color-bg)] text-[var(--color-text-secondary)]"}`}>
                    {costText(cost)}
                  </span>
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}
    </section>
  );
}
