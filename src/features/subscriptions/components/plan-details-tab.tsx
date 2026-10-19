import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { subscriptionKeys, updateSubscriptionPlan, type SubscriptionPlan } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { can } from "@/lib/permissions";
import { toast } from "@/components/ui/toast";
import { Alert, Button, Card, ErrorAlert, Field, FormActions } from "@/components/ui/kit";
import { isValidSlug, optional, PriceField, SegmentedChoice, ToggleField } from "@/features/learning/product-form";

import { LOCALES, toNumber, translationFor } from "../lib";

type PlanType = "standard" | "full_library" | "choose_x";
type Interval = "month" | "year";

/** Edit plan terms and bilingual content (`PUT /admin/subscriptions/plans/{id}`). */
export function PlanDetailsTab({ plan }: { plan: SubscriptionPlan }) {
  const t = useT();
  const queryClient = useQueryClient();
  const writable = can("subscriptionsWrite.write");
  const ar = translationFor(plan, "ar");
  const en = translationFor(plan, "en");

  const [slug, setSlug] = useState(plan.slug);
  const [planType, setPlanType] = useState<PlanType>(plan.plan_type);
  const [interval, setInterval] = useState<Interval>(plan.billing_interval);
  const [price, setPrice] = useState(String(toNumber(plan.price)));
  const [allowance, setAllowance] = useState(plan.selection_allowance != null ? String(plan.selection_allowance) : "5");
  const [maxReplacements, setMaxReplacements] = useState(plan.max_replacements_per_period != null ? String(plan.max_replacements_per_period) : "");
  const [maxSeats, setMaxSeats] = useState(String(plan.max_seats ?? 1));
  const [thumbnail, setThumbnail] = useState(plan.thumbnail_url ?? "");
  const [featured, setFeatured] = useState(Boolean(plan.is_featured));
  const [content, setContent] = useState({
    titleAr: ar?.title ?? "",
    titleEn: en?.title ?? "",
    subtitleAr: ar?.subtitle ?? "",
    subtitleEn: en?.subtitle ?? "",
    shortAr: ar?.short_description ?? "",
    shortEn: en?.short_description ?? "",
    descAr: ar?.description ?? "",
    descEn: en?.description ?? "",
    forAr: ar?.who_is_this_for ?? "",
    forEn: en?.who_is_this_for ?? "",
  });
  const setC = (key: keyof typeof content) => (value: string) => setContent((prev) => ({ ...prev, [key]: value }));

  const chooseX = planType === "choose_x";
  const effectiveInterval: Interval = chooseX ? "year" : interval;
  const company = plan.audience_type === "company";
  const priceNumber = Number(price);

  const termsChanged =
    priceNumber !== toNumber(plan.price) ||
    planType !== plan.plan_type ||
    effectiveInterval !== plan.billing_interval ||
    (chooseX && Number(allowance) !== (plan.selection_allowance ?? 0)) ||
    (chooseX && (maxReplacements.trim() === "" ? null : Number(maxReplacements)) !== (plan.max_replacements_per_period ?? null)) ||
    (company && Number(maxSeats) !== plan.max_seats);

  const save = useMutation({
    mutationFn: () =>
      updateSubscriptionPlan(plan.plan_id, {
        slug: slug.trim(),
        plan_type: planType,
        billing_interval: effectiveInterval,
        price: String(priceNumber),
        selection_allowance: chooseX ? Number(allowance) : null,
        max_replacements_per_period: chooseX && maxReplacements.trim() !== "" ? Number(maxReplacements) : null,
        max_seats: company ? Math.max(1, Number(maxSeats) || 1) : 1,
        thumbnail_url: thumbnail.trim(),
        is_featured: featured,
        translations: [
          {
            locale_code: LOCALES.ar,
            title: content.titleAr.trim(),
            subtitle: optional(content.subtitleAr),
            short_description: optional(content.shortAr),
            description: optional(content.descAr),
            who_is_this_for: optional(content.forAr),
            faq_json: ar?.faq_json ?? null,
          },
          {
            locale_code: LOCALES.en,
            title: content.titleEn.trim(),
            subtitle: optional(content.subtitleEn),
            short_description: optional(content.shortEn),
            description: optional(content.descEn),
            who_is_this_for: optional(content.forEn),
            faq_json: en?.faq_json ?? null,
          },
        ],
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      toast.success(
        updated.version !== plan.version
          ? t(`تم الحفظ — الإصدار ${updated.version} للمشتركين الجدد`, `Saved — version ${updated.version} for new subscribers`)
          : t("تم حفظ التغييرات", "Changes saved"),
      );
    },
  });

  const invalid =
    !content.titleAr.trim() ||
    !content.titleEn.trim() ||
    !isValidSlug(slug) ||
    !(priceNumber > 0) ||
    (chooseX && !(Number(allowance) >= 1));

  return (
    <form
      className="ma-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!invalid) save.mutate();
      }}
    >
      <fieldset disabled={!writable} style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: "var(--space-4)" }}>
        <Card title={t("الشروط والتسعير", "Terms & pricing")}>
          <div className="ma-form">
            <SegmentedChoice<PlanType> label={t("نوع الباقة", "Plan type")} value={planType} onChange={setPlanType}
              options={[
                { value: "standard", label: t("قياسية", "Standard") },
                { value: "full_library", label: t("المكتبة الكاملة", "Full library") },
                { value: "choose_x", label: t("اختر عددًا من الدورات", "Choose X courses") },
              ]} />
            <SegmentedChoice<Interval> label={t("دورة الفوترة", "Billing interval")} value={effectiveInterval}
              onChange={(v) => !chooseX && setInterval(v)}
              options={[{ value: "month", label: t("شهري", "Monthly") }, { value: "year", label: t("سنوي", "Yearly") }]} />
            <div className="ma-form-grid">
              <PriceField id="d-price" value={price} onChange={setPrice} invalid={!(priceNumber > 0)}
                label={t("السعر الأساسي (USD)", "List price (USD)")} />
              {chooseX ? (
                <>
                  <Field id="d-allowance" type="number" min={1} label={t("عدد الدورات المسموح", "Courses allowed")} value={allowance} onChange={setAllowance} />
                  <Field id="d-repl" type="number" min={0} label={t("حد الاستبدال لكل فترة", "Replacements per period")} value={maxReplacements}
                    onChange={setMaxReplacements} hint={t("فارغ = بلا حد", "Empty = no limit")} />
                </>
              ) : null}
              {company ? <Field id="d-seats" type="number" min={1} label={t("أقصى عدد مقاعد", "Max seats")} value={maxSeats} onChange={setMaxSeats} /> : null}
            </div>
            {termsChanged ? (
              <Alert kind="warning" title={t(`سيُنشأ الإصدار ${plan.version + 1} من الباقة`, `This creates version ${plan.version + 1} of the plan`)}>
                {t(
                  "تغيير السعر أو الشروط ينطبق على المشتركين الجدد فقط؛ المشتركون الحاليون يحتفظون بشروطهم وسعرهم.",
                  "Price and term changes apply to new subscribers only; existing subscribers keep their terms and price.",
                )}
              </Alert>
            ) : null}
          </div>
        </Card>

        <Card title={t("المحتوى", "Content")}>
          <div className="ma-form">
            <div className="ma-cols ma-cols--2">
              <Field id="d-title-ar" label={t("الاسم (عربي)", "Title (Arabic)")} required value={content.titleAr} onChange={setC("titleAr")} dir="rtl" />
              <Field id="d-title-en" label={t("الاسم (إنجليزي)", "Title (English)")} required value={content.titleEn} onChange={setC("titleEn")} dir="ltr" />
              <Field id="d-sub-ar" label={t("عنوان فرعي (عربي)", "Subtitle (Arabic)")} value={content.subtitleAr} onChange={setC("subtitleAr")} dir="rtl" />
              <Field id="d-sub-en" label={t("عنوان فرعي (إنجليزي)", "Subtitle (English)")} value={content.subtitleEn} onChange={setC("subtitleEn")} dir="ltr" />
              <Field id="d-short-ar" type="textarea" rows={3} label={t("وصف مختصر (عربي)", "Short description (Arabic)")} value={content.shortAr} onChange={setC("shortAr")} dir="rtl" />
              <Field id="d-short-en" type="textarea" rows={3} label={t("وصف مختصر (إنجليزي)", "Short description (English)")} value={content.shortEn} onChange={setC("shortEn")} dir="ltr" />
              <Field id="d-desc-ar" type="textarea" rows={5} label={t("الوصف (عربي)", "Description (Arabic)")} value={content.descAr} onChange={setC("descAr")} dir="rtl" />
              <Field id="d-desc-en" type="textarea" rows={5} label={t("الوصف (إنجليزي)", "Description (English)")} value={content.descEn} onChange={setC("descEn")} dir="ltr" />
              <Field id="d-for-ar" type="textarea" rows={3} label={t("لمن هذه الباقة (عربي)", "Who it's for (Arabic)")} value={content.forAr} onChange={setC("forAr")} dir="rtl" />
              <Field id="d-for-en" type="textarea" rows={3} label={t("لمن هذه الباقة (إنجليزي)", "Who it's for (English)")} value={content.forEn} onChange={setC("forEn")} dir="ltr" />
            </div>
            <Field id="d-slug" label={t("رابط الباقة (slug)", "Plan slug")} value={slug} onChange={setSlug} dir="ltr"
              hint={!isValidSlug(slug) ? t("حروف لاتينية صغيرة وأرقام وشرطات فقط.", "Lowercase letters, digits and hyphens only.") : undefined} />
            <Field id="d-thumb" label={t("رابط الصورة المصغّرة", "Thumbnail URL")} value={thumbnail} onChange={setThumbnail} dir="ltr" />
            <ToggleField id="d-featured" label={t("باقة مميّزة", "Featured plan")} checked={featured} onChange={setFeatured} />
          </div>
        </Card>
      </fieldset>

      <ErrorAlert error={save.error} title={t("تعذّر الحفظ", "Couldn't save")} />
      {writable ? (
        <FormActions>
          <Button kind="primary" type="submit" disabled={invalid || save.isPending} label={save.isPending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ التغييرات", "Save changes")} />
        </FormActions>
      ) : null}
    </form>
  );
}
