import { useQuery } from "@tanstack/react-query";

import { legacyGet, type LegacyRow } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Card, Dl, PageHead } from "@/components/ui/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageState } from "@/components/ui/primitives";

export type LegacyPanelProps = {
  titleAr: string;
  titleEn: string;
  subAr: string;
  subEn: string;
  /** Legacy-admin path, e.g. `marketing/ads`. */
  path: string;
  query?: Record<string, string>;
  /** Skip the page header (for pages that compose several panels). */
  hideHead?: boolean;
  /** Card title used when the page header is hidden. */
  panelTitle?: string;
};

/** Renders a legacy-admin read panel: arrays as a table, plain objects as a definition list. */
export function LegacyPanel({ titleAr, titleEn, subAr, subEn, path, query, hideHead, panelTitle }: LegacyPanelProps) {
  const t = useT();
  const result = useQuery({ queryKey: ["legacy", path, query ?? {}], queryFn: () => legacyGet<unknown>(path, query) });

  const data = result.data;
  const rows = toRows(data);
  const objectEntries = rows.length === 0 && isPlainObject(data) ? Object.entries(data) : [];

  return (
    <>
      {hideHead ? null : <PageHead title={t(titleAr, titleEn)} sub={t(subAr, subEn)} />}
      <Card flush={rows.length > 0} title={hideHead ? panelTitle : undefined}>
        <PageState error={result.error}>
          {result.isLoading ? (
            <p className="ma-muted" style={{ padding: "var(--space-6)" }}>{t("جارٍ التحميل…", "Loading…")}</p>
          ) : rows.length > 0 ? (
            <DataTable columns={autoColumns(rows)} rows={rows} empty={t("لا بيانات.", "No data.")} />
          ) : objectEntries.length > 0 ? (
            <div style={{ padding: "var(--space-4)" }}>
              <Dl rows={objectEntries.map(([key, value]) => [key, renderCell(value)])} />
            </div>
          ) : (
            <p className="ma-muted" style={{ padding: "var(--space-6)" }}>{t("لا بيانات.", "No data.")}</p>
          )}
        </PageState>
      </Card>
    </>
  );
}

function toRows(data: unknown): LegacyRow[] {
  if (Array.isArray(data)) return data as LegacyRow[];
  if (isPlainObject(data) && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: LegacyRow[] }).items;
  }
  return [];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function autoColumns(rows: LegacyRow[]): Column<LegacyRow>[] {
  const keys = Array.from(new Set(rows.slice(0, 20).flatMap((row) => Object.keys(row)))).slice(0, 7);
  return keys.map((key) => ({
    key,
    header: key,
    sortable: true,
    cell: (row) => renderCell(row[key]),
  }));
}

function renderCell(value: unknown) {
  if (value == null) return "—";
  if (typeof value === "number") return <span className="ma-num">{formatNumber(value)}</span>;
  if (typeof value === "boolean") return value ? "yes" : "no";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return formatDateTime(text);
  return text;
}
