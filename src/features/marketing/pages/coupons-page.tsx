import { useMutation, useQueryClient } from "@tanstack/react-query";

import { listPromotions, promotionsKeys, setPromotionActive, type Promotion } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { dateValue } from "@/lib/export/columns";
import { Badge, Button, ErrorAlert, PageHead } from "@/components/ui/kit";
import { type Column } from "@/components/ui/data-table";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";

export default function CouponsPage() {
  const t = useT();
  const lang = useLang();
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: (promotion: Promotion) => setPromotionActive(promotion.legacy_coupon_id, { active: !promotion.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: promotionsKeys.all }),
  });

  const columns: Column<Promotion>[] = [
    { key: "code", header: t("الكود", "Code"), sortable: true, exportValue: (row) => row.code, cell: (row) => <span className="ma-num">{row.code}</span> },
    { key: "name", header: t("الاسم", "Name"), sortable: true, exportValue: (row) => row.name, cell: (row) => row.name },
    { key: "discount", header: t("الخصم", "Discount"), align: "end", sortable: true, sortValue: (row) => row.discount_percent ?? 0, exportKind: "number", exportHeader: t("الخصم %", "Discount %"), exportValue: (row) => row.discount_percent ?? null, cell: (row) => (row.discount_percent != null ? `${row.discount_percent}%` : "—") },
    { key: "ends", header: t("ينتهي", "Ends"), exportKind: "datetime", exportValue: (row) => dateValue(row.ends_at), cell: (row) => formatDateTime(row.ends_at) },
    { key: "active", header: t("الحالة", "Status"), exportValue: (row) => (row.active ? (lang === "ar" ? "مفعّل" : "Active") : lang === "ar" ? "موقوف" : "Inactive"), cell: (row) => <Badge def={{ label: row.active ? { ar: "مفعّل", en: "Active" } : { ar: "موقوف", en: "Inactive" }, tone: row.active ? "success" : "warning" }} /> },
    {
      key: "actions",
      header: "",
      exportable: false,
      align: "end",
      cell: (row) => (
        <Button sm disabled={toggle.isPending} label={row.active ? t("إيقاف", "Deactivate") : t("تفعيل", "Activate")} onClick={() => toggle.mutate(row)} />
      ),
    },
  ];

  const filters: ListFilter[] = [
    {
      key: "active",
      label: t("كل الحالات", "All states"),
      options: [
        { value: "true", label: t("مفعّل", "Active") },
        { value: "false", label: t("موقوف", "Inactive") },
      ],
    },
  ];

  return (
    <>
      <PageHead
        title={t("الكوبونات", "Coupons")}
        sub={t("كوبونات الخصم من النظام القديم.", "Discount coupons from the legacy system.")}
        actions={<Button kind="primary" icon="plus" label={t("إنشاء كوبون", "Create coupon")} href="/sales/coupons/new" />}
      />
      <ErrorAlert error={toggle.error} title={t("تعذّر تغيير حالة الكوبون", "Couldn't change the coupon state")} />
      <PagedList
        queryKeyBase={["marketing", "promotions"]}
        fetchPage={({ query, offset, limit, filters: selected }) =>
          listPromotions({ query, active: selected.active ? selected.active === "true" : undefined, limit, offset })
        }
        columns={columns}
        searchPlaceholder={t("ابحث بالكود أو الاسم…", "Search code or name…")}
        filters={filters}
        empty={t("لا كوبونات.", "No coupons.")}
        exportConfig={{ filename: "coupons", title: t("الكوبونات", "Coupons"), pdf: true, fetchSize: 200 }}
      />
    </>
  );
}
