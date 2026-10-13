import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listLegacyResource, resourcesKeys, type LegacyResourceName, type ResourceRow } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Card, PageHead } from "@/components/ui/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageState, Pagination } from "@/components/ui/primitives";

const PAGE_SIZE = 25;

export type ResourceListPageProps = {
  resource: LegacyResourceName;
  titleAr: string;
  titleEn: string;
  subAr: string;
  subEn: string;
  /** Show a backend-search box (uses the resource `search` query param). */
  searchable?: boolean;
};

/** A paginated table over one mirrored legacy table (`GET /legacy-admin/resources/{resource}`). */
export function ResourceListPage({ resource, titleAr, titleEn, subAr, subEn, searchable = true }: ResourceListPageProps) {
  const t = useT();
  const [offset, setOffset] = useState(0);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");

  const result = useQuery({
    queryKey: resourcesKeys.list(resource, { search, limit: PAGE_SIZE, offset }),
    queryFn: () => listLegacyResource(resource, { search: search || undefined, limit: PAGE_SIZE, offset }),
  });

  const rows: ResourceRow[] = result.data?.items ?? [];

  return (
    <>
      <PageHead title={t(titleAr, titleEn)} sub={t(subAr, subEn)} />

      {searchable ? (
        <div className="ma-toolbar">
          <form
            className="ma-search"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(text);
              setOffset(0);
            }}
          >
            <input
              className="ma-input ma-input--search"
              placeholder={t("ابحث…", "Search…")}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </form>
        </div>
      ) : null}

      <Card flush>
        <PageState error={result.error}>
          {result.isLoading ? (
            <p className="ma-muted" style={{ padding: "var(--space-6)" }}>{t("جارٍ التحميل…", "Loading…")}</p>
          ) : result.data ? (
            <>
              <DataTable columns={autoColumns(rows)} rows={rows} empty={t("لا بيانات.", "No data.")} />
              <Pagination total={result.data.total} limit={result.data.limit} offset={result.data.offset} onPage={setOffset} />
            </>
          ) : null}
        </PageState>
      </Card>
    </>
  );
}

function autoColumns(rows: ResourceRow[]): Column<ResourceRow>[] {
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
