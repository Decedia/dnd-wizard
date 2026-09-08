export interface SpellMechanics {
  spell: string;
  index: string;
  level: number;
  school: string;
  casting: {
    time: string;
    range: number | null;
    rangeUnit: "feet" | "self" | "touch" | "special";
    components: string[];
    material?: string;
    concentration: boolean;
    duration: string;
  };
  targeting: {
    type: "self" | "creature" | "point" | "area" | "multiple";
    shape?: "sphere" | "cube" | "cone" | "line" | "cylinder" | "hemisphere";
    size?: number;
    maxTargets?: number;
    maxRange: number | null;
    selfAllowed: boolean;
  };
  resolution?: {
    type: "attack" | "save" | "check" | "none";
    ability?: string;
    dcType?: string;
    onSuccess?: "none" | "half" | "full" | "negates";
    onFailure?: "full" | "disintegrate" | "instantKill";
  };
  effects: Effect[];
  scaling?: Scaling;
  special?: SpecialRule[];
  source: string;
  classes: string[];
  subclasses: string[];
}

export interface Effect {
  type: EffectType;
  trigger: EffectTrigger;
  condition?: string;
  amount?: string;
  stat?: string;
  damageType?: string;
  effectType?: string;
  bonus?: number;
  bonusTo?: string;
  duration?: string;
  description?: string;
  special?: string;
}

export type EffectType =
  | "damage"
  | "healing"
  | "buff"
  | "debuff"
  | "condition"
  | "summon"
  | "teleport"
  | "create"
  | "control"
  | "utility";

export type EffectTrigger =
  | "immediate"
  | "onEnter"
  | "onTurnStart"
  | "onTurnEnd"
  | "onAttack"
  | "onSave"
  | "onHit"
  | "onCast"
  | "onDamaged"
  | "onRest"
  | "onEnd"
  | "onAction";

export interface Scaling {
  type: "cantrip" | "slotLevel";
  description: string;
  appliesTo: string;
  increment?: string;
  startsAtLevel?: number;
}

export interface SpecialRule {
  rule: string;
  description: string;
}
