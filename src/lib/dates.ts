/** Reporting windows anchored to today; both ranges are inclusive of `end`. */
export type DateWindow = { start: string; end: string };

function at(date: Date, endOfDay: boolean): string {
  const copy = new Date(date);
  copy.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, 0);
  return copy.toISOString().slice(0, 19);
}

export function buildWindows(days: number, anchor = new Date()): { current: DateWindow; previous: DateWindow } {
  const end = new Date(anchor);
  const start = new Date(anchor);
  start.setDate(start.getDate() - (days - 1));
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  return {
    current: { start: at(start, false), end: at(end, true) },
    previous: { start: at(prevStart, false), end: at(prevEnd, true) },
  };
}

export function percentDelta(current: number, previous: number): number {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
}
