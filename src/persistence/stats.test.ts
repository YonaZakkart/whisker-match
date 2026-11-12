import { describe, expect, it } from "vitest";
import { createEmptyStats, recordCompletedGame } from "./stats";

describe("recordCompletedGame", () => {
  it("stores the first completed run as both records", () => {
    const result = recordCompletedGame(createEmptyStats(), 12, 45_000);

    expect(result.stats).toEqual({
      gamesPlayed: 1,
      bestMoves: 12,
      bestTimeMs: 45_000,
    });
    expect(result.isBestMoves).toBe(true);
    expect(result.isBestTime).toBe(true);
  });

  it("counts every completed game without replacing worse records", () => {
    const first = recordCompletedGame(createEmptyStats(), 12, 45_000);
    const second = recordCompletedGame(first.stats, 18, 60_000);

    expect(second.stats).toEqual({
      gamesPlayed: 2,
      bestMoves: 12,
      bestTimeMs: 45_000,
    });
    expect(second.isBestMoves).toBe(false);
    expect(second.isBestTime).toBe(false);
  });

  it("replaces records independently when a new run is better", () => {
    const first = recordCompletedGame(createEmptyStats(), 12, 45_000);
    const faster = recordCompletedGame(first.stats, 12, 30_000);

    expect(faster.stats.bestMoves).toBe(12);
    expect(faster.stats.bestTimeMs).toBe(30_000);
    expect(faster.isBestMoves).toBe(false);
    expect(faster.isBestTime).toBe(true);

    const fewerMoves = recordCompletedGame(faster.stats, 10, 40_000);

    expect(fewerMoves.stats.bestMoves).toBe(10);
    expect(fewerMoves.stats.bestTimeMs).toBe(30_000);
    expect(fewerMoves.isBestMoves).toBe(true);
    expect(fewerMoves.isBestTime).toBe(false);
  });

  it("does not mutate the previous stats object", () => {
    const previous = createEmptyStats();

    recordCompletedGame(previous, 8, 20_000);

    expect(previous).toEqual({
      gamesPlayed: 0,
      bestMoves: null,
      bestTimeMs: null,
    });
  });
});
