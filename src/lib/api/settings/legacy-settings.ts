import { queryOptions } from "@tanstack/react-query";

import { legacyGet } from "@/lib/api/legacy/legacy";
import type { LegacyRow } from "@/lib/api/contract";

/** Read-only legacy settings/reference panels (legacy JSON shapes). */
export const settingsPaths = {
  social: "settings/social",
  notificationEmails: "settings/emailnotified",
  tags: "settings/alltags",
  countries: "settings/countries",
  modules: "settings/allmodules",
  offers: "marketing/offers",
  offer: "marketing/offers/{offer_id}",
  priceLists: "courses/price_lists",
} as const;

export function listSocialLinks(): Promise<LegacyRow[]> {
  return legacyGet("settings/social");
}

export function listNotificationEmails(): Promise<LegacyRow[]> {
  return legacyGet("settings/emailnotified");
}

export function listTags(): Promise<LegacyRow[]> {
  return legacyGet("settings/alltags");
}

export function listCountries(): Promise<LegacyRow[]> {
  return legacyGet("settings/countries");
}

export function listModules(): Promise<LegacyRow[]> {
  return legacyGet("settings/allmodules");
}

export function listOffers(): Promise<LegacyRow> {
  return legacyGet("marketing/offers");
}

export function getOffer(offer_id: number): Promise<LegacyRow> {
  return legacyGet(`marketing/offers/${offer_id}`);
}

export function listPriceLists(): Promise<LegacyRow> {
  return legacyGet("courses/price_lists");
}

export const settingsKeys = {
  all: ["settings"] as const,
  social: () => [...settingsKeys.all, "social"] as const,
  notificationEmails: () => [...settingsKeys.all, "notification-emails"] as const,
  tags: () => [...settingsKeys.all, "tags"] as const,
  countries: () => [...settingsKeys.all, "countries"] as const,
  modules: () => [...settingsKeys.all, "modules"] as const,
  offers: () => [...settingsKeys.all, "offers"] as const,
  offer: (offerId: number) => [...settingsKeys.all, "offer", offerId] as const,
  priceLists: () => [...settingsKeys.all, "price-lists"] as const,
};

export const settingsQueries = {
  social: () => queryOptions({ queryKey: settingsKeys.social(), queryFn: listSocialLinks }),
  notificationEmails: () =>
    queryOptions({ queryKey: settingsKeys.notificationEmails(), queryFn: listNotificationEmails }),
  tags: () => queryOptions({ queryKey: settingsKeys.tags(), queryFn: listTags }),
  countries: () => queryOptions({ queryKey: settingsKeys.countries(), queryFn: listCountries }),
  modules: () => queryOptions({ queryKey: settingsKeys.modules(), queryFn: listModules }),
  offers: () => queryOptions({ queryKey: settingsKeys.offers(), queryFn: listOffers }),
  offer: (offerId: number) => queryOptions({ queryKey: settingsKeys.offer(offerId), queryFn: () => getOffer(offerId) }),
  priceLists: () => queryOptions({ queryKey: settingsKeys.priceLists(), queryFn: listPriceLists }),
};
