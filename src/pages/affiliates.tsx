import { useMutation, useQueryClient } from "@tanstack/react-query";

import { listReferralPartners, referralsKeys, setReferralPartnerStatus, type ReferralPartner } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Badge, Button, PageHead } from "@/components/ui/kit";
import { type Column } from "@/components/ui/data-table";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";
import { affiliateStatusBadge } from "@/lib/status";

export default function AffiliatesPage() {
  const t = useT();
  const queryClient = useQueryClient();

  const approve = useMutation({
    mutationFn: (partner: ReferralPartner) => setReferralPartnerStatus(partner.legacy_affiliate_id, { status: "approved" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referralsKeys.all }),
  });

  const columns: Column<ReferralPartner>[] = [
    { key: "name", header: t("المسوّق", "Partner"), sortable: true, cell: (row) => (
      <span>
        <span className="ma-cell-main">{row.name}</span>
        <span className="ma-cell-sub"><bdi>{row.email}</bdi></span>
      </span>
    ) },
    { key: "code", header: t("كود الإحالة", "Referral code"), cell: (row) => <span className="ma-num">{row.referral_code || "—"}</span> },
    { key: "status", header: t("الحالة", "Status"), sortable: true, cell: (row) => <Badge def={affiliateStatusBadge(row.status)} /> },
    { key: "joined", header: t("الانضمام", "Joined"), sortable: true, sortValue: (row) => row.joined_at, cell: (row) => formatDateTime(row.joined_at) },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (row) =>
        row.status === "approved" ? null : (
          <Button sm disabled={approve.isPending} label={t("اعتماد", "Approve")} onClick={() => approve.mutate(row)} />
        ),
    },
  ];

  const filters: ListFilter[] = [
    {
      key: "status",
      label: t("كل الحالات", "All states"),
      options: [
        { value: "pending", label: t("قيد المراجعة", "Pending") },
        { value: "approved", label: t("معتمد", "Approved") },
      ],
    },
  ];

  return (
    <>
      <PageHead title={t("المسوقون بالعمولة", "Affiliates")} sub={t("شركاء الإحالة وأحوالهم.", "Referral partners and their states.")} />
      {approve.error ? <p className="ma-alert ma-alert--danger">{(approve.error as Error).message}</p> : null}
      <PagedList
        queryKeyBase={["marketing", "referrals", "partners"]}
        fetchPage={({ query, offset, limit, filters: selected }) =>
          listReferralPartners({ query, status: (selected.status || undefined) as "pending" | "approved" | undefined, limit, offset })
        }
        columns={columns}
        searchPlaceholder={t("ابحث بالاسم أو البريد…", "Search name or email…")}
        filters={filters}
        empty={t("لا مسوقين.", "No partners.")}
      />
    </>
  );
}
