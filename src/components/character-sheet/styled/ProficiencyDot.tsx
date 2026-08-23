"use client";

interface ProficiencyDotProps {
  proficient: boolean;
  onChange?: (proficient: boolean) => void;
  size?: "sm" | "md";
}

interface ProficiencyDotProps {
  proficient: boolean;
  onChange?: (proficient: boolean) => void;
  size?: "sm" | "md";
  editMode?: boolean;
}

export function ProficiencyDot({ proficient, onChange, size = "sm", editMode }: ProficiencyDotProps) {
  const sizeClasses = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const interactive = editMode !== false && onChange;

  const handleClick = () => {
    if (!interactive) return;
    onChange?.(!proficient);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={proficient}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${sizeClasses} rounded-full border-2 transition-all duration-200 ${
        proficient
          ? "border-gold bg-gold shadow-sm shadow-gold/40"
          : "border-parchment/30 bg-transparent hover:border-parchment/50"
      } ${interactive ? "cursor-pointer" : "cursor-default"}`}
    />
  );
}
