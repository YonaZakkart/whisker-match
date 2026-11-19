import { MISMATCH_DELAY_MS } from "@/game";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "whisker-match:save";

async function loadStore() {
  const module = await import("./gameStore");
  return module.gameStore;
}

function findOtherPair(store: Awaited<ReturnType<typeof loadStore>>) {
  const first = store.game.cards[0];
  const other = store.game.cards.find((card) => card.pairId !== first.pairId);

  if (!other) throw new Error("Expected a card from another pair");
  return other;
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
  vi.resetModules();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("game store session flow", () => {
  it("starts a game and saves it", async () => {
    const store = await loadStore();
    store.startGame("relaxed");

    expect(store.screen()).toBe("game");
    expect(store.game.totalPairs).toBe(3);
    expect(store.game.phase).toBe("idle");
    expect(store.savedGame()).not.toBeNull();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.activeGame.difficulty).toBe("relaxed");
    expect(saved.activeGame.state.totalPairs).toBe(3);
  });

  it("counts a matching move and keeps the pair face-up", async () => {
    const store = await loadStore();
    store.startGame("relaxed");

    const pairId = store.game.cards[0].pairId;
    const pair = store.game.cards.filter((card) => card.pairId === pairId);

    store.selectCard(pair[0].id);
    expect(store.game.phase).toBe("oneSelected");
    store.selectCard(pair[1].id);

    expect(store.game.moves).toBe(1);
    expect(store.game.matchedPairs).toBe(1);
    expect(store.game.phase).toBe("idle");
    expect(store.game.cards.filter((card) => card.state === "matched")).toHaveLength(2);
  });

  it("resolves a mismatch after the delay and blocks extra selections", async () => {
    const store = await loadStore();
    store.startGame("relaxed");

    const first = store.game.cards[0];
    const other = findOtherPair(store);
    const third = store.game.cards.find((card) => card.id !== first.id && card.id !== other.id);

    if (!third) throw new Error("Expected a third card");

    store.selectCard(first.id);
    store.selectCard(other.id);
    expect(store.game.phase).toBe("resolving");

    store.selectCard(third.id);
    expect(store.game.moves).toBe(1);

    vi.advanceTimersByTime(MISMATCH_DELAY_MS);

    expect(store.game.phase).toBe("idle");
    expect(store.game.cards.every((card) => card.state === "hidden")).toBe(true);
  });

  it("records a completed game and clears the active save", async () => {
    const store = await loadStore();
    store.startGame("relaxed");

    const pairIds = [...new Set(store.game.cards.map((card) => card.pairId))];

    for (const pairId of pairIds) {
      const pair = store.game.cards.filter((card) => card.pairId === pairId);
      store.selectCard(pair[0].id);
      store.selectCard(pair[1].id);
    }

    expect(store.game.phase).toBe("completed");
    expect(store.stats.relaxed.gamesPlayed).toBe(1);
    expect(store.lastResult()?.moves).toBe(3);
    expect(store.savedGame()).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).activeGame).toBeNull();
  });

  it("resumes a saved game and completes a pending mismatch", async () => {
    const firstStore = await loadStore();
    firstStore.startGame("relaxed");

    const first = firstStore.game.cards[0];
    const other = findOtherPair(firstStore);

    firstStore.selectCard(first.id);
    firstStore.selectCard(other.id);
    expect(firstStore.game.phase).toBe("resolving");
    firstStore.goToMenu();

    vi.resetModules();
    const store = await loadStore();

    expect(store.hasSavedGame()).toBe(true);
    store.continueGame();
    expect(store.game.phase).toBe("resolving");

    vi.advanceTimersByTime(MISMATCH_DELAY_MS);

    expect(store.game.phase).toBe("idle");
  });

  it("keeps elapsed time when the player leaves and resumes", async () => {
    const store = await loadStore();
    store.startGame("relaxed");

    vi.advanceTimersByTime(5_000);
    store.goToMenu();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.activeGame.elapsedMs).toBeGreaterThanOrEqual(5_000);

    vi.resetModules();
    const resumed = await loadStore();
    resumed.continueGame();

    expect(resumed.elapsedMs()).toBeGreaterThanOrEqual(5_000);
  });

  it("persists personalization choices immediately", async () => {
    const store = await loadStore();

    store.selectCardBack("midnight");
    store.selectDifficulty("marathon");

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.settings.cardBackId).toBe("midnight");
    expect(saved.settings.difficulty).toBe("marathon");
    expect(saved.activeGame).toBeNull();
  });
});
