import { describe, expect, it } from "vitest";
import {
  TIME_PERIODS,
  getBackgroundImage,
  getBackgroundPack,
  getTimePeriod,
  isBackgroundPackId,
  isTimePeriod,
} from "./backgrounds";

describe("time-based backgrounds", () => {
  it("maps hours to the four time periods", () => {
    expect(getTimePeriod(new Date(2026, 0, 1, 0, 0))).toBe("midnight");
    expect(getTimePeriod(new Date(2026, 0, 1, 5, 59))).toBe("midnight");
    expect(getTimePeriod(new Date(2026, 0, 1, 6, 0))).toBe("morning");
    expect(getTimePeriod(new Date(2026, 0, 1, 11, 59))).toBe("morning");
    expect(getTimePeriod(new Date(2026, 0, 1, 12, 0))).toBe("afternoon");
    expect(getTimePeriod(new Date(2026, 0, 1, 17, 59))).toBe("afternoon");
    expect(getTimePeriod(new Date(2026, 0, 1, 18, 0))).toBe("evening");
    expect(getTimePeriod(new Date(2026, 0, 1, 23, 59))).toBe("evening");
  });

  it("resolves a pack image for every time period", () => {
    const pack = getBackgroundPack("whisker-den");

    for (const period of TIME_PERIODS) {
      expect(pack.images[period]).toBe(`/backgrounds/whisker-den/${period}.png`);
      expect(getBackgroundImage("whisker-den", period)).toBe(pack.images[period]);
    }
  });

  it("validates pack and period ids", () => {
    expect(isBackgroundPackId("whisker-den")).toBe(true);
    expect(isBackgroundPackId("missing-pack")).toBe(false);
    expect(isTimePeriod("evening")).toBe(true);
    expect(isTimePeriod("noon")).toBe(false);
  });
});
