"use client";

import { getStaticSpells, getPactBoons } from "@/lib/srd-client";
import { getCircleSpells } from "@/lib/storage";
import { usesOptionalClassFeatures } from "@/data/optional-class-features";
import { FeatureChipSelector } from "../FeatureChipSelector";
import { SparklesIcon as Sparkle, CrownIcon as Crown, SwordIcon as Sword, BookIcon as Book, InfoIcon as Info, CaretDownIcon as CaretDown, LeafIcon as Leaf, TargetIcon as Target, XIcon } from "@/components/icons";
import { InfoIcon } from "@/components/icons";
import { RichText } from "@/components/RichText";
import { toPlainText } from "@/lib/rich-text";
import { getAvailableInvocations, slugify } from "./level-infos";
import { useLevelCard } from "./level-card-state";

/** Class and subclass picks: fighting styles, expertise, invocations, terrain and the like. */
export function StepFeatures() {
  const { info, subclassSelection, subclassFeatureChoices, classFeatureChoices, onClassFeatureChoice, spells, circleTerrain, character, allSpellSelections, invocationSelections, onInvocationsChange, replacedInvocation, onReplacedInvocationChange, pactTomeCantrips, onPactTomeCantripsChange, expertise, allInvocationSelections, pactBoon, takenSpells, subclassOnly, show, language, tDesc, t, infoState, setInfoState, setShowTerrainModal, setShowFeaturePopup, setFeatureSelections, getAllSelectedMetamagic, setShowSpellMasteryModal, setSpellMasterySelections, setShowExpertiseModal, isComplete } = useLevelCard();
  return (
    <>
      {show("features") && info.expertise && info.expertise.count > 0 && (() => {
        const expCount = info.expertise.count;
        const selectedCount = expertise.length;
        const isComplete = selectedCount >= expCount;
        const availableOptions = info.expertise.availableOptions || [];
        return (
          <div className={`flex items-start gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${!isComplete ? "border border-red-400 bg-red-50/30" : ""}`}>
            <Target className={`h-4 w-4 ${!isComplete ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
            <div className="flex-1">
               <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("sheet.expertise", "Expertise")}</div>
               <div className={`text-xs ${!isComplete ? "text-red-500" : "text-[var(--color-text-primary)]"}`}>
                 {t("creator.expertiseHint", "Choose")} {expCount} {t("creator.skill", "skill")}{expCount !== 1 ? t("creator.skillPlural", "s") : ""} {t("creator.toDoubleProficiency", "to double proficiency")}
                 {selectedCount > 0 && <span className="ml-1">({selectedCount}/{expCount} selected)</span>}
              </div>
              {selectedCount > 0 && (
                <div className="text-[10px] text-[var(--color-text-primary)] mt-0.5">
                  {expertise.join(", ")}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setShowExpertiseModal(true); }}
              className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${!isComplete ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
             >
               {isComplete ? t("common.change", "Change") : t("common.select", "Select")}
             </button>
          </div>
        );
      })()}

      {show("features") && ((info.subclassFeatureChoices && info.subclassFeatureChoices.length > 0 && subclassSelection) || (info.classFeatureChoices && info.classFeatureChoices.length > 0)) ? (
        <div className="space-y-3">
          {info.subclassFeatureChoices && info.subclassFeatureChoices.length > 0 && subclassSelection && (
            info.subclassFeatureChoices.map((fc) => (
              <div key={fc.name} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                 <div className="flex items-center gap-2 mb-1">
                   <Crown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                   <span className="text-sm font-bold text-[var(--color-text-primary)]">{fc.name}</span>
{fc.description && (
                      <button
                        type="button"
                        onClick={() => setInfoState({ title: fc.name, description: fc.description, descKey: `feature.desc.${slugify(fc.name)}` })}
                        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                        aria-label={`Info: ${fc.name}`}
                      >
                        <InfoIcon className="h-4 w-4" />
                      </button>
                    )}
                    {infoState?.title === fc.name && (
                      <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoState(null)}>
                        <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{fc.name}</h3>
                            <button type="button" onClick={() => setInfoState(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <RichText text={infoState.descKey ? tDesc(infoState.descKey, toPlainText(fc.description)) : fc.description} className="max-h-[60vh] overflow-y-auto text-xs text-[var(--color-text-secondary)]" />
                          <button type="button" onClick={() => setInfoState(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">{t("wizard.gotIt", "Got it")}</button>
                        </div>
                      </div>
                    )}
                 </div>
                <div className="text-[10px] text-[var(--color-text-secondary)] mb-2">{t("levelUp.subclassLevel", "Subclass · Level {level}", { level: info.level })}</div>
                  <button
                    type="button"
                    onClick={() => { setFeatureSelections([]); setShowFeaturePopup({ ...fc, isSubclass: true, count: fc.count }); }}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                   >
                    <span>{subclassFeatureChoices[fc.name] || t("creator.selectOption", "Select an option...")}</span>
                   <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                 </button>
              </div>
            ))
          )}
          {info.classFeatureChoices && info.classFeatureChoices.length > 0 && (
            info.classFeatureChoices
              .filter((fc) => fc.name !== "Pact Boon" && fc.name !== "Eldritch Invocations")
              .map((fc) => {
                const isMetamagic = fc.name === "Metamagic";
                const availableOptions = isMetamagic
                  ? (() => {
                      const selected = getAllSelectedMetamagic();
                      return fc.options.filter((opt) => !selected.has(opt.name));
                    })()
                  : fc.options;
                const currentValue = classFeatureChoices[fc.name] || "";
                const currentValues = currentValue.split(", ").filter(Boolean);
                const maxCount = fc.count || 1;

                return (
                  <div key={fc.name} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                     <div className="flex items-center gap-2 mb-1">
                       <Sword className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                       <span className="text-sm font-bold text-[var(--color-text-primary)]">{fc.name}</span>
{fc.description && (
                          <button
                            type="button"
                            onClick={() => setInfoState({ title: fc.name, description: fc.description, descKey: `feature.desc.${slugify(fc.name)}` })}
                            className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                            aria-label={`Info: ${fc.name}`}
                          >
                            <InfoIcon className="h-4 w-4" />
                          </button>
                        )}
                        {infoState?.title === fc.name && (
                          <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoState(null)}>
                            <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{fc.name}</h3>
                                <button type="button" onClick={() => setInfoState(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                  <XIcon className="h-4 w-4" />
                                </button>
                              </div>
                              <RichText text={infoState.descKey ? tDesc(infoState.descKey, toPlainText(fc.description)) : fc.description} className="max-h-[60vh] overflow-y-auto text-xs text-[var(--color-text-secondary)]" />
                               <button type="button" onClick={() => setInfoState(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">{t("wizard.gotIt", "Got it")}</button>
                            </div>
                          </div>
                        )}
                     </div>
                    <div className="text-[10px] text-[var(--color-text-secondary)] mb-2">{t("levelUp.classLevel", "Class · Level {level}", { level: info.level })}</div>
                    {maxCount > 1 ? (
                      <FeatureChipSelector
                        name={fc.name}
                        description={fc.description}
                        options={availableOptions.map((opt) => ({ name: opt.name, description: opt.description, icon: opt.icon }))}
                        selectedValues={currentValues}
                        maxCount={maxCount}
                        onChange={(values) => onClassFeatureChoice(fc.name, values.join(", "))}
                        isSubclass={false}
                        takenSpells={takenSpells}
            />
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setFeatureSelections([]); setShowFeaturePopup({ ...fc, options: availableOptions, isSubclass: false, count: fc.count }); }}
                        className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                      >
                        <span>{currentValue || t("creator.selectOption", "Select an option...")}</span>
                        <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                      </button>
                    )}
                  </div>
                );
              })
          )}
        </div>
      ) : null}

      {show("features") && !subclassOnly && character.class === "Wizard" && info.level === 18 && (() => {
        const spellMasterySelection = classFeatureChoices["Spell Mastery"] || "";
        return (
          <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/30">
            <div className="flex items-center gap-2 mb-1">
              <Sparkle className="h-3.5 w-3.5 text-amber-600" />
               <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.spellMastery", "Spell Mastery")}</span>
             </div>
             <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.spellMasteryHint", "Choose one 1st-level and one 2nd-level spell to cast at will without spell slots.")}</p>
            <button
              type="button"
              onClick={() => { setSpellMasterySelections([]); setShowSpellMasteryModal(true); }}
              className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
            >
              <span>{spellMasterySelection || t("levelUp.selectSpells", "Select {count} spells...", { count: 2 })}</span>
              <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
            </button>
          </div>
        );
      })()}

      {show("features") && !subclassOnly && character.class === "Warlock" && info.level === 3 && subclassSelection && (() => {
        const pactBoon = classFeatureChoices["Pact Boon"] || "";
        return (
          <div className="p-3 rounded-lg border border-purple-300 bg-purple-50/30">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-3.5 w-3.5 text-purple-600" />
               <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.pactBoon", "Pact Boon")}</span>
             </div>
             <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.pactBoonGift", "Your patron bestows a gift. Choose one.")}</p>
            <button
              type="button"
              onClick={() => { setFeatureSelections([]); setShowFeaturePopup({ name: "Pact Boon", description: "", options: getPactBoons().filter((b: any) => b.source !== "TCE" || usesOptionalClassFeatures(character)).map(b => ({ name: b.name, description: b.description })), isSubclass: false, count: 1 }); }}
              className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
            >
               <span>{pactBoon || t("levelUp.selectPactBoon", "Select Pact Boon...")}</span>
              <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
            </button>
            {pactBoon === "Pact of the Tome" && (
              <div className="mt-3">
                 <p className="text-[10px] font-semibold text-purple-700 mb-1">{t("spell.chooseCantripsFromAnyClass", "Choose 3 Cantrips from Any Class:")}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {pactTomeCantrips.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-purple-100 border border-purple-300 rounded-full text-purple-800">
                      {c}
                      <button type="button" onClick={() => onPactTomeCantripsChange(pactTomeCantrips.filter(x => x !== c))} className="hover:text-red-600 font-bold">×</button>
                    </span>
                  ))}
                </div>
                <FeatureChipSelector
                   name="Book of Shadows"
                   description={t("spell.pactTomeCantripsHint", "Choose three cantrips from any class. They don't count against your cantrips known.")}
                  options={getStaticSpells(character.sources, undefined, language)
                    .filter((s) => s.level === 0 && !pactTomeCantrips.includes(s.name))
                    .map((s) => ({ name: s.name, description: s.school || "" }))}
                  selectedValues={pactTomeCantrips}
                  maxCount={3}
                  onChange={onPactTomeCantripsChange}
                  isSubclass={false}
                  takenSpells={takenSpells}
            />
              </div>
            )}
            {pactBoon === "Pact of the Chain" && (
              <div className="mt-2">
                <p className="text-[10px] text-[var(--color-text-muted)]">{t("spell.familiarForms", "Special familiar forms available: imp, pseudodragon, quasit, sprite")}</p>
              </div>
            )}
          </div>
        );
      })()}

      {show("features") && !subclassOnly && character.class === "Warlock" && info.level >= 3 && !subclassSelection && (
        <div className="p-3 rounded-lg border border-purple-300 bg-purple-50/30">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.pactBoonRequired", "Pact Boon Required")}</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("creator.pactBoonHint", "Choose your subclass (Otherworldly Patron) first to unlock Pact Boon selection.")}</p>
        </div>
      )}

      {show("features") && !subclassOnly && character.class === "Warlock" && info.level >= 2 && (() => {
        const invocationFeature = info.classFeatureChoices?.find(fc => fc.name === "Eldritch Invocations");
        if (!invocationFeature) return null;
        const currentInvocations = invocationSelections;
        const invocationCount = invocationFeature.count || 1;
        const knowsEldritchBlast =
          (character.cantrips || []).some((c) => c.name === "Eldritch Blast") ||
          (character.spells || []).some((sp) => sp.name === "Eldritch Blast") ||
          Object.entries(allSpellSelections || {}).some(([l, list]) => Number(l) <= info.level && list.includes("Eldritch Blast:0"));
        const availableInvocations = getAvailableInvocations(info.level, pactBoon || "", currentInvocations, knowsEldritchBlast, character.sources, usesOptionalClassFeatures(character));
        const priorInvocations = Object.entries(allInvocationSelections || {}).filter(([l]) => Number(l) < info.level).flatMap(([, invs]) => invs);
        const hasPriorInvocations = info.level > 2 && priorInvocations.length > 0;

        return (
          <div className="p-3 rounded-lg border border-indigo-300 bg-indigo-50/30">
             <div className="flex items-center gap-2 mb-1">
               <Sparkle className="h-3.5 w-3.5 text-indigo-600" />
               <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.eldritchInvocations", "Eldritch Invocations")}</span>
             </div>
             <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.invocationCountHint", "Invocations to choose: {count}. Spell slots recover on a short rest.", { count: invocationCount })}</p>
            <FeatureChipSelector
              name="Eldritch Invocations"
              description={t("spell.chooseInvocations", "Invocations to choose: {count}", { count: invocationCount })}
               options={availableInvocations.map((i) => ({
                 name: i.name,
                 description: i.available ? t("spell.availableAtLevel", "Available at level {level}", { level: info.level }) : i.reason || t("common.notAvailable", "Not available"),
                 disabled: !i.available,
                 unavailableReason: i.reason,
              }))}
              selectedValues={currentInvocations}
              maxCount={invocationCount}
              onChange={onInvocationsChange}
              isSubclass={false}
              takenSpells={takenSpells}
            />
            {hasPriorInvocations && info.level > 2 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold text-orange-700 mb-1">{t("spell.replaceInvocation", "Replace an invocation (optional):")}</p>
                <button
                  type="button"
                  onClick={() =>
                   setShowFeaturePopup({
                       name: "__replace_invocation__",
                       description: t("spell.replaceInvocationHint", "Choose an existing invocation to replace."),
                       options: priorInvocations.map((inv) => ({ name: inv, description: t("spell.replaceInvocationOption", "Replace {name}", { name: inv }) })),
                      isSubclass: false,
                      count: 1,
                    })
                  }
                  className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
                >
                   <span>{replacedInvocation || t("common.noReplacement", "No replacement")}</span>
                  <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
                {replacedInvocation && (
                  <button
                    type="button"
                    onClick={() => onReplacedInvocationChange("")}
                     className="mt-1 text-[10px] text-[var(--color-error-600)] hover:underline"
                   >
                     {t("common.clearReplacement", "Clear replacement")}
                   </button>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {show("features") && info.circleTerrainSelection && (
        <div className="p-3 rounded-lg border border-green-300 bg-green-50/30">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("creator.circleSpellsTitle", "Circle Spells - Choose Terrain")}</span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("creator.circleSpellsHint", "Choose your terrain type to gain circle spells (always prepared, do not count against limit)")}</p>
          <button
            type="button"
            onClick={() => setShowTerrainModal(true)}
            className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
          >
             <span>{circleTerrain ? circleTerrain.charAt(0).toUpperCase() + circleTerrain.slice(1) : t("creator.chooseTerrain", "Select terrain...")}</span>
            <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
          </button>
          {circleTerrain && (() => {
            const circleSpells = getCircleSpells(circleTerrain, info.level);
            const spellsForLevel = circleSpells.filter((name) => {
              const spell = getStaticSpells(character.sources, undefined, language).find((s) => s.name?.toLowerCase() === name.toLowerCase());
              return spell && spell.level <= info.maxSpellLevel;
            });
            if (spellsForLevel.length === 0) return null;
            return (
              <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded-lg">
                 <p className="text-[10px] text-green-700 font-semibold mb-1">{t("creator.circleSpellsGained", "Circle Spells gained:")}</p>
                <div className="flex flex-wrap gap-1">
                  {spellsForLevel.map((name) => (
                    <span key={name} className="text-[10px] font-bold text-green-600 bg-green-200 px-1.5 py-0.5 rounded">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
