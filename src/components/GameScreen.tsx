import { gameStore } from "@/store/gameStore";
import { formatDuration } from "@/utils/format";
import type { Component } from "solid-js";
import { Show, createEffect } from "solid-js";
import { Board } from "./Board";

export const GameScreen: Component = () => {
  const state = gameStore.game;
  const config = gameStore.difficultyConfig;
  let playAgainButton: HTMLButtonElement | undefined;

  createEffect(() => {
    if (state.phase !== "completed") return;

    requestAnimationFrame(() => playAgainButton?.focus());
  });

  const statusText = () => {
    switch (state.phase) {
      case "idle":
        return state.moves === 0
          ? "Pick two cards to make your first move."
          : "Pick a card to start the next move.";
      case "oneSelected":
        return "Now find its match.";
      case "resolving":
        return "No match. Watch closely…";
      case "completed":
        return "All pairs found!";
    }
  };

  return (
    <section class="panel panel--game" aria-labelledby="game-title">
      <header class="game__topbar">
        <button
          class="pixel-button pixel-button--ghost"
          type="button"
          onClick={() => gameStore.goToMenu()}
        >
          ← Menu
        </button>
        <h1 class="game__title" id="game-title">
          {config().label} board
        </h1>
        <button
          class="pixel-button pixel-button--ghost"
          type="button"
          onClick={() => gameStore.restartGame()}
        >
          Restart
        </button>
      </header>

      <div class="hud" aria-label="Game statistics">
        <div class="hud__item">
          <span class="hud__label">Moves</span>
          <strong>{state.moves}</strong>
        </div>
        <div class="hud__item">
          <span class="hud__label">Pairs</span>
          <strong>
            {state.matchedPairs}/{state.totalPairs}
          </strong>
        </div>
        <div class="hud__item">
          <span class="hud__label">Time</span>
          <strong>{formatDuration(gameStore.elapsedMs())}</strong>
        </div>
      </div>

      <div class="board-frame">
        <Board
          cards={state.cards}
          columns={config().columns}
          interactive={state.phase !== "resolving" && state.phase !== "completed"}
          resolving={state.phase === "resolving"}
          onSelect={gameStore.selectCard}
        />

        <Show when={state.phase === "completed"}>
          <dialog class="result" open aria-labelledby="result-title">
            <div class="result__inner">
              <p class="result__eyebrow">Board cleared</p>
              <h2 id="result-title">Pawsome!</h2>
              <p class="result__summary">
                You found all {state.totalPairs} pairs in <strong>{state.moves}</strong> moves and{" "}
                <strong>{formatDuration(gameStore.elapsedMs())}</strong>.
              </p>

              <Show when={gameStore.lastResult()}>
                {(result) => (
                  <p class="result__badge">
                    {result().isBestMoves && result().isBestTime
                      ? "New personal best!"
                      : result().isBestMoves
                        ? "Fewest moves yet!"
                        : result().isBestTime
                          ? "Fastest run yet!"
                          : "Saved to your records."}
                  </p>
                )}
              </Show>

              <div class="result__actions">
                <button
                  ref={(element) => {
                    playAgainButton = element;
                  }}
                  class="pixel-button pixel-button--primary"
                  type="button"
                  onClick={() => gameStore.restartGame()}
                >
                  Play again
                </button>
                <button class="pixel-button" type="button" onClick={() => gameStore.goToMenu()}>
                  Menu
                </button>
              </div>
            </div>
          </dialog>
        </Show>
      </div>

      <p
        class="game__status"
        classList={{
          "game__status--alert": state.phase === "resolving",
          "game__status--success": state.phase === "completed",
        }}
        aria-live="polite"
      >
        {statusText()}
      </p>
    </section>
  );
};
