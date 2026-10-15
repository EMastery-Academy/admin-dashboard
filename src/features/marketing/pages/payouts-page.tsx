import { useMemo } from "react";
import { listReferralPayouts, referralsKeys, type ReferralPayout } from "@/lib/api";
import { formatAmount, formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Badge, PageHead } from "@/components/ui/kit";
import type { Column } from "@/components/ui/data-table";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";

const payoutStatus = (status: number) =>
  status === 3
    ? { label: { ar: "مدفوع", en: "Paid" }, tone: "success" as const }
    : { label: { ar: "مطلوب", en: "Requested" }, tone: "warning" as const };

export default function PayoutsPage() {
  const t = useT();

  const columns: Column<ReferralPayout>[] = [
    { key: "partner", header: t("المسوّق", "Partner"), cell: (row) => row.partner_name },
    { key: "amount", header: t("المبلغ", "Amount"), align: "end", cell: (row) => formatAmount(row.amount) },
    { key: "status", header: t("الحالة", "Status"), cell: (row) => <Badge def={payoutStatus(row.status)} /> },
    { key: "requested", header: t("الطلب", "Requested"), cell: (row) => formatDateTime(row.requested_at) },
    { key: "updated", header: t("آخر تحديث", "Updated"), cell: (row) => formatDateTime(row.updated_at) },
  ];

  const filters: ListFilter[] = useMemo(
    () => [
      {
        key: "status",
        label: t("كل الحالات", "All statuses"),
        options: [
          { value: "3", label: t("مدفوع", "Paid") },
          { value: "1", label: t("مطلوب", "Requested") },
        ],
      },
    ],
    [t],
  );

  return (
    <>
      <PageHead
        title={t("طلبات الصرف", "Payout requests")}
        sub={t("طلبات صرف عمولات المسوقين وحالة الدفع.", "Referral partner payout requests and payment status.")}
      />
      <PagedList
        queryKeyBase={referralsKeys.payouts()}
        fetchPage={({ offset, limit, filters: selected, query }) =>
          listReferralPayouts({ limit, offset }).then((res) => {
            let items = res.items;
            if (query) {
              const q = query.toLowerCase();
              items = items.filter((item) => item.partner_name?.toLowerCase().includes(q));
            }
            if (selected.status) {
              const st = Number(selected.status);
              items = items.filter((item) => item.status === st);
            }
            return { ...res, items };
          })
        }
        columns={columns}
        filters={filters}
        searchPlaceholder={t("ابحث باسم المسوق…", "Search partner name…")}
        empty={t("لا طلبات صرف.", "No payout requests.")}
      />
    </>
  );
}
