import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody } from "@/lib/api/operation-types";
import type { Page, Promotion } from "@/lib/api/contract";

type ListPromotionsOp = "list_promotions_api_v1_admin_backoffice_promotions_get";
type GetPromotionOp = "get_promotion_api_v1_admin_backoffice_promotions__legacy_coupon_id__get";
type SetPromotionActiveOp = "set_promotion_active_api_v1_admin_backoffice_promotions__legacy_coupon_id__active_post";

export type PromotionsParams = QueryParams<ListPromotionsOp>;
export type PromotionPage = Page<Promotion>;
export type ActiveRequest = RequestBody<SetPromotionActiveOp>;

export const promotionsPaths = {
  promotions: "admin/backoffice/promotions",
  promotion: "admin/backoffice/promotions/{legacy_coupon_id}",
  promotionActive: "admin/backoffice/promotions/{legacy_coupon_id}/active",
} as const;

export const promotionsKeys = {
  all: ["marketing", "promotions"] as const,
  list: (params?: PromotionsParams) => [...promotionsKeys.all, "list", params ?? {}] as const,
  detail: (legacyCouponId: number) => [...promotionsKeys.all, "detail", legacyCouponId] as const,
};

export function listPromotions(params: PromotionsParams = {}): Promise<PromotionPage> {
  return apiGet<PromotionPage>(promotionsPaths.promotions, { query: params });
}

export function getPromotion(
  legacy_coupon_id: PathParams<GetPromotionOp>["legacy_coupon_id"],
): Promise<Promotion> {
  return apiGet(promotionsPaths.promotion, { path: { legacy_coupon_id } });
}

/** `POST .../promotions/{id}/active` — activates or deactivates a coupon. Audited. */
export function setPromotionActive(
  legacy_coupon_id: PathParams<SetPromotionActiveOp>["legacy_coupon_id"],
  body: ActiveRequest,
): Promise<Promotion> {
  return apiPost(promotionsPaths.promotionActive, { path: { legacy_coupon_id }, body });
}

export const promotionsQueries = {
  list: (params?: PromotionsParams) =>
    queryOptions({ queryKey: promotionsKeys.list(params), queryFn: () => listPromotions(params) }),
  detail: (legacyCouponId: number) =>
    queryOptions({ queryKey: promotionsKeys.detail(legacyCouponId), queryFn: () => getPromotion(legacyCouponId) }),
};
