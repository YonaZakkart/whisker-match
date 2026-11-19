/**
 * Picks an integer index in `[0, upperBound)` from an injectable random source.
 *
 * `Math.random` already returns a value in `[0, 1)`, but seeded and test
 * sources can return boundary or non-finite values. Clamping keeps board
 * generation in range instead of producing `undefined` cards.
 */
export function pickIndex(random: () => number, upperBound: number): number {
  if (!Number.isInteger(upperBound) || upperBound < 1) {
    throw new Error("upperBound must be a positive integer");
  }

  const value = random();
  const clamped = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1 - Number.EPSILON) : 0;

  return Math.floor(clamped * upperBound);
}
