import type { Character } from "./storage";

export interface CreationState {
  step: number;
  totalSteps: number;
  character: Character;
  completed: boolean;
}

export interface SubclassChoice {
  name: string;
  description: string;
  features: SubclassFeature[];
}

export interface SubclassFeature {
  name: string;
  description: string;
  level?: number;
  choices?: FeatureChoice[];
}

export interface FeatureChoice {
  featureName: string;
  options: string[];
  selected?: string;
  optional?: boolean;
  count?: number;
}

export interface LevelUpStep {
  id: string;
  level: number;
  title: string;
  description: string;
  type: "core" | "subclass" | "asi" | "expertise" | "spells" | "features" | "skills";
  required: boolean;
  completed: boolean;
}

export interface CreationStep {
  id: string;
  title: string;
  description: string;
  hint: string;
  type: "identity" | "race" | "class" | "subclass" | "abilities" | "skills" | "equipment" | "spells" | "appearance";
  required: boolean;
  completed: boolean;
}
