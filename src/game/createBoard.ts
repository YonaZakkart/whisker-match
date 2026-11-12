import type { Card, PairId } from "./types";

/**
 * Builds a shuffled board with two cards per pair.
 *
 * `random` is injectable so tests (and future daily boards) can use a
 * deterministic source of randomness.
 */
export function createBoard(
  pairCount: number,
  pairIds?: PairId[],
  random: () => number = Math.random,
): Card[] {
  if (!Number.isInteger(pairCount) || pairCount < 1) {
    throw new Error("pairCount must be a positive integer");
  }

  // Default pairIds become "1", "2", ... so they map cleanly to the catalog.
  const ids = pairIds ?? Array.from({ length: pairCount }, (_, i) => String(i + 1));

  if (ids.length !== pairCount) {
    throw new Error("pairIds length must match pairCount");
  }

  if (new Set(ids).size !== ids.length) {
    throw new Error("pairIds must be unique");
  }

  const cards: Card[] = [];

  for (const pairId of ids) {
    cards.push(
      { id: `${pairId}-a`, pairId, state: "hidden" },
      { id: `${pairId}-b`, pairId, state: "hidden" },
    );
  }

  return shuffle(cards, random);
}

function shuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
