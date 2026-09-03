"use client";

import { LightningIcon as Lightning, DropIcon as Drop, ShieldIcon as Shield, FlameIcon as Flame, EyeIcon as Eye, ClockIcon as Clock, SparklesIcon as Sparkle, SkullIcon as Skull } from "@/components/icons";

export interface StateDefinition {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  colorVar: string;
  bgColorVar: string;
  borderColorVar: string;
}

export const COMMON_STATES: StateDefinition[] = [
  { id: "concentration", name: "Concentration", icon: Lightning, colorVar: "--color-state-concentration", bgColorVar: "--color-state-concentration-bg", borderColorVar: "--color-state-concentration-border" },
  { id: "rage", name: "Rage", icon: Flame, colorVar: "--color-state-rage", bgColorVar: "--color-state-rage-bg", borderColorVar: "--color-state-rage-border" },
  { id: "wildshape", name: "Wild Shape", icon: Sparkle, colorVar: "--color-state-wildshape", bgColorVar: "--color-state-wildshape-bg", borderColorVar: "--color-state-wildshape-border" },
  { id: "channel-divinity", name: "Channel Divinity", icon: Lightning, colorVar: "--color-state-channel-divinity", bgColorVar: "--color-state-channel-divinity-bg", borderColorVar: "--color-state-channel-divinity-border" },
  { id: "action-surge", name: "Action Surge", icon: Clock, colorVar: "--color-state-action-surge", bgColorVar: "--color-state-action-surge-bg", borderColorVar: "--color-state-action-surge-border" },
  { id: "second-wind", name: "Second Wind", icon: Drop, colorVar: "--color-state-second-wind", bgColorVar: "--color-state-second-wind-bg", borderColorVar: "--color-state-second-wind-border" },
  { id: "ki", name: "Ki Points", icon: Sparkle, colorVar: "--color-state-ki", bgColorVar: "--color-state-ki-bg", borderColorVar: "--color-state-ki-border" },
  { id: "sneak-attack", name: "Sneak Attack", icon: Eye, colorVar: "--color-state-sneak-attack", bgColorVar: "--color-state-sneak-attack-bg", borderColorVar: "--color-state-sneak-attack-border" },
  { id: "hexblade-curse", name: "Hexblade Curse", icon: Skull, colorVar: "--color-state-hexblade-curse", bgColorVar: "--color-state-hexblade-curse-bg", borderColorVar: "--color-state-hexblade-curse-border" },
  { id: "divine-smite", name: "Divine Smite", icon: Lightning, colorVar: "--color-state-divine-smite", bgColorVar: "--color-state-divine-smite-bg", borderColorVar: "--color-state-divine-smite-border" },
  { id: "bardic-inspiration", name: "Bardic Insp.", icon: Sparkle, colorVar: "--color-state-bardic-inspiration", bgColorVar: "--color-state-bardic-inspiration-bg", borderColorVar: "--color-state-bardic-inspiration-border" },
  { id: "lay-on-hands", name: "Lay on Hands", icon: Drop, colorVar: "--color-state-lay-on-hands", bgColorVar: "--color-state-lay-on-hands-bg", borderColorVar: "--color-state-lay-on-hands-border" },
];

interface StateTrackerProps {
  activeStates: string[];
  onToggle: (stateId: string) => void;
  onReset?: () => void;
  editMode?: boolean;
}

export function StateTracker({ activeStates, onToggle, onReset, editMode = true }: StateTrackerProps) {
  if (!editMode && activeStates.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {COMMON_STATES.map((state) => {
        const isActive = activeStates.includes(state.id);
        if (!editMode && !isActive) return null;
        const IconComponent = state.icon;
        return (
          <button
            key={state.id}
            type="button"
            onClick={() => onToggle(state.id)}
            className={`inline-flex items-center gap-1 rounded border font-semibold transition-all ${
              isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
            }`}
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              backgroundColor: isActive ? `var(${state.bgColorVar})` : "transparent",
              color: isActive ? `var(${state.colorVar})` : "var(--color-text-muted)",
              borderColor: isActive ? `var(${state.borderColorVar})` : "var(--color-border)",
            }}
          >
            <IconComponent className="h-3 w-3" />
            <span>{state.name}</span>
          </button>
        );
      })}
      {editMode && activeStates.length > 0 && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all"
        >
          Reset
        </button>
      )}
    </div>
  );
}