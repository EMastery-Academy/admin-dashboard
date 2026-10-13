import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createLegacyResource } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { Button, Card, PageHead } from "@/components/ui/kit";

export default function CourseNewPage() {
  const t = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    linkName: "",
    isDiploma: false,
  });
  const set = (key: keyof typeof form) => (value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const create = useMutation({
    mutationFn: () =>
      createLegacyResource("courses", {
        name: form.name,
        description: form.description,
        price: form.price === "" ? null : Number(form.price),
        linkName: form.linkName || null,
        isDiploma: form.isDiploma,
        active: true,
      }),
    onSuccess: () => navigate("/learning/courses"),
  });

  return (
    <>
      <PageHead title={t("إنشاء دورة", "Create course")} sub={t("أضف دورة إلى النظام القديم.", "Add a course to the legacy system.")} />
      <Card>
        <form
          className="ma-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (form.name) create.mutate();
          }}
        >
          <label className="ma-field">
            <span className="ma-label">{t("الاسم", "Name")}</span>
            <input className="ma-input" value={form.name} onChange={(e) => set("name")(e.target.value)} required />
          </label>
          <label className="ma-field">
            <span className="ma-label">{t("الرابط المختصر", "Slug")}</span>
            <input className="ma-input" value={form.linkName} onChange={(e) => set("linkName")(e.target.value)} />
          </label>
          <label className="ma-field">
            <span className="ma-label">{t("السعر", "Price")}</span>
            <input className="ma-input" type="number" min={0} value={form.price} onChange={(e) => set("price")(e.target.value)} />
          </label>
          <label className="ma-field">
            <span className="ma-label">{t("الوصف", "Description")}</span>
            <textarea className="ma-input ma-textarea" rows={4} value={form.description} onChange={(e) => set("description")(e.target.value)} />
          </label>
          <label className="ma-field ma-field--inline">
            <input type="checkbox" checked={form.isDiploma} onChange={(e) => set("isDiploma")(e.target.checked)} />
            <span>{t("دبلوم", "Diploma")}</span>
          </label>
          {create.error ? <p className="ma-alert ma-alert--danger">{(create.error as Error).message}</p> : null}
          <div className="ma-toolbar">
            <Button type="submit" kind="primary" label={create.isPending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ", "Save")} disabled={create.isPending} />
            <Button label={t("إلغاء", "Cancel")} href="/learning/courses" />
          </div>
        </form>
      </Card>
    </>
  );
}
