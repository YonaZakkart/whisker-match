import type { Component } from "solid-js";
import { For } from "solid-js";
import { gameStore } from "@/store/gameStore";
import { Card } from "./Card";

export const Board: Component = () => {
  const { state, selectCard, reset } = gameStore;

  return (
    <div class="board-wrapper">
      <header class="hud">
        <span>Moves: {state.moves}</span>
        <span>
          Pairs: {state.matchedPairs}/{state.totalPairs}
        </span>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </header>

      <div
        class="board"
        classList={{ "board--completed": state.phase === "completed" }}
      >
        <For each={state.cards}>
          {(card) => <Card card={card} onSelect={selectCard} />}
        </For>
      </div>

      {state.phase === "completed" && (
        <div class="completion">
          <p>Completed in {state.moves} moves</p>
          <button type="button" onClick={reset}>
            Play again
          </button>
        </div>
      )}
    </div>
  );
};