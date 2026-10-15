import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type SearchGetOp = "search_api_v1_search_get";
type SearchPostOp = "advanced_search_api_v1_search_post";
type OptionsOp = "search_options_api_v1_search_options_get";
type ProductDetailOp = "search_product_details_api_v1_search_products__slug__details_get";

export type SearchPage = SuccessResponse<SearchGetOp>;
export type SearchResult = SearchPage["items"][number];
export type SearchParams = QueryParams<SearchGetOp>;
export type SearchRequestBody = RequestBody<SearchPostOp>;
export type SearchOptions = SuccessResponse<OptionsOp>;
export type SearchOption = NonNullable<SearchOptions["categories"]>[number];
export type SearchProductDetail = SuccessResponse<ProductDetailOp>;

export const searchPaths = {
  search: "search",
  options: "search/options",
  productDetails: "search/products/{slug}/details",
} as const;

export const searchKeys = {
  all: ["search"] as const,
  results: (params?: SearchParams) => [...searchKeys.all, "results", params ?? {}] as const,
  options: (params?: SearchParams) => [...searchKeys.all, "options", params ?? {}] as const,
  productDetails: (slug: string) => [...searchKeys.all, "product", slug] as const,
};

/** `GET /search` — full-text + filtered search over the catalog. Public (no auth). */
export function search(params: SearchParams = {}): Promise<SearchPage> {
  return apiGet(searchPaths.search, { query: params });
}

/** `GET /search/options` — the filter facets (types, categories, skills, tags, instructors). */
export function searchOptions(params: SearchParams = {}): Promise<SearchOptions> {
  return apiGet(searchPaths.options, { query: params });
}

export function getSearchProductDetails(slug: PathParams<ProductDetailOp>["slug"]): Promise<SearchProductDetail> {
  return apiGet(searchPaths.productDetails, { path: { slug } });
}

export const searchQueries = {
  results: (params: SearchParams = {}) => queryOptions({ queryKey: searchKeys.results(params), queryFn: () => search(params) }),
  options: (params: SearchParams = {}) => queryOptions({ queryKey: searchKeys.options(params), queryFn: () => searchOptions(params) }),
  productDetails: (slug: string) => queryOptions({ queryKey: searchKeys.productDetails(slug), queryFn: () => getSearchProductDetails(slug) }),
};
