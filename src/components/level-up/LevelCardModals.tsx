"use client";

import { SpellSelectionModal } from "../modals/SpellSelectionModal";
import { REPEATABLE_FEATS } from "@/lib/feature-groups";
import { FeatSelectionModal } from "../modals/FeatSelectionModal";
import { SubclassDetailsModal } from "../modals/SubclassDetailsModal";
import { SubclassSelectionModal } from "../modals/SubclassSelectionModal";
import { FeatureSelectionModal } from "../modals/FeatureSelectionModal";
import { TerrainModal } from "../modals/TerrainModal";
import { BonusCantripModal } from "../modals/BonusCantripModal";
import { SpellMasteryModal } from "../modals/SpellMasteryModal";
import { SignatureSpellsModal } from "../modals/SignatureSpellsModal";
import { BasePopup } from "@/components/BasePopup";
import { OptionPicker } from "../modals/OptionPicker";
import { optionLine } from "@/lib/option-line";
import { optionIcon } from "@/components/option-icons";
import { ABILITIES } from "./level-infos";
import { useLevelCard } from "./level-card-state";

/** Pop-ups opened from a level card: subclass, spells, ability scores, feats and other pickers. */
export function LevelCardModals() {
  const { language, info, asiSelection, onAsiChange, baseScores, subclassSelection, onSubclassSelect, subclassFeatureChoices, onSubclassFeatureChoice, classFeatureChoices, onClassFeatureChoice, spells, onSpellsChange, magicalSecretsSpells, onMagicalSecretsChange, subclassSpellSelections, onSubclassSpellSelectionsChange, onReplacedSpellChange, circleTerrain, onCircleTerrainChange, bonusCantrip, onBonusCantripChange, character, wizardCharacter, allSpellSelections, onReplacedInvocationChange, expertise, onExpertiseChange, takenSpells, allAsiFeats, t, showSubclassDetails, setShowSubclassDetails, showSubclassModal, setShowSubclassModal, showSpellModal, setShowSpellModal, spellModalMode, showTerrainModal, setShowTerrainModal, showBonusCantripModal, setShowBonusCantripModal, showFeaturePopup, setShowFeaturePopup, setFeatureSelections, setShowHumanoidPopup, setHumanoidSelections, showSpellMasteryModal, setShowSpellMasteryModal, spellMasterySelections, setSpellMasterySelections, showSignatureSpellsModal, setShowSignatureSpellsModal, signatureSpellsSelections, setSignatureSpellsSelections, showAsiModal, setShowAsiModal, asiAllocation, showAsiFeatModal, setShowAsiFeatModal, showExpertiseModal, setShowExpertiseModal, lvl, totalAsiPoints, canApplyAsi, allocateAsiPoint, removeAsiPoint, applyAsi } = useLevelCard();
  return (
    <>

      {showSubclassDetails && (
        <SubclassDetailsModal
          subclass={showSubclassDetails}
          characterClass={character.class}
          onClose={() => setShowSubclassDetails(null)}
        />
      )}

      {showSubclassModal && info.subclassOptions && (
        <SubclassSelectionModal
          options={info.subclassOptions}
          selected={subclassSelection}
          characterClass={character.class}
          characterSources={character.sources}
          onSelect={(name) => { onSubclassSelect(name); setShowSubclassModal(false); }}
          onClose={() => setShowSubclassModal(false)}
        />
      )}

      {showSpellModal && info.hasSpellSelection && (
        <SpellSelectionModal
          key={`spell-modal-${lvl}`}
          character={{ ...character, subclassIndex: (subclassSelection || character.subclass || '').toLowerCase().replace(/\s+/g, '-') }}
          subclassSelection={subclassSelection}
          count={spellModalMode === "cantrips" ? 0 : info.spellSelectionCount}
          cantripCount={spellModalMode === "spells" ? 0 : info.cantripSelectionCount}
          maxLevel={info.maxSpellLevel}
          spells={spells}
          onSpellsChange={onSpellsChange}
          onClose={() => setShowSpellModal(false)}
          takenSpells={takenSpells}
          existingSpells={info.spellSelectionType === "book" ? [] : (character.spells?.filter((s) => s.level > 0) || [])}
          spellsKnownChanged={info.spellsKnownChanged}
          earlierSelections={Object.entries(allSpellSelections).filter(([l]) => Number(l) < info.level).flatMap(([, s]) => s)}
          magicalSecretsCount={info.magicalSecretsCount}
          magicalSecretsSpells={magicalSecretsSpells}
          onMagicalSecretsChange={onMagicalSecretsChange}
          subclassSpellSelectionCount={info.subclassSpellSelectionCount}
          subclassSpellSelections={subclassSpellSelections}
          onSubclassSpellSelectionsChange={onSubclassSpellSelectionsChange}
          mode={spellModalMode}
          selectionType={info.spellSelectionType}
          allKnownSpells={info.spellSelectionType === "prepare" ? (character.spells || []).filter(s => s.level > 0).map(s => `${s.name}:${s.level}`) : []}
          disabledSpells={Object.entries(allSpellSelections).filter(([l]) => Number(l) > info.level).flatMap(([, s]) => s)}
          castingLevel={info.level}
        />
      )}

      {showAsiModal && info.asi && (
        <BasePopup
           isOpen={true}
           onClose={() => setShowAsiModal(false)}
           title={t("creator.abilityScoreImprovement", "Ability Score Improvement") + ` (${t("character.level", "Level")} ${lvl})`}
           confirmLabel={t("feat.applyAsi", "Apply ASI")}
           cancelLabel={t("wizard.cancel", "Cancel")}
           onConfirm={applyAsi}
           confirmDisabled={!canApplyAsi}
           showFooter={true}
         >
          <div className="max-h-[65vh] overflow-y-auto px-4 py-4 space-y-4">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onAsiChange({ mode: "single" })}
                className={`w-full px-4 py-3 rounded-[var(--radius-sm)] border text-left transition-all ${
                  !asiSelection || asiSelection.mode !== "feat"
                    ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                }`}
               >
                 <div className="text-sm font-bold text-[var(--color-text-primary)]">{t("creator.improveAbilityScores", "Improve Ability Scores")}</div>
                 <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{t("creator.asiHint", "+2 to one ability or +1 to two abilities")}</div>
               </button>
              <button
                type="button"
                onClick={() => onAsiChange({ mode: "feat" })}
                className={`w-full px-4 py-3 rounded-[var(--radius-sm)] border text-left transition-all ${
                  asiSelection?.mode === "feat"
                    ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                }`}
               >
                 <div className="text-sm font-bold text-[var(--color-text-primary)]">{t("creator.takeFeat", "Take a Feat")}</div>
                 <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{t("creator.featGain", "Gain a feat instead of ability score improvements")}</div>
               </button>
            </div>

      {asiSelection?.mode !== "feat" && (
        <>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t("creator.asiDistribute", "Distribute 2 points: +2 to one ability, or +1 to two abilities. Maximum ability score is 20.")}
          </p>
          <div className="space-y-2">
            {ABILITIES.map(({ key, label, full }) => {
              const currentScore = baseScores[key];
              const allocated = asiAllocation[key] || 0;
              const isAtCap = currentScore >= 20;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)]"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[var(--color-text-primary)] w-12">{label}</span>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">{full}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[var(--color-text-primary)] w-8 text-center">{currentScore}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => removeAsiPoint(key)}
                        disabled={allocated <= 0 || isAtCap}
                        className="flex h-8 w-8 items-center justify-center p-0 rounded-full border border-[var(--color-border)] disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-[var(--color-text-primary)] w-7 text-center">
                        {allocated > 0 ? `+${allocated}` : "0"}
                      </span>
                      <button
                        type="button"
                        onClick={() => allocateAsiPoint(key)}
                        disabled={allocated >= 2 || totalAsiPoints >= 2 || isAtCap}
                        className="flex h-8 w-8 items-center justify-center p-0 rounded-full border border-[var(--color-border)] disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {asiSelection?.mode === "feat" && (
        <div className="space-y-3">
          {asiSelection.feat && (
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">{asiSelection.feat}</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowAsiFeatModal(true)}
            className="btn btn-secondary w-full text-sm"
          >
            {asiSelection.feat ? t("feat.changeFeat", "Change Feat") : t("feat.chooseFeat", "Choose Feat")}
          </button>
        </div>
      )}
    </div>
  </BasePopup>
)}

      {showAsiFeatModal && (
        <FeatSelectionModal
          selectedFeat={asiSelection?.feat}
          sources={character.sources}
          disabledFeats={[
            ...(character.features || []).filter((f: any) => f.name && f.source !== "custom").map((f: any) => f.name),
            ...Object.values(character.featureSelections || {}).flat(),
            // Feats picked at other levels of this level-up.
            ...allAsiFeats.filter((x) => x.level !== info.level).map((x) => x.feat),
          ].filter((name) => !REPEATABLE_FEATS.has(String(name)))}
          character={wizardCharacter}
          takenSpells={(() => {
            // This feat's own earlier picks stay pickable when it is changed.
            const own = new Set(Object.values(asiSelection?.featOptions || {}).map((v) => v.toLowerCase()));
            return new Set([...takenSpells].filter((n) => !own.has(n)));
          })()}
          onSelect={(feat, featOptions) => {
            onAsiChange({ feat: feat.name, featOptions });
            setShowAsiFeatModal(false);
          }}
          onClose={() => setShowAsiFeatModal(false)}
        />
      )}

      {showSpellMasteryModal && (
        <SpellMasteryModal
          isOpen={showSpellMasteryModal}
          onClose={() => { setShowSpellMasteryModal(false); setSpellMasterySelections([]); }}
          selections={spellMasterySelections}
          onSelectionsChange={setSpellMasterySelections}
          onConfirm={(value) => { onClassFeatureChoice("Spell Mastery", value); }}
          characterSources={character.sources}
        />
      )}

      {showSignatureSpellsModal && (
        <SignatureSpellsModal
          isOpen={showSignatureSpellsModal}
          onClose={() => { setShowSignatureSpellsModal(false); setSignatureSpellsSelections([]); }}
          selections={signatureSpellsSelections}
          onSelectionsChange={setSignatureSpellsSelections}
          onConfirm={(value) => { onClassFeatureChoice("Signature Spells", value); }}
          characterSources={character.sources}
        />
      )}

      {showFeaturePopup && (
        <FeatureSelectionModal
          isOpen={!!showFeaturePopup}
          onClose={() => { setShowFeaturePopup(null); setFeatureSelections([]); }}
          name={showFeaturePopup.name}
          description={showFeaturePopup.description}
          options={showFeaturePopup.options}
          count={showFeaturePopup.count}
          isSubclass={showFeaturePopup.isSubclass}
          onSelect={(value) => {
            if (showFeaturePopup.name === "__replace_invocation__") {
              onReplacedInvocationChange(value);
            } else if (showFeaturePopup.name === "__replace_spell__") {
              onReplacedSpellChange(value);
            } else if (showFeaturePopup.isSubclass) {
              onSubclassFeatureChoice(showFeaturePopup.name, value);
            } else {
              onClassFeatureChoice(showFeaturePopup.name, value);
            }
          }}
          onSpecialOption={(optName) => {
            if (optName === "Humanoid (2 races)") {
              setShowHumanoidPopup({ featureName: showFeaturePopup.name, level: lvl });
              setHumanoidSelections([]);
            }
          }}
          characterSources={character.sources}
          takenSpells={showFeaturePopup.name === "__replace_spell__" ? undefined : takenSpells}
          selectedValues={(() => {
            const current = showFeaturePopup.isSubclass
              ? subclassFeatureChoices[showFeaturePopup.name]
              : classFeatureChoices[showFeaturePopup.name];
            if (!current) return [];
            if (showFeaturePopup.count && showFeaturePopup.count > 1) {
              return current.split(", ").filter(Boolean);
            }
            return [current];
          })()}
        />
      )}

      {showTerrainModal && (
        <TerrainModal
          isOpen={showTerrainModal}
          onClose={() => setShowTerrainModal(false)}
          character={{ ...character, subclassIndex: (subclassSelection || character.subclass || '').toLowerCase().replace(/\s+/g, '-') }}
          level={info.level}
          maxSpellLevel={info.maxSpellLevel}
          selectedTerrain={circleTerrain}
          onTerrainChange={onCircleTerrainChange}
        />
      )}

      {showBonusCantripModal && (
        <BonusCantripModal
          isOpen={showBonusCantripModal}
          onClose={() => setShowBonusCantripModal(false)}
          selectedCantrip={bonusCantrip}
          onCantripChange={onBonusCantripChange}
          takenSpells={takenSpells}
        />
      )}

      {showExpertiseModal && info.expertise && (
        <OptionPicker
          isOpen={showExpertiseModal}
          onClose={() => setShowExpertiseModal(false)}
          title={t("creator.selectExpertise", "Select Expertise")}
          hint={t("creator.expertiseHintCount", "Pick {count}. Your proficiency bonus counts twice on these.", { count: info.expertise.count })}
          options={(info.expertise.availableOptions || []).map((skill) => ({ name: skill, line: optionLine("Expertise", { name: skill }, language), Icon: optionIcon("Expertise", skill) }))}
          count={info.expertise.count}
          selected={expertise}
          onPick={onExpertiseChange}
        />
      )}
    </>
  );
}
