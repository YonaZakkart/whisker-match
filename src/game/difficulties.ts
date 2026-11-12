import { selectRandomPairIds } from "@/content/cards";
import type { PairId } from "./types";

export type DifficultyId = "relaxed" | "classic" | "marathon";

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  description: string;
  pairs: number;
  columns: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  relaxed: {
    id: "relaxed",
    label: "Relaxed",
    description: "3 pairs · 6 cards",
    pairs: 3,
    columns: 3,
  },
  classic: {
    id: "classic",
    label: "Classic",
    description: "6 pairs · 12 cards",
    pairs: 6,
    columns: 4,
  },
  marathon: {
    id: "marathon",
    label: "Marathon",
    description: "8 pairs · 16 cards",
    pairs: 8,
    columns: 4,
  },
};

export const DIFFICULTY_IDS: readonly DifficultyId[] = ["relaxed", "classic", "marathon"];

export function isDifficultyId(value: unknown): value is DifficultyId {
  return value === "relaxed" || value === "classic" || value === "marathon";
}

export function getPairIdsForDifficulty(
  id: DifficultyId,
  random: () => number = Math.random,
): PairId[] {
  return selectRandomPairIds(DIFFICULTIES[id].pairs, random);
}
