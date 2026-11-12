import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "./gameMachine";
import type { Card, CardId, PairId } from "./types";

function cardByPair(cards: Card[], pairId: PairId, index = 0): Card {
  const pair = cards.filter((card) => card.pairId === pairId);
  const card = pair[index];

  if (!card) {
    throw new Error(`Card ${index} for pair ${pairId} not found`);
  }

  return card;
}

function firstHiddenCard(cards: Card[], excludedIds: CardId[] = []): Card {
  const card = cards.find(
    (candidate) => candidate.state === "hidden" && !excludedIds.includes(candidate.id),
  );

  if (!card) {
    throw new Error("No hidden card available");
  }

  return card;
}

describe("memory game rules", () => {
  it("starts idle with every card hidden", () => {
    const state = createInitialState(2, ["1", "2"]);

    expect(state.phase).toBe("idle");
    expect(state.moves).toBe(0);
    expect(state.matchedPairs).toBe(0);
    expect(state.cards).toHaveLength(4);
    expect(state.cards.every((card) => card.state === "hidden")).toBe(true);
  });

  it("completes a matching move and keeps the pair face-up", () => {
    const state = createInitialState(2, ["1", "2"]);
    const first = cardByPair(state.cards, "1", 0);
    const second = cardByPair(state.cards, "1", 1);

    const afterFirst = reduce(state, { type: "SELECT_CARD", cardId: first.id });
    expect(afterFirst.phase).toBe("oneSelected");
    expect(afterFirst.selectedIds).toEqual([first.id]);

    const afterSecond = reduce(afterFirst, { type: "SELECT_CARD", cardId: second.id });

    expect(afterSecond.moves).toBe(1);
    expect(afterSecond.matchedPairs).toBe(1);
    expect(afterSecond.phase).toBe("idle");
    expect(afterSecond.cards.filter((card) => card.state === "matched")).toHaveLength(2);
  });

  it("keeps a mismatch visible and blocks further selections until it resolves", () => {
    const state = createInitialState(2, ["1", "2"]);
    const first = cardByPair(state.cards, "1", 0);
    const second = cardByPair(state.cards, "2", 0);

    const afterFirst = reduce(state, { type: "SELECT_CARD", cardId: first.id });
    const afterSecond = reduce(afterFirst, { type: "SELECT_CARD", cardId: second.id });

    expect(afterSecond.phase).toBe("resolving");
    expect(afterSecond.selectedIds).toEqual([first.id, second.id]);
    expect(afterSecond.moves).toBe(1);
    expect(afterSecond.cards.filter((card) => card.state === "revealed")).toHaveLength(2);

    const third = firstHiddenCard(afterSecond.cards);
    expect(reduce(afterSecond, { type: "SELECT_CARD", cardId: third.id })).toBe(afterSecond);

    const resolved = reduce(afterSecond, { type: "RESOLVE_MISMATCH" });

    expect(resolved.phase).toBe("idle");
    expect(resolved.selectedIds).toEqual([]);
    expect(resolved.cards.every((card) => card.state === "hidden")).toBe(true);
  });

  it("does not allow the same card twice in one move", () => {
    const state = createInitialState(2, ["1", "2"]);
    const first = cardByPair(state.cards, "1", 0);
    const afterFirst = reduce(state, { type: "SELECT_CARD", cardId: first.id });

    expect(reduce(afterFirst, { type: "SELECT_CARD", cardId: first.id })).toBe(afterFirst);
  });

  it("does not allow an already matched card to be selected", () => {
    const state = createInitialState(2, ["1", "2"]);
    const first = cardByPair(state.cards, "1", 0);
    const second = cardByPair(state.cards, "1", 1);
    const afterMatch = reduce(reduce(state, { type: "SELECT_CARD", cardId: first.id }), {
      type: "SELECT_CARD",
      cardId: second.id,
    });

    expect(reduce(afterMatch, { type: "SELECT_CARD", cardId: first.id })).toBe(afterMatch);
  });

  it("completes the game when the final pair is matched", () => {
    const state = createInitialState(1, ["1"]);
    const first = cardByPair(state.cards, "1", 0);
    const second = cardByPair(state.cards, "1", 1);

    const afterMatch = reduce(reduce(state, { type: "SELECT_CARD", cardId: first.id }), {
      type: "SELECT_CARD",
      cardId: second.id,
    });

    expect(afterMatch.phase).toBe("completed");
    expect(afterMatch.matchedPairs).toBe(1);
    expect(afterMatch.moves).toBe(1);
  });

  it("resets the board while preserving its size and pairs", () => {
    const state = createInitialState(2, ["1", "2"]);
    const first = cardByPair(state.cards, "1", 0);
    const second = cardByPair(state.cards, "1", 1);
    const afterMatch = reduce(reduce(state, { type: "SELECT_CARD", cardId: first.id }), {
      type: "SELECT_CARD",
      cardId: second.id,
    });

    const reset = reduce(afterMatch, { type: "RESET" });

    expect(reset.phase).toBe("idle");
    expect(reset.moves).toBe(0);
    expect(reset.matchedPairs).toBe(0);
    expect(reset.totalPairs).toBe(2);
    expect(reset.cards).toHaveLength(4);
    expect(reset.cards.every((card) => card.state === "hidden")).toBe(true);
    expect(new Set(reset.cards.map((card) => card.pairId))).toEqual(new Set(["1", "2"]));
  });

  it("ignores a mismatch resolution outside the resolving phase", () => {
    const state = createInitialState(2, ["1", "2"]);

    expect(reduce(state, { type: "RESOLVE_MISMATCH" })).toBe(state);
  });
});
