import {
  BACKGROUND_PACKS,
  CARD_BACKS,
  TIME_PERIOD_OPTIONS,
  getBackgroundPack,
  getCardBack,
} from "@/content";
import { gameStore } from "@/store/gameStore";
import type { Component } from "solid-js";
import { For, Show } from "solid-js";

export const OptionsScreen: Component = () => {
  const selectedBack = () => gameStore.cardBackId();
  const selectedPack = () => gameStore.backgroundPackId();
  const isAutoTime = () => gameStore.timePeriodOverride() === null;

  const currentPeriodLabel = () =>
    TIME_PERIOD_OPTIONS.find((option) => option.id === gameStore.currentTimePeriod())?.label ??
    "Current time";

  return (
    <section class="panel panel--options" aria-labelledby="options-title">
      <header class="options__header">
        <button
          class="pixel-button pixel-button--ghost"
          type="button"
          onClick={() => gameStore.goToMenu()}
        >
          ← Menu
        </button>
        <h1 class="options__title" id="options-title">
          Options
        </h1>
        <button
          class="pixel-button pixel-button--ghost"
          type="button"
          onClick={() => gameStore.goToMenu()}
        >
          Done
        </button>
      </header>

      <p class="options__intro">Make the table yours. These choices are saved on this device.</p>

      <section class="options__section" aria-labelledby="card-back-title">
        <header class="options__section-header">
          <div>
            <p class="options__eyebrow">Personalization</p>
            <h2 id="card-back-title">Card back</h2>
          </div>
          <span class="options__current">{getCardBack(selectedBack()).name}</span>
        </header>

        <div class="option-grid option-grid--backs">
          <For each={CARD_BACKS}>
            {(back) => {
              const isActive = () => selectedBack() === back.id;

              return (
                <button
                  type="button"
                  class="option-tile"
                  classList={{ "option-tile--active": isActive() }}
                  aria-pressed={isActive()}
                  onClick={() => gameStore.selectCardBack(back.id)}
                >
                  <span class="option-tile__art option-tile__art--card">
                    <img src={back.image} alt="" draggable={false} />
                  </span>
                  <span class="option-tile__label">{back.name}</span>
                </button>
              );
            }}
          </For>
        </div>
      </section>

      <section class="options__section" aria-labelledby="background-title">
        <header class="options__section-header">
          <div>
            <p class="options__eyebrow">Scenery</p>
            <h2 id="background-title">Background pack</h2>
          </div>
          <span class="options__current">{getBackgroundPack(selectedPack()).name}</span>
        </header>

        <div class="option-grid option-grid--packs">
          <For each={BACKGROUND_PACKS}>
            {(pack) => {
              const isActive = () => selectedPack() === pack.id;

              return (
                <button
                  type="button"
                  class="option-tile option-tile--pack"
                  classList={{ "option-tile--active": isActive() }}
                  aria-pressed={isActive()}
                  onClick={() => gameStore.selectBackgroundPack(pack.id)}
                >
                  <span class="option-tile__art option-tile__art--background">
                    <img src={pack.images[gameStore.activeTimePeriod()]} alt="" draggable={false} />
                  </span>
                  <span class="option-tile__label">{pack.name}</span>
                  <span class="option-tile__meta">{pack.description}</span>
                </button>
              );
            }}
          </For>
        </div>

        <Show when={BACKGROUND_PACKS.length === 1}>
          <p class="options__hint">More background packs are planned for a future update.</p>
        </Show>

        <h3 class="options__subtitle">Time of day</h3>
        <p class="options__help">
          Auto follows your clock. Manual choices are a preview and return to the current time when
          you reopen the game.
        </p>

        <div class="time-grid">
          <button
            type="button"
            class="time-card"
            classList={{ "time-card--active": isAutoTime() }}
            aria-pressed={isAutoTime()}
            onClick={() => gameStore.selectTimePeriod(null)}
          >
            <span class="time-card__label">Auto</span>
            <span class="time-card__meta">Now: {currentPeriodLabel()}</span>
          </button>

          <For each={TIME_PERIOD_OPTIONS}>
            {(option) => {
              const isActive = () => gameStore.timePeriodOverride() === option.id;

              return (
                <button
                  type="button"
                  class="time-card"
                  classList={{ "time-card--active": isActive() }}
                  aria-pressed={isActive()}
                  onClick={() => gameStore.selectTimePeriod(option.id)}
                >
                  <span class="time-card__label">{option.label}</span>
                  <span class="time-card__meta">{option.hours}</span>
                </button>
              );
            }}
          </For>
        </div>
      </section>
    </section>
  );
};
