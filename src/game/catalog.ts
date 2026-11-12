import type { PairId } from "./types";

export interface CatCard {
  pairId: PairId;
  name: string;
  image: string;
}

/** Shared card back until the final art pass replaces the test artwork. */
export const CARD_BACK_IMAGE = "/cards/back-1-test.png";

/**
 * The initial local card catalog. Pair ids are intentionally short strings so
 * the current test artwork can be swapped for the final sprites without
 * changing the persistence schema.
 */
export const CAT_CARDS: readonly CatCard[] = [
  { pairId: "1", name: "Mochi", image: "/cards/img-test1.png" },
  { pairId: "2", name: "Biscuit", image: "/cards/img-test2.png" },
  { pairId: "3", name: "Nori", image: "/cards/img-test3.png" },
  { pairId: "4", name: "Pepper", image: "/cards/img-test4.png" },
  { pairId: "5", name: "Miso", image: "/cards/img-test5.png" },
  { pairId: "6", name: "Clover", image: "/cards/img-test6.png" },
];

export function getCatCard(pairId: PairId): CatCard | undefined {
  return CAT_CARDS.find((card) => card.pairId === pairId);
}

export function getDefaultPairIds(pairCount: number): PairId[] {
  if (!Number.isInteger(pairCount) || pairCount < 1) {
    throw new Error("pairCount must be a positive integer");
  }

  if (pairCount > CAT_CARDS.length) {
    throw new Error(`The card catalog only contains ${CAT_CARDS.length} pairs`);
  }

  return CAT_CARDS.slice(0, pairCount).map((card) => card.pairId);
}
