import { MISMATCH_DELAY_MS } from "@/game";
import { createDefaultData } from "@/persistence/storage";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "whisker-match:save";
const CATALOG_IDS = ["1", "2", "3", "4", "5", "6", "7", "8"];

async function loadStore() {
  const module = await import("./gameStore");
  return module.gameStore;
}

type Store = Awaited<ReturnType<typeof loadStore>>;

function seedCollection(collection: { ownedPairIds: string[]; pawprints: number }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createDefaultData(), collection }));
}

function completeCurrentGame(store: Store) {
  const pairIds = [...new Set(store.game.cards.map((card) => card.pairId))];

  for (const pairId of pairIds) {
    const pair = store.game.cards.filter((card) => card.pairId === pairId);
    store.selectCard(pair[0].id);
    store.selectCard(pair[1].id);
  }
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
  vi.restoreAllMocks();
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
    expect(store.lastResult()?.isBestMoves).toBe(true);
    expect(store.lastResult()?.isBestTime).toBe(true);
    expect(store.savedGame()).toBeNull();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.activeGame).toBeNull();
    expect(saved.stats.relaxed.gamesPlayed).toBe(1);
    expect(saved.stats.relaxed.bestMoves).toBe(3);
    expect(saved.stats.relaxed.bestTimeMs).not.toBeNull();
  });

  it("does not resume a resolving game — mismatches are not persisted", async () => {
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

    expect(store.hasSavedGame()).toBe(false);
    store.continueGame();
    expect(store.game.phase).toBe("idle");
    expect(store.game.moves).toBe(0);
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

  it("loads the persisted collection into the initial state", async () => {
    seedCollection({ ownedPairIds: ["1", "2"], pawprints: 4 });

    const store = await loadStore();

    expect(store.collection()).toEqual({ ownedPairIds: ["1", "2"], pawprints: 4 });
  });

  it("grants one new card and persists it with the completed game", async () => {
    const store = await loadStore();
    store.startGame("relaxed");
    vi.spyOn(Math, "random").mockReturnValue(0);

    const pairIds = [...new Set(store.game.cards.map((card) => card.pairId))];
    const lastPairId = pairIds[pairIds.length - 1];
    const lastPair = store.game.cards.filter((card) => card.pairId === lastPairId);

    for (const pairId of pairIds.slice(0, -1)) {
      const pair = store.game.cards.filter((card) => card.pairId === pairId);
      store.selectCard(pair[0].id);
      store.selectCard(pair[1].id);
    }

    store.selectCard(lastPair[0].id);

    const setItem = vi.spyOn(Storage.prototype, "setItem");
    store.selectCard(lastPair[1].id);

    expect(setItem).toHaveBeenCalledTimes(1);
    expect(store.collection()).toEqual({ ownedPairIds: ["1"], pawprints: 0 });
    expect(store.lastReward()?.kind).toBe("new-card");
    expect(store.lastReward()?.pairId).toBe("1");

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.collection).toEqual({ ownedPairIds: ["1"], pawprints: 0 });
    expect(saved.activeGame).toBeNull();
    expect(saved.stats.relaxed.gamesPlayed).toBe(1);
  });

  it("turns a duplicate reward into one Lost Pawprint", async () => {
    seedCollection({ ownedPairIds: CATALOG_IDS, pawprints: 2 });

    const store = await loadStore();
    store.startGame("relaxed");
    vi.spyOn(Math, "random").mockReturnValue(0);
    completeCurrentGame(store);

    expect(store.lastReward()?.kind).toBe("duplicate");
    expect(store.collection()).toEqual({ ownedPairIds: CATALOG_IDS, pawprints: 3 });

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.collection).toEqual({ ownedPairIds: CATALOG_IDS, pawprints: 3 });
  });

  it("does not grant a reward when the player leaves or restarts", async () => {
    const store = await loadStore();
    store.startGame("relaxed");

    store.goToMenu();
    store.restartGame();

    expect(store.collection()).toEqual({ ownedPairIds: [], pawprints: 0 });
    expect(store.lastReward()).toBeNull();
  });

  it("does not grant another card after reloading a completed game", async () => {
    const store = await loadStore();
    store.startGame("relaxed");
    vi.spyOn(Math, "random").mockReturnValue(0);
    completeCurrentGame(store);

    const collectionAfterCompletion = store.collection();

    vi.resetModules();
    const reloaded = await loadStore();

    expect(reloaded.collection()).toEqual(collectionAfterCompletion);
    expect(reloaded.lastReward()).toBeNull();
  });

  it("exchanges three pawprints for a new card and persists it", async () => {
    seedCollection({ ownedPairIds: ["1"], pawprints: 3 });

    const store = await loadStore();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const reward = store.exchangePawprints();

    expect(reward?.source).toBe("exchange");
    expect(reward?.kind).toBe("new-card");
    expect(reward?.pairId).toBe("5");
    expect(store.collection()).toEqual({ ownedPairIds: ["1", "5"], pawprints: 0 });
    expect(store.lastExchange()).toEqual(reward);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.collection).toEqual({ ownedPairIds: ["1", "5"], pawprints: 0 });

    store.clearLastExchange();
    expect(store.lastExchange()).toBeNull();
  });

  it("refunds one pawprint when an exchange yields a duplicate", async () => {
    seedCollection({ ownedPairIds: ["1"], pawprints: 3 });

    const store = await loadStore();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const reward = store.exchangePawprints();

    expect(reward?.kind).toBe("duplicate");
    expect(store.collection()).toEqual({ ownedPairIds: ["1"], pawprints: 1 });
  });

  it("blocks exchanges without enough pawprints or with a complete collection", async () => {
    seedCollection({ ownedPairIds: ["1"], pawprints: 2 });

    let store = await loadStore();
    expect(store.exchangePawprints()).toBeNull();
    expect(store.collection()).toEqual({ ownedPairIds: ["1"], pawprints: 2 });

    vi.resetModules();
    seedCollection({ ownedPairIds: CATALOG_IDS, pawprints: 3 });
    store = await loadStore();

    expect(store.exchangePawprints()).toBeNull();
    expect(store.collection()).toEqual({ ownedPairIds: CATALOG_IDS, pawprints: 3 });
  });

  it("opens the collection screen and clears the exchange result on exit", async () => {
    seedCollection({ ownedPairIds: ["1"], pawprints: 3 });

    const store = await loadStore();
    store.goToCollection();
    expect(store.screen()).toBe("collection");

    vi.spyOn(Math, "random").mockReturnValue(0.5);
    store.exchangePawprints();
    expect(store.lastExchange()).not.toBeNull();

    store.goToMenu();
    expect(store.screen()).toBe("menu");
    expect(store.lastExchange()).toBeNull();
  });
});
