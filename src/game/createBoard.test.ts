import { describe, expect, it } from "vitest";
import { createBoard } from "./createBoard";

describe("createBoard", () => {
  it("creates exactly two cards for every pair", () => {
    const board = createBoard(3, ["1", "2", "3"]);

    expect(board).toHaveLength(6);
    expect(board.filter((card) => card.pairId === "1")).toHaveLength(2);
    expect(board.filter((card) => card.pairId === "2")).toHaveLength(2);
    expect(board.filter((card) => card.pairId === "3")).toHaveLength(2);
  });

  it("starts every card face-down", () => {
    const board = createBoard(2, ["1", "2"]);

    expect(board.every((card) => card.state === "hidden")).toBe(true);
  });

  it("uses the injected random source deterministically", () => {
    const first = createBoard(2, ["1", "2"], () => 0.25);
    const second = createBoard(2, ["1", "2"], () => 0.25);

    expect(first.map((card) => card.id)).toEqual(second.map((card) => card.id));
  });

  it("rejects an invalid pair count", () => {
    expect(() => createBoard(0)).toThrow("pairCount must be a positive integer");
    expect(() => createBoard(1.5)).toThrow("pairCount must be a positive integer");
  });

  it("rejects a mismatched pair id list", () => {
    expect(() => createBoard(2, ["1"])).toThrow("pairIds length must match pairCount");
  });

  it("rejects duplicate pair ids", () => {
    expect(() => createBoard(2, ["1", "1"])).toThrow("pairIds must be unique");
  });
});
