import type { PairId } from "@/game/types";
import { pickIndex } from "@/utils/random";
import type { CollectionState, RewardEvent } from "./types";

export const EXCHANGE_COST = 3;

export function createEmptyCollection(): CollectionState {
  return { ownedPairIds: [], pawprints: 0 };
}

/**
 * The collection is complete when every catalog card is owned. Unknown ids are
 * preserved but never count toward completion.
 */
function isCollectionComplete(collection: CollectionState, catalog: readonly PairId[]): boolean {
  if (catalog.length === 0) {
    return true;
  }

  const owned = new Set(collection.ownedPairIds);
  return catalog.every((pairId) => owned.has(pairId));
}

export function canExchange(collection: CollectionState, catalog: readonly PairId[]): boolean {
  return collection.pawprints >= EXCHANGE_COST && !isCollectionComplete(collection, catalog);
}

/**
 * Grants one uniformly random card from the whole catalog, owned or not.
 * A new card joins the collection; a duplicate becomes one Lost Pawprint.
 */
export function rollReward(
  collection: CollectionState,
  catalog: readonly PairId[],
  random: () => number = Math.random,
): RewardEvent {
  if (catalog.length === 0) {
    throw new Error("catalog must not be empty");
  }

  const pairId = catalog[pickIndex(random, catalog.length)];

  if (collection.ownedPairIds.includes(pairId)) {
    return {
      source: "game",
      kind: "duplicate",
      pairId,
      collection: {
        ownedPairIds: [...collection.ownedPairIds],
        pawprints: collection.pawprints + 1,
      },
    };
  }

  return {
    source: "game",
    kind: "new-card",
    pairId,
    collection: {
      ownedPairIds: [...collection.ownedPairIds, pairId],
      pawprints: collection.pawprints,
    },
  };
}

/**
 * Spends three Lost Pawprints for one uniformly random card. Returns `null`
 * when there is not enough balance or the collection is already complete.
 * A duplicate rolled here refunds one pawprint, for a net cost of two.
 */
export function exchange(
  collection: CollectionState,
  catalog: readonly PairId[],
  random: () => number = Math.random,
): RewardEvent | null {
  if (!canExchange(collection, catalog)) {
    return null;
  }

  const afterCost: CollectionState = {
    ownedPairIds: [...collection.ownedPairIds],
    pawprints: collection.pawprints - EXCHANGE_COST,
  };

  const reward = rollReward(afterCost, catalog, random);

  return { ...reward, source: "exchange" };
}
