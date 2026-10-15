import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";

import { listOrders, type AdminOrder } from "@/lib/api";
import { formatAmount, formatDayMonth, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { shortRef } from "@/lib/refs";
import { Card, Kpi, PageHead } from "@/components/ui/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { orderStatusBadge } from "@/lib/status";
import { Badge } from "@/components/ui/kit";
import { Pagination } from "@/components/ui/primitives";
import { SearchBox } from "@/components/ui/paged-list";
import { SelectField } from "@/components/ui/select";

const PAGE_SIZE = 25;

export default function InvoicesPage() {
  const t = useT();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("all");

  const orders = useQuery({
    queryKey: ["sales", "invoices", { offset }],
    queryFn: () => listOrders({ source: "b2c", limit: PAGE_SIZE, offset }),
  });

  const rawRows = orders.data?.items ?? [];
  const withInvoices = rawRows.filter((row) => row.invoice_count > 0);
  const totalInvoices = rawRows.reduce((sum, row) => sum + row.invoice_count, 0);

  const filteredRows = useMemo(() => {
    return rawRows.filter((row) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        row.ref.toLowerCase().includes(q) ||
        (row.customer_email?.toLowerCase().includes(q) ?? false);
      const matchFilter =
        invoiceFilter === "all" ||
        (invoiceFilter === "with_invoice" ? row.invoice_count > 0 : row.invoice_count === 0);
      return matchSearch && matchFilter;
    });
  }, [rawRows, search, invoiceFilter]);

  const columns: Column<AdminOrder>[] = [
    { key: "order", header: t("الطلب", "Order"), cell: (row) => <bdi className="ma-num">{shortRef(row.ref)}</bdi> },
    { key: "when", header: t("التاريخ", "Date"), cell: (row) => formatDayMonth(row.created_at ?? undefined) },
    { key: "customer", header: t("العميل", "Customer"), cell: (row) => <bdi className="ma-cell-sub">{row.customer_email ?? "—"}</bdi> },
    { key: "amount", header: t("المبلغ", "Amount"), align: "end", cell: (row) => formatAmount(row.amount_minor / 100, row.currency_code) },
    { key: "invoices", header: t("الفواتير", "Invoices"), align: "end", cell: (row) => <span className="ma-num">{formatNumber(row.invoice_count)}</span> },
    { key: "status", header: t("الحالة", "Status"), cell: (row) => <Badge def={orderStatusBadge(row.status)} /> },
  ];

  const toolbar = (
    <>
      <SearchBox placeholder={t("ابحث برقم الطلب أو البريد…", "Search order id or email…")} value={search} onChange={setSearch} />
      <SelectField
        label={t("حالة الفاتورة", "Invoice filter")}
        value={invoiceFilter}
        onChange={setInvoiceFilter}
        options={[
          { value: "all", label: t("الكل", "All orders") },
          { value: "with_invoice", label: t("تم إصدار فاتورة", "With invoice") },
          { value: "no_invoice", label: t("بدون فاتورة", "Without invoice") },
        ]}
      />
    </>
  );

  return (
    <>
      <PageHead
        title={t("الفواتير", "Invoices")}
        sub={t("الفواتير الصادرة المرتبطة بالطلبات والعملاء.", "Issued invoices attached to customer orders.")}
      />

      <div className="ma-cols ma-cols--3">
        <Kpi label={t("فواتير هذه الصفحة", "Invoices on this page")} value={formatNumber(totalInvoices)} icon="receipt" field="var(--sky)" />
        <Kpi label={t("طلبات بفواتير", "Orders with invoices")} value={formatNumber(withInvoices.length)} icon="file" field="var(--teal)" />
        <Kpi label={t("إجمالي الطلبات", "Orders total")} value={formatNumber(orders.data?.total ?? 0)} icon="cart" field="var(--purple)" />
      </div>

      <Card flush className="ma-section-gap">
        <DataTable
          columns={columns}
          rows={filteredRows}
          toolbar={toolbar}
          loading={orders.isLoading}
          error={orders.error}
          empty={t("لا طلبات مطابقة.", "No matching orders.")}
          footer={orders.data ? <Pagination total={orders.data.total} limit={orders.data.limit} offset={orders.data.offset} onPage={setOffset} /> : null}
        />
      </Card>
    </>
  );
}
