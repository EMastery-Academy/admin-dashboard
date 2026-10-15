import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createCourse } from "@/lib/api";
import { studioHref } from "@/lib/refs";
import { useT } from "@/lib/i18n";
import { Button, Card, ErrorAlert, Field, FormActions, PageHead } from "@/components/ui/kit";

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
      createCourse({
        title: form.name,
        description: form.description || null,
        price: form.price === "" ? null : Number(form.price),
        slug: form.linkName || null,
        is_diploma: form.isDiploma,
        published: true,
      }),
    // A new course opens in the studio, where its page is written.
    onSuccess: (view) => navigate(studioHref(view.ref)),
  });

  return (
    <>
      <PageHead
        title={t("إنشاء دورة", "Create course")}
        sub={t("تُنشأ الدورة في النظام القديم الذي ما زال يملك محتوى الدورات.", "The course is created on the legacy platform, which still owns course content.")}
        back={{ href: "/learning/courses", label: t("الدورات", "Courses") }}
      />
      <Card title={t("بيانات الدورة", "Course details")}>
        <form
          className="ma-form ma-form--narrow"
          onSubmit={(event) => {
            event.preventDefault();
            if (form.name) create.mutate();
          }}
        >
          <Field id="course-name" label={t("الاسم", "Name")} required value={form.name} onChange={set("name")} />
          <div className="ma-form-grid ma-form-grid--2">
            <Field
              id="course-slug"
              label={t("الرابط المختصر", "Slug")}
              hint={t("أحرف إنجليزية وشرطات، مثل leadership-diploma.", "Latin letters and dashes, e.g. leadership-diploma.")}
              dir="ltr"
              value={form.linkName}
              onChange={set("linkName")}
            />
            <Field id="course-price" type="number" label={t("السعر", "Price")} min={0} dir="ltr" value={form.price} onChange={set("price")} />
          </div>
          <Field id="course-description" type="textarea" rows={4} label={t("الوصف", "Description")} value={form.description} onChange={set("description")} />
          <label className="ma-check">
            <input type="checkbox" checked={form.isDiploma} onChange={(e) => set("isDiploma")(e.target.checked)} />
            {t("هذه الدورة دبلوم", "This course is a diploma")}
          </label>
          <ErrorAlert error={create.error} title={t("تعذّر حفظ الدورة", "Couldn't save the course")} />
          <FormActions>
            <Button type="submit" kind="primary" icon="check" label={create.isPending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ الدورة", "Save course")} disabled={create.isPending || !form.name} />
            <Button kind="ghost" label={t("إلغاء", "Cancel")} href="/learning/courses" />
          </FormActions>
        </form>
      </Card>
    </>
  );
}
