import { useMemo } from "react";
import { listRefunds, paymentsKeys, type AdminRefund } from "@/lib/api";
import { formatDateTime, formatMinor } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { badgeLabel, dateValue } from "@/lib/export/columns";
import { Badge, PageHead } from "@/components/ui/kit";
import type { Column } from "@/components/ui/data-table";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";

const refundBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s === "succeeded" || s === "completed") {
    return { label: { ar: "مكتمل", en: "Succeeded" }, tone: "success" as const };
  }
  if (s === "pending" || s === "processing") {
    return { label: { ar: "قيد المعالجة", en: "Pending" }, tone: "warning" as const };
  }
  return { label: { ar: "فشل", en: "Failed" }, tone: "danger" as const };
};

export default function RefundsPage() {
  const t = useT();
  const lang = useLang();

  const columns: Column<AdminRefund>[] = [
    { key: "when", header: t("التاريخ", "When"), exportKind: "datetime", exportValue: (row) => dateValue(row.created_at), cell: (row) => formatDateTime(row.created_at) },
    { key: "order", header: t("الطلب", "Order"), exportValue: (row) => `#${row.order_id.slice(0, 8)}`, cell: (row) => <bdi className="ma-num">#{row.order_id.slice(0, 8)}</bdi> },
    { key: "provider", header: t("المزوّد", "Provider"), exportValue: (row) => row.provider, cell: (row) => row.provider },
    { key: "amount", header: t("المبلغ", "Amount"), align: "end", exportKind: "money", exportValue: (row) => row.amount_minor / 100, exportCurrency: (row) => row.currency_code, cell: (row) => formatMinor(row.amount_minor, row.currency_code) },
    { key: "status", header: t("الحالة", "Status"), exportValue: (row) => badgeLabel(refundBadge(row.status), lang), cell: (row) => <Badge def={refundBadge(row.status)} /> },
    { key: "reason", header: t("السبب", "Reason"), exportValue: (row) => row.reason || "", cell: (row) => <span className="ma-cell-sub">{row.reason || "—"}</span> },
  ];

  const filters: ListFilter[] = useMemo(
    () => [
      {
        key: "status",
        label: t("كل الحالات", "All statuses"),
        options: [
          { value: "succeeded", label: t("مكتمل", "Succeeded") },
          { value: "pending", label: t("قيد المعالجة", "Pending") },
          { value: "failed", label: t("فشل", "Failed") },
        ],
      },
    ],
    [t],
  );

  return (
    <>
      <PageHead
        title={t("الاستردادات", "Refunds")}
        sub={t("كل المبالغ المستردة وأحوالها ومزوّد الدفع.", "All refunds, their statuses and payment providers.")}
      />
      <PagedList
        queryKeyBase={paymentsKeys.refunds()}
        fetchPage={({ offset, limit, query, filters: selected }) =>
          listRefunds({ limit, offset }).then((res) => {
            let items = res.items;
            if (query) {
              const q = query.toLowerCase();
              items = items.filter(
                (item) => item.order_id.toLowerCase().includes(q) || item.provider.toLowerCase().includes(q),
              );
            }
            if (selected.status) {
              items = items.filter((item) => item.status.toLowerCase() === selected.status.toLowerCase());
            }
            return { ...res, items };
          })
        }
        columns={columns}
        filters={filters}
        searchPlaceholder={t("ابحث برقم الطلب أو المزوّد…", "Search order id or provider…")}
        empty={t("لا استردادات.", "No refunds.")}
        exportConfig={{ filename: "refunds", title: t("الاستردادات", "Refunds"), pdf: true, fetchSize: 200 }}
      />
    </>
  );
}
