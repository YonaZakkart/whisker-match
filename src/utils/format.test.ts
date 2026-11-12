import { describe, expect, it } from "vitest";
import { formatDuration } from "./format";

describe("formatDuration", () => {
  it("formats milliseconds as minutes and seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(5_000)).toBe("0:05");
    expect(formatDuration(65_400)).toBe("1:05");
    expect(formatDuration(600_000)).toBe("10:00");
  });

  it("never returns a negative time", () => {
    expect(formatDuration(-5_000)).toBe("0:00");
  });
});
