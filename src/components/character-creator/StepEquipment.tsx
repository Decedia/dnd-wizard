"use client";

import { useState, useMemo } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getEquipmentData, getEquipmentNames } from "@/lib/srd-client";
import { computeEquippedEffects, getModifier, getProficiencyBonus } from "@/lib/storage";
import type { Character } from "@/lib/storage";

interface StepEquipmentProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

interface EquipmentRadioGroup {
  name: string;
  choices: any[];
}

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const [pendingEquip, setPendingEquip] = useState<Character["inventory"]>([]);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemType, setCustomItemType] = useState<Character["inventory"][number]["itemType"]>("item");

  const startingEquipment = useMemo(() => classData?.startingEquipment || [], [classData?.startingEquipment]);

  const grantedItems = useMemo(() => {
    const granted: any[] = [];
    const choices: any[] = [];
    for (const entry of startingEquipment) {
      if (entry.granted) {
        granted.push(entry);
      } else {
        choices.push(entry);
      }
    }
    return { granted, choices };
  }, [startingEquipment]);

  const inventory = useMemo(() => {
    return [...data.inventory, ...pendingEquip];
  }, [data.inventory, pendingEquip]);

  const addPending = (item: any, quantity: number = 1) => {
    const newItem: Character["inventory"][number] = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: item.name || item.description || "Unknown Item",
      quantity,
      equipped: false,
      source: "srd",
      description: item.description || "",
      itemType: item.itemType || "item",
      damageDice: item.damageDice || "",
      damageType: item.damageType || "",
    };
    setPendingEquip((prev) => [...prev, newItem]);
  };

  const removePending = (id: string) => {
    setPendingEquip((prev) => prev.filter((item) => item.id !== id));
  };

  const addCustomItem = () => {
    if (!customItemName.trim()) return;
    const newItem: Character["inventory"][number] = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: customItemName.trim(),
      quantity: customItemQty,
      equipped: false,
      source: "custom",
      description: "",
      itemType: customItemType,
      damageDice: "",
      damageType: "",
    };
    setPendingEquip((prev) => [...prev, newItem]);
    setCustomItemName("");
    setCustomItemQty(1);
  };

  const confirmEquipment = () => {
    onChange({ inventory: [...data.inventory, ...pendingEquip] });
    setPendingEquip([]);
  };

  return (
    <StepCard title="Equipment" hint="Choose your character's starting equipment. Your class determines what you can choose from — weapons, armor, and adventuring gear.">
      {grantedItems.granted.length > 0 && (
        <div className="mb-5">
          <span className="text-xs font-bold text-parchment/70 uppercase tracking-wider mb-3 block">
            Starting Equipment (Auto-granted)
          </span>
          <div className="space-y-2">
            {grantedItems.granted.map((group: any, groupIdx: number) => (
              <div key={groupIdx}>
                {group.description && <p className="text-sm text-parchment/60 mb-2 leading-relaxed">{group.description}</p>}
                <div className="space-y-1">
                  {group.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-3 py-2">
                      <span className="text-sm text-parchment/80">{item.name}</span>
                      <span className="text-xs text-text-muted">x{item.quantity || 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {grantedItems.choices.length > 0 && (
        <div className="mb-5">
          <span className="text-xs font-bold text-parchment/70 uppercase tracking-wider mb-3 block">
            Choose Your Equipment
          </span>
          <div className="space-y-3">
            {grantedItems.choices.map((group: any, groupIdx: number) => {
              const groups: EquipmentRadioGroup[] = [];
              let currentChoices: any[] = [];
              let groupCounter = 0;
              const flush = () => {
                if (currentChoices.length > 0) {
                  groups.push({
                    name: `equip-choice-${groupCounter++}`,
                    choices: [...currentChoices],
                  });
                  currentChoices = [];
                }
              };

              const desc = (group.description || "").trim();
              if (desc.startsWith("Choose one")) {
                flush();
                currentChoices = [group];
              } else if (desc.startsWith("Or")) {
                currentChoices.push(group);
              }
              flush();

              return (
                <div key={groupIdx} className="space-y-2">
                  {group.description && <p className="text-xs text-parchment/60 mb-2">{group.description}</p>}
                  {groups.map((choiceGroup, gIdx) => (
                    <div key={gIdx} className="space-y-2">
                      <p className="text-xs font-medium text-parchment/60 uppercase tracking-wider">
                        {choiceGroup.choices[0]?.description || "Choose one:"}
                      </p>
                      {choiceGroup.choices.map((choice: any, cIdx: number) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => addPending(choice)}
                          className="w-full rounded-lg border border-border bg-charcoal/40 px-3 py-2 text-left text-sm text-parchment hover:border-accent/30 transition-colors"
                        >
                          {choice.description}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-5">
        <span className="text-xs font-bold text-parchment/70 uppercase tracking-wider mb-3 block">
          Pending Equipment
        </span>
        {pendingEquip.length === 0 ? (
          <p className="text-xs text-parchment/50">No equipment selected yet.</p>
        ) : (
          <div className="space-y-2">
            {pendingEquip.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-sm text-parchment">{item.name}</span>
                  {item.description && <span className="text-xs text-parchment/50">{item.description}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => removePending(item.id)}
                  className="text-xs text-burgundy hover:text-burgundy-light"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={confirmEquipment}
              className="w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:border-accent hover:bg-accent/20 transition-colors"
            >
              Confirm Equipment
            </button>
          </div>
        )}
      </div>

      <div>
        <span className="text-xs font-bold text-parchment/70 uppercase tracking-wider mb-3 block">
          Current Inventory
        </span>
        {inventory.length === 0 ? (
          <p className="text-xs text-parchment/50">No equipment yet.</p>
        ) : (
          <div className="space-y-2">
            {inventory.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-sm text-parchment">{item.name}</span>
                  {item.description && <span className="text-xs text-parchment/50">{item.description}</span>}
                </div>
                <span className="text-xs text-text-muted">x{item.quantity || 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </StepCard>
  );
}
