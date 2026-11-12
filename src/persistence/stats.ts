import type { DifficultyStats } from "./types";

export interface CompletedGameRecord {
  stats: DifficultyStats;
  isBestMoves: boolean;
  isBestTime: boolean;
}

export function createEmptyStats(): DifficultyStats {
  return {
    gamesPlayed: 0,
    bestMoves: null,
    bestTimeMs: null,
  };
}

/**
 * Records a completed game without mutating the previous stats object.
 * A record is only replaced when the new run is strictly better.
 */
export function recordCompletedGame(
  stats: DifficultyStats,
  moves: number,
  timeMs: number,
): CompletedGameRecord {
  const safeMoves = Math.max(1, Math.round(moves));
  const safeTime = Math.max(0, Math.round(timeMs));

  const isBestMoves = stats.bestMoves === null || safeMoves < stats.bestMoves;
  const isBestTime = stats.bestTimeMs === null || safeTime < stats.bestTimeMs;

  return {
    stats: {
      gamesPlayed: stats.gamesPlayed + 1,
      bestMoves: isBestMoves ? safeMoves : stats.bestMoves,
      bestTimeMs: isBestTime ? safeTime : stats.bestTimeMs,
    },
    isBestMoves,
    isBestTime,
  };
}
