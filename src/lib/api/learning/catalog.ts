import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";

/*
 * One catalog over B2C and the legacy platform (`/admin/catalog`). Products are addressed by ref:
 * `b2c:<product_id>` for B2C products, `legacy:course:<id>` / `legacy:package:<id>` for legacy courses and
 * packages that no B2C product represents yet. The legacy content of a product (curriculum, price rows,
 * rules, certificates, ratings, instructors, learners) is read with any of its refs.
 */

type ListProductsOp = "list_products_api_v1_admin_catalog_products_get";
type CreateCourseOp = "create_course_api_v1_admin_catalog_products_post";
type GetProductOp = "get_product_api_v1_admin_catalog_products__product_ref__get";
type SetStatusOp = "set_product_status_api_v1_admin_catalog_products__product_ref__status_post";
type SalesOp = "product_sales_api_v1_admin_catalog_products__product_ref__sales_get";
type FacetsOp = "product_facets_api_v1_admin_catalog_products_facets_get";
type InsightsOp = "product_insights_api_v1_admin_catalog_products_insights_get";
type CurriculumOp = "product_curriculum_api_v1_admin_catalog_products__product_ref__curriculum_get";
type PricesOp = "product_prices_api_v1_admin_catalog_products__product_ref__prices_get";
type RulesOp = "product_rules_api_v1_admin_catalog_products__product_ref__rules_get";
type CertificatesOp = "product_certificates_api_v1_admin_catalog_products__product_ref__certificates_get";
type RatingsOp = "product_ratings_api_v1_admin_catalog_products__product_ref__ratings_get";
type InstructorsOp = "product_instructors_api_v1_admin_catalog_products__product_ref__instructors_get";
type LearnersOp = "product_learners_api_v1_admin_catalog_products__product_ref__learners_get";
type SummaryOp = "package_summary_api_v1_admin_catalog_products__product_ref__summary_get";
type PackageCoursesOp = "package_courses_api_v1_admin_catalog_products__product_ref__courses_get";
type CategoriesOp = "list_categories_api_v1_admin_catalog_categories_get";
type PriceListsOp = "list_price_lists_api_v1_admin_catalog_price_lists_get";
type ExtensionPackagesOp = "list_extension_packages_api_v1_admin_catalog_extension_packages_get";
type CertificateTemplatesOp = "list_certificate_templates_api_v1_admin_catalog_certificates_get";
type AllRatingsOp = "list_ratings_api_v1_admin_catalog_ratings_get";

export type ProductsParams = QueryParams<ListProductsOp>;
export type ProductPage = SuccessResponse<ListProductsOp>;
export type ProductSalesParams = QueryParams<SalesOp>;
export type ProductSalesSeries = SuccessResponse<SalesOp>;
export type ProductSalesPoint = NonNullable<ProductSalesSeries["points"]>[number];
/** A catalog list item; `source` is `b2c` or `legacy`, `ref` addresses it. */
export type Product = ProductPage["items"][number];
/** `GET /admin/catalog/products/{ref}`: list item, B2C detail (`b2c`), legacy detail (`legacy`) and `links`. */
export type ProductView = SuccessResponse<GetProductOp>;
export type ProductDetail = NonNullable<ProductView["b2c"]>;
export type LegacyProductDetail = NonNullable<ProductView["legacy"]>;
export type ProductLinks = ProductView["links"];
export type ProductItem = ProductView["product"];
export type ProductPrice = ProductDetail["prices"][number];
export type ProductStatus = RequestBody<SetStatusOp>["status"];
export type ProductSort = NonNullable<ProductsParams["sort"]>;
export type ProductSource = NonNullable<ProductsParams["source"]>;
export type ProductOrigin = NonNullable<ProductsParams["origin"]>;
export type CreateCourseRequest = RequestBody<CreateCourseOp>;

export type ProductFacets = SuccessResponse<FacetsOp>;
export type ProductInsightsParams = QueryParams<InsightsOp>;
export type ProductInsights = SuccessResponse<InsightsOp>;
export type ProductInsightItem = ProductInsights["top_sellers"][number];
export type ProductInsightSegment = ProductInsights["segments_by_product"][number];

export type ContentSection = SuccessResponse<CurriculumOp>[number];
export type LegacyPriceRow = SuccessResponse<PricesOp>[number];
export type CompletionRule = SuccessResponse<RulesOp>[number];
export type ProductCertificate = SuccessResponse<CertificatesOp>[number];
export type ProductRatingPage = SuccessResponse<RatingsOp>;
export type ProductRating = ProductRatingPage["items"][number];
export type ProductInstructor = SuccessResponse<InstructorsOp>[number];
export type ProductLearners = SuccessResponse<LearnersOp>;
export type PackageSummary = SuccessResponse<SummaryOp>;
export type PackageCourse = SuccessResponse<PackageCoursesOp>[number];

