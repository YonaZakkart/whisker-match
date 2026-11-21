import {
  DEFAULT_BACKGROUND_PACK_ID,
  DEFAULT_CARD_BACK_ID,
  isBackgroundPackId,
  isCardBackId,
} from "@/content";
import {
  type CardState,
  DIFFICULTIES,
  DIFFICULTY_IDS,
  type DifficultyId,
  type GamePhase,
  type GameState,
  isDifficultyId,
} from "@/game";
import { createEmptyStats } from "./stats";
import {
  type DifficultyStats,
  type PersistedData,
  type PersistedGame,
  STORAGE_VERSION,
  type StatsByDifficulty,
} from "./types";

export const STORAGE_KEY = "whisker-match:save";

export function createDefaultData(difficulty: DifficultyId = "classic"): PersistedData {
  const stats = Object.fromEntries(
    DIFFICULTY_IDS.map((id) => [id, createEmptyStats()]),
  ) as StatsByDifficulty;

  return {
    version: STORAGE_VERSION,
    settings: {
      difficulty,
      cardBackId: DEFAULT_CARD_BACK_ID,
      backgroundPackId: DEFAULT_BACKGROUND_PACK_ID,
    },
    stats,
    activeGame: null,
  };
}

export function loadData(storage: Storage | null = getStorage()): PersistedData {
  const fallback = createDefaultData();
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    return parsePersistedData(JSON.parse(raw)) ?? fallback;
  } catch {
    // Corrupt JSON, blocked storage, or a shape we cannot understand.
    return fallback;
  }
}

