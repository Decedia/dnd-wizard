"use client";

import { SourceBadge } from "../SourceBadge";
import { HeartBottleIcon as Heart, LightningIcon as Lightning, SparklesIcon as Sparkle, SwordIcon as Sword, StarIcon as Star, InfoIcon as Info, XIcon } from "@/components/icons";
import { InfoIcon } from "@/components/icons";
import { RichText, RichInline } from "@/components/RichText";
import { toPlainText } from "@/lib/rich-text";
import { slugify } from "./level-infos";
import { useLevelCard } from "./level-card-state";

/** Free gains of a level: hit points, proficiency bonus, new features and spell slots. */
export function StepMoment() {
  const { info, hpValue, onHpChange, hitDie, conMod, averageHp, startFromLevelOne, show, tDesc, t, infoState, setInfoState, lvl, isHpComplete, setSectionRef } = useLevelCard();
  return (
    <>
      {show("moment") && (
      <div ref={setSectionRef(`hp-${lvl}`)} className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${!isHpComplete && !(lvl === 1 && startFromLevelOne) ? "border border-red-400 bg-red-50/30" : ""}`}>
        <Heart className={`h-4 w-4 ${!isHpComplete && !(lvl === 1 && startFromLevelOne) ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
        <div className="flex-1">
           <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("sheet.hitPoints", "Hit Points")}</div>
          <div className="text-xs text-[var(--color-text-primary)]">
             <RichInline text={lvl === 1 && startFromLevelOne
               ? `${hitDie} + ${conMod >= 0 ? conMod : `-${Math.abs(conMod)}`} = ${hitDie + conMod} HP (${t("common.automatic", "automatic")})`
              : `d${hitDie} ${conMod >= 0 ? `+ ${conMod}` : `- ${Math.abs(conMod)}`} (avg: ${averageHp})`} />
          </div>
        </div>
      {lvl === 1 && startFromLevelOne ? (
        <span className="text-sm font-bold text-[var(--color-text-primary)]">{hitDie + conMod} HP</span>
      ) : (
        <input
          type="number"
          value={hpValue || ""}
          onChange={(e) => onHpChange(parseInt(e.target.value || "0", 10))}
          className={`w-16 text-center text-sm font-bold rounded-[var(--radius-sm)] border px-2 py-1 ${!isHpComplete ? "border-red-300 bg-white" : "border-[var(--color-border)]"}`}
          placeholder={String(averageHp)}
        />
      )}
    </div>
    )}

      {show("moment") && (
      <div className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
        <Star className="h-4 w-4 text-[var(--color-text-muted)]" />
        <div className="flex-1">
          <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("sheet.proficiencyBonus", "Proficiency Bonus")}</div>
          <div className="text-xs text-[var(--color-text-primary)]">+{info.proficiencyBonus}</div>
        </div>
      </div>
      )}

      {show("moment") && info.classFeatures.length > 0 && (
        <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
          <Sword className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("sheet.classFeatures", "Class Features")}</div>
            <div className="space-y-1 mt-1">
              {info.classFeatures.map((f) => (
                <div key={f.name} className="text-xs text-[var(--color-text-primary)]">
                  <span className="font-semibold">{f.name}:</span> {f.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {show("moment") && info.features.length > 0 && (
        <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
          <Lightning className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("levelUp.newFeatures", "New Features")}</div>
            <div className="space-y-2 mt-1">
              {info.features.map((f) => (
                <div key={f.name}>
                   <div className="text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                     {f.source && f.source !== "PHB" && <SourceBadge source={f.source} />}
                     <span className="font-semibold">{f.name}</span>
{f.description && (
                        <button
                          type="button"
                          onClick={() => setInfoState({ title: f.name, description: f.description, descKey: `feature.desc.${slugify(f.name)}` })}
                          className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                          aria-label={`Info: ${f.name}`}
                        >
                          <InfoIcon className="h-4 w-4" />
                        </button>
                      )}
                      {infoState?.title === f.name && (
                        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoState(null)}>
                          <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{f.name}</h3>
                              <button type="button" onClick={() => setInfoState(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                <XIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <RichText text={infoState.descKey ? tDesc(infoState.descKey, toPlainText(f.description)) : f.description} className="max-h-[60vh] overflow-y-auto text-xs text-[var(--color-text-secondary)]" />
                             <button type="button" onClick={() => setInfoState(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">{t("wizard.gotIt", "Got it")}</button>
                          </div>
                        </div>
                      )}
                   </div>
                   {(f.summary || f.description) && (
                     <p className={`mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)] ${f.summary ? "" : "line-clamp-2"}`}><RichInline text={f.summary || f.description} /></p>
                   )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {show("moment") && info.spellSlots && (
        <div className="flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)]">
          <Sparkle className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("spell.spellSlots", "Spell Slots")}</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.entries(info.spellSlots).map(([level, count]) => (
                <span key={level} className="text-[10px] font-bold text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                  {level}{Number(level) === 1 ? "st" : Number(level) === 2 ? "nd" : Number(level) === 3 ? "rd" : "th"}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
