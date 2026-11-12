import { describe, expect, it } from "vitest";
import { DIFFICULTY_IDS, getPairIdsForDifficulty, isDifficultyId } from "./difficulties";

describe("board sizes", () => {
  it("exposes relaxed, classic, and marathon boards", () => {
    expect(DIFFICULTY_IDS).toEqual(["relaxed", "classic", "marathon"]);
    expect(isDifficultyId("marathon")).toBe(true);
    expect(isDifficultyId("impossible")).toBe(false);
  });

  it("picks the right number of random cards for every board", () => {
    for (const id of DIFFICULTY_IDS) {
      const ids = getPairIdsForDifficulty(id, () => 0.4);

      expect(ids).toHaveLength(id === "relaxed" ? 3 : id === "classic" ? 6 : 8);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
