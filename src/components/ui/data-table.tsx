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
import { Button } from "@/components/ui/kit";
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
};

type Meta = { header: string; align?: "start" | "end"; width?: string };

/**
 * A `@tanstack/react-table` (shadcn DataTable) over the current page of rows, rendered with the kit
 * `ma-table` primitives. Sorting is applied to the current page; filtering/paging stay server-side
 * (see `PagedList`). A column-visibility menu is provided via Radix DropdownMenu.
 */
export function DataTable<T>({
  columns,
  rows,
  empty,
  initialSort,
  showColumnToggle = true,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  showColumnToggle?: boolean;
}) {
  const t = useT();
  const [sorting, setSorting] = useState<SortingState>(initialSort ? [{ id: initialSort.key, desc: initialSort.dir === "desc" }] : []);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const tableColumns = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row: T) => (column.sortValue ? column.sortValue(row) : (row as Record<string, unknown>)[column.key]),
        enableSorting: Boolean(column.sortable),
        meta: { header: column.header, align: column.align, width: column.width } satisfies Meta,
      })),
    [columns],
  );

  // React Compiler intentionally skips memoizing this hook (react-table returns mutable handlers).
  // oxlint-disable-next-line react/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (rows.length === 0) {
    return <div className="ma-empty">{empty ?? "Nothing here yet."}</div>;
  }

  const hideable = table.getAllColumns().filter((column) => column.getCanHide());
  const showToggle = showColumnToggle && hideable.length > 2;

  return (
    <div className="ma-datatable">
      {showToggle ? (
        <div className="ma-table-toolbar">
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
      ) : null}

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
                    aria-sort={header.column.getCanSort() ? (sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none") : undefined}
                    style={meta?.width ? { width: meta.width } : undefined}
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
                  <TableCell key={cell.id} style={meta?.align === "end" ? { textAlign: "end" } : undefined}>
                    {original ? original.cell(row.original) : null}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
