import { createInitialState } from "@/game";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, createDefaultData, loadData, saveData } from "./storage";
import { type PersistedData, STORAGE_VERSION } from "./types";

beforeEach(() => {
  localStorage.clear();
});

describe("local persistence", () => {
  it("returns safe defaults when nothing has been saved", () => {
    const data = loadData();

    expect(data.version).toBe(STORAGE_VERSION);
    expect(data.settings).toEqual({
      difficulty: "classic",
      cardBackId: "classic",
      backgroundPackId: "whisker-den",
    });
    expect(data.activeGame).toBeNull();
    expect(data.stats.relaxed).toEqual({
      gamesPlayed: 0,
      bestMoves: null,
      bestTimeMs: null,
    });
    expect(data.stats.marathon).toEqual({
      gamesPlayed: 0,
      bestMoves: null,
      bestTimeMs: null,
    });
  });

  it("round-trips settings, stats, and an active game", () => {
    const base = createDefaultData("relaxed");
    const state = createInitialState(3, ["1", "2", "3"]);
    const data: PersistedData = {
      ...base,
      settings: { ...base.settings, cardBackId: "midnight" },
      stats: {
        relaxed: { gamesPlayed: 3, bestMoves: 8, bestTimeMs: 21_000 },
        classic: { gamesPlayed: 1, bestMoves: 4, bestTimeMs: 9_500 },
        marathon: { gamesPlayed: 2, bestMoves: 16, bestTimeMs: 64_000 },
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

  it("migrates version 1 saves without losing records", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: { difficulty: "relaxed" },
        stats: {
          relaxed: { gamesPlayed: 2, bestMoves: 10, bestTimeMs: 30_000 },
          classic: { gamesPlayed: 1, bestMoves: 12, bestTimeMs: 50_000 },
        },
        activeGame: null,
      }),
    );

    const data = loadData();

    expect(data.version).toBe(STORAGE_VERSION);
    expect(data.settings).toEqual({
      difficulty: "relaxed",
      cardBackId: "classic",
      backgroundPackId: "whisker-den",
    });
    expect(data.stats.relaxed.gamesPlayed).toBe(2);
    expect(data.stats.classic.bestMoves).toBe(12);
    expect(data.stats.marathon.gamesPlayed).toBe(0);
  });

  it("replaces unknown personalization ids with defaults", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...createDefaultData("classic"),
        settings: {
          difficulty: "classic",
          cardBackId: "neon",
          backgroundPackId: "missing-pack",
        },
      }),
    );

    expect(loadData().settings).toEqual({
      difficulty: "classic",
      cardBackId: "classic",
      backgroundPackId: "whisker-den",
    });
  });

  it("drops an invalid active game without losing valid stats", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...createDefaultData("relaxed"),
        stats: {
          relaxed: { gamesPlayed: 2, bestMoves: 10, bestTimeMs: 30_000 },
          classic: { gamesPlayed: 0, bestMoves: null, bestTimeMs: null },
          marathon: { gamesPlayed: 0, bestMoves: null, bestTimeMs: null },
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
          marathon: { gamesPlayed: 0, bestMoves: null, bestTimeMs: null },
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
