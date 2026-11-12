export type TimePeriod = "morning" | "afternoon" | "evening" | "midnight";

export interface TimePeriodOption {
  id: TimePeriod;
  label: string;
  hours: string;
}

export const TIME_PERIODS: readonly TimePeriod[] = ["morning", "afternoon", "evening", "midnight"];

export function isTimePeriod(value: unknown): value is TimePeriod {
  return typeof value === "string" && TIME_PERIODS.some((period) => period === value);
}

export const TIME_PERIOD_OPTIONS: readonly TimePeriodOption[] = [
  { id: "morning", label: "Morning", hours: "6:00–11:59" },
  { id: "afternoon", label: "Afternoon", hours: "12:00–17:59" },
  { id: "evening", label: "Evening", hours: "18:00–23:59" },
  { id: "midnight", label: "Midnight", hours: "0:00–5:59" },
];

export interface BackgroundPack {
  id: string;
  name: string;
  description: string;
  images: Record<TimePeriod, string>;
}

/**
 * Background packs contain one image per time period. Add another entry here
 * and drop its images under `public/backgrounds/<pack-id>/` to ship a new pack.
 */
export const BACKGROUND_PACKS = [
  {
    id: "whisker-den",
    name: "Whisker Den",
    description: "The original cozy hideout, at every hour.",
    images: {
      morning: "/backgrounds/whisker-den/morning.png",
      afternoon: "/backgrounds/whisker-den/afternoon.png",
      evening: "/backgrounds/whisker-den/evening.png",
      midnight: "/backgrounds/whisker-den/midnight.png",
    },
  },
] as const satisfies readonly BackgroundPack[];

export type BackgroundPackId = (typeof BACKGROUND_PACKS)[number]["id"];

export const DEFAULT_BACKGROUND_PACK_ID: BackgroundPackId = BACKGROUND_PACKS[0].id;

export function isBackgroundPackId(value: unknown): value is BackgroundPackId {
  return typeof value === "string" && BACKGROUND_PACKS.some((pack) => pack.id === value);
}

export function getBackgroundPack(id: string): BackgroundPack {
  return BACKGROUND_PACKS.find((pack) => pack.id === id) ?? BACKGROUND_PACKS[0];
}

export function getTimePeriod(date = new Date()): TimePeriod {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 24) return "evening";
  return "midnight";
}

export function getBackgroundImage(packId: string, period: TimePeriod): string {
  return getBackgroundPack(packId).images[period];
}
