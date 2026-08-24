"use client";

import { useState, useMemo } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getEquipmentData, getStaticWeapons, getStaticArmors } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface StepEquipmentProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

interface ChoiceGroup {
  id: string;
  description: string;
  options: EquipmentOption[];
}

interface EquipmentOption {
  description: string;
  items: { name: string; quantity: number }[];
  weaponType?: string;
}

export function StepEquipment({ data, onChange }: StepEquipmentProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const [pendingEquip, setPendingEquip] = useState<Character["inventory"]>([]);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, number>>({});
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemType, setCustomItemType] = useState<Character["inventory"][number]["itemType"]>("item");

  const startingEquipment = useMemo(() => classData?.startingEquipment || [], [classData?.startingEquipment]);

  const weapons = useMemo(() => getStaticWeapons(), []);
  const armors = useMemo(() => getStaticArmors(), []);

  const choiceGroups = useMemo<ChoiceGroup[]>(() => {
    const groups: ChoiceGroup[] = [];
    let groupCounter = 0;

    startingEquipment.forEach((entry: any) => {
      const desc = entry.description || "";
      const items = entry.items || [];

      if (desc.includes(" or ")) {
        const parts = desc.split(" or ");
        const options: EquipmentOption[] = parts.map((part: string) => ({
          description: part.trim(),
          items: items.length > 0 ? [items[0]] : [],
          weaponType: extractWeaponType(part),
        }));
        groups.push({
          id: `choice-${groupCounter++}`,
          description: desc,
          options,
        });
      } else if (items.length > 0) {
        groups.push({
          id: `choice-${groupCounter++}`,
          description: desc || "Starting equipment",
          options: items.map((item: any) => ({
            description: item.name,
            items: [item],
          })),
        });
      }
    });

    return groups;
  }, [startingEquipment]);

  const filteredWeapons = useMemo(() => {
    const selectedTypes = Object.entries(selectedChoices)
      .filter(([_, optionIndex]) => optionIndex !== undefined)
      .flatMap(([groupId, optionIndex]) => {
        const group = choiceGroups.find(g => g.id === groupId);
        if (!group || optionIndex === undefined) return [];
        const option = group.options[optionIndex];
        return option.weaponType ? [option.weaponType] : [];
      });

    if (selectedTypes.length === 0) return weapons;

    return weapons.filter((w: any) => {
      return selectedTypes.some(type => {
        if (type === "martial") return w.weapon_category === "Martial";
        if (type === "simple") return w.weapon_category === "Simple";
        if (type === "martial melee") return w.weapon_category === "Martial" && w.category_range === "Melee";
        if (type === "martial ranged") return w.weapon_category === "Martial" && w.category_range === "Ranged";
        if (type === "simple melee") return w.weapon_category === "Simple" && w.category_range === "Melee";
        if (type === "simple ranged") return w.weapon_category === "Simple" && w.category_range === "Ranged";
        return false;
      });
    });
  }, [selectedChoices, choiceGroups, weapons]);

  const handleChoiceSelect = (groupId: string, optionIndex: number) => {
    setSelectedChoices(prev => ({
      ...prev,
      [groupId]: optionIndex,
    }));
  };

  const addSelectedToPending = () => {
    const newItems: Character["inventory"] = [];

    choiceGroups.forEach((group) => {
      const selectedIndex = selectedChoices[group.id];
      if (selectedIndex !== undefined) {
        const option = group.options[selectedIndex];
        option.items.forEach((item) => {
          newItems.push({
            id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: item.name,
            quantity: item.quantity || 1,
            equipped: false,
            source: "srd",
            description: "",
            itemType: getItemType(item.name),
          });
        });
      }
    });

    setPendingEquip(prev => [...prev, ...newItems]);
  };

  const getItemType = (itemName: string): Character["inventory"][number]["itemType"] => {
    const weaponNames = weapons.map((w: any) => w.name);
    const armorNames = armors.map((a: any) => a.name);
    if (weaponNames.includes(itemName)) return "weapon";
    if (armorNames.includes(itemName)) return "armor";
    return "item";
  };

  const confirmEquipment = () => {
    onChange({ inventory: [...data.inventory, ...pendingEquip] });
    setPendingEquip([]);
    setSelectedChoices({});
  };

  const isAllRequiredSelected = useMemo(() => {
    if (choiceGroups.length === 0) return true;
    return choiceGroups.every(group => selectedChoices[group.id] !== undefined);
  }, [choiceGroups, selectedChoices]);

  return (
    <StepCard title="Equipment" hint="Choose your character's starting equipment. Your class determines what you can choose from — weapons, armor, and adventuring gear.">
      {choiceGroups.length > 0 && (
        <div className="mb-5">
          <span className="text-xs font-bold text-parchment/70 uppercase tracking-wider mb-3 block">
            Choose Your Equipment
          </span>
          <div className="space-y-4">
            {choiceGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <p className="text-xs text-parchment/70 mb-2">{group.description}</p>
                <div className="space-y-2">
                  {group.options.map((option, optionIndex) => {
                    const isSelected = selectedChoices[group.id] === optionIndex;
                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        onClick={() => handleChoiceSelect(group.id, optionIndex)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                          isSelected
                            ? "border-accent/40 bg-accent/10 text-parchment"
                            : "border-white/20 bg-charcoal/40 text-parchment/80 hover:border-white/40"
                        }`}
                      >
                        {option.description}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addSelectedToPending}
              disabled={!isAllRequiredSelected}
              className="w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:border-accent hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Selected to Pending
            </button>
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
                  onClick={() => setPendingEquip(prev => prev.filter(i => i.id !== item.id))}
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
        {data.inventory.length === 0 ? (
          <p className="text-xs text-parchment/50">No equipment yet.</p>
        ) : (
          <div className="space-y-2">
            {data.inventory.map((item) => (
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

function extractWeaponType(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("martial weapon")) {
    if (lower.includes("melee")) return "martial melee";
    if (lower.includes("ranged")) return "martial ranged";
    return "martial";
  }
  if (lower.includes("simple weapon")) {
    if (lower.includes("melee")) return "simple melee";
    if (lower.includes("ranged")) return "simple ranged";
    return "simple";
  }
  if (lower.includes("light armor")) return "light";
  if (lower.includes("heavy armor")) return "heavy";
  if (lower.includes("medium armor")) return "medium";
  return undefined;
}
