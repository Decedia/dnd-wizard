// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { BEASTS, beastsFor, type Beast } from "@/data/wild-shapes";
import { autoHitExtras, beastPronePatch, beastProneSave, beastRunPatch, buildTurnMenu, endEncounterPatch, endTurnPatch, hitPatch, letGoPatch, optionPatch, swingPatch, wildShapePatch } from "@/lib/turn";
import { suggestPicks } from "@/lib/turn-suggest";
import { createEmptyCharacter, type Character } from "@/lib/storage";
import { translations as enAll } from "@/locales/en";
import { translations as idAll } from "@/locales/id";

const en = enAll as Record<string, string>;
const id = idAll as Record<string, string>;
const apply = (c: Character, patch: Partial<Character>) => ({ ...c, ...patch }) as Character;

function shaped(form: string, level = 18): Character {
  const druid: Character = {
    ...createEmptyCharacter(),
    class: "Druid", subclass: "Moon", level, maxHp: 100, currentHp: 100, wildShapeUses: 2, maxWildShapeUses: 2, turnActive: true, turnRound: 1,
    features: ["Wild Shape", "Combat Wild Shape"].map((name, i) => ({ id: `f${i}`, name, description: "", source: "class" })) as Character["features"],
  };
  const ws = buildTurnMenu(druid, []).options.find((o) => o.name === "Wild Shape")!;
  const beast = beastsFor(druid).find((b) => b.name === form)!;
  return apply(druid, wildShapePatch(ws, beast));
}
const attack = (c: Character, name: string, slot = "action") => buildTurnMenu(c, []).options.find((o) => o.group === "attack" && o.slot === slot && o.name === name);
const swing = (c: Character, name: string, result: "hit" | "miss" = "hit") => {
  c = apply(c, swingPatch(c, attack(c, name)!));
  return apply(c, hitPatch(c, (c.swings || []).length - 1, result));
};

