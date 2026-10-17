import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  productKeys,
  productQueries,
  studioKeys,
  updatePackage,
  updatePackageSections,
  type PackageDetailSection,
} from "@/lib/api";
import { useT } from "@/lib/i18n";
import { Button, Card, ErrorAlert, Field, Loading } from "@/components/ui/kit";
import { PackageCoursesCard } from "@/features/learning/components/package-courses-card";
import { LegacyProductContent } from "@/features/learning/components/legacy-product-content";

/**
 * Package management for a legacy package: its title/description/publish state and the courses it
 * bundles (add, remove, mark required/optional). Writes change the local `legacy` mirror only, and
 * are audited (`/admin/catalog/products/{ref}/package*`). The rest of a package's legacy content
 * (prices, certificates, completion rules) stays read-only below.
 */
export function PackageTab({ productRef }: { productRef: string }) {
  const t = useT();
  const queryClient = useQueryClient();

  const detailQuery = useQuery(productQueries.detail(productRef));
  const sectionsQuery = useQuery(productQueries.packageSections(productRef));

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [sections, setSections] = useState<{ heading: string; body: string; variant: string }[]>([]);

  const detail = detailQuery.data;
  useEffect(() => {
    if (!detail) return;
    setName(detail.legacy?.product.title ?? detail.product.title ?? "");
    setDescription(detail.legacy?.description ?? "");
    setActive((detail.legacy?.product.status ?? detail.product.status) === "published");
  }, [detail]);

  const remoteSections = sectionsQuery.data;
  useEffect(() => {
    if (!remoteSections) return;
    setSections(remoteSections.map((s: PackageDetailSection) => ({ heading: s.heading, body: s.body ?? "", variant: s.variant })));
  }, [remoteSections]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: productKeys.detail(productRef) });
    queryClient.invalidateQueries({ queryKey: productKeys.content(productRef, "summary") });
    // Keep the Studio's live preview in sync with package edits.
    queryClient.invalidateQueries({ queryKey: studioKeys.previewBase(productRef) });
  };

  const save = useMutation({
    mutationFn: () => updatePackage(productRef, { name, description: description || null, active }),
    onSuccess: invalidate,
  });
  const saveSections = useMutation({
    mutationFn: () =>
      updatePackageSections(productRef, {
        sections: sections
          .filter((section) => section.heading.trim())
          .map((section) => ({
            heading: section.heading,
            body: section.body || null,
            variant: (section.variant === "goals" || section.variant === "audience" ? section.variant : "prose") as
              | "prose"
              | "goals"
              | "audience",
          })),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.content(productRef, "package-sections") }),
  });

  if (detailQuery.isLoading) return <Loading />;
  if (detailQuery.error) return <ErrorAlert error={detailQuery.error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card
        title={t("تفاصيل الحزمة", "Package details")}
        actions={
          <Button kind="primary" label={t("حفظ", "Save")} disabled={save.isPending} onClick={() => save.mutate()} />
        }
      >
        <ErrorAlert error={save.error} title={t("تعذّر حفظ الحزمة", "Couldn't save the package")} />
        <Field id="pkg-name" label={t("العنوان", "Title")} value={name} onChange={setName} />
        <Field
          id="pkg-desc"
          label={t("الوصف", "Description")}
          value={description}
          onChange={setDescription}
          type="textarea"
          rows={4}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBlockStart: 8 }}>
          <span className="ma-muted">{t("الحالة", "Status")}</span>
          <Button
            kind={active ? "primary" : "secondary"}
            label={active ? t("منشور", "Published") : t("غير منشور", "Unpublished")}
            onClick={() => setActive((value) => !value)}
          />
        </div>
      </Card>

      <Card
        title={t("أقسام تفاصيل الحزمة", "Detail sections")}
        actions={
          <Button kind="primary" label={t("حفظ الأقسام", "Save sections")} disabled={saveSections.isPending} onClick={() => saveSections.mutate()} />
        }
      >
        <ErrorAlert error={saveSections.error} title={t("تعذّر حفظ الأقسام", "Couldn't save sections")} />
        <p className="ma-muted" style={{ marginBlockEnd: 12 }}>
          {t(
            "المقدمة، المحاور الرئيسية، أهداف البرنامج، الفئة المستهدفة… تظهر بهذا الترتيب في صفحة الحزمة.",
            "المقدمة / المحاور / الأهداف / الفئة المستهدفة — shown in this order on the package page.",
          )}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sections.map((section, index) => (
            <div
              key={index}
              style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-control)", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Field
                    id={`pkg-sec-heading-${index}`}
                    label={t("العنوان", "Heading")}
                    value={section.heading}
                    onChange={(value) => setSections((current) => current.map((s, i) => (i === index ? { ...s, heading: value } : s)))}
                  />
                </div>
                <div style={{ width: 170 }}>
                  <Field
                    id={`pkg-sec-variant-${index}`}
                    label={t("النمط", "Style")}
                    value={section.variant}
                    onChange={(value) => setSections((current) => current.map((s, i) => (i === index ? { ...s, variant: value } : s)))}
                    options={[
                      ["prose", t("نص", "Prose")],
                      ["goals", t("قائمة أهداف", "Goals list")],
                      ["audience", t("الفئة (أشخاص)", "Audience")],
                    ]}
                  />
                </div>
                <span style={{ display: "flex", gap: 4 }}>
                  <Button sm label="↑" disabled={index === 0} onClick={() => setSections((c) => moveSection(c, index, -1))} />
                  <Button sm label="↓" disabled={index === sections.length - 1} onClick={() => setSections((c) => moveSection(c, index, 1))} />
                  <Button sm kind="danger" label={t("إزالة", "Remove")} onClick={() => setSections((c) => c.filter((_, i) => i !== index))} />
                </span>
              </div>
              <Field
                id={`pkg-sec-body-${index}`}
                label={t("المحتوى", "Body")}
                value={section.body}
                onChange={(value) => setSections((current) => current.map((s, i) => (i === index ? { ...s, body: value } : s)))}
                type="textarea"
                rows={4}
              />
            </div>
          ))}
        </div>
        <div style={{ marginBlockStart: 12 }}>
          <Button label={t("إضافة قسم", "Add section")} onClick={() => setSections((c) => [...c, { heading: "", body: "", variant: "prose" }])} />
        </div>
      </Card>

      <PackageCoursesCard productRef={productRef} />

      <LegacyProductContent productRef={productRef} kind="package" />
    </div>
  );
}

/** Moves a section up or down in the list. */
function moveSection<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) {
    return list;
  }
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
