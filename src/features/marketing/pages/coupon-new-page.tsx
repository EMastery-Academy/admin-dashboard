import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createPromotion } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { Button, Card, ErrorAlert, Field, FormActions, PageHead } from "@/components/ui/kit";

export default function CouponNewPage() {
  const t = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    code: "",
    percent: "",
    startingDate: "",
    endingDate: "",
    notes: "",
  });
  const set = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const create = useMutation({
    mutationFn: () =>
      createPromotion({
        name: form.name,
        code: form.code,
        discount_percent: form.percent === "" ? null : Number(form.percent),
        starts_at: form.startingDate || null,
        ends_at: form.endingDate || null,
        notes: form.notes || null,
        active: true,
      }),
    onSuccess: () => navigate("/sales/coupons"),
  });

  return (
    <>
      <PageHead
        title={t("إنشاء كوبون", "Create coupon")}
        sub={t("أضف كوبونًا إلى النظام القديم.", "Add a coupon to the legacy system.")}
        back={{ href: "/sales/coupons", label: t("الكوبونات", "Coupons") }}
      />
      <Card title={t("بيانات الكوبون", "Coupon details")}>
        <form
          className="ma-form ma-form--narrow"
          onSubmit={(event) => {
            event.preventDefault();
            if (form.name && form.code) create.mutate();
          }}
        >
          <div className="ma-form-grid ma-form-grid--2">
            <Field id="coupon-name" label={t("الاسم", "Name")} required value={form.name} onChange={set("name")} />
            <Field
              id="coupon-code"
              label={t("الكود", "Code")}
              hint={t("ما يكتبه العميل عند الدفع، مثل SUMMER25.", "What the customer types at checkout, e.g. SUMMER25.")}
              dir="ltr"
              required
              value={form.code}
              onChange={set("code")}
            />
            <Field id="coupon-percent" type="number" label={t("نسبة الخصم (%)", "Discount (%)")} min={0} max={100} dir="ltr" value={form.percent} onChange={set("percent")} />
            <span aria-hidden="true" />
            <Field id="coupon-start" type="date" label={t("يبدأ", "Starts")} value={form.startingDate} max={form.endingDate || undefined} onChange={set("startingDate")} />
            <Field id="coupon-end" type="date" label={t("ينتهي", "Ends")} value={form.endingDate} min={form.startingDate || undefined} onChange={set("endingDate")} />
          </div>
          <Field id="coupon-notes" type="textarea" rows={3} label={t("ملاحظات", "Notes")} value={form.notes} onChange={set("notes")} />
          <ErrorAlert error={create.error} title={t("تعذّر حفظ الكوبون", "Couldn't save the coupon")} />
          <FormActions>
            <Button type="submit" kind="primary" icon="check" label={create.isPending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ الكوبون", "Save coupon")} disabled={create.isPending || !form.name || !form.code} />
            <Button kind="ghost" label={t("إلغاء", "Cancel")} href="/sales/coupons" />
          </FormActions>
        </form>
      </Card>
    </>
  );
}
