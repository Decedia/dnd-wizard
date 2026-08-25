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
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Successes</span>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={`s-${i}`}
              type="button"
              onClick={() => handleSuccessClick(i)}
              className="h-5 w-5 rounded-full border-[3px] transition-all duration-200"
              style={{
                backgroundColor: successes > i ? "#ffffff" : "transparent",
                borderColor: successes > i ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
              }}
              aria-label={`Success ${i + 1}`}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Failures</span>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={`f-${i}`}
              type="button"
              onClick={() => handleFailureClick(i)}
              className="h-5 w-5 rounded-full border-[3px] transition-all duration-200"
              style={{
                backgroundColor: failures > i ? "#000000" : "transparent",
                borderColor: failures > i ? "#000000" : "rgba(255, 255, 255, 0.4)",
              }}
              aria-label={`Failure ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
