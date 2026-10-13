import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, SuccessResponse } from "@/lib/api/operation-types";

type ListOrdersOp = "search_orders_api_v1_admin_orders_get";
type GetOrderOp = "get_order_api_v1_admin_orders__order_id__get";
type CancelOrderOp = "cancel_order_api_v1_admin_orders__order_id__cancel_post";

export type AdminOrder = SuccessResponse<ListOrdersOp>["items"][number];
export type AdminOrderPage = SuccessResponse<ListOrdersOp>;
export type AdminOrderDetail = SuccessResponse<GetOrderOp>;
export type AdminOrderLine = NonNullable<AdminOrderDetail["lines"]>[number];
export type AdminOrderInvoice = AdminOrderDetail["invoices"][number];
export type AdminOrderTransaction = AdminOrderDetail["transactions"][number];
export type AdminOrdersParams = QueryParams<ListOrdersOp>;

export type OrderStatus = "created" | "pending_payment" | "paid" | "fulfilled" | "cancelled";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export const ordersPaths = {
  orders: "admin/orders",
  order: "admin/orders/{order_id}",
  cancelOrder: "admin/orders/{order_id}/cancel",
} as const;

export const ordersKeys = {
  all: ["sales", "orders"] as const,
  list: (params?: AdminOrdersParams) => [...ordersKeys.all, "list", params ?? {}] as const,
  detail: (orderId: string) => [...ordersKeys.all, "detail", orderId] as const,
};

export function listOrders(params: AdminOrdersParams = {}): Promise<AdminOrderPage> {
  return apiGet(ordersPaths.orders, { query: params });
}

export function getOrder(order_id: PathParams<GetOrderOp>["order_id"]): Promise<AdminOrderDetail> {
  return apiGet(ordersPaths.order, { path: { order_id } });
}

/** `POST /admin/orders/{order_id}/cancel` — audited, only valid for cancellable orders. */
export function cancelOrder(order_id: PathParams<CancelOrderOp>["order_id"]): Promise<AdminOrderDetail> {
  return apiPost(ordersPaths.cancelOrder, { path: { order_id } });
}

export const ordersQueries = {
  list: (params?: AdminOrdersParams) =>
    queryOptions({ queryKey: ordersKeys.list(params), queryFn: () => listOrders(params) }),
  detail: (orderId: string) =>
    queryOptions({ queryKey: ordersKeys.detail(orderId), queryFn: () => getOrder(orderId) }),
};
