import type { Card, PairId } from "./types";

export function createBoard(pairCount: number, pairIds?: PairId[]): Card[] {
  if (pairCount < 1) {
    throw new Error("pairCount must be at least 1");
  }

  // Default pairIds become "1", "2", ... so they map cleanly to img-test1.png etc.
  const ids = pairIds ?? Array.from({ length: pairCount }, (_, i) => String(i + 1));

  if (ids.length !== pairCount) {
    throw new Error("pairIds length must match pairCount");
  }

  const cards: Card[] = [];

  for (const pairId of ids) {
    cards.push(
      { id: `${pairId}-a`, pairId, state: "hidden" },
      { id: `${pairId}-b`, pairId, state: "hidden" },
    );
  }

  return shuffle(cards);
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}