import { useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { useT } from "@/lib/i18n";
import { Card, IconButton } from "@/components/ui/kit";
import { DataTable, type Column, type SortState } from "@/components/ui/data-table";
import { SearchIcon, type AnimatedIconHandle } from "@/components/icons/animated";
import { SelectField } from "@/components/ui/select";
import { Pagination } from "@/components/ui/primitives";

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
    /** Present when `sort` is configured. */
    sort?: SortState;
  }) => Promise<PageResult<T>>;
  columns: Column<T>[];
  searchPlaceholder?: string;
  /** Select filters wired straight to API query params. */
  filters?: ListFilter[];
  /** Extra controls rendered after the filters (e.g. a source switch). */
  toolbar?: ReactNode;
  empty?: string;
  pageSize?: number;
  /**
   * Server-side sort over the whole list: a "Sort by" select plus a direction toggle, and header
   * clicks on columns that declare a matching `sortKey`.
   */
  sort?: { options: { value: string; label: string }[]; initial: SortState };
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
  sort,
}: PagedListProps<T>) {
  const t = useT();
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<SortState | undefined>(sort?.initial);

  const changeSort = (next: SortState) => {
    setOrder(next);
    setOffset(0);
  };

  const result = useQuery({
    queryKey: [...queryKeyBase, { search, offset, values, order }],
    queryFn: () => fetchPage({ query: search || undefined, offset, limit: pageSize, filters: values, sort: order }),
  });

  const hasToolbar = Boolean(searchPlaceholder || (filters && filters.length) || toolbar || sort);

  return (
    <Card flush>
      <DataTable
        columns={columns}
        rows={result.data?.items ?? []}
        empty={empty}
        loading={result.isLoading}
        error={result.error}
        toolbar={
          hasToolbar ? (
            <>
              {searchPlaceholder ? (
                <SearchBox
                  placeholder={searchPlaceholder}
                  value={text}
                  onChange={setText}
                  onSubmit={(query) => {
                    setSearch(query);
                    setOffset(0);
                  }}
                />
              ) : null}

              {(filters ?? []).map((filter) => (
                <SelectField
                  key={filter.key}
                  label={filter.label}
                  value={values[filter.key] || "all"}
                  onChange={(value) => {
                    setValues((prev) => ({ ...prev, [filter.key]: value === "all" ? "" : value }));
                    setOffset(0);
                  }}
                  options={[{ value: "all", label: filter.label }, ...filter.options]}
                />
              ))}

              {sort && order ? (
                <div className="ma-sortby">
                  <SelectField
                    label={t("ترتيب حسب", "Sort by")}
                    value={order.key}
                    onChange={(key) => changeSort({ key, dir: order.dir })}
                    options={sort.options.map((option) => ({ value: option.value, label: `${t("ترتيب:", "Sort:")} ${option.label}` }))}
                  />
                  <IconButton
                    icon={order.dir === "asc" ? "sortAsc" : "sortDesc"}
                    label={order.dir === "asc" ? t("تصاعدي", "Ascending") : t("تنازلي", "Descending")}
                    onClick={() => changeSort({ key: order.key, dir: order.dir === "asc" ? "desc" : "asc" })}
                  />
                </div>
              ) : null}

              {toolbar}
            </>
          ) : undefined
        }
        serverSort={sort ? order : undefined}
        onServerSort={sort ? changeSort : undefined}
        footer={
          result.data ? <Pagination total={result.data.total} limit={result.data.limit} offset={result.data.offset} onPage={setOffset} /> : null
        }
      />
    </Card>
  );
}

/**
 * Search input with the kit icon. Submits on Enter; clearing the box (×) submits the empty query
 * so the list resets without an extra keystroke.
 */
export function SearchBox({
  placeholder,
  value,
  onChange,
  onSubmit,
  label,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  label?: string;
}) {
  const icon = useRef<AnimatedIconHandle>(null);
  return (
    <form
      className="ma-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
    >
      <SearchIcon ref={icon} size={18} className="ma-search__icon" />
      <input
        className="ma-input ma-input--search"
        type="search"
        aria-label={label ?? placeholder}
        placeholder={placeholder}
        value={value}
        onFocus={() => icon.current?.startAnimation()}
        onBlur={() => icon.current?.stopAnimation()}
        onChange={(event) => {
          onChange(event.target.value);
          if (event.target.value === "" && value !== "") onSubmit?.("");
        }}
      />
    </form>
  );
}
