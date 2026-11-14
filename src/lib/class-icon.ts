import { Axe, Guitar, Cross, Leaf, Sword, HandFist, Shield, Crosshair, Knife, Fire, Skull, MagicWand, Wrench, User } from "@phosphor-icons/react";

/** One icon per class, used on hero cards and the sheet header. */
export function getClassIcon(className = "") {
  const c = className.toLowerCase();
  if (c.includes("barbarian")) return Axe;
  if (c.includes("bard")) return Guitar;
  if (c.includes("cleric")) return Cross;
  if (c.includes("druid")) return Leaf;
  if (c.includes("fighter")) return Sword;
  if (c.includes("monk")) return HandFist;
  if (c.includes("paladin")) return Shield;
  if (c.includes("ranger")) return Crosshair;
  if (c.includes("rogue")) return Knife;
  if (c.includes("sorcerer")) return Fire;
  if (c.includes("warlock")) return Skull;
  if (c.includes("wizard")) return MagicWand;
  if (c.includes("artificer")) return Wrench;
  return User;
}