export function saveData(data: PersistedData, storage: Storage | null = getStorage()): boolean {
  if (!storage) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearData(storage: Storage | null = getStorage()): boolean {
  if (!storage) return false;

  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parsePersistedData(value: unknown): PersistedData | null {
  // Version 1 only stored the difficulty. Migrate it in place instead of
  // throwing away the player's records.
  if (!isRecord(value) || (value.version !== 1 && value.version !== STORAGE_VERSION)) {
    return null;
  }

  const defaults = createDefaultData();
  const settings = isRecord(value.settings) ? value.settings : {};

  return {
    version: STORAGE_VERSION,
    settings: {
      difficulty: isDifficultyId(settings.difficulty)
        ? settings.difficulty
        : defaults.settings.difficulty,
      cardBackId: isCardBackId(settings.cardBackId)
        ? settings.cardBackId
        : defaults.settings.cardBackId,
      backgroundPackId: isBackgroundPackId(settings.backgroundPackId)
        ? settings.backgroundPackId
        : defaults.settings.backgroundPackId,
    },
    stats: parseStats(value.stats, defaults.stats),
    activeGame: parseActiveGame(value.activeGame),
  };
}

function parseStats(value: unknown, fallback: StatsByDifficulty): StatsByDifficulty {
  const result = cloneStats(fallback);
  if (!isRecord(value)) return result;

  for (const id of DIFFICULTY_IDS) {
    const rawStats = value[id];
    if (isRecord(rawStats)) {
      result[id] = parseDifficultyStats(rawStats, fallback[id]);
    }
  }

  return result;
}

function parseDifficultyStats(
  value: Record<string, unknown>,
  fallback: DifficultyStats,
): DifficultyStats {
  const bestMoves =
    value.bestMoves === undefined
      ? fallback.bestMoves
      : value.bestMoves === null
        ? null
        : isPositiveInteger(value.bestMoves)
          ? value.bestMoves
          : fallback.bestMoves;

  const bestTimeMs =
    value.bestTimeMs === undefined
      ? fallback.bestTimeMs
      : value.bestTimeMs === null
        ? null
        : isNonNegativeNumber(value.bestTimeMs)
          ? value.bestTimeMs
          : fallback.bestTimeMs;

  return {
    gamesPlayed: isNonNegativeInteger(value.gamesPlayed) ? value.gamesPlayed : fallback.gamesPlayed,
    bestMoves,
    bestTimeMs,
  };
}

function parseActiveGame(value: unknown): PersistedGame | null {
  if (!isRecord(value) || !isDifficultyId(value.difficulty)) {
    return null;
  }

  const state = parseGameState(value.state);

  // A finished board is never persisted; a saved one is corrupt or stale.
  if (!state || state.phase === "completed") return null;

  if (state.totalPairs !== DIFFICULTIES[value.difficulty].pairs) {
    return null;
  }

  return {
    difficulty: value.difficulty,
    state,
    elapsedMs: isNonNegativeNumber(value.elapsedMs) ? value.elapsedMs : 0,
    savedAt: isNonNegativeNumber(value.savedAt) ? value.savedAt : Date.now(),
  };
}

function parseGameState(value: unknown): GameState | null {
  if (!isRecord(value) || !Array.isArray(value.cards) || !isGamePhase(value.phase)) {
    return null;
  }

  if (!isPositiveInteger(value.totalPairs) || !isNonNegativeInteger(value.moves)) {
    return null;
  }

  if (
    !isNonNegativeInteger(value.matchedPairs) ||
    value.matchedPairs > value.totalPairs ||
    value.moves < value.matchedPairs
  ) {
    return null;
  }

  if (!Array.isArray(value.selectedIds) || value.selectedIds.length > 2) {
    return null;
  }

  if (!value.selectedIds.every((id) => typeof id === "string")) {
    return null;
  }

  if (value.cards.length !== value.totalPairs * 2) {
    return null;
  }

  const cards: GameState["cards"] = [];
  const cardIds = new Set<string>();
  const pairCounts = new Map<string, number>();
  let matchedCards = 0;
  let revealedCards = 0;

  for (const rawCard of value.cards) {
    if (
      !isRecord(rawCard) ||
      typeof rawCard.id !== "string" ||
      typeof rawCard.pairId !== "string" ||
      !isCardState(rawCard.state) ||
      cardIds.has(rawCard.id)
    ) {
      return null;
    }

    cardIds.add(rawCard.id);
    pairCounts.set(rawCard.pairId, (pairCounts.get(rawCard.pairId) ?? 0) + 1);

    if (rawCard.state === "matched") matchedCards++;
    if (rawCard.state === "revealed") revealedCards++;

    cards.push({
      id: rawCard.id,
      pairId: rawCard.pairId,
      state: rawCard.state,
    });
  }

  // Every pair must own exactly two cards, or the board can never be cleared.
  if (pairCounts.size !== value.totalPairs) {
    return null;
  }

  for (const count of pairCounts.values()) {
    if (count !== 2) return null;
  }

  if (matchedCards !== value.matchedPairs * 2) {
    return null;
  }

  const selectedIds = [...value.selectedIds];

  if (new Set(selectedIds).size !== selectedIds.length) {
    return null;
  }

  if (!selectedIds.every((id) => cardIds.has(id))) {
    return null;
  }

  // The phase, the selection, and the face-up cards must agree.
  const expectedSelected = value.phase === "oneSelected" ? 1 : value.phase === "resolving" ? 2 : 0;

  if (selectedIds.length !== expectedSelected || revealedCards !== expectedSelected) {
    return null;
  }

  const revealedIds = new Set(
    cards.filter((card) => card.state === "revealed").map((card) => card.id),
  );

  if (selectedIds.length !== revealedIds.size || !selectedIds.every((id) => revealedIds.has(id))) {
    return null;
  }

  // A resolving state is a visible mismatch; two cards of one pair would have
  // matched immediately and cannot be resolved.
  if (value.phase === "resolving") {
    const selectedPairIds = new Set(
      cards.filter((card) => selectedIds.includes(card.id)).map((card) => card.pairId),
    );

    if (selectedPairIds.size !== 2) {
      return null;
    }
  }

  if (value.phase === "completed" && value.matchedPairs !== value.totalPairs) {
    return null;
  }

  return {
    cards,
    phase: value.phase,
    selectedIds,
    moves: value.moves,
    matchedPairs: value.matchedPairs,
    totalPairs: value.totalPairs,
  };
}

function cloneStats(stats: StatsByDifficulty): StatsByDifficulty {
  return Object.fromEntries(
    DIFFICULTY_IDS.map((id) => [id, { ...stats[id] }]),
  ) as StatsByDifficulty;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGamePhase(value: unknown): value is GamePhase {
  return (
    value === "idle" || value === "oneSelected" || value === "resolving" || value === "completed"
  );
}

function isCardState(value: unknown): value is CardState {
  return value === "hidden" || value === "revealed" || value === "matched";
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
