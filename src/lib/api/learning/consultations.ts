import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api/client";
import type { PathParams, QueryParams } from "@/lib/api/operation-types";
import type { ConsultationService, Page } from "@/lib/api/contract";

type ListServicesOp = "list_consultation_services_api_v1_admin_backoffice_consultations_services_get";
type GetServiceOp = "get_consultation_service_api_v1_admin_backoffice_consultations_services__legacy_consultancy_id__get";

export type ConsultationServicesParams = QueryParams<ListServicesOp>;
export type ConsultationServicePage = Page<ConsultationService>;
export type ConsultationServiceDetail = Record<string, unknown>;

export const consultationsPaths = {
  services: "admin/backoffice/consultations/services",
  service: "admin/backoffice/consultations/services/{legacy_consultancy_id}",
} as const;

export const consultationsKeys = {
  all: ["learning", "consultations"] as const,
  list: (params?: ConsultationServicesParams) => [...consultationsKeys.all, "services", params ?? {}] as const,
  detail: (legacyConsultancyId: number) => [...consultationsKeys.all, "service", legacyConsultancyId] as const,
};

export function listConsultationServices(
  params: ConsultationServicesParams = {},
): Promise<ConsultationServicePage> {
  return apiGet<ConsultationServicePage>(consultationsPaths.services, { query: params });
}

export function getConsultationService(
  legacy_consultancy_id: PathParams<GetServiceOp>["legacy_consultancy_id"],
): Promise<ConsultationServiceDetail> {
  return apiGet(consultationsPaths.service, { path: { legacy_consultancy_id } });
}

export const consultationsQueries = {
  list: (params?: ConsultationServicesParams) =>
    queryOptions({ queryKey: consultationsKeys.list(params), queryFn: () => listConsultationServices(params) }),
  detail: (legacyConsultancyId: number) =>
    queryOptions({
      queryKey: consultationsKeys.detail(legacyConsultancyId),
      queryFn: () => getConsultationService(legacyConsultancyId),
    }),
};
