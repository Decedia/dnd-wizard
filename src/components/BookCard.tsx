"use client";

import { useState } from "react";
import { CheckIcon as Check, LockIcon } from "@/components/icons";

interface BookCardProps {
  id: string;
  abbr: string;
  name: string;
  tags: string[];
  locked: boolean;
  selected: boolean;
  onToggle: () => void;
  spineColor: string;
  coverGradient: string;
  topColor: string;
  bookmarkColor: string;
  patternSvg: React.ReactNode;
  iconSvg: React.ReactNode;
}

export function BookCard({
  id,
  abbr,
  name,
  tags,
  locked,
  selected,
  onToggle,
  spineColor,
  coverGradient,
  topColor,
  bookmarkColor,
  patternSvg,
  iconSvg,
}: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = isHovered || selected;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={() => setIsHovered(false)}
      className="relative w-full text-left"
      style={{
        perspective: "600px",
        cursor: locked ? "default" : "pointer",
        pointerEvents: locked ? "none" : "auto",
        opacity: locked ? 0.9 : 1,
        background: "transparent",
        border: "none",
        padding: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "140%",
          transformStyle: "preserve-3d",
          transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          transform: isActive ? "rotateY(-12deg) rotateX(3deg)" : "none",
        }}
      >
        {/* Spine */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: -14,
            width: 14,
            background: spineColor,
            borderRadius: "4px 0 0 4px",
            transformOrigin: "right center",
            transform: "rotateY(-90deg)",
          }}
        >
          <span
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              display: "block",
              padding: "4px 2px",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.9)",
              textAlign: "center",
            }}
          >
            {abbr}
          </span>
        </div>

        {/* Top edge */}
        <div
          style={{
            position: "absolute",
            top: -8,
            left: 0,
            right: 0,
            height: 8,
            background: topColor,
            transformOrigin: "bottom center",
            transform: "rotateX(90deg)",
            borderRadius: "0 10px 0 0",
          }}
        />

        {/* Bottom edge */}
        <div
          style={{
            position: "absolute",
            bottom: -8,
            left: 0,
            right: 0,
            height: 8,
            background: topColor,
            transformOrigin: "top center",
            transform: "rotateX(-90deg)",
            borderRadius: "0 0 10px 0",
          }}
        />

        {/* Right page edges */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: -8,
            width: 8,
            background: "linear-gradient(90deg, #f5f0e8, #e8e0d0)",
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${(i / 8) * 100}%`,
                height: 1,
                background: "rgba(0,0,0,0.08)",
              }}
            />
          ))}
        </div>

        {/* Front cover */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: coverGradient,
            borderRadius: "0 10px 10px 0",
            overflow: "hidden",
          }}
        >
          {/* Pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            {patternSvg}
          </div>

          {/* Icon */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ width: "60%", height: "60%" }}>
              {iconSvg}
            </div>
          </div>

          {/* Bookmark ribbon */}
          <div
            style={{
              position: "absolute",
              top: -4,
              right: 16,
              width: 14,
              height: 22,
              borderRadius: "0 0 5px 5px",
              background: bookmarkColor,
            }}
          />

          {/* Lock badge */}
          {locked && (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LockIcon className="h-2.5 w-2.5 text-white opacity-90" />
            </div>
          )}

          {/* Check badge */}
          {!locked && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: selected ? "#111111" : "rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <Check
                className="h-2.5 w-2.5"
                style={{ color: selected ? "#ffffff" : "rgba(255,255,255,0.5)" }}
              />
            </div>
          )}

          {/* Title area */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "10px 12px",
              background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", lineHeight: 1.1 }}>
              {abbr}
            </div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.75)", marginTop: 2, lineHeight: 1.3 }}>
              {name}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "9px",
                    fontWeight: 500,
                    padding: "1px 5px",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.25)",
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Selection ring */}
        <div
          style={{
            position: "absolute",
            inset: -3,
            border: "2.5px solid #111111",
            borderRadius: "0 12px 12px 0",
            opacity: selected ? 1 : 0,
            pointerEvents: "none",
            transition: "opacity 0.2s",
          }}
        />
      </div>
    </button>
  );
}
