"use client";

import { useState } from "react";

interface InfoTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function InfoTooltip({ content, children }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 px-3 py-2 text-xs text-parchment bg-charcoal-lighter border border-parchment/20 rounded-lg shadow-xl whitespace-nowrap min-w-[180px]"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </span>
      )}
    </span>
  );
}
