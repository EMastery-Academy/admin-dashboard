import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api/client";
import type { PathParams, QueryParams, SuccessResponse } from "@/lib/api/operation-types";

type ExpertOp = "expert_api_v1_legacy_experts__expert_key__get";
type ExpertsOp = "experts_api_v1_legacy_experts_get";
type RecommendationsOp = "expert_recommendations_api_v1_legacy_experts__expert_key__recommendations_get";

export type ExpertDetail = SuccessResponse<ExpertOp>;
export type ExpertProfile = ExpertDetail["expert"];
export type ExpertCourse = ExpertDetail["courses"][number];
export type ExpertPackage = ExpertDetail["packages"][number];
export type ExpertConsultation = ExpertDetail["consultations"][number];
export type ExpertCategory = ExpertDetail["categories"][number];
export type ExpertHighlights = ExpertDetail["highlights"];
export type ExpertsParams = QueryParams<ExpertsOp>;
export type ExpertRecommendationsParams = QueryParams<RecommendationsOp>;
export type ExpertRecommendations = SuccessResponse<RecommendationsOp>;

export const expertsPaths = {
  experts: "legacy/experts",
  expert: "legacy/experts/{expert_key}",
  recommendations: "legacy/experts/{expert_key}/recommendations",
} as const;

export const expertsKeys = {
  all: ["learning", "experts"] as const,
  detail: (key: string) => [...expertsKeys.all, "detail", key] as const,
  recommendations: (key: string, params?: ExpertRecommendationsParams) =>
    [...expertsKeys.all, "recommendations", key, params ?? {}] as const,
};

/**
 * `GET /legacy/experts/{expert_key}` — one public expert profile (a trainer by their id, or a
 * consultant as `c{id}`) with their courses, diplomas, packages and consultations.
 */
export function getExpert(expert_key: PathParams<ExpertOp>["expert_key"]): Promise<ExpertDetail> {
  return apiGet(expertsPaths.expert, { path: { expert_key } });
}

export function getExpertRecommendations(
  expert_key: PathParams<RecommendationsOp>["expert_key"],
  params: ExpertRecommendationsParams = {},
): Promise<ExpertRecommendations> {
  return apiGet(expertsPaths.recommendations, { path: { expert_key }, query: params });
}

export const expertsQueries = {
  detail: (key: string) => queryOptions({ queryKey: expertsKeys.detail(key), queryFn: () => getExpert(key) }),
  recommendations: (key: string, params?: ExpertRecommendationsParams) =>
    queryOptions({ queryKey: expertsKeys.recommendations(key, params), queryFn: () => getExpertRecommendations(key, params) }),
};
