import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody } from "@/lib/api/operation-types";
import type { CatalogKind, CatalogProduct, Page } from "@/lib/api/contract";

type ListProductsOp = "list_products_api_v1_admin_backoffice_catalog__kind__get";
type GetProductOp = "get_product_api_v1_admin_backoffice_catalog__kind___legacy_id__get";
type PublishProductOp = "publish_product_api_v1_admin_backoffice_catalog__kind___legacy_id__publish_post";

export type CatalogProductsParams = QueryParams<ListProductsOp>;
export type CatalogProductPage = Page<CatalogProduct>;
export type CatalogProductDetail = Record<string, unknown>;
export type PublishRequest = RequestBody<PublishProductOp>;

export const catalogPaths = {
  products: "admin/backoffice/catalog/{kind}",
  product: "admin/backoffice/catalog/{kind}/{legacy_id}",
  publish: "admin/backoffice/catalog/{kind}/{legacy_id}/publish",
} as const;

export const catalogKeys = {
  all: ["learning", "catalog"] as const,
  list: (kind: CatalogKind, params?: Omit<CatalogProductsParams, "kind">) =>
    [...catalogKeys.all, "list", kind, params ?? {}] as const,
  detail: (kind: CatalogKind, legacyId: number) => [...catalogKeys.all, "detail", kind, legacyId] as const,
};

export function listCatalog(
  kind: CatalogKind,
  params: Omit<CatalogProductsParams, "kind"> = {},
): Promise<CatalogProductPage> {
  return apiGet<CatalogProductPage>(catalogPaths.products, { path: { kind }, query: params });
}

export function getCatalogProduct(
  kind: CatalogKind,
  legacy_id: PathParams<GetProductOp>["legacy_id"],
): Promise<CatalogProductDetail> {
  return apiGet(catalogPaths.product, { path: { kind, legacy_id } });
}

/** `POST .../catalog/{kind}/{id}/publish` — publishes or unpublishes a product. Audited. */
export function publishProduct(
  kind: CatalogKind,
  legacy_id: PathParams<PublishProductOp>["legacy_id"],
  body: PublishRequest,
): Promise<CatalogProduct> {
  return apiPost(catalogPaths.publish, { path: { kind, legacy_id }, body });
}

export const catalogQueries = {
  list: (kind: CatalogKind, params?: Omit<CatalogProductsParams, "kind">) =>
    queryOptions({ queryKey: catalogKeys.list(kind, params), queryFn: () => listCatalog(kind, params) }),
  detail: (kind: CatalogKind, legacyId: number) =>
    queryOptions({ queryKey: catalogKeys.detail(kind, legacyId), queryFn: () => getCatalogProduct(kind, legacyId) }),
};
