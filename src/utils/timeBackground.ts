export type TimePeriod = "morning" | "afternoon" | "evening" | "midnight";

export function getTimePeriod(date = new Date()): TimePeriod {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 24) return "evening";
  return "midnight";
}

export function getBackgroundUrl(period: TimePeriod = getTimePeriod()): string {
  return `/backgrounds/background1-${period}.png`;
}
