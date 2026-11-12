import { describe, expect, it } from "vitest";
import { CARD_BACKS, DEFAULT_CARD_BACK_ID, getCardBack, isCardBackId } from "./cardBacks";

describe("card back catalog", () => {
  it("exposes the three selectable backs", () => {
    expect(CARD_BACKS.map((back) => back.id)).toEqual(["classic", "midnight", "forest"]);
    expect(CARD_BACKS.map((back) => back.name)).toEqual(["Classic", "Black", "Green"]);

    for (const back of CARD_BACKS) {
      expect(back.image).toMatch(/^\/cards\/backs\/.+\.png$/);
    }
  });

  it("falls back to the default back for unknown ids", () => {
    expect(getCardBack(DEFAULT_CARD_BACK_ID).id).toBe("classic");
    expect(isCardBackId("forest")).toBe(true);
    expect(isCardBackId("neon")).toBe(false);
  });
});
