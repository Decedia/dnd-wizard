"use client";

import { useMemo } from "react";
import { Check, Info, Star } from "@phosphor-icons/react";
import { getBackgroundData } from "@/data/backgrounds";
import { useLanguage } from "@/contexts/LanguageContext";
import { isRecommended } from "@/lib/recommendations";
import { getStaticClass } from "@/lib/srd-client";
import { getProficiencyBonus, type Character } from "@/lib/storage";

interface StepSkillsProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

const SKILL_GROUPS: { ability: string; skills: string[] }[] = [
  { ability: "str", skills: ["Athletics"] },
  { ability: "dex", skills: ["Acrobatics", "Sleight of Hand", "Stealth"] },
  {
    ability: "int",
    skills: ["Arcana", "History", "Investigation", "Nature", "Religion"],
  },
  {
    ability: "wis",
    skills: ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"],
  },
  { ability: "cha", skills: ["Deception", "Intimidation", "Performance", "Persuasion"] },
];

const GUIDE_ROW = "mb-3 flex items-center justify-between rounded-xl border-2 p-4";

export function StepSkills({ data, onChange }: StepSkillsProps) {
  const { t } = useLanguage();

  const classData = data.class ? getStaticClass(data.class, data.ruleset) : null;
  const profBonus = getProficiencyBonus(data.level);
  const skillChoices = classData?.skillChoices || null;
  const backgroundSkills = useMemo(
    () => getBackgroundData(data.background)?.skillProficiencies || [],
    [data.background],
  );

  const allSkills = useMemo(
    () =>
      SKILL_GROUPS.flatMap(({ ability, skills }) =>
        skills.map((name) => ({ name, ability })),
      ),
    [],
  );

  const selectedCount = useMemo(() => {
    if (!skillChoices) return 0;
    return Object.entries(data.skills || {}).filter(
      ([name, proficient]) =>
        proficient &&
        skillChoices.options.includes(name) &&
        !backgroundSkills.includes(name),
    ).length;
  }, [data.skills, skillChoices, backgroundSkills]);

  const totalProficient = useMemo(
    () => Object.values(data.skills || {}).filter(Boolean).length,
    [data.skills],
  );

  const allowedCount = skillChoices?.count ?? 0;

  const toggleSkill = (skillName: string) => {
    if (backgroundSkills.includes(skillName)) return;
    if (skillChoices && !skillChoices.options.includes(skillName)) return;

    const isSelected = !!data.skills[skillName];
    if (!isSelected && skillChoices && selectedCount >= skillChoices.count) return;

    onChange({ skills: { ...data.skills, [skillName]: !isSelected } });
  };

  const getModifier = (ability: string): number => {
    const score = (data[ability as keyof Character] as number) || 10;
    return Math.floor((score - 10) / 2);
  };

  const formatModifier = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

  const getRowClassName = (
    isProficient: boolean,
    isBackgroundSkill: boolean,
    isDisabled: boolean,
  ): string => {
    if (isBackgroundSkill) {
      return `${GUIDE_ROW} border-success-300 bg-success-50 cursor-default`;
    }
    if (isDisabled) {
      return `${GUIDE_ROW} border-border-strong bg-surface opacity-50 cursor-not-allowed`;
    }
    if (isProficient) {
      return `${GUIDE_ROW} border-ink bg-ink/5 shadow-sm active:scale-[0.98]`;
    }
    return `${GUIDE_ROW} border-border-strong bg-surface active:scale-[0.98]`;
  };

  return (
    <section className="w-full pb-32">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-ink">
          {t("creator.skills", "Skills")}
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          {t(
            "creator.skillsHint",
            "Skill mencerminkan keahlian karaktermu. Pilih keahlian yang sesuai dengan kelasmu.",
          )}
        </p>
      </header>

      <div className="mb-6 rounded-2xl border border-ink/20 bg-ink/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Info size={18} weight="bold" className="text-ink" />
          <h3 className="text-sm font-bold text-ink">
            {t("skills.guideTitle", "Panduan Skill")}
          </h3>
        </div>
        <p className="text-xs leading-relaxed text-ink/80">
          {t(
            "skills.guideText",
            "Skill mencerminkan keahlian karaktermu. Ikon Bintang (⭐) menunjukkan skill yang direkomendasikan untuk kelasmu. Pilih skill sesuai dengan jatah kelas atau latar belakangmu.",
          )}
        </p>
      </div>

      <div className="sticky top-14 z-20 mb-6 flex items-center justify-between rounded-2xl border-2 border-ink bg-surface p-4 shadow-sm">
        <span className="text-sm font-bold uppercase tracking-widest text-ink">
          {skillChoices
            ? t("skills.trackerLabel", "Pilih Skill")
            : t("skills.trackerLabelOpen", "Skill Dipilih")}
        </span>
        <span className="text-xl font-black text-ink">
          {skillChoices ? selectedCount : totalProficient}
          {skillChoices && (
            <span className="ml-1 text-sm font-bold text-ink-muted">/ {allowedCount}</span>
          )}
        </span>
      </div>

      <div>
        {allSkills.map(({ name, ability }) => {
          const isProficient = !!data.skills[name];
          const isBackgroundSkill = backgroundSkills.includes(name);
          const isAllowed = !skillChoices || skillChoices.options.includes(name);
          const atMax = !!skillChoices && selectedCount >= skillChoices.count;
          const isDisabled =
            isBackgroundSkill || !isAllowed || (!isProficient && atMax);
          const isRecommendedSkill = isRecommended("skill", name, data.class);
          const modifier = getModifier(ability);
          const totalBonus =
            modifier + (isProficient || isBackgroundSkill ? profBonus : 0);

          return (
            <label
              key={name}
              className={getRowClassName(isProficient, isBackgroundSkill, isDisabled)}
            >
              <div className="flex items-center gap-3">
                <div className="flex w-5 shrink-0 justify-center">
                  {isRecommendedSkill && (
                    <Star size={16} weight="fill" className="text-warning-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-bold leading-none text-ink">{name}</h4>
                  <span className="mt-1.5 inline-block rounded-md bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    {ability.toUpperCase()} {formatModifier(modifier)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`text-xl font-black ${
                    isProficient || isBackgroundSkill ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {formatModifier(totalBonus)}
                </span>

                {isBackgroundSkill && (
                  <span className="rounded-md bg-success-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success-700">
                    {t("skills.backgroundBadge", "LB")}
                  </span>
                )}

                {!isAllowed && !isBackgroundSkill && (
                  <span className="rounded-md bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                    {t("skills.na", "T/A")}
                  </span>
                )}

                {isAllowed && !isBackgroundSkill && (
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      isProficient
                        ? "border-ink bg-ink text-surface"
                        : "border-ink-subtle bg-transparent"
                    }`}
                  >
                    {isProficient && <Check size={14} weight="bold" />}
                  </div>
                )}
              </div>

              <input
                type="checkbox"
                className="sr-only"
                checked={isProficient}
                disabled={isDisabled}
                onChange={() => toggleSkill(name)}
                aria-label={t("skills.toggleSkill", { skill: name }, "Pilih {skill}")}
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}
