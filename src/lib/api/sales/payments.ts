import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, SuccessResponse } from "@/lib/api/operation-types";

type FailuresOp = "list_payment_failures_api_v1_admin_payments_failures_get";
type RefundsOp = "list_refunds_api_v1_admin_payments_refunds_get";
type RefundPreviewOp = "refund_preview_api_v1_admin_payments_orders__order_id__refund_preview_get";
type IntentOp = "get_payment_intent_api_v1_admin_payments_intents__payment_intent_id__get";
type ReconcileOp = "reconcile_payment_intent_api_v1_admin_payments_intents__payment_intent_id__reconcile_post";

export type AdminPaymentFailure = SuccessResponse<FailuresOp>["items"][number];
export type AdminPaymentFailurePage = SuccessResponse<FailuresOp>;
export type PaymentFailuresParams = QueryParams<FailuresOp>;
export type AdminRefund = SuccessResponse<RefundsOp>["items"][number];
export type AdminRefundPage = SuccessResponse<RefundsOp>;
export type RefundsParams = QueryParams<RefundsOp>;
export type AdminRefundPreview = SuccessResponse<RefundPreviewOp>;
export type AdminPaymentIntent = SuccessResponse<IntentOp>;
export type AdminPaymentIntentParams = PathParams<IntentOp>;

export const paymentsPaths = {
  failures: "admin/payments/failures",
  refunds: "admin/payments/refunds",
  refundPreview: "admin/payments/orders/{order_id}/refund-preview",
  intent: "admin/payments/intents/{payment_intent_id}",
  reconcileIntent: "admin/payments/intents/{payment_intent_id}/reconcile",
} as const;

export const paymentsKeys = {
  all: ["sales", "payments"] as const,
  failures: (params?: PaymentFailuresParams) => [...paymentsKeys.all, "failures", params ?? {}] as const,
  refunds: (params?: RefundsParams) => [...paymentsKeys.all, "refunds", params ?? {}] as const,
  refundPreview: (orderId: string) => [...paymentsKeys.all, "refund-preview", orderId] as const,
  intent: (paymentIntentId: string) => [...paymentsKeys.all, "intent", paymentIntentId] as const,
};

export function listPaymentFailures(params: PaymentFailuresParams = {}): Promise<AdminPaymentFailurePage> {
  return apiGet(paymentsPaths.failures, { query: params });
}

export function listRefunds(params: RefundsParams = {}): Promise<AdminRefundPage> {
  return apiGet(paymentsPaths.refunds, { query: params });
}

export function getRefundPreview(
  order_id: PathParams<RefundPreviewOp>["order_id"],
): Promise<AdminRefundPreview> {
  return apiGet(paymentsPaths.refundPreview, { path: { order_id } });
}

export function getPaymentIntent(
  payment_intent_id: PathParams<IntentOp>["payment_intent_id"],
): Promise<AdminPaymentIntent> {
  return apiGet(paymentsPaths.intent, { path: { payment_intent_id } });
}

/** `POST /admin/payments/intents/{id}/reconcile` — re-queries the provider and updates the intent. */
export function reconcilePaymentIntent(
  payment_intent_id: PathParams<ReconcileOp>["payment_intent_id"],
): Promise<AdminPaymentIntent> {
  return apiPost(paymentsPaths.reconcileIntent, { path: { payment_intent_id } });
}

export const paymentsQueries = {
  failures: (params?: PaymentFailuresParams) =>
    queryOptions({ queryKey: paymentsKeys.failures(params), queryFn: () => listPaymentFailures(params) }),
  refunds: (params?: RefundsParams) =>
    queryOptions({ queryKey: paymentsKeys.refunds(params), queryFn: () => listRefunds(params) }),
  refundPreview: (orderId: string) =>
    queryOptions({ queryKey: paymentsKeys.refundPreview(orderId), queryFn: () => getRefundPreview(orderId) }),
  intent: (paymentIntentId: string) =>
    queryOptions({ queryKey: paymentsKeys.intent(paymentIntentId), queryFn: () => getPaymentIntent(paymentIntentId) }),
};
