"use client";

import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BOTTOM_NAV_SPACE } from "@/components/BottomNav";
import { getCharacter, saveCharacter, deleteCharacter, computeDerivedStats, touchCharacterOpened, applyConChangeToHp, type Character } from "@/lib/storage";
import { importCharacterFromJson } from "@/lib/character-io";
import { advanceTurn, parseDurationToTurns } from "@/lib/spellEffects";
import { useSRD } from "@/contexts/SRDContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CharacterSheetProvider, type OverrideRequest } from "@/components/character-sheet/CharacterSheetContext";
import { ChoicesSection } from "@/components/character-sheet/ChoicesSection";
import { OverrideSheet } from "@/components/character-sheet/OverrideSheet";
import { SheetTabs, type TabId } from "@/components/character-sheet/SheetTabs";
import { SheetHeader } from "@/components/character-sheet/SheetHeader";
import { HpChangeSheet } from "@/components/character-sheet/HpChangeSheet";
import { LevelXpSection } from "@/components/character-sheet/LevelXpSection";
import { IdentitySection } from "@/components/character-sheet/IdentitySection";
import { StatsSection } from "@/components/character-sheet/StatsSection";
import { TurnPanel } from "@/components/character-sheet/TurnPanel";
import { RestSheet } from "@/components/character-sheet/RestSheet";
import { startTurnPatch, endTurnPatch } from "@/lib/turn";
import { CombatStatsSection } from "@/components/character-sheet/CombatStatsSection";
import { DeathSavesSection } from "@/components/character-sheet/DeathSavesSection";
import { HitDiceSection } from "@/components/character-sheet/HitDiceSection";
import { SkillsSection } from "@/components/character-sheet/SkillsSection";
import { FeaturesTraitsSection } from "@/components/character-sheet/FeaturesTraitsSection";
import { AttacksAndSpellcastingSection } from "@/components/character-sheet/AttacksAndSpellcastingSection";
import { InventorySection } from "@/components/character-sheet/InventorySection";
import { OtherProficienciesSection } from "@/components/character-sheet/OtherProficienciesSection";
import { SpellsSection } from "@/components/character-sheet/SpellsSection";
import { SpellcastingStatsSection } from "@/components/character-sheet/SpellcastingStatsSection";
import { AppearanceBioSection } from "@/components/character-sheet/AppearanceBioSection";
import { PassiveStatsSection } from "@/components/character-sheet/PassiveStatsSection";
import { PencilSimpleIcon as PencilSimple, DotsThreeIcon as DotsThree, TrashIcon as Trash, ExportIcon as Export, UploadIcon as Upload, CheckCircleIcon as CheckCircle, UserPlusIcon as UserPlus, ClockIcon as Clock, FileJsonIcon as FileJson } from "@/components/icons";
import { syncGrantedSpells } from "@/lib/granted-spells";
import { undoLevelUp, undoableChange } from "@/lib/level-snapshot";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { DiceProvider } from "@/contexts/DiceContext";
import { GiCampfire, GiNightSleep } from "react-icons/gi";

const GRANT_SOURCES = ["race", "class", "subclass", "level", "raceChoices", "circleTerrain", "optionalClassFeatures", "sources", "featureSelections"] as const;

