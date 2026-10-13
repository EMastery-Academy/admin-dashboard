import { queryOptions } from "@tanstack/react-query";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { LegacyPanelUser, LegacyRow, Page } from "@/lib/api/contract";

/**
 * Generic gateway to the legacy-admin mirror. Rows keep the legacy JSON shapes (camelCase), so
 * consumers read them defensively. Reads are safe in production; writes need the legacy write
 * scope and the backend's `LEGACY_ADMIN_LOCAL_WRITES_ENABLED` flag.
 */
export function legacyGet<T = LegacyRow>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  return apiGet<T>(`legacy-admin/${path}`, { query });
}

export function legacyPost<T = unknown>(path: string, body: unknown): Promise<T> {
  return apiPost<T>(`legacy-admin/${path}`, { body });
}

export function legacyPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  return apiPatch<T>(`legacy-admin/${path}`, { body });
}

export function legacyDelete(path: string): Promise<void> {
  return apiDelete(`legacy-admin/${path}`);
}

// ------------------------------------------------------------------ typed helpers (common panels)

export function legacyCounters(): Promise<Record<string, number>> {
  return legacyGet("report/counters");
}

export function listBanners(query?: Record<string, string>): Promise<LegacyRow> {
  return legacyGet("v2/banners", query);
}

export function listSliders(query?: Record<string, string>): Promise<LegacyRow> {
  return legacyGet("v2/sliders", query);
}

export function listAnnouncementBars(): Promise<LegacyRow[]> {
  return legacyGet("marketing/ads");
}

export function listLegacyPanelUsers(): Promise<Page<LegacyPanelUser>> {
  return legacyGet("users/panelusers");
}

export function listLegacyTickets(params: { limit?: number; offset?: number } = {}): Promise<LegacyRow> {
  return legacyGet("settings/tickets", params);
}

export function legacyResources(): Promise<LegacyRow[]> {
  return legacyGet("resources");
}

export const legacyKeys = {
  all: ["legacy"] as const,
  counters: () => [...legacyKeys.all, "counters"] as const,
  resource: (resource: string, params?: Record<string, unknown>) =>
    [...legacyKeys.all, "resource", resource, params ?? {}] as const,
};

export const legacyQueries = {
  counters: () => queryOptions({ queryKey: legacyKeys.counters(), queryFn: legacyCounters }),
  banners: (query?: Record<string, string>) =>
    queryOptions({ queryKey: [...legacyKeys.all, "banners", query ?? {}] as const, queryFn: () => listBanners(query) }),
  sliders: (query?: Record<string, string>) =>
    queryOptions({ queryKey: [...legacyKeys.all, "sliders", query ?? {}] as const, queryFn: () => listSliders(query) }),
  announcementBars: () =>
    queryOptions({ queryKey: [...legacyKeys.all, "announcement-bars"] as const, queryFn: listAnnouncementBars }),
  panelUsers: () =>
    queryOptions({ queryKey: [...legacyKeys.all, "panel-users"] as const, queryFn: listLegacyPanelUsers }),
  tickets: (params?: { limit?: number; offset?: number }) =>
    queryOptions({ queryKey: [...legacyKeys.all, "tickets", params ?? {}] as const, queryFn: () => listLegacyTickets(params) }),
};
