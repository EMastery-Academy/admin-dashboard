import { listConsultationServices, consultationsKeys, type ConsultationService } from "@/lib/api";
import { formatAmount, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Badge, PageHead } from "@/components/ui/kit";
import type { Column } from "@/components/ui/data-table";
import { PagedList } from "@/components/ui/paged-list";

export default function ConsultationsPage() {
  const t = useT();

  const columns: Column<ConsultationService>[] = [
    { key: "title", header: t("الخدمة", "Service"), cell: (row) => row.title },
    {
      key: "consultant",
      header: t("المستشار", "Consultant"),
      cell: (row) => (
        <span>
          <span className="ma-cell-main">{row.consultant_name}</span>
          <span className="ma-cell-sub"><bdi>{row.consultant_email}</bdi></span>
        </span>
      ),
    },
    { key: "price", header: t("السعر", "Price"), align: "end", cell: (row) => formatAmount(row.price) },
    { key: "sessions", header: t("الجلسات", "Sessions"), align: "end", cell: (row) => <span className="ma-num">{formatNumber(row.sessions)}</span> },
    { key: "minutes", header: t("دقائق/جلسة", "Minutes"), align: "end", cell: (row) => <span className="ma-num">{formatNumber(row.session_minutes)}</span> },
    { key: "active", header: t("الحالة", "Status"), cell: (row) => <Badge def={{ label: row.active ? { ar: "نشطة", en: "Active" } : { ar: "موقوفة", en: "Inactive" }, tone: row.active ? "success" : "warning" }} /> },
  ];

  return (
    <>
      <PageHead title={t("الاستشارات", "Consultations")} sub={t("خدمات الاستشارة من النظام القديم.", "Consultation services from the legacy system.")} />
      <PagedList
        queryKeyBase={consultationsKeys.list()}
        fetchPage={({ query, offset, limit }) => listConsultationServices({ query, limit, offset })}
        columns={columns}
        searchPlaceholder={t("ابحث بالخدمة…", "Search service…")}
        empty={t("لا خدمات.", "No services.")}
      />
    </>
  );
}
