import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { listCountries, listModules, listSocialLinks, listTags, type LegacyRow } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Card, PageHead } from "@/components/ui/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageState } from "@/components/ui/primitives";

export default function GeneralSettingsPage() {
  const t = useT();

  return (
    <>
      <PageHead title={t("عام", "General")} sub={t("بيانات مرجعية وإعدادات من النظام القديم.", "Reference data and settings from the legacy system.")} />
      <div className="ma-cols ma-cols--2">
        <ReferenceCard title={t("الدول", "Countries")} result={useQuery({ queryKey: ["settings", "countries"], queryFn: listCountries })} />
        <ReferenceCard title={t("وسائل التواصل", "Social links")} result={useQuery({ queryKey: ["settings", "social"], queryFn: listSocialLinks })} />
        <ReferenceCard title={t("الوسوم", "Tags")} result={useQuery({ queryKey: ["settings", "tags"], queryFn: listTags })} />
        <ReferenceCard title={t("الوحدات", "Modules")} result={useQuery({ queryKey: ["settings", "modules"], queryFn: listModules })} />
      </div>
    </>
  );
}

function ReferenceCard({ title, result }: { title: string; result: UseQueryResult<LegacyRow[]> }) {
  const t = useT();
  return (
    <Card flush title={title}>
      <PageState error={result.error}>
        {result.isLoading ? (
          <p className="ma-muted" style={{ padding: "var(--space-6)" }}>{t("جارٍ التحميل…", "Loading…")}</p>
        ) : (
          <DataTable columns={autoColumns(result.data ?? [])} rows={result.data ?? []} empty={t("لا بيانات.", "No data.")} />
        )}
      </PageState>
    </Card>
  );
}

function autoColumns(rows: LegacyRow[]): Column<LegacyRow>[] {
  const keys = Array.from(new Set(rows.slice(0, 20).flatMap((row) => Object.keys(row)))).slice(0, 5);
  return keys.map((key) => ({ key, header: key, cell: (row) => renderCell(row[key]) }));
}

function renderCell(value: unknown) {
  if (value == null) return "—";
  if (typeof value === "number") return <span className="ma-num">{formatNumber(value)}</span>;
  if (typeof value === "boolean") return value ? "yes" : "no";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return formatDateTime(text);
  return text;
}
