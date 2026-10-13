import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api/client";
import type { QueryParams } from "@/lib/api/operation-types";
import type { DashboardSummary, ProductSalesRow, SalesPoint } from "@/lib/api/contract";

type DashboardSalesOp = "dashboard_sales_api_v1_admin_backoffice_dashboard_sales_get";
type ProductsReportOp = "product_sales_report_api_v1_admin_backoffice_reports_products_get";

export type DashboardSalesParams = QueryParams<DashboardSalesOp>;
export type ProductsReportParams = QueryParams<ProductsReportOp>;

export const dashboardPaths = {
  summary: "admin/backoffice/dashboard/summary",
  sales: "admin/backoffice/dashboard/sales",
  productsReport: "admin/backoffice/reports/products",
} as const;

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
  sales: (params: DashboardSalesParams) => [...dashboardKeys.all, "sales", params] as const,
  productsReport: (params?: ProductsReportParams) => [...dashboardKeys.all, "products-report", params ?? {}] as const,
};

/** `GET /admin/backoffice/dashboard/summary` — the platform-wide counters. */
export function dashboardSummary(): Promise<DashboardSummary> {
  return apiGet(dashboardPaths.summary);
}

/** `GET /admin/backoffice/dashboard/sales?start&end` — one point per day. */
export function dashboardSales(params: DashboardSalesParams): Promise<SalesPoint[]> {
  return apiGet(dashboardPaths.sales, { query: params });
}

/** `GET /admin/backoffice/reports/products?start&end` — per-product sales rows. */
export function productsReport(params: ProductsReportParams): Promise<ProductSalesRow[]> {
  return apiGet(dashboardPaths.productsReport, { query: params });
}

export const dashboardQueries = {
  summary: () => queryOptions({ queryKey: dashboardKeys.summary(), queryFn: dashboardSummary }),
  sales: (params: DashboardSalesParams) =>
    queryOptions({ queryKey: dashboardKeys.sales(params), queryFn: () => dashboardSales(params) }),
  productsReport: (params: ProductsReportParams) =>
    queryOptions({ queryKey: dashboardKeys.productsReport(params), queryFn: () => productsReport(params) }),
};
