import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setSubscriptionPlanBenefits, subscriptionKeys, type SubscriptionPlan } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { can } from "@/lib/permissions";
import { toast } from "@/components/ui/toast";
import { Button, Card, Empty, ErrorAlert, FormActions, IconButton } from "@/components/ui/kit";
import { AddRowButton } from "@/features/learning/product-form";

/**
 * Benefits with behaviour get a plain number input: subscribers book that many sessions
 * free each billing period, and get the discount on paid sessions.
 */
const NUMERIC_BENEFITS: Record<string, { key: string; ar: string; en: string; max: number }> = {
  consultation_credit: { key: "credits_per_period", ar: "عدد الجلسات المجانية لكل فترة فوترة", en: "Free sessions per billing period", max: 100 },
  consultation_discount: { key: "discount_percent", ar: "نسبة الخصم على الجلسات المدفوعة ٪", en: "Discount on paid sessions %", max: 99 },
};

/** Benefit types already used by plans; any other type is allowed too. */
const KNOWN_TYPES: { value: string; ar: string; en: string; example: Record<string, unknown> }[] = [
  { value: "consultation_discount", ar: "خصم على الاستشارات", en: "Consultation discount", example: { discount_percent: 20 } },
  { value: "consultation_credit", ar: "جلسات استشارة مجانية لكل فترة", en: "Free consultation sessions per period", example: { credits_per_period: 2 } },
  { value: "community_access", ar: "الوصول للمجتمع", en: "Community access", example: { tier: "member" } },
  { value: "included_courses", ar: "دورات مضمّنة", en: "Included courses", example: { access: "standard_catalog", certificates: true } },
  { value: "full_library_access", ar: "المكتبة الكاملة", en: "Full library access", example: { unlimited_included_courses: true } },
  { value: "choose_x_allowance", ar: "اختيار الدورات", en: "Choose-X allowance", example: { selection_allowance: 5, replaceable_before_learning_starts: true } },
  { value: "company_seats", ar: "مقاعد الشركات", en: "Company seats", example: { max_seats: 10 } },
  { value: "priority_support", ar: "دعم أولوية", en: "Priority support", example: {} },
];

type Row = { benefit_type: string; config: string };

const parse = (raw: string): Record<string, unknown> | null => {
  if (!raw.trim()) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
};

/** Structured plan benefits (`PUT /admin/subscriptions/plans/{id}/benefits`): a type and a JSON config each. */
export function PlanBenefitsTab({ plan }: { plan: SubscriptionPlan }) {
  const t = useT();
  const queryClient = useQueryClient();
  const writable = can("subscriptionsWrite.write");
  const [rows, setRows] = useState<Row[]>(() =>
    (plan.benefits ?? []).map((b) => ({ benefit_type: b.benefit_type, config: JSON.stringify(b.config ?? {}, null, 2) })),
  );
  const update = (index: number, patch: Partial<Row>) => setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const invalidIndex = rows.findIndex((row) => !row.benefit_type.trim() || parse(row.config) === null);
  const save = useMutation({
    mutationFn: () =>
      setSubscriptionPlanBenefits(plan.plan_id, {
        benefits: rows.map((row) => ({ benefit_type: row.benefit_type.trim(), config: parse(row.config) ?? {} })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      toast.success(t("تم حفظ المزايا", "Benefits saved"));
    },
  });

  return (
    <Card
      title={t("استحقاقات الباقة", "Plan benefits")}
      actions={writable ? <AddRowButton label={t("إضافة ميزة", "Add benefit")} onClick={() => setRows((prev) => [...prev, { benefit_type: "", config: "{}" }])} /> : null}
    >
      <datalist id="benefit-types">
        {KNOWN_TYPES.map((type) => (
          <option key={type.value} value={type.value}>{t(type.ar, type.en)}</option>
        ))}
      </datalist>
      {rows.length === 0 ? <Empty text={t("لا توجد مزايا.", "No benefits.")} /> : null}
      <div className="ma-form">
        {rows.map((row, index) => {
          const known = KNOWN_TYPES.find((type) => type.value === row.benefit_type);
          const badJson = parse(row.config) === null;
          return (
            <div key={index} className="ma-orderlist__row" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
              <div className="ma-field" style={{ flex: "1 1 220px" }}>
                <label className="ma-label" htmlFor={`benefit-type-${index}`}>{t("النوع", "Type")}</label>
                <input id={`benefit-type-${index}`} className="ma-input" dir="ltr" list="benefit-types" value={row.benefit_type} disabled={!writable}
                  onChange={(event) => {
                    const value = event.target.value;
                    const match = KNOWN_TYPES.find((type) => type.value === value);
                    update(index, { benefit_type: value, ...(match && row.config.trim() === "{}" ? { config: JSON.stringify(match.example, null, 2) } : {}) });
                  }} />
                {known ? <span className="ma-help">{t(known.ar, known.en)}</span> : null}
              </div>
              {NUMERIC_BENEFITS[row.benefit_type] ? (() => {
                const spec = NUMERIC_BENEFITS[row.benefit_type];
                const current = parse(row.config) ?? {};
                return (
                  <div className="ma-field" style={{ flex: "1 1 180px" }}>
                    <label className="ma-label" htmlFor={`benefit-num-${index}`}>{t(spec.ar, spec.en)}</label>
                    <input id={`benefit-num-${index}`} className="ma-input" type="number" min={0} max={spec.max} dir="ltr" disabled={!writable}
                      value={String(current[spec.key] ?? "")}
                      onChange={(event) => update(index, { config: JSON.stringify({ ...current, [spec.key]: Number(event.target.value) }, null, 2) })} />
                  </div>
                );
              })() : null}
              <div className="ma-field" style={{ flex: "2 1 280px" }}>
                <label className="ma-label" htmlFor={`benefit-config-${index}`}>{t("الإعدادات (JSON)", "Config (JSON)")}</label>
                <textarea id={`benefit-config-${index}`} className="ma-input ma-textarea" dir="ltr" rows={3} value={row.config} disabled={!writable}
                  aria-invalid={badJson || undefined} onChange={(event) => update(index, { config: event.target.value })} />
                {badJson ? <span className="ma-help" style={{ color: "var(--danger)" }}>{t("JSON غير صالح (كائن مطلوب).", "Invalid JSON (an object is required).")}</span> : null}
              </div>
              {writable ? <IconButton icon="trash" label={t("حذف", "Remove")} onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))} /> : null}
            </div>
          );
        })}
        <ErrorAlert error={save.error} title={t("تعذّر حفظ المزايا", "Couldn't save benefits")} />
        {writable ? (
          <FormActions>
            <Button kind="primary" disabled={invalidIndex >= 0 || save.isPending} label={save.isPending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ المزايا", "Save benefits")}
              onClick={() => save.mutate()} />
          </FormActions>
        ) : null}
      </div>
    </Card>
  );
}
