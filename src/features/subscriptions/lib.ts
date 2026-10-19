import { useMemo, useState } from "react";

import type { SubscriptionPlan } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

/** Shared labels and helpers for the subscriptions screens. */

type Label = { ar: string; en: string };

export const PLAN_TYPE_LABELS: Record<string, Label> = {
  standard: { ar: "قياسية", en: "Standard" },
  full_library: { ar: "المكتبة الكاملة", en: "Full library" },
  choose_x: { ar: "اختر عددًا من الدورات", en: "Choose X" },
};
export const AUDIENCE_LABELS: Record<string, Label> = {
  individual: { ar: "أفراد", en: "Individual" },
  company: { ar: "شركات", en: "Company" },
};
export const INTERVAL_LABELS: Record<string, Label> = {
  month: { ar: "شهريًا", en: "Monthly" },
  year: { ar: "سنويًا", en: "Yearly" },
};
export const PER_INTERVAL: Record<string, Label> = {
  month: { ar: "/ شهر", en: "/ month" },
  year: { ar: "/ سنة", en: "/ year" },
};

export const labelOf = (map: Record<string, Label>, key: string | null | undefined): Label =>
  map[key ?? ""] ?? { ar: key ?? "—", en: key ?? "—" };

/** Locale codes the backend stores translations and card items under. */
export const LOCALES = { ar: "ar-EG", en: "en-US" } as const;

/** Locale prefix match ("ar-EG" → "ar"), since older rows may use short codes. */
export const localeKey = (code: string): "ar" | "en" | null => {
  const prefix = code.split("-")[0].toLowerCase();
  return prefix === "ar" || prefix === "en" ? prefix : null;
};

export function translationFor(plan: SubscriptionPlan, lang: "ar" | "en") {
  return (plan.translations ?? []).find((tr) => localeKey(tr.locale_code) === lang);
}

/** Plan title in the UI language, falling back to the other language and then the slug. */
export function planTitle(plan: SubscriptionPlan, lang: Lang): string {
  return translationFor(plan, lang)?.title ?? translationFor(plan, lang === "ar" ? "en" : "ar")?.title ?? plan.title ?? plan.slug;
}

export function cardFeaturesFor(plan: SubscriptionPlan, lang: "ar" | "en"): string[] {
  const entry = Object.entries(plan.card_features_by_locale ?? {}).find(([code]) => localeKey(code) === lang);
  return entry?.[1] ?? [];
}

export const toNumber = (value: string | number | null | undefined): number => Number(value ?? 0) || 0;

const DAY = 86_400_000;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** `[start, end)` window for the stats endpoints, editable as two date inputs (end is inclusive in the UI). */
export function useStatsWindow(days = 30) {
  const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - (days - 1) * DAY)));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const window = useMemo(() => {
    const end = new Date(`${to}T00:00:00Z`);
    return { start: from, end: isoDay(new Date(end.getTime() + DAY)) };
  }, [from, to]);
  return { from, to, setFrom, setTo, window };
}

/** Suggest a slug for a copy of a plan ("pro-monthly" → "pro-monthly-copy"). */
export const copySlug = (slug: string) => `${slug}-copy`;
