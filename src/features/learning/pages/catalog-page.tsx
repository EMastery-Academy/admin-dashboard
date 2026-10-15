import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listProducts,
  productKeys,
  productQueries,
  setProductStatus,
  type Product,
  type ProductOrigin,
  type ProductSort,
  type ProductSource,
  type ProductStatus,
} from "@/lib/api";
import { formatAmount, formatDateTime, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { AppLink } from "@/components/ui/app-link";
import { Avatar, Badge, Button, ErrorAlert, PageHead } from "@/components/ui/kit";
import { type Column } from "@/components/ui/data-table";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";
import { initialsOf, productStatusBadge } from "@/lib/status";
import { CatalogInsightsPanel } from "@/features/learning/components/catalog-insights-panel";
import { productHref } from "@/lib/refs";
import { SourceBadge } from "@/components/ui/source-badge";

/**
 * Every catalog product: B2C products (`b2c.products`, only `published` ones are sold) and the legacy
 * courses/packages no B2C product represents yet (`source` = `legacy`).
 */
export default function CoursesPage() {
  return (
    <CatalogList
      types="course"
      titleAr="الدورات"
      titleEn="Courses"
      subAr="دورات المتجر وحالة نشرها والمدربون."
      subEn="Storefront courses, instructors and their publishing state."
    />
  );
}

export function PackagesPage() {
  return (
    <CatalogList
      types="package,diploma,bundle"
      titleAr="الحزم والدبلومات"
      titleEn="Packages & diplomas"
      subAr="الحزم والدبلومات والباقات المعروضة في المتجر."
      subEn="Storefront packages, diplomas and bundles."
    />
  );
}

const STATUSES: { value: ProductStatus; ar: string; en: string }[] = [
  { value: "published", ar: "منشور", en: "Published" },
  { value: "unpublished", ar: "غير منشور", en: "Unpublished" },
  { value: "draft", ar: "مسودة", en: "Draft" },
  { value: "archived", ar: "مؤرشف", en: "Archived" },
];

const TYPES: Record<string, [string, string]> = {
  course: ["دورة", "Course"],
  package: ["حزمة", "Package"],
  diploma: ["دبلوم", "Diploma"],
  bundle: ["باقة", "Bundle"],
  consultation: ["استشارة", "Consultation"],
};

function CatalogList({
  types,
  titleAr,
  titleEn,
  subAr,
  subEn,
}: {
  types: string;
  titleAr: string;
  titleEn: string;
  subAr: string;
  subEn: string;
}) {
  const t = useT();
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: (product: Product) =>
      setProductStatus(
        product.ref ?? `b2c:${product.product_id}`,
        product.status === "published" ? (product.source === "legacy" ? "draft" : "unpublished") : "published",
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });

  const columns: Column<Product>[] = [
    {
      key: "title",
      header: t("العنوان", "Title"),
      width: "16rem",
      sortKey: "title",
      cell: (row) => (
        <AppLink to={productHref(row.ref ?? `b2c:${row.product_id}`)} className="ma-cell-flex ma-link ma-link--plain">
          <Avatar
            initials={initialsOf(row.title ?? row.slug)}
            src={row.image ?? row.square_image ?? (row as unknown as { squareImage?: string | null }).squareImage}
            color="var(--teal)"
            alt={row.title ?? row.slug}
            square
          />
          <span>
            <span className="ma-cell-main">{row.title ?? row.slug}</span>
            <span className="ma-cell-sub">
              {[
                TYPES[row.product_type] ? t(...TYPES[row.product_type]) : row.product_type,
                row.category,
                row.origin === "migrated" ? t("منقول من المنصة القديمة", "Migrated") : null,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </span>
          </span>
        </AppLink>
      ),
    },
    {
      key: "instructor",
      header: t("المدرب", "Instructor"),
      cell: (row) =>
        row.instructor ? (
          <span className="ma-cell-flex">
            <Avatar
              initials={initialsOf(row.instructor)}
              src={row.instructor_avatar}
              color="var(--sky)"
              alt={row.instructor}
            />
            <span className="ma-cell-main">{row.instructor}</span>
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "price",
      header: t("السعر", "Price"),
      align: "end",
      sortKey: "price",
      cell: (row) => (row.price != null ? formatAmount(row.price, row.price_currency ?? "USD") : "—"),
    },
    {
      key: "orders",
      header: t("طلبات مدفوعة", "Paid orders"),
      align: "end",
      sortKey: "paid_orders",
      cell: (row) => <span className="ma-num">{formatNumber(row.paid_orders)}</span>,
    },
    {
      key: "rating",
      header: t("التقييم", "Rating"),
      align: "end",
      sortKey: "rating",
      cell: (row) =>
        row.rating != null ? (
          <span className="ma-num" title={t(`${row.review_count} تقييم`, `${row.review_count} reviews`)}>
            ★ {row.rating.toFixed(1)} <span className="ma-cell-sub">({formatNumber(row.review_count ?? 0)})</span>
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "tags",
      header: t("الوسوم", "Tags"),
      cell: (row) => {
        const tags = row.tags ?? [];
        if (!tags.length) return "—";
        return (
          <span className="ma-cell-tags" title={tags.join(", ")}>
            {tags.slice(0, 1).map((tag) => (
              <span key={tag} className="ma-tag">
                {tag}
              </span>
            ))}
            {tags.length > 1 ? <bdi className="ma-cell-sub">+{tags.length - 1}</bdi> : null}
          </span>
        );
      },
    },
    {
      key: "status",
      header: t("الحالة", "Status"),
      cell: (row) => (
        <span className="ma-cell-flex">
          <Badge def={productStatusBadge(row.status)} />
          <SourceBadge source={row.source} />
        </span>
      ),
    },
    {
      key: "updated",
      header: t("آخر تحديث", "Updated"),
      sortKey: "updated",
      cell: (row) => formatDateTime(row.updated_at),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (row) => (
        <Button
          sm
          disabled={toggle.isPending}
          label={row.status === "published" ? t("إلغاء النشر", "Unpublish") : t("نشر", "Publish")}
          onClick={() => toggle.mutate(row)}
        />
      ),
    },
  ];

  const facets = useQuery(productQueries.facets(types)).data;
  const typeOptions = types.split(",");

  const filters: ListFilter[] = [
    {
      key: "status",
      label: t("كل الحالات", "All states"),
      options: STATUSES.map((item) => ({ value: item.value, label: t(item.ar, item.en) })),
    },
    ...(typeOptions.length > 1
      ? [
          {
            key: "product_type",
            label: t("كل الأنواع", "All types"),
            options: typeOptions.map((type) => ({ value: type, label: TYPES[type] ? t(...TYPES[type]) : type })),
          },
        ]
      : []),
    {
      key: "category",
      label: t("كل التصنيفات", "All categories"),
      options: (facets?.categories ?? []).map((item) => ({ value: item.value, label: `${item.label} (${item.count})` })),
    },
    {
      key: "tag",
      label: t("كل الوسوم", "All tags"),
      options: (facets?.tags ?? []).map((item) => ({ value: item.value, label: `${item.label} (${item.count})` })),
    },
    {
      key: "source",
      label: t("كل الأنظمة", "All systems"),
      options: [
        { value: "b2c", label: t("المتجر (B2C)", "B2C products") },
        { value: "legacy", label: t("النظام القديم (غير منقول)", "Legacy (not migrated)") },
      ],
    },
    {
      key: "origin",
      label: t("كل المصادر", "All origins"),
      options: [
        { value: "migrated", label: t("منقول من المنصة القديمة", "Migrated from legacy") },
        { value: "native", label: t("المتجر الجديد", "Native") },
      ],
    },
    {
      key: "purchased",
      label: t("المبيعات: الكل", "Sales: all"),
      options: [
        { value: "true", label: t("بيع مرة على الأقل", "Purchased") },
        { value: "false", label: t("لم يُشترَ", "Never purchased") },
      ],
    },
  ];

  const sortOptions: { value: ProductSort; label: string }[] = [
    { value: "updated", label: t("آخر تحديث", "Last updated") },
    { value: "created", label: t("تاريخ الإنشاء", "Created") },
    { value: "price", label: t("السعر", "Price") },
    { value: "title", label: t("العنوان", "Title") },
    { value: "paid_orders", label: t("الطلبات المدفوعة", "Paid orders") },
    { value: "rating", label: t("التقييم", "Rating") },
  ];

  return (
    <>
      <PageHead
        title={t(titleAr, titleEn)}
        sub={t(subAr, subEn)}
        actions={
          types === "course" ? (
            <Button kind="primary" icon="plus" label={t("إنشاء دورة", "Create course")} href="/learning/courses/new" />
          ) : undefined
        }
      />
      <CatalogInsightsPanel productType={types} />
      <ErrorAlert error={toggle.error} title={t("تعذّر تغيير حالة النشر", "Couldn't change the publishing state")} />
      <PagedList
        queryKeyBase={productKeys.list({ product_type: types })}
        fetchPage={({ query, offset, limit, filters: selected, sort }) =>
          listProducts({
            product_type: selected.product_type || types,
            status: (selected.status || undefined) as ProductStatus | undefined,
            category: selected.category || undefined,
            tag: selected.tag || undefined,
            source: (selected.source || undefined) as ProductSource | undefined,
            origin: (selected.origin || undefined) as ProductOrigin | undefined,
            purchased: selected.purchased ? selected.purchased === "true" : undefined,
            sort: sort?.key as ProductSort | undefined,
            order: sort?.dir,
            query,
            limit,
            offset,
          })
        }
        sort={{ options: sortOptions, initial: { key: "updated", dir: "desc" } }}
        columns={columns}
        searchPlaceholder={t("ابحث بالعنوان أو الرابط…", "Search title or slug…")}
        filters={filters}
        empty={t("لا عناصر.", "No items.")}
      />
    </>
  );
}
