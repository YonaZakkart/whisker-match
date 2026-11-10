import type { Card, CardId, GameAction, GameState } from "./types";
import { createBoard } from "./createBoard";

export function createInitialState(pairCount = 8): GameState {
  const cards = createBoard(pairCount);
  return {
    cards,
    phase: "idle",
    selectedIds: [],
    moves: 0,
    matchedPairs: 0,
    totalPairs: pairCount,
  };
}

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SELECT_CARD":
      return selectCard(state, action.cardId);
    case "RESOLVE_MISMATCH":
      return resolveMismatch(state);
    case "RESET":
      return createInitialState(state.totalPairs);
    default:
      return state;
  }
}

function selectCard(state: GameState, cardId: CardId): GameState {
  if (state.phase === "resolving" || state.phase === "completed") {
    return state;
  }

  const card = state.cards.find((c) => c.id === cardId);
  if (!card || card.state !== "hidden") {
    return state;
  }

  if (state.selectedIds.includes(cardId)) {
    return state;
  }

  if (state.phase === "idle") {
    return {
      ...state,
      cards: revealCard(state.cards, cardId),
      phase: "oneSelected",
      selectedIds: [cardId],
    };
  }

  // phase === "oneSelected" → second card
  const firstId = state.selectedIds[0];
  const firstCard = state.cards.find((c) => c.id === firstId);
  if (!firstCard) return state;

  const updatedCards = revealCard(state.cards, cardId);
  const secondCard = updatedCards.find((c) => c.id === cardId)!;
  const isMatch = firstCard.pairId === secondCard.pairId;
  const newMoves = state.moves + 1;

  if (isMatch) {
    const matchedCards = markMatched(updatedCards, [firstId, cardId]);
    const matchedPairs = state.matchedPairs + 1;
    const completed = matchedPairs === state.totalPairs;

    return {
      ...state,
      cards: matchedCards,
      phase: completed ? "completed" : "idle",
      selectedIds: [],
      moves: newMoves,
      matchedPairs,
    };
  }

  // mismatch
  return {
    ...state,
    cards: updatedCards,
    phase: "resolving",
    selectedIds: [firstId, cardId],
    moves: newMoves,
  };
}

function resolveMismatch(state: GameState): GameState {
  if (state.phase !== "resolving") return state;

  const hiddenCards = state.cards.map((card) =>
    state.selectedIds.includes(card.id) ? { ...card, state: "hidden" as const } : card,
  );

  return {
    ...state,
    cards: hiddenCards,
    phase: "idle",
    selectedIds: [],
  };
}

function revealCard(cards: Card[], cardId: CardId): Card[] {
  return cards.map((card) =>
    card.id === cardId ? { ...card, state: "revealed" as const } : card,
  );
}

function markMatched(cards: Card[], ids: CardId[]): Card[] {
  return cards.map((card) =>
    ids.includes(card.id) ? { ...card, state: "matched" as const } : card,
  );
}