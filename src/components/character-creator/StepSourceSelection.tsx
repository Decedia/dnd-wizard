"use client";

import { SOURCE_OPTIONS, SourceBadge } from "@/components/SourceBadge";

interface StepSourceSelectionProps {
  data: { sources: string[] };
  onChange: (patch: { sources: string[] }) => void;
}

export function StepSourceSelection({ data, onChange }: StepSourceSelectionProps) {
  const selectedSources = data.sources || ["PHB"];

  const toggleSource = (sourceId: string) => {
    if (sourceId === "PHB") return;
    const current = selectedSources;
    if (current.includes(sourceId)) {
      onChange({ sources: current.filter((s) => s !== sourceId) });
    } else {
      onChange({ sources: [...current, sourceId] });
    }
  };

  const selectAll = () => {
    onChange({ sources: SOURCE_OPTIONS.map((s) => s.id) });
  };

  const selectCoreOnly = () => {
    onChange({ sources: ["PHB"] });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-3">
          Choose which sourcebooks are allowed for this character. Only content from selected sources will appear during creation.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={selectCoreOnly}
          className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Core Only (PHB)
        </button>
        <button
          onClick={selectAll}
          className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          All Sources
        </button>
      </div>

      <div className="space-y-2">
        {SOURCE_OPTIONS.map((source) => {
          const isSelected = selectedSources.includes(source.id);
          const isPHB = source.id === "PHB";
          return (
            <button
              key={source.id}
              onClick={() => toggleSource(source.id)}
              disabled={isPHB}
              className={`w-full flex items-center justify-between p-3 rounded border transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              } ${isPHB ? "opacity-75 cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{source.name}</div>
                  <div className="text-xs text-gray-500">{source.id}</div>
                </div>
              </div>
              <SourceBadge source={source.id} size="sm" />
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
        <strong>Selected:</strong> {selectedSources.length} source{selectedSources.length !== 1 ? "s" : ""} —{" "}
        {selectedSources.join(", ")}
      </div>
    </div>
  );
}
