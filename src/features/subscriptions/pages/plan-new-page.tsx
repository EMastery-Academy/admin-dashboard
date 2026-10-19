import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createSubscriptionPlan } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "@/components/ui/toast";
import { Alert, Button, Card, ErrorAlert, Field, FormActions, PageHead } from "@/components/ui/kit";
import {
  isPriceRequiredValid,
  isValidSlug,
  ListEditor,
  optional,
  parsePrice,
  PriceField,
  SegmentedChoice,
  SlugField,
  ToggleField,
  toSlug,
} from "@/features/learning/product-form";

import { LOCALES } from "../lib";

type Audience = "individual" | "company";
type PlanType = "standard" | "full_library" | "choose_x";
type Interval = "month" | "year";

/** `POST /admin/subscriptions/plans` — creates the plan as a draft; resources, benefits and discount follow on its page. */
export default function SubscriptionPlanNewPage() {
  const t = useT();
  const navigate = useNavigate();

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [subtitleAr, setSubtitleAr] = useState("");
  const [subtitleEn, setSubtitleEn] = useState("");
  const [shortAr, setShortAr] = useState("");
  const [shortEn, setShortEn] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [audience, setAudience] = useState<Audience>("individual");
  const [planType, setPlanType] = useState<PlanType>("standard");
  const [interval, setInterval] = useState<Interval>("month");
  const [price, setPrice] = useState("");
  const [allowance, setAllowance] = useState("5");
  const [maxReplacements, setMaxReplacements] = useState("");
  const [maxSeats, setMaxSeats] = useState("10");
  const [thumbnail, setThumbnail] = useState("");
  const [featured, setFeatured] = useState(false);
  const [cardAr, setCardAr] = useState<string[]>([]);
  const [cardEn, setCardEn] = useState<string[]>([]);

  const chooseX = planType === "choose_x";
  // Choose-X plans are annual only (CHX-01).
  const effectiveInterval: Interval = chooseX ? "year" : interval;

  const setTitleEnSafe = (value: string) => {
    setTitleEn(value);
    if (!slugEdited) setSlug(toSlug(value));
  };

  const create = useMutation({
    mutationFn: () =>
      createSubscriptionPlan({
        slug: slug.trim(),
        audience_type: audience,
        plan_type: planType,
        billing_interval: effectiveInterval,
        price: String(parsePrice(price) ?? 0),
        currency_code: "USD",
        status: "draft",
        selection_allowance: chooseX ? Number(allowance) : null,
        max_replacements_per_period: chooseX && maxReplacements.trim() !== "" ? Number(maxReplacements) : null,
        max_seats: audience === "company" ? Math.max(1, Number(maxSeats) || 1) : 1,
        thumbnail_url: optional(thumbnail),
        is_featured: featured,
        translations: [
          { locale_code: LOCALES.ar, title: titleAr.trim(), subtitle: optional(subtitleAr), short_description: optional(shortAr) },
          { locale_code: LOCALES.en, title: titleEn.trim(), subtitle: optional(subtitleEn), short_description: optional(shortEn) },
        ],
        card_features: {
          [LOCALES.ar]: cardAr.map((i) => i.trim()).filter(Boolean),
          [LOCALES.en]: cardEn.map((i) => i.trim()).filter(Boolean),
        },
      }),
    onSuccess: (plan) => {
      toast.success(t("تم إنشاء الباقة كمسودة", "Plan created as a draft"));
      navigate(`/subscriptions/plans/${plan.plan_id}?tab=resources`);
    },
  });

  const invalid =
    !titleAr.trim() ||
    !titleEn.trim() ||
    !slug.trim() ||
    !isValidSlug(slug) ||
    !isPriceRequiredValid(price) ||
    (parsePrice(price) ?? 0) <= 0 ||
    (chooseX && !(Number(allowance) >= 1));

  return (
    <>
      <PageHead
        title={t("باقة اشتراك جديدة", "New subscription plan")}
        sub={t(
          "تُحفظ الباقة كمسودة. بعدها أضف الموارد والمزايا والخصم ثم انشرها.",
          "The plan is saved as a draft. Then add resources, benefits and a discount, and publish it.",
        )}
        back={{ href: "/subscriptions/plans", label: t("الباقات", "Plans") }}
      />
      <form
        className="ma-form-layout"
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid) create.mutate();
        }}
      >
        <div className="ma-form-main">
          <Card title={t("النموذج والتسعير", "Model & pricing")}>
            <div className="ma-form">
              <SegmentedChoice<Audience> label={t("الفئة", "Audience")} value={audience} onChange={setAudience}
                options={[{ value: "individual", label: t("أفراد", "Individual") }, { value: "company", label: t("شركات (مقاعد)", "Company (seats)") }]} />
              <SegmentedChoice<PlanType> label={t("نوع الباقة", "Plan type")} value={planType} onChange={setPlanType}
                options={[
                  { value: "standard", label: t("قياسية", "Standard") },
                  { value: "full_library", label: t("المكتبة الكاملة", "Full library") },
                  { value: "choose_x", label: t("اختر عددًا من الدورات", "Choose X courses") },
                ]} />
              <SegmentedChoice<Interval> label={t("دورة الفوترة", "Billing interval")} value={effectiveInterval}
                onChange={(v) => !chooseX && setInterval(v)}
                options={[{ value: "month", label: t("شهري", "Monthly") }, { value: "year", label: t("سنوي", "Yearly") }]} />
              {chooseX ? <Alert kind="info" title={t("باقات «اختر» سنوية فقط.", "Choose-X plans are yearly only.")} /> : null}
              <div className="ma-form-grid">
                <PriceField id="plan-price" value={price} onChange={setPrice} invalid={price !== "" && !isPriceRequiredValid(price)} />
                {chooseX ? (
                  <>
                    <Field id="plan-allowance" type="number" min={1} label={t("عدد الدورات المسموح", "Courses allowed")} value={allowance} onChange={setAllowance} required />
                    <Field id="plan-replacements" type="number" min={0} label={t("حد الاستبدال لكل فترة", "Replacements per period")} value={maxReplacements}
                      onChange={setMaxReplacements} hint={t("اتركه فارغًا لعدم التحديد.", "Leave empty for no limit.")} />
                  </>
                ) : null}
                {audience === "company" ? (
                  <Field id="plan-seats" type="number" min={1} label={t("أقصى عدد مقاعد", "Max seats")} value={maxSeats} onChange={setMaxSeats} />
                ) : null}
              </div>
            </div>
          </Card>

          <Card title={t("المحتوى", "Content")}>
            <div className="ma-form">
              <div className="ma-cols ma-cols--2">
                <Field id="plan-title-ar" label={t("الاسم (عربي)", "Title (Arabic)")} required value={titleAr} onChange={setTitleAr} dir="rtl" />
                <Field id="plan-title-en" label={t("الاسم (إنجليزي)", "Title (English)")} required value={titleEn} onChange={setTitleEnSafe} dir="ltr" />
                <Field id="plan-sub-ar" label={t("عنوان فرعي (عربي)", "Subtitle (Arabic)")} value={subtitleAr} onChange={setSubtitleAr} dir="rtl" />
                <Field id="plan-sub-en" label={t("عنوان فرعي (إنجليزي)", "Subtitle (English)")} value={subtitleEn} onChange={setSubtitleEn} dir="ltr" />
                <Field id="plan-short-ar" type="textarea" rows={3} label={t("وصف مختصر (عربي)", "Short description (Arabic)")} value={shortAr} onChange={setShortAr} dir="rtl" />
                <Field id="plan-short-en" type="textarea" rows={3} label={t("وصف مختصر (إنجليزي)", "Short description (English)")} value={shortEn} onChange={setShortEn} dir="ltr" />
              </div>
              <SlugField id="plan-slug" value={slug} required
                onChange={(value) => { setSlug(value); setSlugEdited(true); }}
                onRegenerate={() => { setSlug(toSlug(titleEn)); setSlugEdited(false); }}
                hint={t("يُولَّد من الاسم الإنجليزي.", "Generated from the English title.")} />
              <Field id="plan-thumb" label={t("رابط الصورة المصغّرة", "Thumbnail URL")} value={thumbnail} onChange={setThumbnail} dir="ltr" />
              <ToggleField id="plan-featured" label={t("باقة مميّزة", "Featured plan")} checked={featured} onChange={setFeatured}
                hint={t("تُبرز على صفحة الأسعار", "highlighted on the pricing page")} />
            </div>
          </Card>

          <Card title={t("عناصر بطاقة الباقة", "Plan card items")}>
            <div className="ma-cols ma-cols--2">
              <ListEditor label={t("بالعربية", "Arabic")} items={cardAr} onChange={setCardAr} addLabel={t("إضافة عنصر", "Add item")} placeholder="وصول غير محدود لكل الدورات" />
              <ListEditor label={t("بالإنجليزية", "English")} items={cardEn} onChange={setCardEn} addLabel={t("إضافة عنصر", "Add item")} placeholder="Unlimited access to every course" />
            </div>
          </Card>

          <ErrorAlert error={create.error} title={t("تعذّر إنشاء الباقة", "Couldn't create the plan")} />
          <FormActions>
            <Button kind="primary" type="submit" disabled={invalid || create.isPending}
              label={create.isPending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ كمسودة", "Save as draft")} />
            <Button kind="ghost" label={t("إلغاء", "Cancel")} href="/subscriptions/plans" />
          </FormActions>
        </div>
      </form>
    </>
  );
}
