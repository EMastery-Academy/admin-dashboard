import { apiGet, apiPut } from "@/lib/api/client";
import type { PathParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type GetPriceOp = "get_product_price_api_v1_admin_pricing_products__product_id__get";
type SetPriceOp = "set_product_price_api_v1_admin_pricing_products__product_id__put";

export type ProductPriceBody = RequestBody<SetPriceOp>;
export type ProductActivePrice = SuccessResponse<GetPriceOp>;

export const pricingPaths = {
  product: "admin/pricing/products/{product_id}",
} as const;

/** `GET /admin/pricing/products/{id}` — the active global price (USD by default). */
export function getProductPrice(product_id: PathParams<GetPriceOp>["product_id"]): Promise<ProductActivePrice> {
  return apiGet(pricingPaths.product, { path: { product_id } });
}

/** `PUT /admin/pricing/products/{id}` — closes the current price and starts a new one. Audited. */
export function setProductPrice(
  product_id: PathParams<SetPriceOp>["product_id"],
  body: ProductPriceBody,
): Promise<ProductActivePrice> {
  return apiPut(pricingPaths.product, { path: { product_id }, body });
}
