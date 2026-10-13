import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api/client";
import type { RequestBody } from "@/lib/api/operation-types";
import type { LegacyRow } from "@/lib/api/contract";

type SalesReportOp = "sales_report_api_v1_legacy_admin_report_salesreport_post";

/** The legacy reports all take the same `{ date1, date2 }` window. */
export type DateRangeRequest = RequestBody<SalesReportOp>;

/** One day in a legacy sales report / monthly chart. Amounts are major currency units. */
export type DailySalesPoint = {
  date: string;
  amount: number;
  numberOfOrders: number;
};

/** `POST /legacy-admin/report/monthlycharts`. */
export type MonthlyChartPoint = DailySalesPoint;

/** `POST /legacy-admin/report/salesreport`. */
export type SalesReport = {
  totalOrders: number;
  totalSales: number;
  days: DailySalesPoint[];
};

export type LegacyProductsReportRow = LegacyRow;
export type CategoriesReportRow = LegacyRow;
export type CouponsReportRow = LegacyRow;
export type CustomersReportRow = LegacyRow;

/**
 * The legacy reporting endpoints are POSTs that take a date window and return legacy-shaped rows.
 * Reads only — they never mutate — but the HTTP verb is POST.
 */
export const reportPaths = {
  monthlyCharts: "legacy-admin/report/monthlycharts",
  salesReport: "legacy-admin/report/salesreport",
  products: "legacy-admin/report/productsreport",
  categories: "legacy-admin/report/categoriessellingreport",
  coupons: "legacy-admin/report/couponsellingreport",
  customers: "legacy-admin/report/customersreport",
  counters: "legacy-admin/report/counters",
} as const;

export const reportKeys = {
  all: ["analytics", "reports"] as const,
  monthlyCharts: (body: DateRangeRequest) => [...reportKeys.all, "monthlycharts", body] as const,
  sales: (body: DateRangeRequest) => [...reportKeys.all, "sales", body] as const,
  products: (body: DateRangeRequest) => [...reportKeys.all, "products", body] as const,
  categories: (body: DateRangeRequest) => [...reportKeys.all, "categories", body] as const,
  coupons: (body: DateRangeRequest) => [...reportKeys.all, "coupons", body] as const,
  customers: (body: DateRangeRequest) => [...reportKeys.all, "customers", body] as const,
  counters: () => [...reportKeys.all, "counters"] as const,
};

export function monthlyCharts(body: DateRangeRequest): Promise<MonthlyChartPoint[]> {
  return apiPost(reportPaths.monthlyCharts, { body });
}

export function salesReport(body: DateRangeRequest): Promise<SalesReport> {
  return apiPost(reportPaths.salesReport, { body });
}

export function legacyProductsReport(body: DateRangeRequest): Promise<LegacyProductsReportRow[]> {
  return apiPost(reportPaths.products, { body });
}

export function categoriesReport(body: DateRangeRequest): Promise<CategoriesReportRow[]> {
  return apiPost(reportPaths.categories, { body });
}

export function couponsReport(body: DateRangeRequest): Promise<CouponsReportRow[]> {
  return apiPost(reportPaths.coupons, { body });
}

export function customersReport(body: DateRangeRequest): Promise<CustomersReportRow[]> {
  return apiPost(reportPaths.customers, { body });
}

/** `GET /legacy-admin/report/counters` — all legacy dashboard counters in one call. */
export function reportCounters(): Promise<Record<string, number>> {
  return apiGet(reportPaths.counters);
}

export const reportQueries = {
  monthlyCharts: (body: DateRangeRequest) =>
    queryOptions({ queryKey: reportKeys.monthlyCharts(body), queryFn: () => monthlyCharts(body) }),
  sales: (body: DateRangeRequest) =>
    queryOptions({ queryKey: reportKeys.sales(body), queryFn: () => salesReport(body) }),
  legacyProducts: (body: DateRangeRequest) =>
    queryOptions({ queryKey: reportKeys.products(body), queryFn: () => legacyProductsReport(body) }),
  categories: (body: DateRangeRequest) =>
    queryOptions({ queryKey: reportKeys.categories(body), queryFn: () => categoriesReport(body) }),
  coupons: (body: DateRangeRequest) =>
    queryOptions({ queryKey: reportKeys.coupons(body), queryFn: () => couponsReport(body) }),
  customers: (body: DateRangeRequest) =>
    queryOptions({ queryKey: reportKeys.customers(body), queryFn: () => customersReport(body) }),
  counters: () => queryOptions({ queryKey: reportKeys.counters(), queryFn: reportCounters }),
};
