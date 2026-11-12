import type { DifficultyId, GameState } from "@/game";

export const STORAGE_VERSION = 1 as const;

export interface DifficultyStats {
  gamesPlayed: number;
  bestMoves: number | null;
  bestTimeMs: number | null;
}

export type StatsByDifficulty = Record<DifficultyId, DifficultyStats>;

export interface PersistedGame {
  difficulty: DifficultyId;
  state: GameState;
  elapsedMs: number;
  savedAt: number;
}

export interface PersistedData {
  version: typeof STORAGE_VERSION;
  settings: {
    difficulty: DifficultyId;
  };
  stats: StatsByDifficulty;
  activeGame: PersistedGame | null;
}
