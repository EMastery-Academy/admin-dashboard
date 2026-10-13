import type { DailySalesPoint } from "@/lib/api";

export type MonthPoint = { month: string; amount: number; orders: number };

/** Rolls a daily sales series up to calendar months (legacy "مبيعات الشهر"). */
export function monthlyFromDays(days: DailySalesPoint[]): MonthPoint[] {
  const map = new Map<string, MonthPoint>();
  for (const day of days) {
    const month = day.date.slice(0, 7);
    const current = map.get(month) ?? { month, amount: 0, orders: 0 };
    current.amount += day.amount;
    current.orders += day.numberOfOrders;
    map.set(month, current);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}
