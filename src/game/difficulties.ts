import { getDefaultPairIds } from "./catalog";
import type { PairId } from "./types";

export type DifficultyId = "relaxed" | "classic";

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
};

export const DIFFICULTY_IDS: readonly DifficultyId[] = ["relaxed", "classic"];

export function isDifficultyId(value: unknown): value is DifficultyId {
  return value === "relaxed" || value === "classic";
}

export function getPairIdsForDifficulty(id: DifficultyId): PairId[] {
  return getDefaultPairIds(DIFFICULTIES[id].pairs);
}