export type CategoriesParams = QueryParams<CategoriesOp>;
export type ProductCategoryPage = SuccessResponse<CategoriesOp>;
export type PriceListsParams = QueryParams<PriceListsOp>;
export type PriceListPage = SuccessResponse<PriceListsOp>;
export type ExtensionPackagesParams = QueryParams<ExtensionPackagesOp>;
export type ExtensionPackagePage = SuccessResponse<ExtensionPackagesOp>;
export type CertificateTemplatesParams = QueryParams<CertificateTemplatesOp>;
export type CertificateTemplatePage = SuccessResponse<CertificateTemplatesOp>;
export type RatingsParams = QueryParams<AllRatingsOp>;

export const productPaths = {
  list: "admin/catalog/products",
  detail: "admin/catalog/products/{product_ref}",
  status: "admin/catalog/products/{product_ref}/status",
  sales: "admin/catalog/products/{product_ref}/sales",
  facets: "admin/catalog/products/facets",
  insights: "admin/catalog/products/insights",
  curriculum: "admin/catalog/products/{product_ref}/curriculum",
  prices: "admin/catalog/products/{product_ref}/prices",
  rules: "admin/catalog/products/{product_ref}/rules",
  certificates: "admin/catalog/products/{product_ref}/certificates",
  ratings: "admin/catalog/products/{product_ref}/ratings",
  instructors: "admin/catalog/products/{product_ref}/instructors",
  learners: "admin/catalog/products/{product_ref}/learners",
  summary: "admin/catalog/products/{product_ref}/summary",
  courses: "admin/catalog/products/{product_ref}/courses",
  categories: "admin/catalog/categories",
  priceLists: "admin/catalog/price-lists",
  extensionPackages: "admin/catalog/extension-packages",
  certificateTemplates: "admin/catalog/certificates",
  allRatings: "admin/catalog/ratings",
} as const;

export const productKeys = {
  all: ["learning", "products"] as const,
  list: (params?: ProductsParams) => [...productKeys.all, "list", params ?? {}] as const,
  detail: (productRef: string) => [...productKeys.all, "detail", productRef] as const,
  content: (productRef: string, part: string) => [...productKeys.all, "content", productRef, part] as const,
  sales: (productRef: string, params?: ProductSalesParams) =>
    [...productKeys.all, "sales", productRef, params ?? {}] as const,
  facets: (productType?: string) => [...productKeys.all, "facets", productType ?? ""] as const,
  insights: (params: ProductInsightsParams) => [...productKeys.all, "insights", params] as const,
  lists: (name: string, params?: object) => [...productKeys.all, name, params ?? {}] as const,
};

/** Product ref of a legacy course/package. */
export function legacyProductRef(kind: "course" | "package", legacyId: number | string): string {
  return `legacy:${kind}:${legacyId}`;
}

/** `GET /admin/catalog/products` — B2C products and not-migrated legacy courses/packages (`source` filters). */
export function listProducts(params: ProductsParams = {}): Promise<ProductPage> {
  return apiGet(productPaths.list, { query: params });
}

export function getProduct(product_ref: PathParams<GetProductOp>["product_ref"]): Promise<ProductView> {
  return apiGet(productPaths.detail, { path: { product_ref } });
}

/** `POST /admin/catalog/products` — creates a course on the legacy platform (local mirror). Audited. */
export function createCourse(body: CreateCourseRequest): Promise<ProductView> {
  return apiPost(productPaths.list, { body });
}

/** `POST /admin/catalog/products/{ref}/status` — B2C status, or publish/draft a legacy-only product. Audited. */
export function setProductStatus(
  product_ref: PathParams<SetStatusOp>["product_ref"],
  status: ProductStatus,
): Promise<ProductView> {
  return apiPost(productPaths.status, { path: { product_ref }, body: { status } });
}

/** `GET /admin/catalog/products/facets` — categories, top tags, product types and sources with counts. */
export function getProductFacets(product_type?: string): Promise<ProductFacets> {
  return apiGet(productPaths.facets, { query: { product_type } });
}

/** `GET /admin/catalog/products/insights` — best sellers, most viewed, low rated, never sold, pie series. */
export function getProductInsights(params: ProductInsightsParams): Promise<ProductInsights> {
  return apiGet(productPaths.insights, { query: params });
}

function content<T>(path: string, product_ref: string, query?: Record<string, unknown>): Promise<T> {
  return apiGet(path, { path: { product_ref }, query: query as never });
}

export const getProductCurriculum = (ref: string) => content<ContentSection[]>(productPaths.curriculum, ref);
export const getProductPrices = (ref: string) => content<LegacyPriceRow[]>(productPaths.prices, ref);
export const getProductSales = (ref: string, query?: ProductSalesParams) =>
  content<ProductSalesSeries>(productPaths.sales, ref, query as never);
