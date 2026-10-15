import { useMemo, useState, type ReactNode } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useT } from "@/lib/i18n";
import { Button, Empty, ErrorAlert, Loading } from "@/components/ui/kit";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type Column<T> = {
  /** Stable key: a value extractor or field name. */
  key: string;
  header: string;
  /** Optional narrow width (for looping helpers). */
  width?: string;
  cell: (row: T) => ReactNode;
  align?: "start" | "end";
  /** Enables the sort affordance in the header. */
  sortable?: boolean;
  /** Value used for sorting; defaults to `row[key]`. */
  sortValue?: (row: T) => string | number | null | undefined;
  /** API sort key; when the table is server-sorted only columns with one are sortable. */
  sortKey?: string;
};

export type SortState = { key: string; dir: "asc" | "desc" };

type Meta = { header: string; align?: "start" | "end"; width?: string };

/**
 * A `@tanstack/react-table` (shadcn DataTable) over the current page of rows, rendered with the kit
 * `ma-table` primitives. Sorting is applied to the current page unless `onServerSort` hands it to the
 * server; filtering/paging stay server-side (see `PagedList`). A column-visibility menu is provided via Radix DropdownMenu.
 *
 * Every state renders inside the same frame so the panel never jumps: the toolbar row (search,
 * filters, then the column menu at the end), then loading / error / empty / rows, then the footer.
 */
export function DataTable<T>({
  columns,
  rows,
  empty,
  initialSort,
  showColumnToggle,
  toolbar,
  loading = false,
  error,
  footer,
  serverSort,
  onServerSort,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  /** Column menu; on by default for wide tables (more than five columns). */
  showColumnToggle?: boolean;
  /** Search and filters, rendered at the start of the toolbar row. */
  toolbar?: ReactNode;
  loading?: boolean;
  error?: unknown;
  /** Rendered under the rows (pagination). Hidden while loading or on error. */
  footer?: ReactNode;
  /**
   * Server-side sort over the whole result (keyed by `Column.sortKey`). When `onServerSort` is set the
   * rows arrive already ordered and header clicks ask the server for a new order instead.
   */
  serverSort?: SortState;
  onServerSort?: (sort: SortState) => void;
}) {
  const t = useT();
  const [localSorting, setLocalSorting] = useState<SortingState>(initialSort ? [{ id: initialSort.key, desc: initialSort.dir === "desc" }] : []);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const manual = Boolean(onServerSort);
  const sortedColumn = manual && serverSort ? columns.find((column) => column.sortKey === serverSort.key) : undefined;
  const sorting: SortingState = manual
    ? sortedColumn && serverSort
      ? [{ id: sortedColumn.key, desc: serverSort.dir === "desc" }]
      : []
    : localSorting;

  const tableColumns = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row: T) => (column.sortValue ? column.sortValue(row) : (row as Record<string, unknown>)[column.key]),
        enableSorting: manual ? Boolean(column.sortKey) : Boolean(column.sortable),
        meta: { header: column.header, align: column.align, width: column.width } satisfies Meta,
      })),
    [columns, manual],
  );

  // React Compiler intentionally skips memoizing this hook (react-table returns mutable handlers).
  // oxlint-disable-next-line react/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    state: { sorting, columnVisibility },
    manualSorting: manual,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      if (!manual) return setLocalSorting(next);
      // A server sort always has a key: clicking a sorted header flips it instead of clearing it.
      const id = next[0]?.id ?? sorting[0]?.id;
      const column = columns.find((item) => item.key === id);
      if (!column?.sortKey) return;
      const flip = sorting[0]?.id === id ? (sorting[0].desc ? "asc" : "desc") : "desc";
      onServerSort?.({ key: column.sortKey, dir: next[0] ? (next[0].desc ? "desc" : "asc") : flip });
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const hideable = table.getAllColumns().filter((column) => column.getCanHide());
  const showToggle = (showColumnToggle ?? columns.length > 5) && hideable.length > 2 && rows.length > 0;

  let body: ReactNode;
  if (loading) body = <Loading />;
  else if (error) body = <div className="ma-panel__body"><ErrorAlert error={error} title={t("تعذّر تحميل البيانات", "Couldn't load the data")} /></div>;
  else if (rows.length === 0) body = <Empty text={empty ?? t("لا توجد بيانات بعد.", "Nothing here yet.")} />;

  const columnMenu = showToggle ? (
    <div className="ma-toolbar__end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button sm icon="layers" label={t("الأعمدة", "Columns")} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t("إظهار الأعمدة", "Toggle columns")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {hideable.map((column) => {
            const meta = column.columnDef.meta as Meta | undefined;
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                onSelect={(event) => event.preventDefault()}
              >
                {meta?.header ?? column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : null;

  return (
    <div className="ma-datatable">
      {toolbar || columnMenu ? (
        <div className="ma-toolbar">
          {toolbar}
          {columnMenu}
        </div>
      ) : null}

      {body ?? (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as Meta | undefined;
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={meta?.align === "end" ? "is-num" : undefined}
                      aria-sort={header.column.getCanSort() ? (sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none") : undefined}
                      style={meta?.width ? { width: meta.width, minWidth: meta.width } : undefined}
                    >
                      {header.column.getCanSort() ? (
                        <button type="button" className="ma-sort" onClick={header.column.getToggleSortingHandler()}>
                          <span>{meta?.header}</span>
                          <span aria-hidden="true">{sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}</span>
                        </button>
                      ) : (
                        meta?.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as Meta | undefined;
                  const original = columns.find((column) => column.key === cell.column.id);
                  return (
                    <TableCell key={cell.id} className={meta?.align === "end" ? "is-num" : undefined}>
                      {original ? original.cell(row.original) : null}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {body ? null : footer}
    </div>
  );
}
