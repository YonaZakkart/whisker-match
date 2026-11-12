import {
  type CardId,
  DIFFICULTIES,
  type DifficultyId,
  type GameState,
  MISMATCH_DELAY_MS,
  createInitialState,
  getPairIdsForDifficulty,
  isDifficultyId,
  reduce,
} from "@/game";
import { recordCompletedGame } from "@/persistence/stats";
import { loadData, saveData } from "@/persistence/storage";
import { type PersistedData, type PersistedGame, STORAGE_VERSION } from "@/persistence/types";
import { createSignal } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";

export type Screen = "menu" | "game";

export interface GameResult {
  difficulty: DifficultyId;
  moves: number;
  timeMs: number;
  isBestMoves: boolean;
  isBestTime: boolean;
}

const loaded = loadData();
const initialDifficulty = loaded.settings.difficulty;
const initialActiveGame = loaded.activeGame;

const [screen, setScreen] = createSignal<Screen>("menu");
const [difficulty, setDifficulty] = createSignal<DifficultyId>(initialDifficulty);
const [stats, setStats] = createStore(loaded.stats);
const [savedGame, setSavedGame] = createSignal<PersistedGame | null>(initialActiveGame);
const [game, setGame] = createStore<GameState>(
  initialActiveGame?.state ??
    createInitialState(
      DIFFICULTIES[initialDifficulty].pairs,
      getPairIdsForDifficulty(initialDifficulty),
    ),
);
const [elapsedMs, setElapsedMs] = createSignal(initialActiveGame?.elapsedMs ?? 0);
const [lastResult, setLastResult] = createSignal<GameResult | null>(null);

let timerId: number | null = null;
let timerBase = 0;
let timerStartedAt = 0;
let resolveTimer: number | null = null;

function currentDifficultyConfig() {
  return DIFFICULTIES[difficulty()];
}

function hasSavedGame() {
  return savedGame() !== null;
}

function readElapsed(): number {
  return timerId === null ? elapsedMs() : timerBase + Date.now() - timerStartedAt;
}

function startTimer() {
  if (timerId !== null) return;

  timerBase = elapsedMs();
  timerStartedAt = Date.now();
  timerId = window.setInterval(() => {
    setElapsedMs(timerBase + Date.now() - timerStartedAt);
  }, 250);
}

function stopTimer() {
  if (timerId === null) return;

  window.clearInterval(timerId);
  timerId = null;
  setElapsedMs(timerBase + Date.now() - timerStartedAt);
}

function clearResolveTimer() {
  if (resolveTimer === null) return;

  window.clearTimeout(resolveTimer);
  resolveTimer = null;
}

function buildData(activeGame: PersistedGame | null): PersistedData {
  return {
    version: STORAGE_VERSION,
    settings: { difficulty: difficulty() },
    stats: unwrap(stats),
    activeGame,
  };
}

function persistActiveGame(state: GameState, elapsed = readElapsed()) {
  const activeGame: PersistedGame = {
    difficulty: difficulty(),
    state,
    elapsedMs: elapsed,
    savedAt: Date.now(),
  };

  saveData(buildData(activeGame));
  setSavedGame(activeGame);
}

function persistCurrentGame() {
  if (screen() !== "game" || game.phase === "completed") return;

  persistActiveGame(unwrap(game), readElapsed());
}

function persistSettingsAndStats() {
  saveData(buildData(savedGame()));
}

function scheduleMismatchResolution() {
  clearResolveTimer();

  resolveTimer = window.setTimeout(() => {
    resolveTimer = null;

    if (screen() !== "game" || game.phase !== "resolving") return;

    const resolved = reduce(unwrap(game), { type: "RESOLVE_MISMATCH" });
    setGame(reconcile(resolved));
    persistActiveGame(resolved);
  }, MISMATCH_DELAY_MS);
}

function completeGame(finalState: GameState) {
  clearResolveTimer();
  stopTimer();

  const finalElapsed = elapsedMs();
  const record = recordCompletedGame(stats[difficulty()], finalState.moves, finalElapsed);

  setStats(difficulty(), record.stats);
  setLastResult({
    difficulty: difficulty(),
    moves: finalState.moves,
    timeMs: finalElapsed,
    isBestMoves: record.isBestMoves,
    isBestTime: record.isBestTime,
  });

  saveData(buildData(null));
  setSavedGame(null);
}

function startGame(nextDifficulty: DifficultyId = difficulty()) {
  if (!isDifficultyId(nextDifficulty)) return;

  clearResolveTimer();
  stopTimer();

  const nextState = createInitialState(
    DIFFICULTIES[nextDifficulty].pairs,
    getPairIdsForDifficulty(nextDifficulty),
  );

  setDifficulty(nextDifficulty);
  setGame(reconcile(nextState));
  setElapsedMs(0);
  setLastResult(null);
  setScreen("game");
  startTimer();
  persistActiveGame(nextState, 0);
}

function continueGame() {
  const saved = savedGame();
  if (!saved) return;

  if (saved.state.phase === "completed") {
    startGame(saved.difficulty);
    return;
  }

  clearResolveTimer();
  stopTimer();

  setDifficulty(saved.difficulty);
  setGame(reconcile(saved.state));
  setElapsedMs(saved.elapsedMs);
  setLastResult(null);
  setScreen("game");
  startTimer();

  if (saved.state.phase === "resolving") {
    scheduleMismatchResolution();
  }
}

function selectCard(cardId: CardId) {
  if (screen() !== "game" || game.phase === "resolving" || game.phase === "completed") {
    return;
  }

  const current = unwrap(game);
  const next = reduce(current, { type: "SELECT_CARD", cardId });
  if (next === current) return;

  setGame(reconcile(next));

  if (next.phase === "completed") {
    completeGame(next);
    return;
  }

  persistActiveGame(next);

  if (next.phase === "resolving") {
    scheduleMismatchResolution();
  }
}

function restartGame() {
  startGame(difficulty());
}

function goToMenu() {
  clearResolveTimer();

  if (screen() === "game" && game.phase !== "completed") {
    stopTimer();
    persistCurrentGame();
  } else {
    stopTimer();
  }

  setScreen("menu");
}

function selectDifficulty(nextDifficulty: DifficultyId) {
  if (!isDifficultyId(nextDifficulty) || nextDifficulty === difficulty()) return;

  setDifficulty(nextDifficulty);
  persistSettingsAndStats();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", persistCurrentGame);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      persistCurrentGame();
    }
  });
}

export const gameStore = {
  screen,
  difficulty,
  difficultyConfig: currentDifficultyConfig,
  game,
  stats,
  elapsedMs,
  lastResult,
  savedGame,
  hasSavedGame,
  startGame,
  continueGame,
  selectCard,
  restartGame,
  goToMenu,
  selectDifficulty,
};
