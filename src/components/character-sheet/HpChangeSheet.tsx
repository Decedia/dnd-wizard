"use client";

import { useCallback, useState } from "react";
import { GiRollingDices } from "react-icons/gi";
import { BasePopup } from "@/components/BasePopup";
import { RichInline } from "@/components/RichText";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDice } from "@/contexts/DiceContext";
import { d20Group } from "@/lib/dice-roll";
import { saveParts } from "@/lib/roll-parts";
import { activeResistances, reducedDamage } from "@/lib/resistances";
import type { Character } from "@/lib/storage";

interface HpChangeSheetProps {
  character: Character;
  mode: "heal" | "damage";
  onChange: (patch: Partial<Character>) => void;
  onClose: () => void;
}

/** Heal or take damage: temp HP soaks damage first, resistances halve it, concentration asks for a CON save. */
export function HpChangeSheet({ character, mode, onChange, onClose }: HpChangeSheetProps) {
  const { t } = useLanguage();
  const dice = useDice();
  const [hpAmount, setHpAmount] = useState("");
  const [damageHow, setDamageHow] = useState<"normal" | "resist" | "immune">("normal");
  const [concentrationCheck, setConcentrationCheck] = useState<{ damage: number; roll?: number } | null>(null);
  const maxHp = character.effectiveMaxHp ?? character.maxHp;
  const isWarCaster = (character.features || []).some((f) => f.name.toLowerCase().includes("war caster"));
  const resistingNow = activeResistances(character);

  const handleHpAction = useCallback(() => {
    const typed = parseInt(hpAmount, 10);
    if (isNaN(typed) || typed <= 0) return;
    const amount = mode === "damage" ? reducedDamage(typed, damageHow) : typed;
    if (mode === "heal") {
      onChange({ currentHp: Math.min(maxHp, character.currentHp + amount) });
      onClose();
      return;
    }
    const tempHp = character.temporaryHp || 0;
    const soaked = Math.min(tempHp, amount);
    const remainingDamage = amount - soaked;
    onChange({ currentHp: Math.max(0, character.currentHp - remainingDamage), temporaryHp: tempHp - soaked });
    onClose();
  }, [hpAmount, mode, damageHow, character, onChange, onClose, maxHp]);

  return (
    <BasePopup
      isOpen={true}
      onClose={onClose}
      title={mode === "heal" ? t("character.heal") : t("button.takeDamage", "Take Damage")}
      confirmLabel={mode === "heal" ? t("character.heal") : t("button.apply")}
      cancelLabel={t("common.cancel")}
      onConfirm={handleHpAction}
      confirmDisabled={!hpAmount || parseInt(hpAmount, 10) <= 0}
      showFooter={true}
    >
      <div className="px-4 py-4">
        <label className="field-label-light">{t("equipment.amount")}</label>
        <input
          type="number"
          value={hpAmount}
          onChange={(e) => setHpAmount(e.target.value)}
          placeholder={t("equipment.enterAmount")}
          className="input w-full mt-1"
          autoFocus
          min={1}
        />
      </div>
      {mode === "damage" && resistingNow.length > 0 && (
        <div className="mx-4 mb-3">
          <p className="mb-2 text-[11px] text-[var(--color-text-secondary)]">
            {t("combat.youResist", "You resist:")} <RichInline text={[...new Set(resistingNow.filter((r) => !r.immune).map((r) => r.type))].join(", ")} />
            {resistingNow.some((r) => r.immune) && (
              <>
                {" "}{t("combat.youAreImmune", "Immune:")} <RichInline text={[...new Set(resistingNow.filter((r) => r.immune).map((r) => r.type))].join(", ")} />
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {(["normal", "resist", ...(resistingNow.some((r) => r.immune) ? ["immune"] : [])] as const).map((how) => (
              <button
                key={how}
                type="button"
                onClick={() => setDamageHow(how as "normal" | "resist" | "immune")}
                className={`btn ${damageHow === how ? "btn-primary" : "btn-secondary"} text-xs`}
              >
                {t(`combat.damage.${how}`)}
                {hpAmount && parseInt(hpAmount, 10) > 0 ? ` (${reducedDamage(parseInt(hpAmount, 10), how as "normal" | "resist" | "immune")})` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === "damage" && (character.activeBuffs || []).some(b => b.concentration) && !concentrationCheck && (
        <div className="mx-4 mb-3 px-3 py-2 rounded border border-[var(--color-warning-200)] bg-[var(--color-warning-50)]">
          <div className="flex items-center gap-2">
            <span className="text-xs">⚠️</span>
             <span className="text-[10px] font-semibold text-[var(--color-warning-700)]">
              {t("combat.concentrationCheck", { dc: Math.max(10, Math.floor(parseInt(hpAmount || "0", 10) / 2)) })}
             </span>
          </div>
          <div className="mt-2">
            <button
              type="button"
              disabled={!dice}
              onClick={() => {
                const damage = parseInt(hpAmount || "0", 10);
                const label = t("override.save", { ability: "CON" }, "{ability} saving throw");
                const st = character.savingThrows?.con ?? { proficient: false, value: 0 };
                // A Constitution save; War Caster gives advantage on it.
                const group = { ...d20Group(label, st.value, saveParts(character, "con", st.proficient)), ...(isWarCaster ? { mode: "adv" as const } : {}) };
                dice?.roll(t("dice.concentration", "Concentration"), [group], (result) => setConcentrationCheck({ damage, roll: result[0]?.total }), { autoClose: true });
              }}
              className="btn btn-secondary inline-flex w-full items-center justify-center gap-1.5 !py-1.5 text-xs"
            >
              <GiRollingDices className="h-4 w-4" aria-hidden="true" />
              {t("dice.rollConSave", "Roll CON save")}
            </button>
             {isWarCaster && <p className="text-center text-[10px] text-[var(--color-success-600)] mt-1">{t("combat.warCasterAdvantage")}</p>}
          </div>
        </div>
      )}
      {concentrationCheck && (
        <div className="mx-4 mb-3 px-3 py-2 rounded border border-[var(--color-warning-200)] bg-[var(--color-warning-50)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs">🎲</span>
            <span className="text-[10px] font-semibold text-[var(--color-warning-700)]">
              {t("dice.concRolled", { roll: concentrationCheck.roll ?? "", dc: Math.max(10, Math.floor(concentrationCheck.damage / 2)) }, "Rolled {roll} against DC {dc}.")}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const current = character.activeBuffs || [];
                onChange({ activeBuffs: current.filter((b) => !b.concentration) });
                handleHpAction();
              }}
               className="flex-1 text-[10px] font-semibold text-[var(--color-success-600)] hover:text-[var(--color-success-700)] underline py-1"
            >
              {t("combat.failedBreakConcentration")}
            </button>
            <button
              type="button"
              onClick={() => { setConcentrationCheck(null); handleHpAction(); }}
               className="flex-1 text-[10px] font-semibold text-[var(--color-success-600)] hover:text-[var(--color-success-700)] underline py-1"
            >
              {t("combat.successMaintain")}
            </button>
          </div>
        </div>
      )}
    </BasePopup>
  );
}
