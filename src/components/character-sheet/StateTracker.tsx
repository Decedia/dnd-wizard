"use client";

import { LightningIcon as Lightning, DropIcon as Drop, ShieldIcon as Shield, FlameIcon as Flame, EyeIcon as Eye, ClockIcon as Clock, SparklesIcon as Sparkle, SkullIcon as Skull } from "@/components/icons";

export interface StateDefinition {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const COMMON_STATES: StateDefinition[] = [
  { id: "concentration", name: "Concentration", icon: Lightning, color: "#0891b2", bgColor: "#0891b215", borderColor: "#0891b230" },
  { id: "rage", name: "Rage", icon: Flame, color: "#dc2626", bgColor: "#dc262615", borderColor: "#dc262630" },
  { id: "wildshape", name: "Wild Shape", icon: Sparkle, color: "#16a34a", bgColor: "#16a34a15", borderColor: "#16a34a30" },
  { id: "channel-divinity", name: "Channel Divinity", icon: Lightning, color: "#eab308", bgColor: "#eab30815", borderColor: "#eab30830" },
  { id: "action-surge", name: "Action Surge", icon: Clock, color: "#7c3aed", bgColor: "#7c3aed15", borderColor: "#7c3aed30" },
  { id: "second-wind", name: "Second Wind", icon: Drop, color: "#2563eb", bgColor: "#2563eb15", borderColor: "#2563eb30" },
  { id: "ki", name: "Ki Points", icon: Sparkle, color: "#f59e0b", bgColor: "#f59e0b15", borderColor: "#f59e0b30" },
  { id: "sneak-attack", name: "Sneak Attack", icon: Eye, color: "#4b5563", bgColor: "#4b556315", borderColor: "#4b556330" },
  { id: "hexblade-curse", name: "Hexblade Curse", icon: Skull, color: "#7c2d12", bgColor: "#7c2d1215", borderColor: "#7c2d1230" },
  { id: "divine-smite", name: "Divine Smite", icon: Lightning, color: "#f59e0b", bgColor: "#f59e0b15", borderColor: "#f59e0b30" },
  { id: "bardic-inspiration", name: "Bardic Insp.", icon: Sparkle, color: "#ec4899", bgColor: "#ec489915", borderColor: "#ec489930" },
  { id: "lay-on-hands", name: "Lay on Hands", icon: Drop, color: "#ef4444", bgColor: "#ef444415", borderColor: "#ef444430" },
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
              backgroundColor: isActive ? state.bgColor : "transparent",
              color: isActive ? state.color : "var(--color-text-muted)",
              borderColor: isActive ? state.borderColor : "var(--color-border)",
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
