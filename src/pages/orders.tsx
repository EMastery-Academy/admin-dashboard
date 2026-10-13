import { listOrders, type AdminOrder } from "@/lib/api";
import { formatAmount, formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { initialsOf, orderStatusBadge, paymentStatusBadge } from "@/lib/status";
import { type Column } from "@/components/ui/data-table";
import { Avatar, Badge, PageHead } from "@/components/ui/kit";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";

const STATUSES: { value: string; ar: string; en: string }[] = [
  { value: "created", ar: "جديد", en: "Created" },
  { value: "pending_payment", ar: "بانتظار الدفع", en: "Pending payment" },
  { value: "paid", ar: "مدفوع", en: "Paid" },
  { value: "fulfilled", ar: "مكتمل", en: "Fulfilled" },
  { value: "cancelled", ar: "ملغى", en: "Cancelled" },
];

const PAYMENT_STATUSES: { value: string; ar: string; en: string }[] = [
  { value: "pending", ar: "بانتظار", en: "Pending" },
  { value: "succeeded", ar: "ناجح", en: "Succeeded" },
  { value: "failed", ar: "فاشل", en: "Failed" },
  { value: "refunded", ar: "مُسترد", en: "Refunded" },
];

export default function OrdersPage() {
  const t = useT();

  const columns: Column<AdminOrder>[] = [
    {
      key: "order",
      header: t("الطلب", "Order"),
      sortable: true,
      sortValue: (row) => row.created_at,
      cell: (row) => (
        <>
          <span className="ma-cell-main"><bdi>#{row.order_id.slice(0, 8)}</bdi></span>
          <span className="ma-cell-sub">{formatDateTime(row.created_at)}</span>
        </>
      ),
    },
    {
      key: "customer",
      header: t("العميل", "Customer"),
      sortable: true,
      sortValue: (row) => row.customer_email ?? "",
      cell: (row) => (
        <span className="ma-cell-flex">
          <Avatar initials={initialsOf(row.customer_email)} color="var(--sky)" />
          <span className="ma-cell-main"><bdi>{row.customer_email}</bdi></span>
        </span>
      ),
    },
    { key: "status", header: t("الحالة", "Status"), sortable: true, cell: (row) => <Badge def={orderStatusBadge(row.status)} /> },
    { key: "payment", header: t("الدفع", "Payment"), cell: (row) => <Badge def={paymentStatusBadge(row.payment_status)} /> },
    { key: "total", header: t("الإجمالي", "Total"), align: "end", sortable: true, sortValue: (row) => row.amount_minor, cell: (row) => <span className="ma-num">{formatAmount(row.amount_minor / 100, row.currency_code)}</span> },
  ];

  const filters: ListFilter[] = [
    { key: "status", label: t("كل الحالات", "All statuses"), options: STATUSES.map((item) => ({ value: item.value, label: t(item.ar, item.en) })) },
    { key: "payment_status", label: t("كل حالات الدفع", "All payments"), options: PAYMENT_STATUSES.map((item) => ({ value: item.value, label: t(item.ar, item.en) })) },
  ];

  return (
    <>
      <PageHead title={t("الطلبات", "Orders")} sub={t("كل الطلبات مع الفلاتر والبحث.", "Every order, with filters and search.")} />

      <PagedList
        queryKeyBase={["orders"]}
        fetchPage={({ query, offset, limit, filters: selected }) =>
          listOrders({
            status: selected.status || undefined,
            payment_status: selected.payment_status || undefined,
            query,
            limit,
            offset,
          })
        }
        columns={columns}
        searchPlaceholder={t("ابحث ببريد العميل…", "Search customer email…")}
        filters={filters}
        empty={t("لا طلبات.", "No orders.")}
      />

      <p className="ma-muted ma-section-gap" style={{ fontSize: 13 }}>
        {t("استرداد الطلب متاح من صفحة الطلب بعد اكتمال تكامل بوابة الدفع.", "Issuing a refund is available from the order page once the gateway integration is complete.")}
      </p>
    </>
  );
}
