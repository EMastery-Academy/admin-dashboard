import { listReferralPayouts, referralsKeys, type ReferralPayout } from "@/lib/api";
import { formatAmount, formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Badge, PageHead } from "@/components/ui/kit";
import type { Column } from "@/components/ui/data-table";
import { PagedList } from "@/components/ui/paged-list";

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

  return (
    <>
      <PageHead title={t("طلبات الصرف", "Payout requests")} sub={t("طلبات صرف عمولات المسوقين.", "Referral partner payout requests.")} />
      <PagedList
        queryKeyBase={referralsKeys.payouts()}
        fetchPage={({ offset, limit }) => listReferralPayouts({ limit, offset })}
        columns={columns}
        empty={t("لا طلبات صرف.", "No payout requests.")}
      />
    </>
  );
}
