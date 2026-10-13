import { useState } from "react";

import { listPaymentFailures, listRefunds, paymentsKeys, type AdminPaymentFailure, type AdminRefund } from "@/lib/api";
import { formatDateTime, formatMinor } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Badge, PageHead } from "@/components/ui/kit";
import type { Column } from "@/components/ui/data-table";
import { PagedList } from "@/components/ui/paged-list";

type Tab = "failures" | "refunds";

export default function PaymentsPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("failures");

  return (
    <>
      <PageHead title={t("المدفوعات", "Payments")} sub={t("المدفوعات الفاشلة والاستردادات.", "Failed payments and refunds.")} />

      <div className="ma-pagetabs">
        <button type="button" className={tab === "failures" ? "is-active" : undefined} onClick={() => setTab("failures")}>
          {t("المدفوعات الفاشلة", "Failed payments")}
        </button>
        <button type="button" className={tab === "refunds" ? "is-active" : undefined} onClick={() => setTab("refunds")}>
          {t("الاستردادات", "Refunds")}
        </button>
      </div>

      {tab === "failures" ? <FailuresList /> : <RefundsList />}
    </>
  );
}

function FailuresList() {
  const t = useT();
  const columns: Column<AdminPaymentFailure>[] = [
    { key: "when", header: t("التاريخ", "When"), cell: (row) => formatDateTime(row.created_at) },
    { key: "order", header: t("الطلب", "Order"), cell: (row) => <bdi className="ma-num">#{row.order_id?.slice(0, 8) ?? "—"}</bdi> },
    { key: "provider", header: t("المزوّد", "Provider"), cell: (row) => row.provider },
    { key: "reason", header: t("السبب", "Reason"), cell: (row) => <span className="ma-cell-sub">{row.failure_message || row.failure_code || "—"}</span> },
    { key: "amount", header: t("المبلغ", "Amount"), align: "end", cell: (row) => formatMinor(row.amount_minor, row.currency_code) },
  ];

  return (
    <PagedList
      queryKeyBase={paymentsKeys.failures()}
      fetchPage={({ offset, limit }) => listPaymentFailures({ limit, offset })}
      columns={columns}
      empty={t("لا مدفوعات فاشلة.", "No failed payments.")}
    />
  );
}

function RefundsList() {
  const t = useT();
  const columns: Column<AdminRefund>[] = [
    { key: "when", header: t("التاريخ", "When"), cell: (row) => formatDateTime(row.created_at) },
    { key: "order", header: t("الطلب", "Order"), cell: (row) => <bdi className="ma-num">#{row.order_id?.slice(0, 8) ?? "—"}</bdi> },
    { key: "amount", header: t("المبلغ", "Amount"), align: "end", cell: (row) => formatMinor(row.amount_minor, row.currency_code) },
    { key: "status", header: t("الحالة", "Status"), cell: (row) => <Badge def={{ label: { ar: row.status, en: row.status } }} /> },
    { key: "reason", header: t("السبب", "Reason"), cell: (row) => <span className="ma-cell-sub">{row.reason || "—"}</span> },
  ];

  return (
    <PagedList
      queryKeyBase={paymentsKeys.refunds()}
      fetchPage={({ offset, limit }) => listRefunds({ limit, offset })}
      columns={columns}
      empty={t("لا استردادات.", "No refunds.")}
    />
  );
}
