import { queryOptions } from "@tanstack/react-query";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, Schemas } from "@/lib/api/operation-types";
import type { LegacyRow, Page } from "@/lib/api/contract";

type LegacyResourceName = Schemas["LegacyResourceName"];

type ListResourceOp = "list_resource_records_api_v1_legacy_admin_resources__resource__get";
type GetResourceOp = "get_resource_record_api_v1_legacy_admin_resources__resource___record_id__get";
type UpdateResourceOp = "update_resource_record_api_v1_legacy_admin_resources__resource___record_id__patch";
type DeleteResourceOp = "delete_resource_record_api_v1_legacy_admin_resources__resource___record_id__delete";

export type { LegacyResourceName };
export type ResourcePage = Page<LegacyRow>;
export type ResourceRow = LegacyRow;
export type ResourceListParams = QueryParams<ListResourceOp>;
export type ResourceCreateRequest = Record<string, unknown>;
export type ResourceUpdateRequest = Record<string, unknown>;

export const resourcesPaths = {
  resources: "legacy-admin/resources",
  resource: "legacy-admin/resources/{resource}",
  record: "legacy-admin/resources/{resource}/{record_id}",
} as const;

export const resourcesKeys = {
  all: ["legacy", "resources"] as const,
  list: (resource: LegacyResourceName, params?: ResourceListParams) =>
    [...resourcesKeys.all, resource, params ?? {}] as const,
  record: (resource: LegacyResourceName, recordId: number) =>
    [...resourcesKeys.all, resource, "record", recordId] as const,
};

/** `GET /legacy-admin/resources/{resource}` — a page of rows from one mirrored legacy table. */
export function listLegacyResource(
  resource: LegacyResourceName,
  params: ResourceListParams = {},
): Promise<ResourcePage> {
  return apiGet<ResourcePage>(resourcesPaths.resource, { path: { resource }, query: params });
}

export function getLegacyResource(
  resource: LegacyResourceName,
  record_id: PathParams<GetResourceOp>["record_id"],
): Promise<ResourceRow> {
  return apiGet(resourcesPaths.record, { path: { resource, record_id } });
}

/** `POST /legacy-admin/resources/{resource}` — creates a row (needs the legacy write scope). */
export function createLegacyResource(
  resource: LegacyResourceName,
  body: ResourceCreateRequest,
): Promise<ResourceRow> {
  return apiPost(resourcesPaths.resource, { path: { resource }, body });
}

export function updateLegacyResource(
  resource: LegacyResourceName,
  record_id: PathParams<UpdateResourceOp>["record_id"],
  body: ResourceUpdateRequest,
): Promise<ResourceRow> {
  return apiPatch(resourcesPaths.record, { path: { resource, record_id }, body });
}

export function deleteLegacyResource(
  resource: LegacyResourceName,
  record_id: PathParams<DeleteResourceOp>["record_id"],
): Promise<void> {
  return apiDelete(resourcesPaths.record, { path: { resource, record_id } });
}

export const resourcesQueries = {
  list: (resource: LegacyResourceName, params?: ResourceListParams) =>
    queryOptions({ queryKey: resourcesKeys.list(resource, params), queryFn: () => listLegacyResource(resource, params) }),
  record: (resource: LegacyResourceName, recordId: number) =>
    queryOptions({ queryKey: resourcesKeys.record(resource, recordId), queryFn: () => getLegacyResource(resource, recordId) }),
};
