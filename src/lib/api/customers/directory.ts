import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";
import type { BackofficeCustomer, Page } from "@/lib/api/contract";

type DirectoryOp = "search_customers_api_v1_admin_backoffice_customers_get";
type DirectoryDetailOp = "get_customer_api_v1_admin_backoffice_customers__legacy_user_id__get";
type ImportOp = "import_legacy_customers_api_v1_admin_backoffice_customers_import_post";
type ImportIssuesOp = "legacy_customer_import_issues_api_v1_admin_backoffice_customers_import_issues_get";

export type DirectoryParams = QueryParams<DirectoryOp>;
export type BackofficeCustomerPage = Page<BackofficeCustomer>;
export type BackofficeCustomerDetail = Record<string, unknown>;
export type CustomerImportRequest = RequestBody<ImportOp>;
export type CustomerImportResult = SuccessResponse<ImportOp>;
export type ImportIssuesParams = QueryParams<ImportIssuesOp>;
export type ImportIssue = Record<string, unknown>;

export const directoryPaths = {
  customers: "admin/backoffice/customers",
  customer: "admin/backoffice/customers/{legacy_user_id}",
  import: "admin/backoffice/customers/import",
  importIssues: "admin/backoffice/customers/import/issues",
} as const;

export const directoryKeys = {
  all: ["customers", "directory"] as const,
  list: (params?: DirectoryParams) => [...directoryKeys.all, "list", params ?? {}] as const,
  detail: (legacyUserId: number) => [...directoryKeys.all, "detail", legacyUserId] as const,
  importIssues: (params?: ImportIssuesParams) => [...directoryKeys.all, "import-issues", params ?? {}] as const,
};

/** `GET /admin/backoffice/customers` — B2C + legacy directory (legacy mirror). */
export function listBackofficeCustomers(params: DirectoryParams = {}): Promise<BackofficeCustomerPage> {
  return apiGet<BackofficeCustomerPage>(directoryPaths.customers, { query: params });
}

/** `GET /admin/backoffice/customers/{legacy_user_id}` — legacy customer with their last orders. */
export function getBackofficeCustomer(
  legacy_user_id: PathParams<DirectoryDetailOp>["legacy_user_id"],
): Promise<BackofficeCustomerDetail> {
  return apiGet(directoryPaths.customer, { path: { legacy_user_id } });
}

/** `POST /admin/backoffice/customers/import` — maps legacy accounts into `b2c.customers` (idempotent). */
export function importCustomers(body: CustomerImportRequest): Promise<CustomerImportResult> {
  return apiPost(directoryPaths.import, { body });
}

/** `GET /admin/backoffice/customers/import/issues` — rows that failed to import. */
export function listImportIssues(params: ImportIssuesParams = {}): Promise<ImportIssue[]> {
  return apiGet(directoryPaths.importIssues, { query: params });
}

export const directoryQueries = {
  list: (params?: DirectoryParams) =>
    queryOptions({ queryKey: directoryKeys.list(params), queryFn: () => listBackofficeCustomers(params) }),
  detail: (legacyUserId: number) =>
    queryOptions({ queryKey: directoryKeys.detail(legacyUserId), queryFn: () => getBackofficeCustomer(legacyUserId) }),
  importIssues: (params?: ImportIssuesParams) =>
    queryOptions({ queryKey: directoryKeys.importIssues(params), queryFn: () => listImportIssues(params) }),
};