export function CharacterView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") ?? "";
  const { data: srdData, setRuleset: setSrdRuleset } = useSRD();
  const { t, language } = useLanguage();

  const [character, setCharacter] = useState<Character | null>(null);

  // The shared SRD data (spell cards, level-up pickers) follows the open character's rule set.
  const characterRuleset = character?.ruleset === "2024" ? "2024" : "2014";
  useEffect(() => { setSrdRuleset(characterRuleset); }, [characterRuleset, setSrdRuleset]);
  const [turnOpen, setTurnOpen] = useState(false);
  const [restKind, setRestKind] = useState<"short" | "long" | null>(null);
  const [restPick, setRestPick] = useState(false);
  const [hpMode, setHpMode] = useState<"heal" | "damage" | null>(null);
  const [undoOpen, setUndoOpen] = useState(false);
  const [overrideReq, setOverrideReq] = useState<OverrideRequest | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window !== "undefined" && id) {
        const loaded = await getCharacter(id) ?? null;
        if (!cancelled && loaded) {
          const derived = computeDerivedStats(loaded);
          setCharacter({ ...loaded, ...derived });
          touchCharacterOpened(id);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("combat");
  const [menuOpen, setMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportInputRef = useRef<HTMLInputElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(() => {
    clearTimeout(timeoutRef.current ?? undefined);
    timeoutRef.current = setTimeout(() => {
      if (character) {
        saveCharacter(character);
      }
    }, 400);
  }, [character]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current ?? undefined);
  }, []);

  // Every change is saved shortly after it happens. Taps (a rest, a spent
  // slot, the turn panel) never blur a field, so saving on blur alone lost them.
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!character) return;
    // The first value is the one just read from storage.
    if (!loadedRef.current) {
      loadedRef.current = true;
      return;
    }
    const timer = setTimeout(() => { if (loadedRef.current) saveCharacter(character); }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [character]);
  // Leaving the page inside that short wait must not drop the last change.
  const latestRef = useRef(character);
  useEffect(() => {
    latestRef.current = character;
  }, [character]);
  useEffect(() => {
    return () => {
      if (loadedRef.current && latestRef.current) saveCharacter(latestRef.current);
    };
  }, []);

  useEffect(() => {
    if (importSuccess) {
      timeoutRef.current = setTimeout(() => setImportSuccess(null), 4000);
      return () => clearTimeout(timeoutRef.current ?? undefined);
    }
  }, [importSuccess]);

  const handleSave = useCallback(async () => {
    if (character) {
      await saveCharacter(character);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    }
  }, [character]);

  const handleDelete = useCallback(async () => {
    if (character && window.confirm(t("delete.confirm", { "char.name": character.name || t("home.unnamedHero") } as any))) {
      // Stop the autosave from writing the deleted character back.
      loadedRef.current = false;
      latestRef.current = null;
      await deleteCharacter(character.id);
      router.push("/");
    }
  }, [character, router, t]);

  const handleExport = async () => {
    if (!character || exportingPdf) return;
    setExportingPdf(true);
    try {
      const { exportCharacterToPdf } = await import("@/lib/pdf-visual");
      await exportCharacterToPdf(character, language);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportJson = useCallback(() => {
    if (!character) return;
    const { exportCharacterToJson } = require("@/lib/character-io");
    exportCharacterToJson(character);
  }, [character]);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    try {
      const { importCharacterFromPdf } = await import("@/lib/pdf");
      const imported = await importCharacterFromPdf(file);
      await saveCharacter(imported);
      setImportSuccess(t("import.success", { name: imported.name || "Unnamed" } as any));
      router.push(`/character?id=${imported.id}`);
    } catch (err) {
      setImportError(t("import.pdfError"));
    } finally {
      e.target.value = "";
    }
  };

  const handleImportJsonClick = () => {
    jsonImportInputRef.current?.click();
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    try {
      const imported = await importCharacterFromJson(file);
      await saveCharacter(imported);
      setImportSuccess(t("import.success", { name: imported.name || "Unnamed" } as any));
      router.push(`/character?id=${imported.id}`);
    } catch (err) {
      setImportError(t("import.jsonError"));
    } finally {
      e.target.value = "";
    }
  };

  const handleChange = useCallback((patch: Partial<Character>) => {
    setCharacter((prev) => {
      if (!prev) return prev;
      let next = { ...prev, ...patch };
      next = { ...next, ...applyConChangeToHp(prev, next, patch) };
      // A new race, class, subclass or level changes which spells come free.
      if (GRANT_SOURCES.some((k) => k in patch)) next = syncGrantedSpells(next);
      try {
        const derived = computeDerivedStats(next);
        return { ...next, ...derived };
      } catch {
        return next;
      }
    });
  }, []);

  const undoSnap = character ? undoableChange(character) : null;

  const openTurn = () => {
    if (character && !character.turnActive) handleChange(startTurnPatch(character));
    setTurnOpen(true);
  };
  const endTurn = () => {
    if (character) handleChange(endTurnPatch(character, srdData?.spells || []));
  };

  if (!character) {
    return (
      <div className="min-h-screen bg-paper">
        <AppHeader title={t("character.sheet")} subtitle={t("character.sheet")} />
         <main className="px-4 py-6 pb-6">
          <div className="flex flex-col items-center justify-center card border-dashed border-border-muted bg-paper py-16 text-center">
             <UserPlus size={48} color="var(--color-text-muted)" className="mb-3 opacity-40" />
            <h2 className="text-page-title mb-2">
              {t("character.notFound", "Character Not Found")}
            </h2>
            <p className="text-description max-w-xs mb-5">
              {t("character.notFoundDesc", "This character could not be found. It may have been deleted.")}
            </p>
            <Link
              href="/"
              className="btn btn-primary"
            >
              {t("character.returnHome")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Non-casters (a Champion fighter, a barbarian) get no Spells tab unless a race or feat gave them spells.
  const canCast = !!character.spellcastingAbility || (character.spells?.length ?? 0) > 0 || (character.cantrips?.length ?? 0) > 0;
  const shownTab: TabId = activeTab === "spells" && !canCast ? "combat" : activeTab;

  return (
    <DiceProvider>
    <div className="min-h-screen bg-paper">
            <CharacterSheetProvider onFieldBlur={debouncedSave} editOverride={setOverrideReq} overridden={character.overrides}>
      <SheetHeader
        character={character}
        editMode={editMode}
        onHp={setHpMode}
        onRest={() => setRestPick(true)}
        actions={
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (editMode) handleSave();
                setEditMode(!editMode);
              }}
              aria-label={t("character.editMode", "Edit")}
              aria-pressed={editMode}
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${editMode ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-on-gold)]" : "border-[var(--color-control-border)] text-[var(--color-text-primary)]"}`}
            >
              <PencilSimple className="h-4 w-4" />
            </button>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={t("character.moreActions", "More actions")}
                aria-expanded={menuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-control-border)] text-[var(--color-text-primary)]"
              >
                <DotsThree className="h-5 w-5" />
              </button>
              {menuOpen && (
                <>
                  <button type="button" aria-label={t("common.close", "Close")} className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
                    {[
                      { key: "pdf", label: exportingPdf ? t("admin.generating") : t("character.exportPdf", "Export PDF"), Icon: Export, onClick: handleExport },
                      { key: "json", label: t("character.exportJson", "Export JSON"), Icon: FileJson, onClick: handleExportJson },
                      { key: "ipdf", label: t("home.importPdf"), Icon: Upload, onClick: handleImportClick },
                      { key: "ijson", label: t("home.importJson"), Icon: FileJson, onClick: handleImportJsonClick },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          item.onClick();
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
                      >
                        <item.Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleDelete();
                      }}
                      className="flex w-full items-center gap-2.5 border-t-2 border-[var(--color-border)] px-4 py-3 text-left text-sm font-semibold text-[var(--color-error-600)] hover:bg-[var(--color-bg)]"
                    >
                      <Trash className="h-4 w-4" />
                      {t("character.delete", "Delete Character")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

         <main className="mx-auto max-w-lg px-4 py-3 pb-6">
          {shownTab === "combat" && (
            <>
              <CombatStatsSection character={character} onChange={handleChange} editMode={editMode} onOpenTurn={openTurn} />
              {/* Death saves matter only at 0 HP (or while a count is still marked). */}
              {((character.currentHp || 0) <= 0 || (character.deathSaveSuccesses || 0) > 0 || (character.deathSaveFailures || 0) > 0) && (
                <DeathSavesSection character={character} onChange={handleChange} editMode={editMode} />
              )}
              <AttacksAndSpellcastingSection character={character} onChange={handleChange} editMode={editMode} />
              <StatsSection character={character} onChange={handleChange} editMode={editMode} />
              <PassiveStatsSection character={character} editMode={editMode} />
              <HitDiceSection character={character} onChange={handleChange} editMode={editMode} />
            </>
          )}
          {shownTab === "features" && (
            <>
              <SkillsSection character={character} onChange={handleChange} editMode={editMode} />
              <FeaturesTraitsSection character={character} onChange={handleChange} editMode={editMode} />
              <OtherProficienciesSection otherProficiencies={character.otherProficiencies} toolProficiencies={character.toolProficiencies || []} onChange={(value) => handleChange({ otherProficiencies: value })} onToolsChange={(value) => handleChange({ toolProficiencies: value })} editMode={editMode} />
            </>
          )}
          {shownTab === "gear" && (
            <>
              <InventorySection character={character} onChange={handleChange} editMode={editMode} />
            </>
          )}
          {shownTab === "spells" && (
            <>
              <SpellcastingStatsSection character={character} onChange={handleChange} editMode={editMode} />
              <SpellsSection
                character={character}
                onChange={handleChange}
                editMode={editMode}
              />
            </>
          )}
          {shownTab === "bio" && (
            <>
              {character.level < 20 && (
                <div className="mb-4">
                  <button
                    onClick={() => router.push(`/character/level-up?id=${character.id}`)}
                    className="btn btn-secondary w-full"
                  >
                    {t("character.levelUp", "Level Up")}
                  </button>
                </div>
              )}
              {undoSnap && (
                <div className="mb-4">
                  <button type="button" onClick={() => setUndoOpen(true)} className="btn btn-secondary w-full">
                    {undoSnap.kind === "choice"
                      ? t("levelUndo.button.choice", "Undo the last change of picks")
                      : undoSnap.kind === "class" || undoSnap.kind === "subclass"
                      ? t(`levelUndo.button.${undoSnap.kind}`, { name: undoSnap.kind === "class" ? undoSnap.character.class : undoSnap.character.subclass || "" }, "Undo change (back to {name})")
                      : t("levelUndo.button", { level: undoSnap.level }, "Undo level-up (back to level {level})")}
                  </button>
                </div>
              )}
              <IdentitySection character={character} onChange={handleChange} editMode={editMode} />
              <LevelXpSection character={character} onChange={handleChange} editMode={editMode} />
              {editMode && <ChoicesSection character={character} />}
              <AppearanceBioSection character={character} onChange={handleChange} editMode={editMode} />
            </>
          )}

          <div className="mt-5 space-y-2.5">
            {savedAt && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--color-nav-icon)] bg-[var(--color-nav-bg)] py-2 surface">
                <CheckCircle className="h-4 w-4" />
                {t("character.saved", "Saved")}
              </div>
            )}
            <input
              ref={importInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleImportFile}
              className="hidden"
            />
            <input
              ref={jsonImportInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
          </div>
        </main>
      </CharacterSheetProvider>

      <SheetTabs activeTab={shownTab} onTabChange={setActiveTab} hidden={canCast ? [] : ["spells"]} />

      {hpMode && <HpChangeSheet character={character} mode={hpMode} onChange={handleChange} onClose={() => setHpMode(null)} />}

      {restPick && (
        <BottomSheet isOpen onClose={() => setRestPick(false)} title={t("sheet.restPick", "Which rest?")}>
          <div className="grid grid-cols-2 gap-2 px-4 py-4">
            {(["short", "long"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  setRestPick(false);
                  setRestKind(kind);
                }}
                className="btn btn-secondary flex-col gap-1 py-3"
              >
                {kind === "short" ? <GiCampfire className="h-6 w-6" aria-hidden="true" /> : <GiNightSleep className="h-6 w-6" aria-hidden="true" />}
                <span className="text-sm font-semibold">{t(`rest.${kind}.title`)}</span>
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      {undoOpen && undoSnap && (
        <BottomSheet
          isOpen
          onClose={() => setUndoOpen(false)}
          title={undoSnap.kind === "class" || undoSnap.kind === "subclass" || undoSnap.kind === "choice" ? t("levelUndo.titleChange", "Undo the change") : t("levelUndo.title", "Undo level-up")}
          footer={
            <div className="flex items-center gap-2 px-4 py-3">
              <button type="button" onClick={() => setUndoOpen(false)} className="btn btn-secondary flex-1">{t("common.cancel", "Cancel")}</button>
              <button
                type="button"
                onClick={() => {
                  const restored = undoLevelUp(character);
                  if (restored) handleChange(restored);
                  setUndoOpen(false);
                }}
                className="btn btn-primary flex-1"
              >
                {t("levelUndo.confirm", "Undo it")}
              </button>
            </div>
          }
        >
          <div className="space-y-2 px-4 py-4 text-sm text-[var(--color-text-secondary)]">
            <p>
              {undoSnap.kind === "choice"
                ? t("levelUndo.bodyChoice", { name: character.name }, "{name}'s picks go back to how they were before the last change.")
                : undoSnap.kind === "class" || undoSnap.kind === "subclass"
                ? t("levelUndo.bodyChange", { name: character.name, was: undoSnap.kind === "class" ? undoSnap.character.class : undoSnap.character.subclass || "" }, "{name} goes back to being a {was}, with the picks, HP and spells from before.")
                : t("levelUndo.body", { name: character.name, level: undoSnap.level }, "{name} goes back to level {level}, with the picks, HP and spells from before the level-up.")}
            </p>
            <p>{t("levelUndo.kept", "Gear, coins, notes and backstory stay as they are now.")}</p>
          </div>
        </BottomSheet>
      )}

      {overrideReq && (
        <OverrideSheet key={overrideReq.key} character={character} request={overrideReq} onChange={handleChange} onClose={() => setOverrideReq(null)} />
      )}

      {restKind && (
        <RestSheet character={character} kind={restKind} onChange={handleChange} onClose={() => setRestKind(null)} />
      )}

      {turnOpen && (
        <TurnPanel
          character={character}
          srdSpells={srdData?.spells || []}
          onChange={handleChange}
          onEndTurn={() => { endTurn(); setTurnOpen(false); }}
          onClose={() => setTurnOpen(false)}
        />
      )}

      {!turnOpen && ((character.spellsUsedThisTurn?.length ?? 0) > 0 || (character.featuresUsedThisTurn?.length ?? 0) > 0 || (character.activeBuffs?.length ?? 0) > 0 || character.turnActive) && (
         <div className="fixed left-1/2 -translate-x-1/2 z-30" style={{ bottom: `calc(${BOTTOM_NAV_SPACE} + 12px)` }}>
          <button
            type="button"
            onClick={endTurn}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-ink)] text-[var(--color-surface)] shadow-lg hover:opacity-90 transition-all"
          >
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold">{t("character.endTurn", "End Turn")}</span>
          </button>
        </div>
      )}
    </div>
    </DiceProvider>
  );
}

export default function CharacterPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <span className="text-ink-muted font-semibold text-sm">{t("common.loading")}</span>
      </div>
    }>
      <CharacterView />
    </Suspense>
  );
}
