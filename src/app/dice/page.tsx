"use client";

import { useState, useRef } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Dice, DiceType, DiceHandle } from "@/components/Dice";

const DICE_TYPES: DiceType[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

export default function DiceRoller() {
  const diceRefs = useRef<Record<DiceType, DiceHandle | null>>({
    d4: null,
    d6: null,
    d8: null,
    d10: null,
    d12: null,
    d20: null,
    d100: null,
  });

  const [lastResults, setLastResults] = useState<Record<DiceType, number | null>>({
    d4: null,
    d6: null,
    d8: null,
    d10: null,
    d12: null,
    d20: null,
    d100: null,
  });

  const handleRoll = (type: DiceType, result: number) => {
    setLastResults((prev) => ({ ...prev, [type]: result }));
  };

  const rollAll = () => {
    DICE_TYPES.forEach((type, index) => {
      setTimeout(() => {
        diceRefs.current[type]?.roll();
      }, index * 80);
    });
  };

  return (
    <div className="min-h-screen bg-ink">
      <AppHeader title="Dice Roller" subtitle="Roll the bones" />

      <main className="px-4 py-6 pb-28">
        <div className="mx-auto max-w-lg">
          <button
            onClick={rollAll}
            className="btn btn-primary w-full mb-6"
          >
            Roll All Dice
          </button>

          <div className="grid grid-cols-2 gap-4">
            {DICE_TYPES.map((type) => (
              <div
                key={type}
                  className="card flex flex-col items-center gap-2 p-4"
              >
                <Dice
                  ref={(el) => {
                    diceRefs.current[type] = el;
                  }}
                  type={type}
                  size={100}
                  onRoll={(result) => handleRoll(type, result)}
                />
                   <span className="text-xs text-paper-muted uppercase tracking-wider font-bold">
                    {type}
                  </span>
                  {lastResults[type] !== null && (
                    <span className="text-sm font-bold text-paper">
                    Last: {lastResults[type]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