describe("beast tricks", () => {
  test("Pounce: the claw knocks prone only after the run; a prone target opens the bonus bite once", () => {
    let c = shaped("Tiger");
    expect(beastProneSave(c, "beast:1")).toBeNull();
    c = apply(c, beastRunPatch(c, true));
    expect(beastProneSave(c, "beast:1")).toBe(13);
    expect(beastProneSave(c, "beast:0")).toBeNull();
    expect(attack(c, "Bite", "bonus")).toBeUndefined();
    c = swing(c, "Claw");
    c = apply(c, beastPronePatch(c, 0, true));
    expect(c.swings![0].trick).toBe("prone");
    const bite = attack(c, "Bite", "bonus")!;
    expect(bite.blocked).toBeUndefined();
    expect(bite.nameKey).toBe("wild.run.bonus.pounce");
    c = apply(c, optionPatch(bite));
    expect(c.bonusActionUsed).toBe(true);
    expect(attack(c, "Bite", "bonus")!.blocked).toBe("usedThisTurn");
    // End of turn: the run and the prone target are over.
    c = apply(c, endTurnPatch(c, []));
    expect(c.wildShape!.run).toBe(false);
    expect(c.wildShape!.prone).toBe(false);
    expect(attack(c, "Bite", "bonus")).toBeUndefined();
  });

  test("a target that stays up opens no bonus bite", () => {
    let c = apply(shaped("Panther"), {});
    c = apply(c, beastRunPatch(c, true));
    c = swing(c, "Claw");
    c = apply(c, beastPronePatch(c, 0, false));
    expect(c.swings![0].trick).toBe("up");
    expect(attack(c, "Bite", "bonus")).toBeUndefined();
  });

  test("Charge adds its dice to the hit only after the run", () => {
    let c = shaped("Rhinoceros");
    expect(autoHitExtras(c, "beast:0").extras).toEqual([]);
    c = apply(c, beastRunPatch(c, true));
    expect(autoHitExtras(c, "beast:0").extras).toEqual([{ name: "Charge", dice: "2d8", auto: true }]);
    c = swing(c, "Gore");
    expect(c.swings![0].extras).toEqual([{ name: "Charge", dice: "2d8", auto: true }]);
    expect(beastProneSave(c, "beast:0")).toBe(15);
  });

  test("Trampling Charge: the stomp waits for a prone target and is the top pick then", () => {
    let c = shaped("Elephant");
    expect(attack(c, "Stomp (prone target)")!.condition).toBe("proneOnly");
    expect(suggestPicks(c, buildTurnMenu(c, []), [], { near: true }).action[0].option.name).toBe("Gore");
    c = apply(c, beastRunPatch(c, true));
    c = swing(c, "Gore");
    c = apply(c, beastPronePatch(c, 0, true));
    expect(attack(c, "Stomp (prone target)", "bonus")!.nameKey).toBe("wild.run.bonus.trample");
    const bonus = suggestPicks(c, buildTurnMenu(c, []), [], { near: true }).bonus[0];
    expect(bonus.option.name).toBe("Stomp (prone target)");
    expect(bonus.why).toBe("proneBonus");
  });

  test("a wolf's bite asks for the prone save without a run", () => {
    const c = swing(shaped("Dire Wolf"), "Bite");
    expect(beastProneSave(c, "beast:0")).toBe(13);
  });

  test("a crocodile's bite grabs on a hit; the tail cannot hit the held target; a miss grabs nothing", () => {
    let c = swing(shaped("Giant Crocodile"), "Bite", "miss");
    expect(c.wildShape!.holding).toBeUndefined();
    c = apply(c, { swings: [] });
    c = swing(c, "Bite");
    expect(c.wildShape!.holding).toEqual(["Bite"]);
    expect(attack(c, "Bite")!.condition).toBe("heldOnly");
    expect(attack(c, "Tail")!.condition).toBe("notHeld");
    c = apply(c, letGoPatch(c, "Bite"));
    expect(c.wildShape!.holding).toEqual([]);
    expect(attack(c, "Tail")!.condition).toBeUndefined();
  });

  test("a giant toad swallows only the target its bite holds", () => {
    let c = shaped("Giant Toad");
    expect(attack(c, "Swallow")!.blocked).toBe("notHolding");
    c = swing(c, "Bite");
    expect(attack(c, "Swallow")!.blocked).toBeUndefined();
    c = apply(c, endTurnPatch(c, []));
    c = apply(c, { swings: [] });
    c = swing(c, "Swallow");
    expect(c.wildShape!.swallowed).toBe(true);
    expect(c.wildShape!.holding).toEqual([]);
    c = apply(c, letGoPatch(c, "swallowed"));
    expect(c.wildShape!.swallowed).toBe(false);
  });

  test("the end of the fight lets go of everything but keeps the form", () => {
    let c = swing(shaped("Giant Crocodile"), "Bite");
    expect(c.wildShape!.holding).toEqual(["Bite"]);
    c = apply(c, endEncounterPatch(c));
    expect(c.wildShape).toEqual({ form: "Giant Crocodile", hp: 85 });
  });

  test("beast data: every trick names a real attack, and every note has Indonesian text", () => {
    const run = BEASTS.filter((b) => b.run);
    expect(run.map((b) => b.name).sort()).toEqual(["Boar", "Elephant", "Giant Elk", "Mammoth", "Panther", "Rhinoceros", "Saber-Toothed Tiger", "Tiger", "Triceratops"]);
    for (const b of run as Beast[]) {
      expect(b.attacks.some((a) => a.prone?.run)).toBe(true);
      if (b.proneBonus) expect(b.attacks.some((a) => a.name === b.proneBonus)).toBe(true);
      if (b.run === "charge") expect(b.attacks.some((a) => a.runDamage)).toBe(true);
      else expect(b.proneBonus).toBeTruthy();
    }
    for (const b of BEASTS) b.attacks.forEach((a, i) => {
      if (a.needsHold) expect(b.attacks.some((x) => x.name === a.needsHold && x.grapple)).toBe(true);
      if (a.note) expect([b.name, i, !!id[`wild.note.${b.name}.${i}`], en[`wild.note.${b.name}.${i}`]]).toEqual([b.name, i, true, a.note]);
    });
    for (const k of ["pounce", "charge", "trample"]) expect([k, !!en[`wild.run.hint.${k}`], !!id[`wild.run.hint.${k}`]]).toEqual([k, true, true]);
  });
});

describe("beast tricks in Suggest mode", () => {
  test("holding a target counts as next to it; the pounce bite is the top bonus pick", () => {
    let c = swing(shaped("Giant Crocodile"), "Bite");
    c = apply(c, { swings: [], actionUsed: false });
    expect(suggestPicks(c, buildTurnMenu(c, []), [], {}).action[0].why).not.toBe("dash");
    let t = apply(shaped("Tiger"), {});
    t = apply(t, beastRunPatch(t, true));
    t = swing(t, "Claw");
    t = apply(t, beastPronePatch(t, 0, true));
    const bonus = suggestPicks(t, buildTurnMenu(t, []), [], {}).bonus[0];
    expect([bonus.option.key, bonus.why]).toEqual(["beast:bonus:0", "proneBonus"]);
  });
});
