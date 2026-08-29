"use client";

import { useState, useCallback, useMemo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import { useSRD } from "@/contexts/SRDContext";
import type { Character } from "@/lib/storage";
import { getModifier, getMaxPreparedSpells, isPreparationCaster, getDomainSpellNames, getCircleSpells } from "@/lib/storage";
import { Lightning, Plus, Check, Circle, X } from "phosphor-react";
import { DamageBadge } from "./DamageBadge";
import { SpellSelectionModal } from "./SpellSelectionModal";

interface SpellsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

interface UnifiedSpell {
  id: string;
  name: string;
  level: number;
  source: "srd" | "custom";
  srdSpellName?: string;
  damageDice?: string;
  damageType?: string;
  description?: string;
}

export function SpellsSection({ character, onChange, editMode = true }: SpellsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { data } = useSRD();
  const srdSpells = data?.spells || [];
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const preparationCaster = isPreparationCaster(character);
  const maxPrepared = getMaxPreparedSpells(character);
  const domainSpells = getDomainSpellNames(character);
  const circleTerrain = character.circleTerrain || "";
  const circleSpellsList = circleTerrain ? getCircleSpells(circleTerrain, character.level) : [];
  const preparedCount = (character.preparedSpells || []).filter(id => {
    const spell = character.spells.find(s => s.id === id);
    return spell && spell.level > 0 && !circleSpellsList.some(cs => cs.toLowerCase() === spell.name?.toLowerCase());
  }).length;

  const unifiedSpells: UnifiedSpell[] = useMemo(() => {
    return (character.spells || []).map(s => {
      const srdSpell = s.srdSpellName ? srdSpells.find(sp => sp.name === s.srdSpellName) : undefined;
      const desc = s.description || srdSpell?.description;
      const description = typeof desc === "string" ? desc : (Array.isArray(desc) ? desc.join("\n") : "");
      const damageDice = s.damageDice || srdSpell?.damage?.damageDice || "";
      const damageType = s.damageType || srdSpell?.damage?.damageType || "";
      return {
        id: s.id,
        name: s.name,
        level: s.level,
        source: s.source,
        srdSpellName: s.srdSpellName,
        damageDice,
        damageType,
        description,
      };
    });
  }, [character.spells, srdSpells]);

  const spellsByLevel = useMemo(() => {
    const map = new Map<number, UnifiedSpell[]>();
    for (const spell of unifiedSpells) {
      const existing = map.get(spell.level) || [];
      existing.push(spell);
      map.set(spell.level, existing);
    }
    return map;
  }, [unifiedSpells]);

  const levels = useMemo(() => {
    return Array.from(spellsByLevel.keys()).sort((a, b) => a - b);
  }, [spellsByLevel]);

  const activeLevel = levels[activeTab] ?? 0;
  const activeSpells = spellsByLevel.get(activeLevel) || [];

  const isPrepared = useCallback((spellId: string) => {
    return (character.preparedSpells || []).includes(spellId);
  }, [character.preparedSpells]);

  const togglePrepared = useCallback((spellId: string) => {
    const current = character.preparedSpells || [];
    const isPrep = current.includes(spellId);
    if (isPrep) {
      onChange({ preparedSpells: current.filter(id => id !== spellId) });
    } else {
      onChange({ preparedSpells: [...current, spellId] });
    }
  }, [character.preparedSpells, onChange]);

  const removeSpell = useCallback((id: string) => {
    onChange({
      spells: (character.spells || []).filter(s => s.id !== id),
      preparedSpells: (character.preparedSpells || []).filter(pid => pid !== id),
    });
  }, [character.spells, character.preparedSpells, onChange]);

  const getLevelLabel = (level: number) => {
    if (level === 0) return "Cantrips";
    if (level === 1) return "1st";
    if (level === 2) return "2nd";
    if (level === 3) return "3rd";
    return `${level}th`;
  };

  return (
    <SectionCard id="spells" title="Spells" icon={<Lightning weight="regular" className="h-5 w-5" />}>
      {preparationCaster && (
        <div className="mb-4 surface bg-paper-muted px-4 py-3">
          <span className="text-sm font-bold text-ink">Prepared Spells: {preparedCount}/{maxPrepared}</span>
          <span className="text-xs text-ink ml-2">(Spellcasting ability mod + level)</span>
        </div>
      )}

      {levels.length > 0 && (
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {levels.map((level, idx) => (
            <button
              key={level}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1.5 text-xs font-bold rounded whitespace-nowrap transition-colors ${
                activeTab === idx
                  ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
                  : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
              }`}
            >
              {getLevelLabel(level)}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {activeSpells.map((spell) => {
          const spellPrepared = isPrepared(spell.id);
          return (
            <div key={spell.id} className={`list-row flex flex-col gap-1 ${spellPrepared ? "border-l-4 border-[var(--color-success-500)]" : ""}`}>
              <div className="flex items-center gap-2 flex-wrap">
                {preparationCaster && spell.level > 0 && (
                  <button
                    type="button"
                    onClick={() => togglePrepared(spell.id)}
                    className={`shrink-0 px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                      spellPrepared
                        ? "bg-[var(--color-success-500)] text-[var(--color-surface)]"
                        : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                    }`}
                    title={spellPrepared ? "Click to unprepare" : "Click to prepare"}
                  >
                    {spellPrepared ? "Prepared" : "Prepare"}
                  </button>
                )}
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{spell.name}</span>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => removeSpell(spell.id)}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-error-500)] shrink-0"
                    aria-label="Remove spell"
                  >
                    <X weight="regular" className="h-4 w-4" />
                  </button>
                )}
              </div>
              {(spell.damageDice || spell.damageType) && (
                <div className="flex items-center gap-2">
                  <DamageBadge type={spell.damageType} size="sm" />
                  {spell.damageDice && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: "#64748b", backgroundColor: "#64748b15" }}>
                      {spell.damageDice}
                    </span>
                  )}
                </div>
              )}
              {spell.description && (
                <DescriptionText>{spell.description}</DescriptionText>
              )}
            </div>
          );
        })}
      </div>

      {editMode && (
        <button
          type="button"
          onClick={() => setShowSpellModal(true)}
          className="mt-3 btn-secondary flex items-center gap-1.5"
        >
          <Plus weight="regular" size={16} />
          Add Spells
        </button>
      )}

      {showSpellModal && (
        <SpellSelectionModal
          character={character}
          onChange={onChange}
          onClose={() => setShowSpellModal(false)}
        />
      )}
    </SectionCard>
  );
}
