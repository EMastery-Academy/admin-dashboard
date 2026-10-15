import { useMemo } from "react";
import { listConsultationServices, consultationsKeys, type ConsultationService } from "@/lib/api";
import { formatAmount, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { initialsOf } from "@/lib/status";
import { AppLink } from "@/components/ui/app-link";
import { Avatar, Badge, PageHead } from "@/components/ui/kit";
import type { Column } from "@/components/ui/data-table";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";
import { CatalogInsightsPanel } from "@/features/learning/components/catalog-insights-panel";

type ServiceSort = "title" | "price" | "sessions";

export default function ConsultationsPage() {
  const t = useT();

  const columns: Column<ConsultationService>[] = [
    {
      key: "title",
      header: t("الخدمة", "Service"),
      sortKey: "title",
      cell: (row) => (
        <AppLink className="ma-cell-flex ma-link ma-link--plain" to={`/learning/consultations/${row.legacy_consultancy_id}`}>
          <Avatar
            initials={initialsOf(row.title ?? "")}
            src={row.image ?? row.square_image}
            color="var(--coral)"
            alt={row.title ?? ""}
            square
          />
          <span className="ma-cell-main">{row.title}</span>
        </AppLink>
      ),
    },
    {
      key: "consultant",
      header: t("المستشار / المدرب", "Consultant / Instructor"),
      cell: (row) => (
        <div className="ma-cell-flex">
          <Avatar
            initials={initialsOf(row.consultant_name || row.consultant_email)}
            src={row.consultant_avatar}
            color="var(--purple)"
            alt={row.consultant_name ?? ""}
          />
          <span>
            <span className="ma-cell-main">{row.consultant_name || "—"}</span>
            <span className="ma-cell-sub"><bdi>{row.consultant_email || "—"}</bdi></span>
          </span>
        </div>
      ),
    },
    {
      key: "price",
      header: t("السعر", "Price"),
      align: "end",
      sortKey: "price",
      cell: (row) => (row.price != null ? formatAmount(row.price) : "—"),
    },
    {
      key: "sessions",
      header: t("الجلسات", "Sessions"),
      align: "end",
      sortKey: "sessions",
      cell: (row) => <span className="ma-num">{formatNumber(row.sessions ?? 0)}</span>,
    },
    {
      key: "minutes",
      header: t("دقائق/جلسة", "Minutes/Session"),
      align: "end",
      cell: (row) => <span className="ma-num">{formatNumber(row.session_minutes ?? 0)}</span>,
    },
    {
      key: "active",
      header: t("الحالة", "Status"),
      cell: (row) => (
        <Badge
          def={{
            label: row.active ? { ar: "نشطة", en: "Active" } : { ar: "موقوفة", en: "Inactive" },
            tone: row.active ? "success" : "warning",
          }}
        />
      ),
    },
  ];

  const filters: ListFilter[] = useMemo(
    () => [
      {
        key: "active",
        label: t("كل الحالات", "All statuses"),
        options: [
          { value: "true", label: t("نشطة", "Active") },
          { value: "false", label: t("موقوفة", "Inactive") },
        ],
      },
    ],
    [t],
  );

  return (
    <>
      <PageHead
        title={t("الاستشارات", "Consultations")}
        sub={t("خدمات الاستشارة والمدربون المعتمدون من النظام القديم والمنصة.", "Consultation services and certified instructors.")}
      />
      <CatalogInsightsPanel productType="consultation" />
      <PagedList
        queryKeyBase={consultationsKeys.list()}
        fetchPage={({ query, offset, limit, filters: selected, sort }) =>
          listConsultationServices({ query, limit, offset, sort: sort?.key as ServiceSort | undefined, order: sort?.dir }).then((res) => {
            // Apply client-side status filter if specified
            if (selected.active === "true") {
              return { ...res, items: res.items.filter((item) => item.active === true) };
            }
            if (selected.active === "false") {
              return { ...res, items: res.items.filter((item) => item.active === false) };
            }
            return res;
          })
        }
        columns={columns}
        filters={filters}
        sort={{
          options: [
            { value: "title", label: t("الاسم", "Name") },
            { value: "price", label: t("السعر", "Price") },
            { value: "sessions", label: t("الجلسات", "Sessions") },
          ],
          initial: { key: "price", dir: "desc" },
        }}
        searchPlaceholder={t("ابحث بعنوان الخدمة أو المستشار…", "Search service title or consultant…")}
        empty={t("لا خدمات استشارية.", "No consultation services.")}
      />
    </>
  );
}
