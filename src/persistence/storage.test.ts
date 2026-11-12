import { createInitialState } from "@/game";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, createDefaultData, loadData, saveData } from "./storage";
import type { PersistedData } from "./types";

beforeEach(() => {
  localStorage.clear();
});

describe("local persistence", () => {
  it("returns safe defaults when nothing has been saved", () => {
    const data = loadData();

    expect(data.version).toBe(1);
    expect(data.settings.difficulty).toBe("classic");
    expect(data.activeGame).toBeNull();
    expect(data.stats.relaxed).toEqual({
      gamesPlayed: 0,
      bestMoves: null,
      bestTimeMs: null,
    });
  });

  it("round-trips settings, stats, and an active game", () => {
    const state = createInitialState(3, ["1", "2", "3"]);
    const data: PersistedData = {
      ...createDefaultData("relaxed"),
      stats: {
        relaxed: { gamesPlayed: 3, bestMoves: 8, bestTimeMs: 21_000 },
        classic: { gamesPlayed: 1, bestMoves: 4, bestTimeMs: 9_500 },
      },
      activeGame: {
        difficulty: "relaxed",
        state,
        elapsedMs: 12_345,
        savedAt: 1_700_000_000_000,
      },
    };

    expect(saveData(data)).toBe(true);
    expect(loadData()).toEqual(data);
  });

  it("falls back to defaults for invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");

    expect(loadData()).toEqual(createDefaultData());
  });

  it("falls back to defaults for an unsupported schema version", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));

    expect(loadData()).toEqual(createDefaultData());
  });

  it("drops an invalid active game without losing valid stats", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...createDefaultData("relaxed"),
        stats: {
          relaxed: { gamesPlayed: 2, bestMoves: 10, bestTimeMs: 30_000 },
          classic: { gamesPlayed: 0, bestMoves: null, bestTimeMs: null },
        },
        activeGame: {
          difficulty: "relaxed",
          elapsedMs: 0,
          savedAt: 0,
          state: { cards: [], phase: "idle" },
        },
      }),
    );

    const data = loadData();

    expect(data.activeGame).toBeNull();
    expect(data.stats.relaxed.gamesPlayed).toBe(2);
    expect(data.stats.relaxed.bestMoves).toBe(10);
  });

  it("replaces malformed nested stats with safe values", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...createDefaultData(),
        stats: {
          relaxed: { gamesPlayed: -2, bestMoves: "many", bestTimeMs: null },
          classic: { gamesPlayed: 0, bestMoves: null, bestTimeMs: null },
        },
      }),
    );

    expect(loadData().stats.relaxed).toEqual({
      gamesPlayed: 0,
      bestMoves: null,
      bestTimeMs: null,
    });
  });
});
