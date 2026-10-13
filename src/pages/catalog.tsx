import { useMutation, useQueryClient } from "@tanstack/react-query";

import { catalogKeys, listCatalog, publishProduct, type CatalogKind, type CatalogProduct } from "@/lib/api";
import { formatAmount, formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Avatar, Badge, Button, PageHead } from "@/components/ui/kit";
import { type Column } from "@/components/ui/data-table";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";
import { initialsOf, productStatusBadge } from "@/lib/status";

export default function CoursesPage() {
  return <CatalogList kind="course" titleAr="الدورات" titleEn="Courses" subAr="دورات المصدر القديم وحالة نشرها." subEn="Legacy courses and their publishing state." />;
}

export function PackagesPage() {
  return <CatalogList kind="package" titleAr="الحزم والدبلومات" titleEn="Packages & diplomas" subAr="حزم ودبلومات المصدر القديم." subEn="Legacy packages and diplomas." />;
}

function CatalogList({ kind, titleAr, titleEn, subAr, subEn }: { kind: CatalogKind; titleAr: string; titleEn: string; subAr: string; subEn: string }) {
  const t = useT();
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: (product: CatalogProduct) => publishProduct(kind, product.legacy_id, { published: product.status !== "published" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
  });

  const columns: Column<CatalogProduct>[] = [
    {
      key: "title",
      header: t("العنوان", "Title"),
      sortable: true,
      cell: (row) => (
        <span className="ma-cell-flex">
          <Avatar initials={initialsOf(row.title)} src={row.square_image ?? row.image} color="var(--teal)" alt={row.title} />
          <span>
            <span className="ma-cell-main">{row.title}</span>
            <span className="ma-cell-sub">{row.category || "—"}</span>
          </span>
        </span>
      ),
    },
    { key: "instructor", header: t("المدرب", "Instructor"), sortable: true, cell: (row) => row.instructor || "—" },
    { key: "price", header: t("السعر", "Price"), align: "end", sortable: true, sortValue: (row) => row.current_price ?? 0, cell: (row) => (row.current_price != null ? formatAmount(row.current_price) : "—") },
    { key: "status", header: t("الحالة", "Status"), sortable: true, cell: (row) => <Badge def={productStatusBadge(row.status)} /> },
    { key: "updated", header: t("آخر تحديث", "Updated"), sortable: true, sortValue: (row) => row.updated_at ?? "", cell: (row) => formatDateTime(row.updated_at) },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (row) => (
        <Button sm disabled={toggle.isPending} label={row.status === "published" ? t("إلغاء النشر", "Unpublish") : t("نشر", "Publish")} onClick={() => toggle.mutate(row)} />
      ),
    },
  ];

  const filters: ListFilter[] = [
    {
      key: "published",
      label: t("كل الحالات", "All states"),
      options: [
        { value: "true", label: t("منشور", "Published") },
        { value: "false", label: t("غير منشور", "Draft") },
      ],
    },
  ];

  return (
    <>
      <PageHead title={t(titleAr, titleEn)} sub={t(subAr, subEn)} />
      {toggle.error ? <p className="ma-alert ma-alert--danger">{(toggle.error as Error).message}</p> : null}
      <PagedList
        queryKeyBase={["learning", "catalog", kind]}
        fetchPage={({ query, offset, limit, filters: selected }) =>
          listCatalog(kind, { query, published: selected.published ? selected.published === "true" : undefined, limit, offset })
        }
        columns={columns}
        searchPlaceholder={t("ابحث بالعنوان…", "Search title…")}
        filters={filters}
        empty={t("لا عناصر.", "No items.")}
      />
    </>
  );
}
