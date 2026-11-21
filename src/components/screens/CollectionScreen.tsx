import { EXCHANGE_COST } from "@/collection";
import { CAT_CARDS, getCatCard } from "@/content";
import { gameStore } from "@/store/gameStore";
import type { Component } from "solid-js";
import { For, Show } from "solid-js";

const TOTAL_CARDS = CAT_CARDS.length;

export const CollectionScreen: Component = () => {
  const ownedIds = () => new Set(gameStore.collection().ownedPairIds);
  const ownedCount = () => CAT_CARDS.filter((card) => ownedIds().has(card.pairId)).length;
  const isComplete = () => ownedCount() === TOTAL_CARDS;
  const pawprints = () => gameStore.collection().pawprints;
  const canExchange = () => pawprints() >= EXCHANGE_COST && !isComplete();

  const exchangeHint = () => {
    if (isComplete()) {
      return "Every cat is collected. The exchange is closed.";
    }

    if (pawprints() < EXCHANGE_COST) {
      const missing = EXCHANGE_COST - pawprints();
      return `Collect ${missing} more Lost Pawprint${missing === 1 ? "" : "s"} to exchange.`;
    }

    return "Spend 3 Lost Pawprints for one random cat.";
  };

  const exchangeResult = () => {
    const event = gameStore.lastExchange();
    if (!event) return "";

    const name = getCatCard(event.pairId)?.name ?? "Mystery cat";

    return event.kind === "new-card"
      ? `New cat collected: ${name}!`
      : `Duplicate: ${name}. +1 Lost Pawprint.`;
  };

  return (
    <section class="panel panel--collection" aria-labelledby="collection-title">
      <header class="collection__header">
        <button
          class="pixel-button pixel-button--ghost"
          type="button"
          onClick={() => gameStore.goToMenu()}
        >
          ← Menu
        </button>
        <h1 class="collection__title" id="collection-title">
          Collection
        </h1>
        <button
          class="pixel-button pixel-button--ghost"
          type="button"
          onClick={() => gameStore.goToMenu()}
        >
          Done
        </button>
      </header>

      <p class="collection__intro">
        Every completed board brings one cat home. Duplicates become Lost Pawprints.
      </p>

      <div class="collection__summary">
        <div class="collection__summary-item">
          <span class="collection__summary-label">Cats collected</span>
          <strong>
            {ownedCount()} / {TOTAL_CARDS}
          </strong>
        </div>
        <div class="collection__summary-item">
          <span class="collection__summary-label">Lost Pawprints</span>
          <strong>{pawprints()}</strong>
        </div>
      </div>

      <ul class="collection__grid" aria-label="Cat collection">
        <For each={CAT_CARDS}>
          {(card) => {
            const owned = () => ownedIds().has(card.pairId);

            return (
              <li class="collection-card" classList={{ "collection-card--owned": owned() }}>
                <div class="collection-card__art">
                  <img src={card.image} alt="" draggable={false} />
                  <Show when={!owned()}>
                    <span class="collection-card__lock" aria-hidden="true">
                      ?
                    </span>
                  </Show>
                </div>
                <p class="collection-card__name">{card.name}</p>
                <p class="collection-card__status">{owned() ? "Collected" : "Not collected"}</p>
              </li>
            );
          }}
        </For>
      </ul>

      <section class="collection__exchange" aria-labelledby="exchange-title">
        <div class="collection__exchange-copy">
          <h2 id="exchange-title">Lost Pawprint exchange</h2>
          <p class="collection__hint" id="exchange-hint">
            {exchangeHint()}
          </p>
        </div>

        <button
          class="pixel-button pixel-button--primary"
          type="button"
          disabled={!canExchange()}
          aria-describedby="exchange-hint"
          onClick={() => gameStore.exchangePawprints()}
        >
          Exchange 3 pawprints
        </button>

        <p class="collection__result" aria-live="polite" aria-atomic="true">
          {exchangeResult()}
        </p>
      </section>
    </section>
  );
};
