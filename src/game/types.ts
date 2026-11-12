export type CardId = string;
export type PairId = string;

export type CardState = "hidden" | "revealed" | "matched";

export interface Card {
  id: CardId;
  pairId: PairId;
  state: CardState;
}

export type GamePhase = "idle" | "oneSelected" | "resolving" | "completed";

export interface GameState {
  cards: Card[];
  phase: GamePhase;
  selectedIds: CardId[];
  moves: number;
  matchedPairs: number;
  totalPairs: number;
}

export type GameAction =
  | { type: "SELECT_CARD"; cardId: CardId }
  | { type: "RESOLVE_MISMATCH" }
  | { type: "RESET" };
