import { listRefunds, paymentsKeys, type AdminRefund } from "@/lib/api";
import { formatDateTime, formatMinor } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Badge, PageHead } from "@/components/ui/kit";
import type { Column } from "@/components/ui/data-table";
import { PagedList } from "@/components/ui/paged-list";

export default function RefundsPage() {
  const t = useT();

  const columns: Column<AdminRefund>[] = [
    { key: "when", header: t("التاريخ", "When"), cell: (row) => formatDateTime(row.created_at) },
    { key: "order", header: t("الطلب", "Order"), cell: (row) => <bdi className="ma-num">#{row.order_id.slice(0, 8)}</bdi> },
    { key: "provider", header: t("المزوّد", "Provider"), cell: (row) => row.provider },
    { key: "amount", header: t("المبلغ", "Amount"), align: "end", cell: (row) => formatMinor(row.amount_minor, row.currency_code) },
    { key: "status", header: t("الحالة", "Status"), cell: (row) => <Badge def={{ label: { ar: row.status, en: row.status } }} /> },
    { key: "reason", header: t("السبب", "Reason"), cell: (row) => <span className="ma-cell-sub">{row.reason || "—"}</span> },
  ];

  return (
    <>
      <PageHead title={t("الاستردادات", "Refunds")} sub={t("كل المبالغ المستردة وأحوالها.", "All refunds and their states.")} />
      <PagedList
        queryKeyBase={paymentsKeys.refunds()}
        fetchPage={({ offset, limit }) => listRefunds({ limit, offset })}
        columns={columns}
        empty={t("لا استردادات.", "No refunds.")}
      />
    </>
  );
}
