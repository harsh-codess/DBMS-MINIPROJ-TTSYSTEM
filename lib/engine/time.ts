const WEEKDAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function toMinutes(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function periodHours(startTime: string, endTime: string): number {
  return (toMinutes(endTime) - toMinutes(startTime)) / 60;
}

export function fullyInside(
  startTime: string,
  endTime: string,
  windowStart: string,
  windowEnd: string,
): boolean {
  return (
    toMinutes(startTime) >= toMinutes(windowStart) &&
    toMinutes(endTime) <= toMinutes(windowEnd)
  );
}

export function hhmm(clock: string): string {
  return clock.slice(0, 5);
}

export function formatSpan(startTime: string, endTime: string): string {
  return `${hhmm(startTime)}–${hhmm(endTime)}`;
}

export function formatWindow(startsAt: string, endsAt: string): string {
  return `${hhmm(startsAt).slice(0, 2)}–${hhmm(endsAt).slice(0, 2)}`;
}

export function weekdayName(weekday: number): string {
  return WEEKDAYS[weekday] ?? `day ${weekday}`;
}

export function areConsecutive(a: { startTime: string; endTime: string; weekday: number }, b: {
  startTime: string;
  endTime: string;
  weekday: number;
}): boolean {
  if (a.weekday !== b.weekday) return false;
  const [first, second] =
    toMinutes(a.startTime) <= toMinutes(b.startTime) ? [a, b] : [b, a];
  return first.endTime.slice(0, 5) === second.startTime.slice(0, 5);
}

export function isContiguousBlock(
  periods: { startTime: string; endTime: string; weekday: number }[],
): boolean {
  if (periods.length <= 1) return true;
  const sorted = [...periods].sort(
    (a, b) => a.weekday - b.weekday || toMinutes(a.startTime) - toMinutes(b.startTime),
  );
  for (let i = 1; i < sorted.length; i += 1) {
    if (!areConsecutive(sorted[i - 1], sorted[i])) return false;
  }
  return true;
}
