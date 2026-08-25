"use client";

interface ProficiencyDotProps {
  proficient: boolean;
  onChange?: (proficient: boolean) => void;
  size?: "sm" | "md";
  editMode?: boolean;
}

export function ProficiencyDot({ proficient, onChange, size = "sm", editMode }: ProficiencyDotProps) {
  const sizeClasses = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
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
      className={`${sizeClasses} rounded-full transition-all duration-200 ${
         proficient
           ? "bg-ink"
           : "bg-transparent"
      } ${interactive ? "cursor-pointer" : "cursor-default"}`}
      style={{
        border: proficient ? "none" : "1px solid #e5e5e5",
      }}
    />
  );
}
