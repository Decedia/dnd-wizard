"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { PrepareSpellsSheet } from "@/components/PrepareSpellsSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { preparableSpells } from "@/lib/prepared-spells";
import { hitDieSides, longRestPatch, restGains, rollHitDice, shortRestPatch, type RestKind } from "@/lib/rest";
import { getMaxPreparedSpells, getModifier, isPreparationCaster, type Character } from "@/lib/storage";

interface RestSheetProps {
  character: Character;
  kind: RestKind;
  onChange: (patch: Partial<Character>) => void;
  onClose: () => void;
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** Confirm a short or long rest, see what comes back, then take it. */
export function RestSheet({ character, kind, onChange, onClose }: RestSheetProps) {
  const { t } = useLanguage();
  const [dice, setDice] = useState(0);
  const [done, setDone] = useState<{ rolls: number[]; healed: number } | null>(null);
  const [preparing, setPreparing] = useState(false);
  // The gains are read once, before the rest is applied, so the list stays on screen.
  const [gains] = useState(() => restGains(character, kind));

  const maxHp = character.effectiveMaxHp || character.maxHp || 0;
  const hurt = (character.currentHp || 0) < maxHp;
  const diceLeft = character.hitDiceRemaining || 0;
  const con = getModifier(character.con ?? 10);
  const canPrepare = kind === "long" && isPreparationCaster(character) && preparableSpells(character).length > 0;

  const rest = () => {
    if (kind === "long") {
      onChange(longRestPatch(character));
      setDone({ rolls: [], healed: 0 });
      return;
    }
    const roll = rollHitDice(character, dice);
    const healed = Math.min(roll.healed, maxHp - (character.currentHp || 0));
    onChange(shortRestPatch(character, dice, roll.healed));
    setDone({ rolls: roll.rolls, healed });
  };

  if (preparing) {
    return (
      <PrepareSpellsSheet
        spells={preparableSpells(character)}
        prepared={character.preparedSpells || []}
        limit={getMaxPreparedSpells(character)}
        onChange={(preparedSpells) => onChange({ preparedSpells })}
        onClose={onClose}
      />
    );
  }

  const footer = done ? (
    <div className="flex items-center gap-2 px-4 py-3">
      {canPrepare && (
        <button type="button" onClick={() => setPreparing(true)} className="btn btn-secondary flex-1">
          {t("rest.changeSpells", "Change spells")}
        </button>
      )}
      <button type="button" onClick={onClose} className="btn btn-primary flex-1">
        {canPrepare ? t("rest.keepSpells", "Keep them") : t("prepare.done", "Done")}
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2 px-4 py-3">
      <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
        {t("common.cancel", "Cancel")}
      </button>
      <button type="button" onClick={rest} className="btn btn-primary flex-1">
        {t(`rest.${kind}.confirm`)}
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen onClose={onClose} title={t(`rest.${kind}.title`)} footer={footer} className="!mb-4 !max-h-[86vh]">
      <div className="space-y-4 px-4 py-4">
        {done ? (
          <>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">{t(`rest.${kind}.done`)}</div>
              {done.rolls.length > 0 && (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {t("rest.rolled", { rolls: done.rolls.join(", "), con: signed(con), healed: done.healed }, "Rolled {rolls} ({con} each). You got {healed} HP back.")}
                </p>
              )}
            </div>
            {canPrepare && (
              <div>
                <div className="text-sm font-bold text-[var(--color-text-primary)]">{t("rest.prepare.title", "Change your prepared spells?")}</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{t("rest.prepare.hint", "After a long rest you may swap which spells are ready. Keep them if you are happy with the set.")}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{t(`rest.${kind}.hint`)}</p>

            {kind === "short" && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-3">
                <div className="text-sm font-bold text-[var(--color-text-primary)]">{t("rest.hitDice.title", "Spend hit dice to heal")}</div>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  {t("rest.hitDice.hint", { die: `d${hitDieSides(character)}`, con: signed(con), left: diceLeft }, "Each one heals {die} {con}. You have {left} left.")}
                </p>
                {diceLeft > 0 && hurt ? (
                  <div className="mt-2 flex items-center gap-3">
                    <button type="button" aria-label={t("rest.hitDice.less", "One less")} onClick={() => setDice((d) => Math.max(0, d - 1))} disabled={dice <= 0} className="btn btn-secondary h-9 w-11 !px-0 disabled:opacity-40">−</button>
                    <span className="w-8 text-center text-xl font-bold text-[var(--color-text-primary)]">{dice}</span>
                    <button type="button" aria-label={t("rest.hitDice.more", "One more")} onClick={() => setDice((d) => Math.min(diceLeft, d + 1))} disabled={dice >= diceLeft} className="btn btn-secondary h-9 w-11 !px-0 disabled:opacity-40">+</button>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{t("rest.hitDice.hp", { hp: character.currentHp || 0, max: maxHp }, "HP {hp} / {max}")}</span>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] font-semibold text-[var(--color-text-muted)]">
                    {hurt ? t("rest.hitDice.none", "No hit dice left. A long rest gives some back.") : t("rest.hitDice.full", "You are at full HP, so there is nothing to heal.")}
                  </p>
                )}
              </div>
            )}

            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("rest.gains", "What comes back")}</div>
              {gains.length > 0 ? (
                <ul className="space-y-1">
                  {gains.map((g) => (
                    <li key={g.id} className="rounded-[var(--radius-sm)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text-primary)]">
                      {t(`rest.gain.${g.id}`, g.values || {})}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--color-text-secondary)]">{t(`rest.${kind}.nothing`)}</p>
              )}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
