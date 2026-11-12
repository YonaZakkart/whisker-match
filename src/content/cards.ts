import type { PairId } from "@/game/types";

export interface CatCard {
  pairId: PairId;
  name: string;
  image: string;
}

const CAT_ART_PATH = "/cards/cats";

/**
 * Playable cat cards. Pair ids are stable, opaque strings so saved games keep
 * working when artwork or display names change.
 */
export const CAT_CARDS: readonly CatCard[] = [
  {
    pairId: "1",
    name: "A poco si muy brga",
    image: `${CAT_ART_PATH}/A_poco_si_muy_brga.png`,
  },
  {
    pairId: "2",
    name: "Cat Bow Tie Stare",
    image: `${CAT_ART_PATH}/Cat_Bow_Tie_Stare.png`,
  },
  {
    pairId: "3",
    name: "Dosecat",
    image: `${CAT_ART_PATH}/Dosecat.png`,
  },
  {
    pairId: "4",
    name: "Erm what the flip",
    image: `${CAT_ART_PATH}/Erm_what_the_flip.png`,
  },
  {
    pairId: "5",
    name: "Kotaro",
    image: `${CAT_ART_PATH}/Kotaro.png`,
  },
  {
    pairId: "6",
    name: "Ramirez",
    image: `${CAT_ART_PATH}/Ramirez.png`,
  },
  {
    pairId: "7",
    name: "Tabby Cat Holding Mug",
    image: `${CAT_ART_PATH}/Tabby_Cat_Holding_Mug.png`,
  },
  {
    pairId: "8",
    name: "Tole Tole",
    image: `${CAT_ART_PATH}/Tole_Tole.png`,
  },
];

export function getCatCard(pairId: PairId): CatCard | undefined {
  return CAT_CARDS.find((card) => card.pairId === pairId);
}

/**
 * Picks a fresh random subset of cards for a board. `random` is injectable so
 * tests can use a deterministic source of randomness.
 */
export function selectRandomPairIds(
  pairCount: number,
  random: () => number = Math.random,
): PairId[] {
  if (!Number.isInteger(pairCount) || pairCount < 1) {
    throw new Error("pairCount must be a positive integer");
  }

  if (pairCount > CAT_CARDS.length) {
    throw new Error(`The card catalog only contains ${CAT_CARDS.length} pairs`);
  }

  const pool = [...CAT_CARDS];

  // Partial Fisher-Yates shuffle: only the first `pairCount` slots matter.
  for (let i = 0; i < pairCount; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, pairCount).map((card) => card.pairId);
}
