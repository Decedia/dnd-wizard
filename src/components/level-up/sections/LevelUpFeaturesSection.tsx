"use client";

interface LevelUpFeaturesSectionProps {
  features: { name: string; description: string }[];
  featureChoices?: {
    featureName: string;
    options: string[];
    optional?: boolean;
    tigerSkillOptions?: string[];
    tigerSkillCount?: number;
  }[];
  featureChoicesState: Record<string, string>;
  onFeatureChoiceChange: (featureName: string, option: string) => void;
}

export function LevelUpFeaturesSection({
  features,
  featureChoices,
  featureChoicesState,
  onFeatureChoiceChange,
}: LevelUpFeaturesSectionProps) {
  return (
    <div className="space-y-3">
      {features.map((feature, i) => (
        <div key={i} className="rounded-lg border border-border bg-charcoal/40 p-3">
          <h4 className="text-sm font-medium text-parchment/80">{feature.name}</h4>
          <p className="text-xs text-parchment/50 mt-1 whitespace-pre-line">{feature.description}</p>
        </div>
      ))}
      {featureChoices?.map((choice, i) => (
        <div key={`choice-${i}`} className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
          <p className="text-xs font-medium text-accent">{choice.featureName}</p>
          <p className="text-xs text-parchment/50">
            {choice.optional ? "Optionally choose" : "Choose"} one
            {choice.tigerSkillCount ? ` and ${choice.tigerSkillCount} skills` : ""}:
          </p>
          <div className="flex flex-wrap gap-2">
            {choice.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onFeatureChoiceChange(choice.featureName, opt)}
                className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                  featureChoicesState[choice.featureName] === opt
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border bg-charcoal/40 text-parchment/60 hover:border-accent/30"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {choice.tigerSkillOptions && choice.tigerSkillCount && featureChoicesState[choice.featureName] === "Tiger" && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-parchment/50">Choose {choice.tigerSkillCount} skills:</p>
              <div className="flex flex-wrap gap-2">
                {choice.tigerSkillOptions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className="rounded-md border border-border bg-charcoal/40 px-2 py-0.5 text-xs text-parchment/60 hover:border-accent/30"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
