"use client";

interface DeathSavePipsProps {
  successes: number;
  failures: number;
  onChange: (patch: { successes: number; failures: number }) => void;
}

export function DeathSavePips({ successes, failures, onChange }: DeathSavePipsProps) {
  const handleSuccessClick = (index: number) => {
    if (successes > index) {
      onChange({ successes: index, failures });
    } else {
      onChange({ successes: index + 1, failures });
    }
  };

  const handleFailureClick = (index: number) => {
    if (failures > index) {
      onChange({ successes, failures: index });
    } else {
      onChange({ successes, failures: index + 1 });
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium text-ink-muted uppercase tracking-wider">Successes</span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <button
              key={`s-${i}`}
              type="button"
              onClick={() => handleSuccessClick(i)}
              className="h-4 w-4 rounded-full border transition-all duration-200"
              style={{
                backgroundColor: successes > i ? "#171717" : "transparent",
                borderColor: successes > i ? "#171717" : "#e5e5e5",
              }}
              aria-label={`Success ${i + 1}`}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium text-ink-muted uppercase tracking-wider">Failures</span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <button
              key={`f-${i}`}
              type="button"
              onClick={() => handleFailureClick(i)}
              className="h-4 w-4 rounded-full border transition-all duration-200"
              style={{
                backgroundColor: failures > i ? "#dc2626" : "transparent",
                borderColor: failures > i ? "#dc2626" : "#e5e5e5",
              }}
              aria-label={`Failure ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
