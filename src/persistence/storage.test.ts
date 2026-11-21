import { createInitialState, reduce } from "@/game";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, createDefaultData, loadData, saveData } from "./storage";
import { type PersistedData, STORAGE_VERSION } from "./types";

beforeEach(() => {
  localStorage.clear();
});

function writeActiveGame(activeGame: unknown) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...createDefaultData("relaxed"),
      activeGame,
    }),
  );
}

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

  it("keeps a valid mid-move save", () => {
    const state = createInitialState(3, ["1", "2", "3"]);
    const first = state.cards[0];
    const next = reduce(state, { type: "SELECT_CARD", cardId: first.id });

    writeActiveGame({ difficulty: "relaxed", state: next, elapsedMs: 1_500, savedAt: 10 });

    const loaded = loadData().activeGame;

    expect(loaded?.state).toEqual(next);
    expect(loaded?.elapsedMs).toBe(1_500);
  });

  it("keeps a valid resolving save", () => {
    const state = createInitialState(3, ["1", "2", "3"]);
    const first = state.cards[0];
    const second = state.cards.find((card) => card.pairId !== first.pairId)!;
    const afterFirst = reduce(state, { type: "SELECT_CARD", cardId: first.id });
    const resolving = reduce(afterFirst, { type: "SELECT_CARD", cardId: second.id });

    expect(resolving.phase).toBe("resolving");
    writeActiveGame({ difficulty: "relaxed", state: resolving, elapsedMs: 2_000, savedAt: 10 });

    expect(loadData().activeGame?.state).toEqual(resolving);
  });

  it("rejects active games with unpaired cards", () => {
    const state = createInitialState(3, ["1", "2", "3"]);
    const first = state.cards[0];
    const other = state.cards.find((card) => card.pairId !== first.pairId)!;
    const cards = state.cards.map((card) =>
      card.id === first.id ? { ...card, pairId: other.pairId } : card,
    );

    writeActiveGame({
      difficulty: "relaxed",
      state: { ...state, cards },
      elapsedMs: 0,
      savedAt: 0,
    });

    expect(loadData().activeGame).toBeNull();
  });

  it("rejects active games whose phase does not match the selection", () => {
    const state = createInitialState(3, ["1", "2", "3"]);

    writeActiveGame({
      difficulty: "relaxed",
      state: { ...state, phase: "resolving" },
      elapsedMs: 0,
      savedAt: 0,
    });

    expect(loadData().activeGame).toBeNull();
  });

  it("rejects active games with face-up cards outside the selection", () => {
    const state = createInitialState(3, ["1", "2", "3"]);
    const first = state.cards[0];
    const other = state.cards.find((card) => card.id !== first.id)!;
    const afterFirst = reduce(state, { type: "SELECT_CARD", cardId: first.id });
    const cards = afterFirst.cards.map((card) => {
      if (card.id === first.id) return { ...card, state: "hidden" as const };
      if (card.id === other.id) return { ...card, state: "revealed" as const };
      return card;
    });

    writeActiveGame({
      difficulty: "relaxed",
      state: { ...afterFirst, cards },
      elapsedMs: 0,
      savedAt: 0,
    });

    expect(loadData().activeGame).toBeNull();
  });

  it("rejects a resolving save whose selected cards are a matching pair", () => {
    const state = createInitialState(3, ["1", "2", "3"]);
    const pair = state.cards.filter((card) => card.pairId === "1");
    const first = reduce(state, { type: "SELECT_CARD", cardId: pair[0].id });
    const cards = first.cards.map((card) =>
      card.id === pair[1].id ? { ...card, state: "revealed" as const } : card,
    );

    writeActiveGame({
      difficulty: "relaxed",
      state: {
        ...first,
        phase: "resolving",
        selectedIds: [pair[0].id, pair[1].id],
        cards,
        moves: 1,
      },
      elapsedMs: 0,
      savedAt: 0,
    });

    expect(loadData().activeGame).toBeNull();
  });

  it("rejects active games whose matched count disagrees with the board", () => {
    const state = createInitialState(3, ["1", "2", "3"]);

    writeActiveGame({
      difficulty: "relaxed",
      state: { ...state, matchedPairs: 1, moves: 1 },
      elapsedMs: 0,
      savedAt: 0,
    });

    expect(loadData().activeGame).toBeNull();
  });

  it("rejects active games with fewer moves than matched pairs", () => {
    const state = createInitialState(3, ["1", "2", "3"]);
    const pair = state.cards.filter((card) => card.pairId === "1");
    const afterFirst = reduce(state, { type: "SELECT_CARD", cardId: pair[0].id });
    const afterMatch = reduce(afterFirst, { type: "SELECT_CARD", cardId: pair[1].id });

    writeActiveGame({
      difficulty: "relaxed",
      state: { ...afterMatch, moves: 0 },
      elapsedMs: 0,
      savedAt: 0,
    });

    expect(loadData().activeGame).toBeNull();
  });

  it("rejects active games whose board size does not match the difficulty", () => {
    const state = createInitialState(6, ["1", "2", "3", "4", "5", "6"]);

    writeActiveGame({ difficulty: "relaxed", state, elapsedMs: 0, savedAt: 0 });

    expect(loadData().activeGame).toBeNull();
  });

  it("drops a completed game from the active save slot", () => {
    let state = createInitialState(3, ["1", "2", "3"]);

    for (const pairId of ["1", "2", "3"]) {
      const pair = state.cards.filter((card) => card.pairId === pairId);
      state = reduce(state, { type: "SELECT_CARD", cardId: pair[0].id });
      state = reduce(state, { type: "SELECT_CARD", cardId: pair[1].id });
    }

    expect(state.phase).toBe("completed");
    writeActiveGame({ difficulty: "relaxed", state, elapsedMs: 1_000, savedAt: 0 });

    expect(loadData().activeGame).toBeNull();
  });
});
