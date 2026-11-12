export type { Card, CardId, CardState, GameAction, GamePhase, GameState, PairId } from "./types";
export type { DifficultyConfig, DifficultyId } from "./difficulties";

export { MISMATCH_DELAY_MS } from "./config";
export { createBoard } from "./createBoard";
export {
  DIFFICULTIES,
  DIFFICULTY_IDS,
  getPairIdsForDifficulty,
  isDifficultyId,
} from "./difficulties";
export { createInitialState, reduce } from "./gameMachine";
