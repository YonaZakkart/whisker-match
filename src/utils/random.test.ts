import { describe, expect, it } from "vitest";
import { pickIndex } from "./random";

describe("pickIndex", () => {
  it("maps a random value to an index inside the bound", () => {
    expect(pickIndex(() => 0, 4)).toBe(0);
    expect(pickIndex(() => 0.5, 4)).toBe(2);
    expect(pickIndex(() => 0.999, 4)).toBe(3);
  });

  it("clamps boundary and non-finite random values", () => {
    expect(pickIndex(() => 1, 4)).toBe(3);
    expect(pickIndex(() => -1, 4)).toBe(0);
    expect(pickIndex(() => Number.NaN, 4)).toBe(0);
    expect(pickIndex(() => Number.POSITIVE_INFINITY, 4)).toBe(0);
  });

  it("rejects an invalid upper bound", () => {
    expect(() => pickIndex(() => 0.5, 0)).toThrow("upperBound must be a positive integer");
    expect(() => pickIndex(() => 0.5, 1.5)).toThrow("upperBound must be a positive integer");
  });
});
