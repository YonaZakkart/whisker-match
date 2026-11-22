import { describe, expect, it, vi } from "vitest";
import { EXCHANGE_COST, canExchange, createEmptyCollection, exchange, rollReward } from "./index";
import type { CollectionState } from "./types";

const CATALOG = ["1", "2", "3", "4"];
const FULL_CATALOG: CollectionState = {
  ownedPairIds: [...CATALOG],
  pawprints: 3,
};

function collectionWith(ownedPairIds: string[], pawprints: number): CollectionState {
  return { ownedPairIds, pawprints };
}

describe("collection domain", () => {
  it("starts empty", () => {
    expect(createEmptyCollection()).toEqual({ ownedPairIds: [], pawprints: 0 });
  });

  it("exposes an exchange cost of three pawprints", () => {
    expect(EXCHANGE_COST).toBe(3);
  });

  describe("rollReward", () => {
    it("adds a new card without touching the pawprint balance", () => {
      const reward = rollReward(collectionWith([], 2), CATALOG, () => 0);

      expect(reward.source).toBe("game");
      expect(reward.kind).toBe("new-card");
      expect(reward.pairId).toBe("1");
      expect(reward.collection).toEqual({ ownedPairIds: ["1"], pawprints: 2 });
    });

    it("picks uniformly across the whole catalog, including owned cards", () => {
      const last = rollReward(collectionWith(["1"], 0), CATALOG, () => 0.999999);
      const middle = rollReward(collectionWith([], 0), CATALOG, () => 0.5);

      expect(last.pairId).toBe("4");
      expect(middle.pairId).toBe("3");
    });

    it("turns a duplicate into exactly one Lost Pawprint", () => {
      const reward = rollReward(collectionWith(["1", "2"], 4), CATALOG, () => 0);

      expect(reward.kind).toBe("duplicate");
      expect(reward.pairId).toBe("1");
      expect(reward.collection).toEqual({ ownedPairIds: ["1", "2"], pawprints: 5 });
    });

    it("can return a duplicate once the collection is complete", () => {
      const reward = rollReward(FULL_CATALOG, CATALOG, () => 0);

      expect(reward.kind).toBe("duplicate");
      expect(reward.collection.pawprints).toBe(4);
    });

    it("does not mutate the input collection", () => {
      const input = collectionWith(["1"], 2);
      const ownedBefore = [...input.ownedPairIds];

      rollReward(input, CATALOG, () => 0.999999);

      expect(input).toEqual({ ownedPairIds: ["1"], pawprints: 2 });
      expect(input.ownedPairIds).toEqual(ownedBefore);
    });

    it("preserves unknown owned ids", () => {
      const reward = rollReward(collectionWith(["99"], 0), CATALOG, () => 0);

      expect(reward.collection.ownedPairIds).toEqual(["99", "1"]);
    });

    it("rejects an empty catalog", () => {
      expect(() => rollReward(createEmptyCollection(), [])).toThrow("catalog must not be empty");
    });
  });

  describe("canExchange", () => {
    it("requires at least three pawprints", () => {
      expect(canExchange(collectionWith(["1"], 2), CATALOG)).toBe(false);
      expect(canExchange(collectionWith(["1"], 3), CATALOG)).toBe(true);
    });

    it("blocks a complete collection", () => {
      expect(canExchange(FULL_CATALOG, CATALOG)).toBe(false);
    });

    it("only counts known cards toward completion", () => {
      expect(canExchange(collectionWith(["1", "2", "3", "99"], 3), CATALOG)).toBe(true);
    });

    it("blocks an empty catalog", () => {
      expect(canExchange(collectionWith([], 10), [])).toBe(false);
    });
  });

  describe("exchange", () => {
    it("returns null without enough pawprints and does not roll", () => {
      const random = vi.fn(() => 0);

      expect(exchange(collectionWith(["1"], 2), CATALOG, random)).toBeNull();
      expect(random).not.toHaveBeenCalled();
    });

    it("returns null when the collection is complete", () => {
      expect(exchange(FULL_CATALOG, CATALOG, () => 0)).toBeNull();
    });

    it("spends three pawprints for a new card", () => {
      const reward = exchange(collectionWith(["1"], 3), CATALOG, () => 0.3);

      expect(reward).not.toBeNull();
      expect(reward?.source).toBe("exchange");
      expect(reward?.kind).toBe("new-card");
      expect(reward?.pairId).toBe("2");
      expect(reward?.collection).toEqual({ ownedPairIds: ["1", "2"], pawprints: 0 });
    });

    it("refunds one pawprint when the exchange yields a duplicate", () => {
      const reward = exchange(collectionWith(["1"], 3), CATALOG, () => 0);

      expect(reward?.kind).toBe("duplicate");
      expect(reward?.pairId).toBe("1");
      expect(reward?.collection).toEqual({ ownedPairIds: ["1"], pawprints: 1 });
    });

    it("has a net cost of two pawprints for a duplicate", () => {
      const reward = exchange(collectionWith(["1", "2"], 5), CATALOG, () => 0);

      expect(reward?.collection.pawprints).toBe(3);
    });

    it("does not mutate the input collection", () => {
      const input = collectionWith(["1"], 3);

      exchange(input, CATALOG, () => 0.3);

      expect(input).toEqual({ ownedPairIds: ["1"], pawprints: 3 });
    });
  });
});
