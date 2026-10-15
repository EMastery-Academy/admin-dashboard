import { useState } from "react";

import {
  listPaymentFailures,
  listPayments,
  listRefunds,
  paymentsKeys,
  type AdminPayment,
  type AdminPaymentFailure,
  type AdminRefund,
} from "@/lib/api";
import { formatDateTime, formatMinor } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { customerHref, orderHref, paymentHref, shortRef } from "@/lib/refs";
import { SourceBadge } from "@/components/ui/source-badge";
import { initialsOf, orderStatusBadge, paymentStatusBadge } from "@/lib/status";
import { AppLink } from "@/components/ui/app-link";
import { Avatar, Badge, Button, PageHead } from "@/components/ui/kit";
import { type Column } from "@/components/ui/data-table";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";

type Tab = "all" | "failures" | "refunds";

const TABS: [Tab, string, string][] = [
  ["all", "كل المدفوعات", "All payments"],
  ["failures", "المدفوعات الفاشلة", "Failed payments"],
  ["refunds", "الاستردادات", "Refunds"],
];

export default function PaymentsPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("all");

  return (
    <>
      <PageHead
        title={t("المدفوعات", "Payments")}
        sub={t("كل مدفوعات B2C عبر Stripe وTamara، والعمليات الفاشلة والاستردادات.", "Every B2C payment across Stripe and Tamara, failures and refunds.")}
      />

      <div className="ma-pagetabs" role="tablist" aria-label={t("أنواع المدفوعات", "Payment views")}>
        {TABS.map(([id, ar, en]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls="payments-panel"
            onClick={() => setTab(id)}
          >
            {t(ar, en)}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="payments-panel" aria-labelledby={`tab-${tab}`}>
        {tab === "all" ? <AllPaymentsList /> : tab === "failures" ? <FailuresList /> : <RefundsList />}
      </div>
    </>
  );
}

const STATUSES = ["succeeded", "pending", "incomplete", "failed", "cancelled", "refunded", "partially_refunded"];
const PROVIDERS = ["stripe", "tamara", "free"];
const CURRENCIES = ["USD", "AED", "SAR"];

function AllPaymentsList() {
  const t = useT();

  const columns: Column<AdminPayment>[] = [
    {
      key: "when",
      header: t("التاريخ", "When"),
      cell: (row) => (
        <AppLink className="ma-link ma-link--plain" to={row.order_ref ? orderHref(row.order_ref) : paymentHref(row.ref)}>
          <span className="ma-cell-main"><bdi>{shortRef(row.order_ref ?? row.ref)}</bdi></span>
          <span className="ma-cell-sub">{formatDateTime(row.created_at)}</span>
        </AppLink>
      ),
    },
    {
      key: "customer",
      header: t("العميل", "Customer"),
      cell: (row) => (
        <AppLink
          className="ma-cell-flex ma-link ma-link--plain"
          to={customerHref(row.customer_id ? `b2c:${row.customer_id}` : `legacy:user:${row.legacy_user_id ?? ""}`)}
        >
          <Avatar initials={initialsOf(row.customer_email ?? "?")} color="var(--sky)" />
          <span className="ma-cell-main"><bdi>{row.customer_email ?? "—"}</bdi></span>
        </AppLink>
      ),
    },
    { key: "source", header: t("النظام", "System"), cell: (row) => <SourceBadge source={row.source} /> },
    { key: "provider", header: t("البوابة", "Gateway"), cell: (row) => row.provider },
    { key: "status", header: t("الدفع", "Payment"), cell: (row) => <Badge def={paymentStatusBadge(row.status)} /> },
    { key: "order", header: t("الطلب", "Order"), cell: (row) => <Badge def={orderStatusBadge(row.order_status)} /> },
    {
      key: "amount",
      header: t("المبلغ", "Amount"),
      align: "end",
      cell: (row) => (
        <>
          <span className="ma-num">{formatMinor(row.amount_minor, row.currency_code)}</span>
          {row.refunded_minor ? <span className="ma-cell-sub">− {formatMinor(row.refunded_minor, row.currency_code)}</span> : null}
        </>
      ),
    },
    { key: "open", header: "", align: "end", cell: (row) => <Button sm icon="eye" label={t("التفاصيل", "Details")} href={paymentHref(row.ref)} /> },
  ];

  const filters: ListFilter[] = [
    {
      key: "source",
      label: t("كل الأنظمة", "All systems"),
      options: [
        { value: "b2c", label: t("المتجر (B2C)", "B2C") },
        { value: "legacy", label: t("النظام القديم", "Legacy") },
      ],
    },
    { key: "status", label: t("كل الحالات", "All statuses"), options: STATUSES.map((value) => ({ value, label: paymentStatusLabel(t, value) })) },
    { key: "provider", label: t("كل البوابات", "All gateways"), options: PROVIDERS.map((value) => ({ value, label: value })) },
    { key: "currency_code", label: t("كل العملات", "All currencies"), options: CURRENCIES.map((value) => ({ value, label: value })) },
  ];

  return (
    <PagedList
      queryKeyBase={paymentsKeys.list()}
      fetchPage={({ query, offset, limit, filters: selected }) =>
        listPayments({
          source: (selected.source || "all") as "all" | "b2c" | "legacy",
          query,
          status: selected.status || undefined,
          provider: selected.provider || undefined,
          currency_code: selected.currency_code || undefined,
          limit,
          offset,
        })
      }
      columns={columns}
      searchPlaceholder={t("ابحث ببريد العميل…", "Search customer email…")}
      filters={filters}
      empty={t("لا مدفوعات.", "No payments.")}
    />
  );
}

function paymentStatusLabel(t: (ar: string, en?: string) => string, status: string): string {
  const badge = paymentStatusBadge(status);
  return badge ? t(badge.label.ar, badge.label.en) : status;
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

  const filters: ListFilter[] = [
    {
      key: "provider",
      label: t("كل البوابات", "All gateways"),
      options: [
        { value: "stripe", label: "Stripe" },
        { value: "tamara", label: "Tamara" },
      ],
    },
  ];

  return (
    <PagedList
      queryKeyBase={paymentsKeys.failures()}
      fetchPage={({ offset, limit, query, filters: selected }) =>
        listPaymentFailures({ limit, offset }).then((res) => {
          let items = res.items;
          if (query) {
            const q = query.toLowerCase();
            items = items.filter((item) => item.order_id?.toLowerCase().includes(q) || item.provider.toLowerCase().includes(q));
          }
          if (selected.provider) {
            items = items.filter((item) => item.provider.toLowerCase() === selected.provider.toLowerCase());
          }
          return { ...res, items };
        })
      }
      columns={columns}
      filters={filters}
      searchPlaceholder={t("ابحث برقم الطلب أو البوابة…", "Search order id or gateway…")}
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

  const filters: ListFilter[] = [
    {
      key: "status",
      label: t("كل الحالات", "All states"),
      options: [
        { value: "succeeded", label: t("ناجح", "Succeeded") },
        { value: "pending", label: t("قيد المعالجة", "Pending") },
        { value: "failed", label: t("فشل", "Failed") },
      ],
    },
  ];

  return (
    <PagedList
      queryKeyBase={paymentsKeys.refunds()}
      fetchPage={({ offset, limit, query, filters: selected }) =>
        listRefunds({ limit, offset }).then((res) => {
          let items = res.items;
          if (query) {
            const q = query.toLowerCase();
            items = items.filter((item) => item.order_id?.toLowerCase().includes(q) || item.provider?.toLowerCase().includes(q));
          }
          if (selected.status) {
            items = items.filter((item) => item.status?.toLowerCase() === selected.status.toLowerCase());
          }
          return { ...res, items };
        })
      }
      columns={columns}
      filters={filters}
      searchPlaceholder={t("ابحث برقم الطلب…", "Search order id…")}
      empty={t("لا استردادات.", "No refunds.")}
    />
  );
}
