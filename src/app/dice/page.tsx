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
    DICE_TYPES.forEach((type) => {
      diceRefs.current[type]?.roll();
    });
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title="Dice Roller" subtitle="Roll the bones" />

      <main className="px-4 py-6 pb-28">
        <div className="mx-auto max-w-lg">
          <button
            onClick={rollAll}
            className="w-full rounded-xl border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold transition-all hover:border-gold/50 hover:bg-gold/20 active:scale-[0.98] mb-6"
          >
            Roll All Dice
          </button>

          <div className="grid grid-cols-2 gap-4">
            {DICE_TYPES.map((type) => (
              <div
                key={type}
                className="flex flex-col items-center gap-2 rounded-xl border border-parchment/10 bg-charcoal/40 p-4"
              >
                <Dice
                  ref={(el) => {
                    diceRefs.current[type] = el;
                  }}
                  type={type}
                  size={100}
                  onRoll={(result) => handleRoll(type, result)}
                />
                <span className="text-xs text-parchment/50 uppercase tracking-wider">
                  {type}
                </span>
                {lastResults[type] !== null && (
                  <span className="text-sm font-semibold text-gold">
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
