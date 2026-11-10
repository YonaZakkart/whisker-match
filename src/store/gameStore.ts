import { createStore } from "solid-js/store";
import { createInitialState, reduce } from "@/game";
import type { CardId, GameState } from "@/game";

const MISMATCH_DELAY_MS = 800;

function createGameStore(pairCount = 6) {
  const [state, setState] = createStore<GameState>(createInitialState(pairCount));
  let resolveTimer: ReturnType<typeof setTimeout> | null = null;

  function selectCard(cardId: CardId) {
    if (state.phase === "resolving" || state.phase === "completed") return;

    const next = reduce(state, { type: "SELECT_CARD", cardId });
    setState(next);

    if (next.phase === "resolving") {
      if (resolveTimer) clearTimeout(resolveTimer);
      resolveTimer = setTimeout(() => {
        setState(reduce(next, { type: "RESOLVE_MISMATCH" }));
        resolveTimer = null;
      }, MISMATCH_DELAY_MS);
    }
  }

  function reset() {
    if (resolveTimer) {
      clearTimeout(resolveTimer);
      resolveTimer = null;
    }
    setState(createInitialState(state.totalPairs));
  }

  return {
    state,
    selectCard,
    reset,
  };
}

export const gameStore = createGameStore(6);