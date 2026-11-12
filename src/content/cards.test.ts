import { describe, expect, it } from "vitest";
import { CAT_CARDS, getCatCard, selectRandomPairIds } from "./cards";

describe("cat card catalog", () => {
  it("exposes readable names and art paths for every card", () => {
    expect(CAT_CARDS).toHaveLength(8);

    for (const card of CAT_CARDS) {
      expect(card.name.length).toBeGreaterThan(0);
      expect(card.image).toMatch(/^\/cards\/cats\/.+\.png$/);
    }

    expect(getCatCard("1")?.name).toBe("A poco si muy brga");
    expect(getCatCard("7")?.name).toBe("Tabby Cat Holding Mug");
  });

  it("selects the requested number of unique cards", () => {
    const ids = selectRandomPairIds(3, () => 0.5);

    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(ids.every((id) => getCatCard(id) !== undefined)).toBe(true);
  });

  it("can build a full board from all eight cats", () => {
    const ids = selectRandomPairIds(8, () => 0.25);

    expect(new Set(ids)).toEqual(new Set(CAT_CARDS.map((card) => card.pairId)));
  });

  it("uses the injected random source deterministically", () => {
    const first = selectRandomPairIds(4, () => 0.3);
    const second = selectRandomPairIds(4, () => 0.3);

    expect(first).toEqual(second);
  });

  it("rejects invalid pair counts", () => {
    expect(() => selectRandomPairIds(0)).toThrow("pairCount must be a positive integer");
    expect(() => selectRandomPairIds(1.5)).toThrow("pairCount must be a positive integer");
    expect(() => selectRandomPairIds(9)).toThrow("only contains 8 pairs");
  });
});
