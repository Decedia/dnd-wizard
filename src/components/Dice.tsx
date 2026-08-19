"use client";

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";

export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export interface DiceHandle {
  roll: () => void;
}

interface DiceProps {
  type?: DiceType;
  onRoll?: (result: number) => void;
  autoRoll?: boolean;
  size?: number;
}

const SIDES: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

const DiceComponent = forwardRef<DiceHandle, DiceProps>(function Dice(
  { type = "d20", onRoll, autoRoll = false, size = 80 },
  ref
) {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [displayNumber, setDisplayNumber] = useState("?");
  const [showResult, setShowResult] = useState(false);
  const flickerRef = useRef<number | null>(null);
  const isRollingRef = useRef(false);

  const sides = SIDES[type];

  const roll = useCallback(() => {
    if (isRollingRef.current) return;
    isRollingRef.current = true;

    if (flickerRef.current) clearInterval(flickerRef.current);

    setIsRolling(true);
    setShowResult(false);

    const finalResult = Math.floor(Math.random() * sides) + 1;
    setResult(finalResult);

    let flickerCount = 0;
    const totalFlickers = 12 + Math.floor(Math.random() * 8);

    flickerRef.current = window.setInterval(() => {
      setDisplayNumber(`${Math.floor(Math.random() * sides) + 1}`);
      flickerCount++;
      if (flickerCount >= totalFlickers) {
        if (flickerRef.current) clearInterval(flickerRef.current);
        setDisplayNumber(finalResult.toString());
        setShowResult(true);
        setIsRolling(false);
        isRollingRef.current = false;
        onRoll?.(finalResult);
      }
    }, 60);
  }, [sides, onRoll]);

  useEffect(() => {
    if (autoRoll) {
      roll();
    }
    return () => {
      if (flickerRef.current) clearInterval(flickerRef.current);
      isRollingRef.current = false;
    };
  }, [autoRoll, roll]);

  useEffect(() => {
    setResult(null);
    setDisplayNumber("?");
    setShowResult(false);
    setIsRolling(false);
    isRollingRef.current = false;
  }, [type]);

  useImperativeHandle(ref, () => ({ roll }));

  const shapeClass = `dice-${type}`;

  return (
    <button
      onClick={roll}
      disabled={isRolling}
      className="dice-button"
      style={{ width: size, height: size }}
      aria-label={`Roll ${type}`}
    >
      <div className={`dice ${shapeClass} ${isRolling ? "rolling" : ""}`}>
        <span className={`dice-face ${showResult ? "result" : ""}`}>
          {displayNumber}
        </span>
        {type === "d100" && <span className="dice-badge">00</span>}
      </div>
      {result !== null && !isRolling && (
        <span className="dice-result-text">Last: {result}</span>
      )}
    </button>
  );
});

DiceComponent.displayName = "Dice";

export { DiceComponent as Dice };
export default DiceComponent;