export const getProductRules = (ref: string) => content<CompletionRule[]>(productPaths.rules, ref);
export const getProductCertificates = (ref: string) => content<ProductCertificate[]>(productPaths.certificates, ref);
export const getProductRatings = (ref: string, query?: { limit?: number; offset?: number }) =>
  content<ProductRatingPage>(productPaths.ratings, ref, query);
export const getProductInstructors = (ref: string) => content<ProductInstructor[]>(productPaths.instructors, ref);
export const getProductLearners = (ref: string, limit = 200) =>
  content<ProductLearners>(productPaths.learners, ref, { limit });
export const getPackageSummary = (ref: string) => content<PackageSummary>(productPaths.summary, ref);
export const getPackageCourses = (ref: string) => content<PackageCourse[]>(productPaths.courses, ref);

export function listCategories(params: CategoriesParams = {}): Promise<ProductCategoryPage> {
  return apiGet(productPaths.categories, { query: params });
}

export function listPriceLists(params: PriceListsParams = {}): Promise<PriceListPage> {
  return apiGet(productPaths.priceLists, { query: params });
}

export function listExtensionPackages(params: ExtensionPackagesParams = {}): Promise<ExtensionPackagePage> {
  return apiGet(productPaths.extensionPackages, { query: params });
}

export function listCertificateTemplates(params: CertificateTemplatesParams = {}): Promise<CertificateTemplatePage> {
  return apiGet(productPaths.certificateTemplates, { query: params });
}

export function listRatings(params: RatingsParams = {}): Promise<ProductRatingPage> {
  return apiGet(productPaths.allRatings, { query: params });
}

export const productQueries = {
  list: (params?: ProductsParams) => queryOptions({ queryKey: productKeys.list(params), queryFn: () => listProducts(params) }),
  detail: (productRef: string) =>
    queryOptions({ queryKey: productKeys.detail(productRef), queryFn: () => getProduct(productRef) }),
  sales: (productRef: string, params?: ProductSalesParams) =>
    queryOptions({ queryKey: productKeys.sales(productRef, params), queryFn: () => getProductSales(productRef, params) }),
  facets: (productType?: string) =>
    queryOptions({ queryKey: productKeys.facets(productType), queryFn: () => getProductFacets(productType), staleTime: 5 * 60_000 }),
  insights: (params: ProductInsightsParams) =>
    queryOptions({ queryKey: productKeys.insights(params), queryFn: () => getProductInsights(params) }),
  curriculum: (ref: string) =>
    queryOptions({ queryKey: productKeys.content(ref, "curriculum"), queryFn: () => getProductCurriculum(ref) }),
  prices: (ref: string) => queryOptions({ queryKey: productKeys.content(ref, "prices"), queryFn: () => getProductPrices(ref) }),
  rules: (ref: string) => queryOptions({ queryKey: productKeys.content(ref, "rules"), queryFn: () => getProductRules(ref) }),
  certificates: (ref: string) =>
    queryOptions({ queryKey: productKeys.content(ref, "certificates"), queryFn: () => getProductCertificates(ref) }),
  ratings: (ref: string) => queryOptions({ queryKey: productKeys.content(ref, "ratings"), queryFn: () => getProductRatings(ref) }),
  instructors: (ref: string) =>
    queryOptions({ queryKey: productKeys.content(ref, "instructors"), queryFn: () => getProductInstructors(ref) }),
  learners: (ref: string) => queryOptions({ queryKey: productKeys.content(ref, "learners"), queryFn: () => getProductLearners(ref) }),
  summary: (ref: string) => queryOptions({ queryKey: productKeys.content(ref, "summary"), queryFn: () => getPackageSummary(ref) }),
  courses: (ref: string) => queryOptions({ queryKey: productKeys.content(ref, "courses"), queryFn: () => getPackageCourses(ref) }),
  categories: (params?: CategoriesParams) =>
    queryOptions({ queryKey: productKeys.lists("categories", params), queryFn: () => listCategories(params) }),
  priceLists: (params?: PriceListsParams) =>
    queryOptions({ queryKey: productKeys.lists("price-lists", params), queryFn: () => listPriceLists(params) }),
  extensionPackages: (params?: ExtensionPackagesParams) =>
    queryOptions({ queryKey: productKeys.lists("extension-packages", params), queryFn: () => listExtensionPackages(params) }),
  certificateTemplates: (params?: CertificateTemplatesParams) =>
    queryOptions({ queryKey: productKeys.lists("certificates", params), queryFn: () => listCertificateTemplates(params) }),
  allRatings: (params?: RatingsParams) =>
    queryOptions({ queryKey: productKeys.lists("ratings", params), queryFn: () => listRatings(params) }),
};
