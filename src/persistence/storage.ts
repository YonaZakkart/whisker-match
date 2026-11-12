import {
  type CardState,
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
    settings: { difficulty },
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
  if (!isRecord(value) || value.version !== STORAGE_VERSION) {
    return null;
  }

  const defaults = createDefaultData();
  const difficulty =
    isRecord(value.settings) && isDifficultyId(value.settings.difficulty)
      ? value.settings.difficulty
      : defaults.settings.difficulty;

  return {
    version: STORAGE_VERSION,
    settings: { difficulty },
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
  if (!state) return null;

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

  if (!isNonNegativeInteger(value.matchedPairs) || value.matchedPairs > value.totalPairs) {
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
    cards.push({
      id: rawCard.id,
      pairId: rawCard.pairId,
      state: rawCard.state,
    });
  }

  return {
    cards,
    phase: value.phase,
    selectedIds: [...value.selectedIds],
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
