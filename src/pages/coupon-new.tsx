import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createLegacyResource } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { Button, Card, PageHead } from "@/components/ui/kit";

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
      createLegacyResource("coupons", {
        name: form.name,
        code: form.code,
        percent: form.percent === "" ? null : Number(form.percent),
        startingDate: form.startingDate || null,
        endingDate: form.endingDate || null,
        notes: form.notes || null,
        active: true,
      }),
    onSuccess: () => navigate("/sales/coupons"),
  });

  return (
    <>
      <PageHead title={t("إنشاء كوبون", "Create coupon")} sub={t("أضف كوبونًا إلى النظام القديم.", "Add a coupon to the legacy system.")} />
      <Card>
        <form
          className="ma-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (form.name && form.code) create.mutate();
          }}
        >
          <label className="ma-field">
            <span className="ma-label">{t("الاسم", "Name")}</span>
            <input className="ma-input" value={form.name} onChange={(e) => set("name")(e.target.value)} required />
          </label>
          <label className="ma-field">
            <span className="ma-label">{t("الكود", "Code")}</span>
            <input className="ma-input" value={form.code} onChange={(e) => set("code")(e.target.value)} required />
          </label>
          <label className="ma-field">
            <span className="ma-label">{t("نسبة الخصم", "Discount percent")}</span>
            <input className="ma-input" type="number" min={0} max={100} value={form.percent} onChange={(e) => set("percent")(e.target.value)} />
          </label>
          <label className="ma-field">
            <span className="ma-label">{t("يبدأ", "Starts")}</span>
            <input className="ma-input" type="date" value={form.startingDate} onChange={(e) => set("startingDate")(e.target.value)} />
          </label>
          <label className="ma-field">
            <span className="ma-label">{t("ينتهي", "Ends")}</span>
            <input className="ma-input" type="date" value={form.endingDate} onChange={(e) => set("endingDate")(e.target.value)} />
          </label>
          <label className="ma-field">
            <span className="ma-label">{t("ملاحظات", "Notes")}</span>
            <textarea className="ma-input ma-textarea" rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
          </label>
          {create.error ? <p className="ma-alert ma-alert--danger">{(create.error as Error).message}</p> : null}
          <div className="ma-toolbar">
            <Button type="submit" kind="primary" label={create.isPending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ", "Save")} disabled={create.isPending} />
            <Button label={t("إلغاء", "Cancel")} href="/sales/coupons" />
          </div>
        </form>
      </Card>
    </>
  );
}
