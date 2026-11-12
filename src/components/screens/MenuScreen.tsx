import { DIFFICULTIES, DIFFICULTY_IDS } from "@/game";
import { gameStore } from "@/store/gameStore";
import { formatDuration } from "@/utils/format";
import type { Component } from "solid-js";
import { For, Show } from "solid-js";

export const MenuScreen: Component = () => {
  const selectedConfig = () => gameStore.difficultyConfig();
  const selectedStats = () => gameStore.stats[gameStore.difficulty()];

  return (
    <section class="panel panel--menu" aria-labelledby="menu-title">
      <header class="brand">
        <p class="brand__eyebrow">A pixel cat memory game</p>
        <h1 class="brand__title" id="menu-title" aria-label="Whisker Match">
          <span>Whisker</span>
          <span>Match</span>
        </h1>
        <p class="brand__tagline">Flip the cards, find every pair, and chase your best run.</p>
      </header>

      <div class="menu__actions">
        <Show when={gameStore.hasSavedGame()}>
          <button
            class="pixel-button pixel-button--primary pixel-button--wide"
            type="button"
            onClick={() => gameStore.continueGame()}
          >
            Continue saved game
          </button>
        </Show>

        <fieldset class="difficulty">
          <legend class="visually-hidden">Board size</legend>
          <For each={DIFFICULTY_IDS}>
            {(id) => {
              const config = DIFFICULTIES[id];
              const isActive = () => gameStore.difficulty() === id;

              return (
                <button
                  type="button"
                  aria-pressed={isActive()}
                  class="difficulty__option"
                  classList={{ "difficulty__option--active": isActive() }}
                  onClick={() => gameStore.selectDifficulty(id)}
                >
                  <span class="difficulty__label">{config.label}</span>
                  <span class="difficulty__meta">{config.description}</span>
                </button>
              );
            }}
          </For>
        </fieldset>

        <button
          class="pixel-button pixel-button--wide"
          classList={{
            "pixel-button--primary": !gameStore.hasSavedGame(),
            "pixel-button--ghost": gameStore.hasSavedGame(),
          }}
          type="button"
          onClick={() => gameStore.startGame()}
        >
          {gameStore.hasSavedGame() ? "Start new game" : "Play"}
        </button>

        <button
          class="pixel-button pixel-button--ghost pixel-button--wide"
          type="button"
          onClick={() => gameStore.goToOptions()}
        >
          Options
        </button>

        <Show when={gameStore.hasSavedGame()}>
          <p class="menu__warning">Starting a new board replaces your saved game.</p>
        </Show>
      </div>

      <article class="stats-card">
        <header class="stats-card__header">
          <h2>{selectedConfig().label} records</h2>
          <span>{selectedConfig().description}</span>
        </header>

        <dl class="stats-grid">
          <div>
            <dt>Games won</dt>
            <dd>{selectedStats().gamesPlayed}</dd>
          </div>
          <div>
            <dt>Best moves</dt>
            <dd>{selectedStats().bestMoves ?? "—"}</dd>
          </div>
          <div>
            <dt>Best time</dt>
            <dd>
              {selectedStats().bestTimeMs === null
                ? "—"
                : formatDuration(selectedStats().bestTimeMs ?? 0)}
            </dd>
          </div>
        </dl>
      </article>

      <details class="how-to">
        <summary>How to play</summary>
        <ul>
          <li>One move is exactly two card flips.</li>
          <li>Matched cats stay face-up on the board.</li>
          <li>Fewer moves and a faster time make a better record.</li>
        </ul>
      </details>

      <p class="menu__note">Your records and unfinished game are saved in this browser.</p>
    </section>
  );
};
