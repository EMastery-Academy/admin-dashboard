import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type SearchCustomersOp = "search_customers_api_v1_admin_customers_get";
type GetCustomerOp = "get_customer_api_v1_admin_customers__customer_id__get";
type UpdateCustomerOp = "update_customer_api_v1_admin_customers__customer_id__patch";
type SetCustomerStatusOp = "set_customer_status_api_v1_admin_customers__customer_id__status_post";
type Customer360Op = "customer_360_api_v1_admin_customers__customer_id__360_get";

export type AdminCustomer = SuccessResponse<SearchCustomersOp>["items"][number];
export type AdminCustomerPage = SuccessResponse<SearchCustomersOp>;
export type AdminCustomersParams = QueryParams<SearchCustomersOp>;
export type AdminCustomerDetail = SuccessResponse<GetCustomerOp>;
export type AdminCustomerUpdateRequest = RequestBody<UpdateCustomerOp>;
export type CustomerStatusRequest = RequestBody<SetCustomerStatusOp>;
export type AdminCustomer360 = SuccessResponse<Customer360Op>;
export type AdminOrderRef = AdminCustomer360["recent_orders"][number];
export type AdminEntitlementRef = AdminCustomer360["entitlements"][number];

export type CustomerStatus = "active" | "suspended" | "blocked";

export const customersPaths = {
  customers: "admin/customers",
  customer: "admin/customers/{customer_id}",
  customerStatus: "admin/customers/{customer_id}/status",
  customer360: "admin/customers/{customer_id}/360",
} as const;

export const customersKeys = {
  all: ["customers", "b2c"] as const,
  list: (params?: AdminCustomersParams) => [...customersKeys.all, "list", params ?? {}] as const,
  detail: (customerId: string) => [...customersKeys.all, "detail", customerId] as const,
  customer360: (customerId: string) => [...customersKeys.all, "360", customerId] as const,
};

export function listCustomers(params: AdminCustomersParams = {}): Promise<AdminCustomerPage> {
  return apiGet(customersPaths.customers, { query: params });
}

export function getCustomer(
  customer_id: PathParams<GetCustomerOp>["customer_id"],
): Promise<AdminCustomerDetail> {
  return apiGet(customersPaths.customer, { path: { customer_id } });
}

export function updateCustomer(
  customer_id: PathParams<UpdateCustomerOp>["customer_id"],
  body: AdminCustomerUpdateRequest,
): Promise<AdminCustomerDetail> {
  return apiPatch(customersPaths.customer, { path: { customer_id }, body });
}

/** `POST /admin/customers/{id}/status` — active / suspended / blocked. Audited. */
export function setCustomerStatus(
  customer_id: PathParams<SetCustomerStatusOp>["customer_id"],
  body: CustomerStatusRequest,
): Promise<AdminCustomerDetail> {
  return apiPost(customersPaths.customerStatus, { path: { customer_id }, body });
}

/** `GET /admin/customers/{id}/360` — orders, entitlements and lifetime value of one customer. */
export function getCustomer360(
  customer_id: PathParams<Customer360Op>["customer_id"],
): Promise<AdminCustomer360> {
  return apiGet(customersPaths.customer360, { path: { customer_id } });
}

export const customersQueries = {
  list: (params?: AdminCustomersParams) =>
    queryOptions({ queryKey: customersKeys.list(params), queryFn: () => listCustomers(params) }),
  detail: (customerId: string) =>
    queryOptions({ queryKey: customersKeys.detail(customerId), queryFn: () => getCustomer(customerId) }),
  customer360: (customerId: string) =>
    queryOptions({ queryKey: customersKeys.customer360(customerId), queryFn: () => getCustomer360(customerId) }),
};
