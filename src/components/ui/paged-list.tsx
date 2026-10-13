import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageState, Pagination } from "@/components/ui/primitives";

export type PageResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

/** A toolbar filter that maps to one API query parameter (select-based). */
export type ListFilter = {
  /** API query-param name, e.g. `status`, `payment_status`, `published`. */
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

export type PagedListProps<T> = {
  /** Stable query key prefix for this list (e.g. `["iam", "admin-users"]`). */
  queryKeyBase: readonly unknown[];
  fetchPage: (params: {
    query?: string;
    offset: number;
    limit: number;
    /** Selected filter values, keyed by API param name; unset keys are omitted. */
    filters: Record<string, string>;
  }) => Promise<PageResult<T>>;
  columns: Column<T>[];
  searchPlaceholder?: string;
  /** Select filters wired straight to API query params. */
  filters?: ListFilter[];
  /** Extra controls rendered after the filters (e.g. a source switch). */
  toolbar?: ReactNode;
  empty?: string;
  pageSize?: number;
};

/** A searchable, filterable, paginated table backed by a B2C `Page<T>` endpoint. */
export function PagedList<T>({
  queryKeyBase,
  fetchPage,
  columns,
  searchPlaceholder,
  filters,
  toolbar,
  empty,
  pageSize = 25,
}: PagedListProps<T>) {
  const t = useT();
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});

  const result = useQuery({
    queryKey: [...queryKeyBase, { search, offset, values }],
    queryFn: () => fetchPage({ query: search || undefined, offset, limit: pageSize, filters: values }),
  });

  return (
    <>
      {searchPlaceholder || (filters && filters.length) || toolbar ? (
        <div className="ma-toolbar">
          {searchPlaceholder ? (
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
                placeholder={searchPlaceholder}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </form>
          ) : null}

          {(filters ?? []).map((filter) => (
            <Select
              key={filter.key}
              value={values[filter.key] ?? "all"}
              onValueChange={(value) => {
                setValues((prev) => ({ ...prev, [filter.key]: value === "all" ? "" : value }));
                setOffset(0);
              }}
            >
              <SelectTrigger aria-label={filter.label}>
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {toolbar}
        </div>
      ) : null}

      <Card flush>
        <PageState error={result.error}>
          {result.isLoading ? (
            <p className="ma-muted" style={{ padding: "var(--space-6)" }}>{t("جارٍ التحميل…", "Loading…")}</p>
          ) : result.data ? (
            <>
              <DataTable columns={columns} rows={result.data.items} empty={empty} />
              <Pagination total={result.data.total} limit={result.data.limit} offset={result.data.offset} onPage={setOffset} />
            </>
          ) : null}
        </PageState>
      </Card>
    </>
  );
}
