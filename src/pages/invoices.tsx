import { useQuery } from "@tanstack/react-query";

import { listOrders, type AdminOrder } from "@/lib/api";
import { formatAmount, formatDayMonth, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Card, Kpi, PageHead } from "@/components/ui/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { orderStatusBadge } from "@/lib/status";
import { Badge } from "@/components/ui/kit";
import { PageState, Pagination } from "@/components/ui/primitives";
import { useState } from "react";

const PAGE_SIZE = 25;

export default function InvoicesPage() {
  const t = useT();
  const [offset, setOffset] = useState(0);

  const orders = useQuery({
    queryKey: ["sales", "invoices", { offset }],
    queryFn: () => listOrders({ limit: PAGE_SIZE, offset }),
  });

  const rows = orders.data?.items ?? [];
  const withInvoices = rows.filter((row) => row.invoice_count > 0);
  const totalInvoices = rows.reduce((sum, row) => sum + row.invoice_count, 0);

  const columns: Column<AdminOrder>[] = [
    { key: "order", header: t("الطلب", "Order"), cell: (row) => <bdi className="ma-num">#{row.order_id.slice(0, 8)}</bdi> },
    { key: "when", header: t("التاريخ", "Date"), cell: (row) => formatDayMonth(row.created_at ?? undefined) },
    { key: "customer", header: t("العميل", "Customer"), cell: (row) => <bdi className="ma-cell-sub">{row.customer_email ?? "—"}</bdi> },
    { key: "amount", header: t("المبلغ", "Amount"), align: "end", cell: (row) => formatAmount(row.amount_minor / 100, row.currency_code) },
    { key: "invoices", header: t("الفواتير", "Invoices"), align: "end", cell: (row) => <span className="ma-num">{formatNumber(row.invoice_count)}</span> },
    { key: "status", header: t("الحالة", "Status"), cell: (row) => <Badge def={orderStatusBadge(row.status)} /> },
  ];

  return (
    <>
      <PageHead
        title={t("الفواتير", "Invoices")}
        sub={t("الفواتير المرتبطة بالطلبات على هذه الصفحة.", "Invoices attached to the orders on this page.")}
      />

      <div className="ma-cols ma-cols--3 ma-section-gap">
        <Kpi label={t("فواتير هذه الصفحة", "Invoices on this page")} value={formatNumber(totalInvoices)} icon="receipt" field="var(--sky)" />
        <Kpi label={t("طلبات بفواتير", "Orders with invoices")} value={formatNumber(withInvoices.length)} icon="file" field="var(--teal)" />
        <Kpi label={t("إجمالي الطلبات", "Orders total")} value={formatNumber(orders.data?.total ?? 0)} icon="cart" field="var(--purple)" />
      </div>

      <Card flush className="ma-section-gap">
        <PageState error={orders.error}>
          {orders.isLoading ? (
            <p className="ma-muted" style={{ padding: "var(--space-6)" }}>{t("جارٍ التحميل…", "Loading…")}</p>
          ) : orders.data ? (
            <>
              <DataTable columns={columns} rows={rows} empty={t("لا طلبات.", "No orders.")} />
              <Pagination total={orders.data.total} limit={orders.data.limit} offset={orders.data.offset} onPage={setOffset} />
            </>
          ) : null}
        </PageState>
      </Card>
    </>
  );
}
